import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../../app.js'

let server
let base

test.before(async () => {
  const app = createApp() // fresh in-memory db
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`
      resolve()
    })
  })
})

test.after(() => server?.close())

async function login() {
  const res = await fetch(`${base}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'standard_user', password: 'secret_sauce' }),
  })
  return (await res.json()).token
}

test('GET /health returns ok', async () => {
  const res = await fetch(`${base}/health`)
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { status: 'ok' })
})

test('GET /api/products returns the seeded catalogue', async () => {
  const res = await fetch(`${base}/api/products`)
  assert.equal(res.status, 200)
  const products = await res.json()
  assert.ok(products.length >= 6)
  assert.ok(products.some((p) => p.name === 'Sauce Labs Backpack'))
})

test('login rejects bad credentials', async () => {
  const res = await fetch(`${base}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'nope', password: 'nope' }),
  })
  assert.equal(res.status, 401)
})

test('creating a product requires a token', async () => {
  const res = await fetch(`${base}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'No Auth', price: 1 }),
  })
  assert.equal(res.status, 401)
})

test('authenticated CRUD round-trip', async () => {
  const token = await login()
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const created = await fetch(`${base}/api/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Node Test Item', price: 3.5 }),
  })
  assert.equal(created.status, 201)
  const { id } = await created.json()

  const updated = await fetch(`${base}/api/products/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ price: 4.25 }),
  })
  assert.equal(updated.status, 200)
  assert.equal((await updated.json()).price, 4.25)

  const removed = await fetch(`${base}/api/products/${id}`, { method: 'DELETE', headers })
  assert.equal(removed.status, 204)

  const gone = await fetch(`${base}/api/products/${id}`)
  assert.equal(gone.status, 404)
})
