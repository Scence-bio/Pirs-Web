import { QUIZZES } from '../data/quizzes'
import { loadCustomQuizzes, saveCustomQuizzes } from '../data/customQuizzes'
import { getFirebase, hasFirebase } from './firebase'

function localKey(userId) {
  return `pirs-quizzes-${userId}`
}

function loadLocalForUser(userId) {
  if (!userId) return loadCustomQuizzes()
  try {
    const raw = localStorage.getItem(localKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocalForUser(userId, list) {
  if (!userId) {
    saveCustomQuizzes(list)
    return
  }
  localStorage.setItem(localKey(userId), JSON.stringify(list))
}

function docToQuiz(id, data) {
  return {
    id,
    custom: true,
    ownerId: data.ownerId,
    title: data.title,
    description: data.description || { ckb: '', ar: '', en: '' },
    timeLimit: data.timeLimit || 20,
    soundEnabled: data.soundEnabled !== false,
    questions: data.questions || [],
    updatedAt: data.updatedAt || 0,
  }
}

export async function listUserQuizzes(user) {
  if (!user) return []
  if (hasFirebase && user.provider === 'firebase') {
    const { db } = await getFirebase()
    const { collection, getDocs, query, where } = await import('firebase/firestore')
    const q = query(collection(db, 'quizzes'), where('ownerId', '==', user.id))
    const snap = await getDocs(q)
    return snap.docs
      .map((d) => docToQuiz(d.id, d.data()))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  }
  return loadLocalForUser(user.id)
}

export async function saveUserQuiz(user, quiz) {
  if (!user) throw new Error('auth_required')
  if (hasFirebase && user.provider === 'firebase') {
    const { db } = await getFirebase()
    const { doc, setDoc } = await import('firebase/firestore')
    const now = Date.now()
    await setDoc(
      doc(db, 'quizzes', quiz.id),
      {
        ownerId: user.id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        soundEnabled: quiz.soundEnabled !== false,
        questions: quiz.questions,
        updatedAt: now,
        ...(quiz.createdAt ? {} : { createdAt: now }),
      },
      { merge: true },
    )
    return quiz
  }
  const list = loadLocalForUser(user.id)
  const next = [quiz, ...list.filter((q) => q.id !== quiz.id)]
  saveLocalForUser(user.id, next)
  return quiz
}

export async function removeUserQuiz(user, id) {
  if (!user) throw new Error('auth_required')
  if (hasFirebase && user.provider === 'firebase') {
    const { db } = await getFirebase()
    const { doc, deleteDoc } = await import('firebase/firestore')
    await deleteDoc(doc(db, 'quizzes', id))
    return
  }
  const next = loadLocalForUser(user.id).filter((q) => q.id !== id)
  saveLocalForUser(user.id, next)
}

export async function findQuiz(id, user) {
  const builtIn = QUIZZES.find((q) => q.id === id)
  if (builtIn) return builtIn
  if (user) {
    const mine = await listUserQuizzes(user)
    const found = mine.find((q) => q.id === id)
    if (found) return found
  }
  return loadCustomQuizzes().find((q) => q.id === id) || null
}
