import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { db, hasFirebase } from './firebase'

const ROOM_PREFIX = 'pirs-room-'
const CHANNEL = 'pirs-kahoot'

let sharedChannel = null
function getChannel() {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!sharedChannel) {
    try {
      sharedChannel = new BroadcastChannel(CHANNEL)
    } catch {
      return null
    }
  }
  return sharedChannel
}

export function readLocalRoom(pin) {
  try {
    const raw = localStorage.getItem(ROOM_PREFIX + pin)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function writeLocalRoom(room) {
  const raw = JSON.stringify(room)
  localStorage.setItem(ROOM_PREFIX + room.pin, raw)
  try {
    getChannel()?.postMessage({ type: 'room', pin: room.pin, raw })
  } catch {
    /* ignore */
  }
  return raw
}

export async function readRoom(pin) {
  if (hasFirebase) {
    const snap = await getDoc(doc(db, 'rooms', pin))
    if (snap.exists()) return snap.data().payload || null
  }
  return readLocalRoom(pin)
}

export async function writeRoom(room, hostUserId = null) {
  const raw = writeLocalRoom(room)
  if (hasFirebase) {
    try {
      await setDoc(
        doc(db, 'rooms', room.pin),
        {
          hostId: hostUserId || room.hostUserId || null,
          payload: room,
          updatedAt: Date.now(),
        },
        { merge: true },
      )
    } catch (err) {
      console.warn('[rooms]', err.message)
    }
  }
  return raw
}

export function subscribeRoom(pin, onChange) {
  const cleanups = []

  const onStorage = (e) => {
    if (e.key === ROOM_PREFIX + pin && e.newValue) {
      try {
        onChange(JSON.parse(e.newValue))
      } catch {
        /* ignore */
      }
    }
  }
  window.addEventListener('storage', onStorage)
  cleanups.push(() => window.removeEventListener('storage', onStorage))

  const channel = getChannel()
  const onMessage = (ev) => {
    if (ev.data?.pin !== pin) return
    if (typeof ev.data.raw === 'string') {
      try {
        onChange(JSON.parse(ev.data.raw))
      } catch {
        /* ignore */
      }
    }
  }
  channel?.addEventListener('message', onMessage)
  cleanups.push(() => channel?.removeEventListener('message', onMessage))

  if (hasFirebase) {
    const unsub = onSnapshot(
      doc(db, 'rooms', pin),
      (snap) => {
        if (snap.exists() && snap.data().payload) onChange(snap.data().payload)
      },
      (err) => console.warn('[rooms subscribe]', err.message),
    )
    cleanups.push(unsub)
  } else {
    const pollId = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return
      const room = readLocalRoom(pin)
      if (room) onChange(room)
    }, 1500)
    cleanups.push(() => clearInterval(pollId))
  }

  const onVisible = () => {
    if (document.visibilityState !== 'visible') return
    readRoom(pin)
      .then((room) => room && onChange(room))
      .catch(() => {})
  }
  document.addEventListener('visibilitychange', onVisible)
  cleanups.push(() => document.removeEventListener('visibilitychange', onVisible))

  return () => cleanups.forEach((fn) => fn())
}
