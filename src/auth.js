import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'demo-shop-dev-secret'
const TOKEN_TTL = '1h'

/*
 * Single hardcoded user, mirroring Sauce Demo's standard_user / secret_sauce.
 * These are public demo credentials by design — safe to commit. Override with
 * env vars if you ever need different values.
 */
export const DEMO_USER = {
  username: process.env.DEMO_USER || 'standard_user',
  password: process.env.DEMO_PASSWORD || 'secret_sauce',
}

export function authenticate(username, password) {
  return username === DEMO_USER.username && password === DEMO_USER.password
}

export function issueToken(username) {
  return jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: TOKEN_TTL })
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
