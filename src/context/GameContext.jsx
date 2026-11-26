import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { scoreAnswer } from '../data/quizzes'
import { findQuiz } from '../lib/quizStore'
import { readLocalRoom, readRoom, subscribeRoom, writeRoom } from '../lib/roomStore'
import { useAuth } from './AuthContext'

const GameContext = createContext(null)
const SESSION_KEY = 'pirs-session'

function makePin() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

function saveSession(session) {
  if (!session) localStorage.removeItem(SESSION_KEY)
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function GameProvider({ children }) {
  const { user } = useAuth()
  const [session, setSession] = useState(loadSession)
  const [room, setRoom] = useState(() => (session?.pin ? readLocalRoom(session.pin) : null))
  const roomRawRef = useRef(room ? JSON.stringify(room) : '')

  const applyRoom = useCallback((next) => {
    if (!next) {
      if (roomRawRef.current) {
        roomRawRef.current = ''
        setRoom(null)
      }
      return
    }
    const raw = JSON.stringify(next)
    if (raw === roomRawRef.current) return
    roomRawRef.current = raw
    setRoom(next)
  }, [])

  useEffect(() => {
    saveSession(session)
  }, [session])

  useEffect(() => {
    if (!session?.pin) return undefined
    const pin = session.pin
    readRoom(pin).then((r) => r && applyRoom(r)).catch(() => {})
    return subscribeRoom(pin, applyRoom)
  }, [session?.pin, applyRoom])

  const persistRoom = useCallback(
    async (next) => {
      const raw = await writeRoom(next, user?.id || next.hostUserId || null)
      roomRawRef.current = typeof raw === 'string' ? raw : JSON.stringify(next)
      setRoom(next)
      return next
    },
    [user?.id],
  )

  const updateRoom = useCallback(
    async (pin, updater) => {
      const current = (await readRoom(pin)) || readLocalRoom(pin)
      if (!current) return null
      const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater }
      return persistRoom(next)
    },
    [persistRoom],
  )

  const hostGame = useCallback(
    async (quizId, quizOverride = null) => {
      const quiz = quizOverride || (await findQuiz(quizId, user))
      if (!quiz) return null
      const pin = makePin()
      const hostId = makeId()
      const next = {
        pin,
        hostId,
        hostUserId: user?.id || null,
        quizId: quiz.id,
        quiz,
        status: 'lobby',
        questionIndex: 0,
        questionStartedAt: null,
        players: [],
        answers: {},
        createdAt: Date.now(),
      }
      await persistRoom(next)
      setSession({ role: 'host', pin, playerId: hostId, name: user?.displayName || 'Host' })
      return pin
    },
    [user, persistRoom],
  )

  const joinGame = useCallback(
    async (pin, name) => {
      const clean = String(pin).trim()
      const current = (await readRoom(clean)) || readLocalRoom(clean)
      if (!current) return { ok: false, error: 'not_found' }
      if (current.status !== 'lobby') return { ok: false, error: 'started' }
      const trimmed = name.trim().slice(0, 16)
      if (!trimmed) return { ok: false, error: 'name' }
      if (current.players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
        return { ok: false, error: 'taken' }
      }
      const playerId = makeId()
      const player = {
        id: playerId,
        name: trimmed,
        score: 0,
        userId: user?.id || null,
      }
      await updateRoom(clean, (r) => ({ ...r, players: [...r.players, player] }))
      setSession({ role: 'player', pin: clean, playerId, name: trimmed })
      return { ok: true, pin: clean }
    },
    [updateRoom, user?.id],
  )

  const startQuestion = useCallback(() => {
    if (!session || session.role !== 'host') return
    updateRoom(session.pin, (r) => ({
      ...r,
      status: 'question',
      questionStartedAt: Date.now(),
      answers: { ...r.answers, [r.questionIndex]: r.answers[r.questionIndex] || {} },
    }))
  }, [session, updateRoom])

  const revealAnswers = useCallback(() => {
    if (!session || session.role !== 'host') return
    updateRoom(session.pin, (r) => {
      const q = r.quiz.questions[r.questionIndex]
      const round = r.answers[r.questionIndex] || {}
      const players = r.players.map((p) => {
        const ans = round[p.id]
        if (!ans || ans.choice !== q.correct) return p
        const points = scoreAnswer(ans.timeMs, r.quiz.timeLimit)
        return { ...p, score: p.score + points }
      })
      return { ...r, status: 'reveal', players }
    })
  }, [session, updateRoom])

  const showLeaderboard = useCallback(() => {
    if (!session || session.role !== 'host') return
    updateRoom(session.pin, { status: 'leaderboard' })
  }, [session, updateRoom])

  const nextQuestion = useCallback(() => {
    if (!session || session.role !== 'host') return
    updateRoom(session.pin, (r) => {
      const nextIndex = r.questionIndex + 1
      if (nextIndex >= r.quiz.questions.length) {
        return { ...r, status: 'finished' }
      }
      return {
        ...r,
        questionIndex: nextIndex,
        status: 'question',
        questionStartedAt: Date.now(),
        answers: { ...r.answers, [nextIndex]: {} },
      }
    })
  }, [session, updateRoom])

  const submitAnswer = useCallback(
    (choice) => {
      if (!session || session.role !== 'player' || !room) return
      if (room.status !== 'question') return
      const qi = room.questionIndex
      const already = room.answers?.[qi]?.[session.playerId]
      if (already) return
      const timeMs = Date.now() - (room.questionStartedAt || Date.now())
      updateRoom(session.pin, (r) => ({
        ...r,
        answers: {
          ...r.answers,
          [qi]: {
            ...(r.answers[qi] || {}),
            [session.playerId]: { choice, timeMs },
          },
        },
      }))
    },
    [session, room, updateRoom],
  )

  const leaveGame = useCallback(() => {
    if (session?.role === 'player' && session.pin) {
      updateRoom(session.pin, (r) => ({
        ...r,
        players: r.players.filter((p) => p.id !== session.playerId),
      }))
    }
    roomRawRef.current = ''
    setSession(null)
    setRoom(null)
  }, [session, updateRoom])

  const me = useMemo(() => {
    if (!session || !room) return null
    if (session.role === 'host') {
      return { id: session.playerId, name: session.name || 'Host', score: 0, isHost: true }
    }
    return room.players.find((p) => p.id === session.playerId) || null
  }, [session, room])

  const myAnswer = useMemo(() => {
    if (!session || !room || session.role !== 'player') return null
    return room.answers?.[room.questionIndex]?.[session.playerId] ?? null
  }, [session, room])

  const answerCount = useMemo(() => {
    if (!room) return 0
    return Object.keys(room.answers?.[room.questionIndex] || {}).length
  }, [room])

  const value = useMemo(
    () => ({
      session,
      room,
      me,
      myAnswer,
      answerCount,
      hostGame,
      joinGame,
      startQuestion,
      revealAnswers,
      showLeaderboard,
      nextQuestion,
      submitAnswer,
      leaveGame,
    }),
    [
      session,
      room,
      me,
      myAnswer,
      answerCount,
      hostGame,
      joinGame,
      startQuestion,
      revealAnswers,
      showLeaderboard,
      nextQuestion,
      submitAnswer,
      leaveGame,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
