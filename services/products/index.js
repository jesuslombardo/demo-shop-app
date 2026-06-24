import express from 'express'
import { createDb } from '../../src/db.js'
import { mountSystem, mountProducts, mountOrders, mountDocs, mountStatic } from '../../app.js'

/*
 * products-service: owns the catalogue + orders (its own db), the API docs and
 * the static UI. Writes still go through requireAuth/requireAdmin, which verify
 * the JWT LOCALLY with the shared JWT_SECRET — no runtime call to auth-service.
 */
const app = express()
app.use(express.json())

const db = createDb()
mountSystem(app)
mountProducts(app, db)
mountOrders(app, db)
mountDocs(app)
mountStatic(app)

const PORT = Number(process.env.PORT) || 3002
app.listen(PORT, () => {
  console.log(`products-service listening on http://localhost:${PORT}`)
})
