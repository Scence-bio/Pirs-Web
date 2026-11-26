import { QUIZZES } from './quizzes'

const STORAGE_KEY = 'pirs-custom-quizzes-v1'

export function loadCustomQuizzes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCustomQuizzes(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function addCustomQuiz(quiz) {
  const list = loadCustomQuizzes()
  const next = [quiz, ...list]
  saveCustomQuizzes(next)
  return next
}

export function deleteCustomQuiz(id) {
  const next = loadCustomQuizzes().filter((q) => q.id !== id)
  saveCustomQuizzes(next)
  return next
}

export function findQuiz(id) {
  return QUIZZES.find((q) => q.id === id) || loadCustomQuizzes().find((q) => q.id === id) || null
}

/** Build a quiz object from the create form (single language → all locales). */
export function buildQuizFromForm({ title, description, timeLimit, questions, soundEnabled = true }) {
  const id = `custom-${Date.now().toString(36)}`
  const t = title.trim()
  const d = (description || '').trim()
  return {
    id,
    custom: true,
    title: { ckb: t, ar: t, en: t },
    description: {
      ckb: d || t,
      ar: d || t,
      en: d || t,
    },
    timeLimit: Number(timeLimit) || 20,
    soundEnabled: soundEnabled !== false,
    questions: questions.map((q) => {
      const text = q.text.trim()
      const options = q.options.map((o) => o.trim())
      return {
        text: { ckb: text, ar: text, en: text },
        options: { ckb: options, ar: options, en: options },
        correct: Number(q.correct),
      }
    }),
  }
}
