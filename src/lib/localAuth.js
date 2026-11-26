const USERS_KEY = 'pirs-users-v1'
const SESSION_KEY = 'pirs-local-session-v1'

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function hashPassword(password, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 120000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )
  return toHex(bits)
}

export function getLocalSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

export function clearLocalSession() {
  localStorage.removeItem(SESSION_KEY)
}

export async function localSignUp({ email, password, displayName }) {
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail || !password || password.length < 6) {
    return { ok: false, error: 'invalid' }
  }
  const users = loadUsers()
  if (users[cleanEmail]) return { ok: false, error: 'exists' }

  const salt = crypto.randomUUID()
  const passHash = await hashPassword(password, salt)
  const user = {
    id: crypto.randomUUID(),
    email: cleanEmail,
    displayName: (displayName || cleanEmail.split('@')[0]).trim().slice(0, 32),
    salt,
    passHash,
    createdAt: Date.now(),
  }
  users[cleanEmail] = user
  saveUsers(users)
  const session = { id: user.id, email: user.email, displayName: user.displayName, provider: 'local' }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return { ok: true, user: session }
}

export async function localSignIn({ email, password }) {
  const cleanEmail = email.trim().toLowerCase()
  const users = loadUsers()
  const user = users[cleanEmail]
  if (!user) return { ok: false, error: 'invalid_creds' }
  const passHash = await hashPassword(password, user.salt)
  if (passHash !== user.passHash) return { ok: false, error: 'invalid_creds' }
  const session = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    provider: 'local',
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return { ok: true, user: session }
}

export function localSignOut() {
  clearLocalSession()
}
