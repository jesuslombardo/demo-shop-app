import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import swaggerUi from 'swagger-ui-express'
import { createDb } from './src/db.js'
import { authenticate, issueToken } from './src/auth.js'
import { productsRouter } from './src/products.router.js'
import { ordersRouter } from './src/orders.router.js'
import { openapiSpec } from './src/openapi.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/*
 * The app is built from small "mount" helpers, each owning one slice of the API.
 * - createApp() mounts ALL of them → the MONOLITH (one process, default).
 * - The per-service entrypoints in services/ mount only their slice → MICROSERVICES.
 * Same business logic either way; only the composition differs. This is the
 * "modular monolith" that makes the auth split additive instead of a rewrite.
 */

/** `commit` lets a post-deploy smoke verify the LIVE instance is the version we
 * just shipped (Render injects RENDER_GIT_COMMIT). 'dev' locally / in CI. */
export function mountSystem(app) {
  app.get('/health', (req, res) =>
    res.json({ status: 'ok', commit: process.env.RENDER_GIT_COMMIT || 'dev' })
  )
}

/** The auth slice: issues a JWT for valid credentials. Owned by auth-service.
 * The token (and the response) carries the user's role so the UI can adapt and
 * protected routes can authorize. */
export function mountAuth(app) {
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body ?? {}
    const user = authenticate(username, password)
    if (!user) {
      return res.status(401).json({ error: 'Username and password do not match any user in this service' })
    }
    res.json({ token: issueToken(user.username, user.role), username: user.username, role: user.role })
  })
}

/** The products slice (CRUD). Owned by products-service. Needs the db. */
export function mountProducts(app, db) {
  app.use('/api/products', productsRouter(db))
}

/** The orders slice (cart checkout + order history). Owned by products-service:
 * orders price themselves against the catalogue, so they share its db. */
export function mountOrders(app, db) {
  app.use('/api/orders', ordersRouter(db))
}

/** OpenAPI spec + Swagger UI. Travels with products-service (it documents the API). */
export function mountDocs(app) {
  app.get('/api/openapi.json', (req, res) => res.json(openapiSpec))
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec))
}

/** The vanilla UI. Served last so /api/* wins. Travels with products-service. */
export function mountStatic(app) {
  // Each page links a real SVG icon (/favicon.svg); answer the browser's legacy
  // /favicon.ico probe with 204 so it never shows up as a 404 in the console.
  app.get('/favicon.ico', (req, res) => res.status(204).end())
  app.use(express.static(path.join(__dirname, 'public')))
}

/**
 * Build the MONOLITH: one Express app that mounts every slice. Accepts an
 * optional db so tests can inject their own isolated instance; defaults to a
 * freshly seeded database. Behaviour is identical to before the split.
 */
export function createApp(db = createDb()) {
  const app = express()
  app.use(express.json())

  mountSystem(app)
  mountAuth(app)
  mountProducts(app, db)
  mountOrders(app, db)
  mountDocs(app)
  mountStatic(app) // last so /api/* wins

  return app
}
