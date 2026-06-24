import test from 'node:test'
import assert from 'node:assert/strict'
import { authenticate, issueToken, requireAuth, requireAdmin, requireCustomer } from '../../src/auth.js'

// Pure credential check — no HTTP, no DB. Returns the user record (with role) or null.
test('authenticate accepts the demo shopper as a customer', () => {
  assert.deepEqual(authenticate('standard_user', 'secret_sauce'), {
    username: 'standard_user',
    role: 'customer',
  })
})

test('authenticate accepts the admin user with the admin role', () => {
  assert.deepEqual(authenticate('admin', 'admin_sauce'), { username: 'admin', role: 'admin' })
})

test('authenticate rejects a wrong password', () => {
  assert.equal(authenticate('standard_user', 'nope'), null)
})

test('authenticate rejects an unknown user', () => {
  assert.equal(authenticate('ghost', 'secret_sauce'), null)
})

// Minimal fakes so we can unit-test the middleware without a server.
function fakeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

test('requireAuth calls next and sets req.user for a valid token', () => {
  const req = { headers: { authorization: `Bearer ${issueToken('standard_user')}` } }
  const res = fakeRes()
  let nextCalled = false

  requireAuth(req, res, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, true)
  assert.equal(req.user.sub, 'standard_user')
})

test('requireAuth returns 401 when the Authorization header is missing', () => {
  const req = { headers: {} }
  const res = fakeRes()
  let nextCalled = false

  requireAuth(req, res, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 401)
})

test('requireAuth returns 401 for an invalid token', () => {
  const req = { headers: { authorization: 'Bearer not-a-real-token' } }
  const res = fakeRes()

  requireAuth(req, res, () => {
    throw new Error('next should not be called for an invalid token')
  })

  assert.equal(res.statusCode, 401)
})

test('requireAdmin calls next for an admin token', () => {
  const req = { headers: { authorization: `Bearer ${issueToken('admin', 'admin')}` } }
  const res = fakeRes()
  let nextCalled = false

  requireAdmin(req, res, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, true)
})

test('requireAdmin returns 403 for a non-admin (customer) token', () => {
  const req = { headers: { authorization: `Bearer ${issueToken('standard_user', 'customer')}` } }
  const res = fakeRes()

  requireAdmin(req, res, () => {
    throw new Error('next should not be called for a customer')
  })

  assert.equal(res.statusCode, 403)
})

test('requireAdmin returns 401 when no token is present', () => {
  const req = { headers: {} }
  const res = fakeRes()

  requireAdmin(req, res, () => {
    throw new Error('next should not be called without a token')
  })

  assert.equal(res.statusCode, 401)
})

test('requireCustomer calls next for a customer token', () => {
  const req = { headers: { authorization: `Bearer ${issueToken('standard_user', 'customer')}` } }
  const res = fakeRes()
  let nextCalled = false

  requireCustomer(req, res, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, true)
})

test('requireCustomer returns 403 for a non-customer (admin) token', () => {
  const req = { headers: { authorization: `Bearer ${issueToken('admin', 'admin')}` } }
  const res = fakeRes()

  requireCustomer(req, res, () => {
    throw new Error('next should not be called for an admin')
  })

  assert.equal(res.statusCode, 403)
})

test('requireCustomer returns 401 when no token is present', () => {
  const req = { headers: {} }
  const res = fakeRes()

  requireCustomer(req, res, () => {
    throw new Error('next should not be called without a token')
  })

  assert.equal(res.statusCode, 401)
})
