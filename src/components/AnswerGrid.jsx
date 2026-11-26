import { memo } from 'react'
import { ANSWER_SHAPES } from '../data/quizzes'

function AnswerGrid({
  options,
  selected,
  correct,
  reveal = false,
  disabled = false,
  onSelect,
  big = false,
}) {
  return (
    <div className={`answer-grid ${big ? 'answer-grid-big' : ''}`}>
      {ANSWER_SHAPES.map((shape, i) => {
        const opt = options[i]
        if (opt == null) return null
        let state = ''
        if (reveal) {
          if (i === correct) state = 'is-correct'
          else if (selected === i) state = 'is-wrong'
          else state = 'is-dim'
        } else if (selected === i) {
          state = 'is-selected'
        }
        return (
          <button
            key={shape.id}
            type="button"
            className={`answer-btn shape-${shape.shape} ${state}`}
            style={{ '--ans': shape.color }}
            disabled={disabled || reveal}
            onClick={() => onSelect?.(i)}
          >
            <span className="answer-symbol" aria-hidden="true">
              {shape.symbol}
            </span>
            <span className="answer-text">{opt}</span>
          </button>
        )
      })}
    </div>
  )
}

export default memo(AnswerGrid)
