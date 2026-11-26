import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleContext'
import { useGame } from '../context/GameContext'
import { ANSWER_SHAPES } from '../data/quizzes'
import { addCustomQuiz, buildQuizFromForm } from '../data/customQuizzes'
import { toEasternDigits } from '../utils/format'
import LangSwitch from '../components/LangSwitch'

function emptyQuestion() {
  return { text: '', options: ['', '', '', ''], correct: 0 }
}

export default function CreateQuizPage() {
  const { t, locale } = useLocale()
  const { hostGame } = useGame()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeLimit, setTimeLimit] = useState(20)
  const [questions, setQuestions] = useState([emptyQuestion(), emptyQuestion()])
  const [error, setError] = useState('')

  function updateQuestion(index, patch) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  function updateOption(qIndex, optIndex, value) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q
        const options = [...q.options]
        options[optIndex] = value
        return { ...q, options }
      }),
    )
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()])
  }

  function removeQuestion(index) {
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  function validate() {
    if (!title.trim()) return t.createErrTitle
    if (questions.length < 1) return t.createErrQuestions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text.trim()) return `${t.createErrQuestion} ${toEasternDigits(i + 1, locale)}`
      if (q.options.some((o) => !o.trim())) {
        return `${t.createErrOptions} ${toEasternDigits(i + 1, locale)}`
      }
    }
    return ''
  }

  function persistQuiz() {
    const msg = validate()
    if (msg) {
      setError(msg)
      return null
    }
    setError('')
    const quiz = buildQuizFromForm({ title, description, timeLimit, questions })
    addCustomQuiz(quiz)
    return quiz
  }

  function onSave(e) {
    e.preventDefault()
    const quiz = persistQuiz()
    if (!quiz) return
    navigate('/?created=1')
  }

  function onSaveAndHost(e) {
    e.preventDefault()
    const quiz = persistQuiz()
    if (!quiz) return
    const pin = hostGame(quiz.id, quiz)
    if (pin) navigate('/lobby')
  }

  return (
    <div className="create-screen">
      <header className="home-top">
        <Link to="/" className="brand-lockup">
          <span className="brand-mark">؟</span>
          <span className="brand-name">{t.brand}</span>
        </Link>
        <LangSwitch />
      </header>

      <div className="create-head">
        <div>
          <h1>{t.createTitle}</h1>
          <p>{t.createSubtitle}</p>
        </div>
        <Link to="/" className="linkish">
          {t.backHome}
        </Link>
      </div>

      <form className="create-form" onSubmit={onSaveAndHost}>
        <section className="create-card">
          <label>
            {t.quizTitle}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.quizTitlePlaceholder}
              maxLength={80}
            />
          </label>
          <label>
            {t.quizDesc}
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.quizDescPlaceholder}
              maxLength={140}
            />
          </label>
          <label>
            {t.timePerQuestion}
            <div className="time-row">
              <input
                type="range"
                min={5}
                max={60}
                step={1}
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
              />
              <strong>
                {toEasternDigits(timeLimit, locale)} {t.seconds}
              </strong>
            </div>
          </label>
        </section>

        {questions.map((q, qi) => (
          <section key={qi} className="create-card question-editor">
            <div className="qe-top">
              <h2>
                {t.questionOf} {toEasternDigits(qi + 1, locale)}
              </h2>
              {questions.length > 1 && (
                <button type="button" className="linkish danger" onClick={() => removeQuestion(qi)}>
                  {t.removeQuestion}
                </button>
              )}
            </div>

            <label>
              {t.questionText}
              <textarea
                value={q.text}
                onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                placeholder={t.questionTextPlaceholder}
                rows={2}
              />
            </label>

            <p className="correct-hint">{t.pickCorrect}</p>
            <div className="option-editors">
              {ANSWER_SHAPES.map((shape, oi) => (
                <div key={shape.id} className="option-row" style={{ '--ans': shape.color }}>
                  <button
                    type="button"
                    className={`correct-pick ${q.correct === oi ? 'active' : ''}`}
                    onClick={() => updateQuestion(qi, { correct: oi })}
                    title={t.markCorrect}
                    aria-label={t.markCorrect}
                  >
                    {shape.symbol}
                  </button>
                  <input
                    value={q.options[oi]}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                    placeholder={`${t.option} ${toEasternDigits(oi + 1, locale)}`}
                    maxLength={100}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}

        <button type="button" className="btn btn-add" onClick={addQuestion}>
          + {t.addQuestion}
        </button>

        {error && <p className="form-error">{error}</p>}

        <div className="create-actions">
          <button type="button" className="btn btn-join" onClick={onSave}>
            {t.saveQuiz}
          </button>
          <button type="submit" className="btn btn-host">
            {t.saveAndHost}
          </button>
        </div>
      </form>
    </div>
  )
}
