import { hasSupabase, supabase } from './supabase'

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
  if (hasSupabase) {
    const { data, error } = await supabase.from('rooms').select('payload').eq('pin', pin).maybeSingle()
    if (error) throw error
    if (data?.payload) return data.payload
  }
  return readLocalRoom(pin)
}

export async function writeRoom(room, hostUserId = null) {
  // Always mirror locally for fast same-device play
  const raw = writeLocalRoom(room)
  if (hasSupabase) {
    const { error } = await supabase.from('rooms').upsert({
      pin: room.pin,
      host_id: hostUserId || room.hostUserId || null,
      payload: room,
      updated_at: new Date().toISOString(),
    })
    if (error) console.warn('[rooms]', error.message)
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

  let pollId = 0
  if (hasSupabase) {
    const rt = supabase
      .channel(`room-${pin}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `pin=eq.${pin}` },
        (payload) => {
          if (payload.new?.payload) onChange(payload.new.payload)
        },
      )
      .subscribe()
    cleanups.push(() => {
      supabase.removeChannel(rt)
    })
    pollId = window.setInterval(async () => {
      if (document.visibilityState === 'hidden') return
      try {
        const room = await readRoom(pin)
        if (room) onChange(room)
      } catch {
        /* ignore */
      }
    }, 2500)
  } else {
    pollId = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return
      const room = readLocalRoom(pin)
      if (room) onChange(room)
    }, 1500)
  }
  cleanups.push(() => clearInterval(pollId))

  const onVisible = () => {
    if (document.visibilityState !== 'visible') return
    readRoom(pin).then((room) => room && onChange(room)).catch(() => {})
  }
  document.addEventListener('visibilitychange', onVisible)
  cleanups.push(() => document.removeEventListener('visibilitychange', onVisible))

  return () => cleanups.forEach((fn) => fn())
}
