import test from 'node:test'
import assert from 'node:assert/strict'
import { authenticate, issueToken, requireAuth } from '../../src/auth.js'

// Pure credential check — no HTTP, no DB.
test('authenticate accepts the demo user', () => {
  assert.equal(authenticate('standard_user', 'secret_sauce'), true)
})

test('authenticate rejects a wrong password', () => {
  assert.equal(authenticate('standard_user', 'nope'), false)
})

test('authenticate rejects an unknown user', () => {
  assert.equal(authenticate('ghost', 'secret_sauce'), false)
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
