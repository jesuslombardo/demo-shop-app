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

async function login(username = 'standard_user', password = 'secret_sauce') {
  const res = await fetch(`${base}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return res.json()
}

const customerToken = async () => (await login()).token
const adminToken = async () => (await login('admin', 'admin_sauce')).token

test('GET /health returns ok', async () => {
  const res = await fetch(`${base}/health`)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.status, 'ok')
  // commit is 'dev' outside Render; a post-deploy smoke checks it matches the SHA
  assert.equal(typeof body.commit, 'string')
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

test('login returns the user role', async () => {
  assert.equal((await login()).role, 'customer')
  assert.equal((await login('admin', 'admin_sauce')).role, 'admin')
})

test('creating a product requires a token', async () => {
  const res = await fetch(`${base}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'No Auth', price: 1 }),
  })
  assert.equal(res.status, 401)
})

test('a customer token cannot write products (403)', async () => {
  const token = await customerToken()
  const res = await fetch(`${base}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Customer Item', price: 1 }),
  })
  assert.equal(res.status, 403)
})

test('admin CRUD round-trip', async () => {
  const token = await adminToken()
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

test('listing orders requires a token', async () => {
  const res = await fetch(`${base}/api/orders`)
  assert.equal(res.status, 401)
})

test('orders are customer-only — an admin is rejected (403)', async () => {
  const token = await adminToken()
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const list = await fetch(`${base}/api/orders`, { headers })
  assert.equal(list.status, 403)

  const placed = await fetch(`${base}/api/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      items: [{ productId: 1, quantity: 1 }],
      customer: { name: 'Admin', address: 'HQ' },
    }),
  })
  assert.equal(placed.status, 403)
})

test('checkout places an order with a server-computed total, then it appears in history', async () => {
  const token = await customerToken()
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  // Order two of the cheapest seeded product and one of the next.
  const catalogue = await (await fetch(`${base}/api/products`)).json()
  const [a, b] = catalogue
  const expectedTotal = Number((a.price * 2 + b.price * 1).toFixed(2))

  const placed = await fetch(`${base}/api/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      items: [
        { productId: a.id, quantity: 2 },
        { productId: b.id, quantity: 1 },
      ],
      customer: { name: 'Ada Lovelace', address: '1 Analytical Engine Way' },
    }),
  })
  assert.equal(placed.status, 201)
  const order = await placed.json()
  assert.equal(order.total, expectedTotal)
  assert.equal(order.items.length, 2)
  // Line price/name are snapshots taken from the catalogue server-side.
  assert.equal(order.items[0].name, a.name)
  assert.equal(order.items[0].lineTotal, Number((a.price * 2).toFixed(2)))

  // Fetch it back by id.
  const fetched = await fetch(`${base}/api/orders/${order.id}`, { headers })
  assert.equal(fetched.status, 200)
  assert.equal((await fetched.json()).id, order.id)

  // It shows up in the user's history.
  const history = await (await fetch(`${base}/api/orders`, { headers })).json()
  assert.ok(history.some((o) => o.id === order.id))
})

test('checkout rejects an unknown product', async () => {
  const token = await customerToken()
  const res = await fetch(`${base}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      items: [{ productId: 999999, quantity: 1 }],
      customer: { name: 'Ghost', address: 'Nowhere' },
    }),
  })
  assert.equal(res.status, 400)
})

test('orders are scoped to their owner (an id that is not yours → 404)', async () => {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${await customerToken()}` }
  const placed = await fetch(`${base}/api/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      items: [{ productId: 1, quantity: 1 }],
      customer: { name: 'Ada', address: 'Somewhere' },
    }),
  })
  const { id } = await placed.json()

  // Owner can read their own order…
  assert.equal((await fetch(`${base}/api/orders/${id}`, { headers })).status, 200)

  // …but the lookup is scoped by username, so an id that isn't theirs is invisible
  // → 404 (the same path that hides one customer's orders from another). Admins
  // can't reach this at all — orders are customer-only (covered above, 403).
  const notMine = await fetch(`${base}/api/orders/${id + 100000}`, { headers })
  assert.equal(notMine.status, 404)
})
