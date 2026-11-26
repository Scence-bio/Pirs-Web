/** Lightweight Web Audio cues — no asset files. */

let ctx = null
let unlocked = false

function getCtx() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  return ctx
}

/** Call from a user gesture so later ticks can play. */
export async function unlockAudio() {
  const c = getCtx()
  if (!c) return false
  try {
    if (c.state === 'suspended') await c.resume()
    unlocked = c.state === 'running'
  } catch {
    unlocked = false
  }
  return unlocked
}

function tone({ freq = 880, duration = 0.06, type = 'sine', gain = 0.08, when = 0 }) {
  const c = getCtx()
  if (!c || !unlocked) return
  if (c.state === 'suspended') {
    c.resume().catch(() => {})
    return
  }
  const t0 = c.currentTime + when
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(g)
  g.connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

export function playTick(urgent = false) {
  if (urgent) {
    tone({ freq: 980, duration: 0.05, type: 'square', gain: 0.07 })
    tone({ freq: 1240, duration: 0.04, type: 'square', gain: 0.05, when: 0.05 })
  } else {
    tone({ freq: 720, duration: 0.045, type: 'sine', gain: 0.05 })
  }
}

export function playQuestionStart() {
  tone({ freq: 523.25, duration: 0.08, type: 'triangle', gain: 0.07 })
  tone({ freq: 659.25, duration: 0.1, type: 'triangle', gain: 0.07, when: 0.09 })
  tone({ freq: 783.99, duration: 0.12, type: 'triangle', gain: 0.06, when: 0.18 })
}

export function playTimesUp() {
  tone({ freq: 400, duration: 0.12, type: 'sawtooth', gain: 0.06 })
  tone({ freq: 280, duration: 0.18, type: 'sawtooth', gain: 0.05, when: 0.1 })
}

export function playCorrect() {
  tone({ freq: 660, duration: 0.08, type: 'sine', gain: 0.07 })
  tone({ freq: 880, duration: 0.12, type: 'sine', gain: 0.07, when: 0.08 })
}

export function playWrong() {
  tone({ freq: 220, duration: 0.16, type: 'triangle', gain: 0.06 })
}
