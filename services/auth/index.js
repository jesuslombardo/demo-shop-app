import express from 'express'
import { mountSystem, mountAuth } from '../../app.js'

/*
 * auth-service: owns ONLY the login slice. It signs JWTs with JWT_SECRET.
 * Other services verify those tokens locally with the same secret (HS256), so
 * auth is NOT called on every request — only at login. That's why splitting it
 * out is cheap: the boundary is at login + deploy, not on each protected call.
 */
const app = express()
app.use(express.json())

mountSystem(app)
mountAuth(app)

const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, () => {
  console.log(`auth-service listening on http://localhost:${PORT}`)
})
