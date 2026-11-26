import { doc, getDoc, onSnapshot, runTransaction, setDoc } from 'firebase/firestore'
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
  const stamped = { ...room, updatedAt: room.updatedAt || Date.now() }
  const raw = writeLocalRoom(stamped)
  if (hasFirebase) {
    try {
      await setDoc(
        doc(db, 'rooms', stamped.pin),
        {
          hostId: hostUserId || stamped.hostUserId || null,
          payload: stamped,
          updatedAt: stamped.updatedAt,
        },
        { merge: true },
      )
    } catch (err) {
      console.warn('[rooms]', err.message)
    }
  }
  return raw
}

/**
 * Apply an updater with conflict protection.
 * Firebase: Firestore transaction (serializes concurrent joins/answers/reveals).
 * Local: single-tab safe; still best-effort across tabs via storage.
 */
export async function updateRoomDoc(pin, updater, hostUserId = null) {
  if (hasFirebase) {
    const ref = doc(db, 'rooms', pin)
    try {
      const result = await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref)
        if (!snap.exists()) return null
        const current = snap.data().payload
        if (!current) return null
        const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater }
        if (!next || next === current) return current
        const stamped = { ...next, updatedAt: Date.now() }
        tx.set(
          ref,
          {
            hostId: hostUserId || stamped.hostUserId || null,
            payload: stamped,
            updatedAt: stamped.updatedAt,
          },
          { merge: true },
        )
        return stamped
      })
      if (result) writeLocalRoom(result)
      return result
    } catch (err) {
      console.warn('[rooms tx]', err.message)
      // Fall through to non-transactional path
    }
  }

  const current = (await readRoom(pin)) || readLocalRoom(pin)
  if (!current) return null
  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater }
  if (!next || next === current) return current
  // Drop stale local writes that would rewind game status
  const remote = readLocalRoom(pin)
  if (remote && remote.updatedAt && current.updatedAt && remote.updatedAt > current.updatedAt) {
    const retry = typeof updater === 'function' ? updater(remote) : { ...remote, ...updater }
    if (!retry || retry === remote) return remote
    await writeRoom({ ...retry, updatedAt: Date.now() }, hostUserId)
    return retry
  }
  await writeRoom({ ...next, updatedAt: Date.now() }, hostUserId)
  return next
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
