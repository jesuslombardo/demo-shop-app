import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

/*
 * The single front door the split forces. The vanilla UI calls same-origin
 * paths (/api/login, /api/products), so SOMETHING has to route each to the
 * right service. This gateway does ONLY that — no auth, no rate limiting:
 *   /api/login      → auth-service
 *   everything else → products-service (products API, docs, static UI, /health)
 *
 * No express.json() here on purpose: the raw request body streams straight
 * through to the target, untouched.
 */
const AUTH_URL = process.env.AUTH_URL || 'http://localhost:3001'
const PRODUCTS_URL = process.env.PRODUCTS_URL || 'http://localhost:3002'

const app = express()

// Order matters: the login filter is checked first; everything else falls through.
app.use(
  createProxyMiddleware({
    target: AUTH_URL,
    changeOrigin: true,
    pathFilter: '/api/login',
  })
)

app.use(
  createProxyMiddleware({
    target: PRODUCTS_URL,
    changeOrigin: true,
  })
)

const PORT = Number(process.env.PORT) || 3000
app.listen(PORT, () => {
  console.log(`gateway listening on http://localhost:${PORT}`)
  console.log(`  /api/login      → ${AUTH_URL}`)
  console.log(`  everything else → ${PRODUCTS_URL}`)
})
