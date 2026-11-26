import { QUIZZES } from '../data/quizzes'
import { hasSupabase, supabase } from './supabase'
import { loadCustomQuizzes, saveCustomQuizzes } from '../data/customQuizzes'

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

function rowToQuiz(row) {
  return {
    id: row.id,
    custom: true,
    ownerId: row.owner_id,
    title: { ckb: row.title, ar: row.title, en: row.title },
    description: {
      ckb: row.description || '',
      ar: row.description || '',
      en: row.description || '',
    },
    timeLimit: row.time_limit,
    questions: row.questions,
  }
}

function quizToRow(quiz, ownerId) {
  const title = typeof quiz.title === 'string' ? quiz.title : quiz.title?.ckb || quiz.title?.en || ''
  const description =
    typeof quiz.description === 'string'
      ? quiz.description
      : quiz.description?.ckb || quiz.description?.en || ''
  return {
    id: quiz.id,
    owner_id: ownerId,
    title,
    description,
    time_limit: quiz.timeLimit,
    questions: quiz.questions,
    updated_at: new Date().toISOString(),
  }
}

export async function listUserQuizzes(user) {
  if (!user) return []
  if (hasSupabase && user.provider === 'supabase') {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(rowToQuiz)
  }
  return loadLocalForUser(user.id)
}

export async function saveUserQuiz(user, quiz) {
  if (!user) throw new Error('auth_required')
  if (hasSupabase && user.provider === 'supabase') {
    const row = quizToRow(quiz, user.id)
    const { error } = await supabase.from('quizzes').upsert(row)
    if (error) throw error
    return quiz
  }
  const list = loadLocalForUser(user.id)
  const next = [quiz, ...list.filter((q) => q.id !== quiz.id)]
  saveLocalForUser(user.id, next)
  return quiz
}

export async function removeUserQuiz(user, id) {
  if (!user) throw new Error('auth_required')
  if (hasSupabase && user.provider === 'supabase') {
    const { error } = await supabase.from('quizzes').delete().eq('id', id).eq('owner_id', user.id)
    if (error) throw error
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
