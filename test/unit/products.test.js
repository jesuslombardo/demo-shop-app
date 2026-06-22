import test from 'node:test'
import assert from 'node:assert/strict'
import { isValidProduct } from '../../src/products.router.js'

// Pure input validation — the guard for every write to the catalogue.
test('isValidProduct accepts a well-formed product', () => {
  assert.equal(isValidProduct({ name: 'Widget', price: 9.99 }), true)
})

test('isValidProduct rejects an empty/whitespace name', () => {
  assert.equal(isValidProduct({ name: '   ', price: 9.99 }), false)
})

test('isValidProduct rejects a missing or non-numeric price', () => {
  assert.equal(isValidProduct({ name: 'Widget' }), false)
  assert.equal(isValidProduct({ name: 'Widget', price: 'free' }), false)
  assert.equal(isValidProduct({ name: 'Widget', price: NaN }), false)
})

test('isValidProduct rejects a null or undefined body', () => {
  assert.equal(isValidProduct(null), false)
  assert.equal(isValidProduct(undefined), false)
})
