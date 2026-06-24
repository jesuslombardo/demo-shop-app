import test from 'node:test'
import assert from 'node:assert/strict'
import { isValidOrder } from '../../src/orders.router.js'

const customer = { name: 'Ada Lovelace', address: '1 Analytical Engine Way' }

// Pure input validation — the guard for every checkout.
test('isValidOrder accepts a well-formed order', () => {
  assert.equal(isValidOrder({ items: [{ productId: 1, quantity: 2 }], customer }), true)
})

test('isValidOrder rejects an empty or missing item list', () => {
  assert.equal(isValidOrder({ items: [], customer }), false)
  assert.equal(isValidOrder({ customer }), false)
})

test('isValidOrder rejects non-positive or non-integer quantities', () => {
  assert.equal(isValidOrder({ items: [{ productId: 1, quantity: 0 }], customer }), false)
  assert.equal(isValidOrder({ items: [{ productId: 1, quantity: -1 }], customer }), false)
  assert.equal(isValidOrder({ items: [{ productId: 1, quantity: 1.5 }], customer }), false)
})

test('isValidOrder rejects a non-integer product id', () => {
  assert.equal(isValidOrder({ items: [{ productId: 'x', quantity: 1 }], customer }), false)
})

test('isValidOrder requires a customer name and address', () => {
  assert.equal(isValidOrder({ items: [{ productId: 1, quantity: 1 }], customer: { name: 'Ada' } }), false)
  assert.equal(
    isValidOrder({ items: [{ productId: 1, quantity: 1 }], customer: { name: '  ', address: 'x' } }),
    false
  )
})

test('isValidOrder rejects a null or undefined body', () => {
  assert.equal(isValidOrder(null), false)
  assert.equal(isValidOrder(undefined), false)
})
