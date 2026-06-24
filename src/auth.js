import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'demo-shop-dev-secret'
const TOKEN_TTL = '1h'

/*
 * Two hardcoded demo users, each with a role:
 *   - standard_user / secret_sauce → 'customer' (shops: browse, cart, checkout)
 *   - admin        / admin_sauce   → 'admin'    (manages the catalogue: CRUD)
 * standard_user mirrors Sauce Demo and stays the headline shopper. These are
 * public demo credentials by design — safe to commit. Override with env vars.
 */
export const DEMO_USER = {
  username: process.env.DEMO_USER || 'standard_user',
  password: process.env.DEMO_PASSWORD || 'secret_sauce',
}

export const ADMIN_USER = {
  username: process.env.ADMIN_USER || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin_sauce',
}

const USERS = {
  [DEMO_USER.username]: { password: DEMO_USER.password, role: 'customer' },
  [ADMIN_USER.username]: { password: ADMIN_USER.password, role: 'admin' },
}

/**
 * Verify credentials. Returns the matching user record ({ username, role }) on
 * success, or null on failure — callers need the role to embed it in the token.
 */
export function authenticate(username, password) {
  const user = USERS[username]
  if (!user || user.password !== password) return null
  return { username, role: user.role }
}

export function issueToken(username, role = 'customer') {
  return jwt.sign({ sub: username, role }, JWT_SECRET, { expiresIn: TOKEN_TTL })
}

/** Express middleware: rejects the request unless a valid Bearer token is present. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null

  if (!token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' })
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

/**
 * Express middleware: a valid token AND the 'admin' role. Verifies the JWT
 * locally (same as requireAuth, so it works unchanged in microservices mode),
 * then rejects non-admins with 403. Used to gate catalogue writes.
 */
export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'This action requires the admin role' })
    }
    next()
  })
}
