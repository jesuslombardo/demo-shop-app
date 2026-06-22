import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import swaggerUi from 'swagger-ui-express'
import { createDb } from './src/db.js'
import { authenticate, issueToken } from './src/auth.js'
import { productsRouter } from './src/products.router.js'
import { openapiSpec } from './src/openapi.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Build the Express app. Accepts an optional db so tests can inject their own
 * isolated instance; defaults to a freshly seeded database.
 */
export function createApp(db = createDb()) {
  const app = express()
  app.use(express.json())

  // --- system ---
  // `commit` lets a post-deploy smoke verify the LIVE instance is the version we
  // just shipped (Render injects RENDER_GIT_COMMIT). 'dev' locally / in CI.
  app.get('/health', (req, res) =>
    res.json({ status: 'ok', commit: process.env.RENDER_GIT_COMMIT || 'dev' })
  )

  // --- auth ---
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body ?? {}
    if (!authenticate(username, password)) {
      return res.status(401).json({ error: 'Username and password do not match any user in this service' })
    }
    res.json({ token: issueToken(username), username })
  })

  // --- products ---
  app.use('/api/products', productsRouter(db))

  // --- docs ---
  app.get('/api/openapi.json', (req, res) => res.json(openapiSpec))
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec))

  // --- static UI (served last so /api/* wins) ---
  app.use(express.static(path.join(__dirname, 'public')))

  return app
}
