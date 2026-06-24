import { Router } from 'express'
import { requireCustomer } from './auth.js'

/**
 * Shape check for a checkout payload. A valid order has at least one line item
 * (each a positive-integer quantity of a product id) and a customer with a
 * non-empty name and address. Prices/totals are NOT trusted from the client —
 * they are recomputed server-side from the catalogue at checkout.
 */
export function isValidOrder(body) {
  if (!body || !Array.isArray(body.items) || body.items.length === 0) return false

  const itemsOk = body.items.every(
    (it) =>
      it &&
      Number.isInteger(it.productId) &&
      Number.isInteger(it.quantity) &&
      it.quantity > 0
  )
  if (!itemsOk) return false

  const c = body.customer
  return Boolean(
    c &&
      typeof c.name === 'string' &&
      c.name.trim() !== '' &&
      typeof c.address === 'string' &&
      c.address.trim() !== ''
  )
}

/** Maps a row + its items into the camelCase order shape the API exposes. */
function toOrder(row, items) {
  return {
    id: row.id,
    username: row.username,
    customer: {
      name: row.customer_name,
      address: row.customer_address,
      city: row.customer_city,
      zip: row.customer_zip,
    },
    total: row.total,
    createdAt: row.created_at,
    items: items.map((it) => ({
      productId: it.product_id,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      lineTotal: Number((it.price * it.quantity).toFixed(2)),
    })),
  }
}

/**
 * Builds the /api/orders router. Every endpoint requires a token; an order is
 * owned by the username in that token, so a user only ever sees their own.
 */
export function ordersRouter(db) {
  const router = Router()

  const findProduct = db.prepare('SELECT * FROM products WHERE id = ?')
  const findOrder = db.prepare('SELECT * FROM orders WHERE id = ? AND username = ?')
  const findItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?')
  const listOrders = db.prepare('SELECT * FROM orders WHERE username = ? ORDER BY id DESC')

  const insertOrder = db.prepare(
    `INSERT INTO orders (username, customer_name, customer_address, customer_city, customer_zip, total)
     VALUES (@username, @name, @address, @city, @zip, @total)`
  )
  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_id, name, price, quantity)
     VALUES (@orderId, @productId, @name, @price, @quantity)`
  )

  // Persist the order and all its line items atomically.
  const placeOrder = db.transaction((order, lines) => {
    const info = insertOrder.run(order)
    for (const line of lines) insertItem.run({ orderId: info.lastInsertRowid, ...line })
    return info.lastInsertRowid
  })

  router.get('/', requireCustomer, (req, res) => {
    const rows = listOrders.all(req.user.sub)
    res.json(rows.map((row) => toOrder(row, findItems.all(row.id))))
  })

  router.get('/:id', requireCustomer, (req, res) => {
    const row = findOrder.get(Number(req.params.id), req.user.sub)
    if (!row) return res.status(404).json({ error: 'Order not found' })
    res.json(toOrder(row, findItems.all(row.id)))
  })

  router.post('/', requireCustomer, (req, res) => {
    if (!isValidOrder(req.body)) {
      return res
        .status(400)
        .json({ error: 'items (non-empty, positive quantities) and customer (name, address) are required' })
    }

    // Resolve every line against the live catalogue; reject unknown products and
    // snapshot the authoritative name/price so the total can't be tampered with.
    const lines = []
    for (const { productId, quantity } of req.body.items) {
      const product = findProduct.get(productId)
      if (!product) return res.status(400).json({ error: `Product ${productId} does not exist` })
      lines.push({ productId, name: product.name, price: product.price, quantity })
    }

    const total = Number(lines.reduce((sum, l) => sum + l.price * l.quantity, 0).toFixed(2))
    const { name, address, city = '', zip = '' } = req.body.customer
    const id = placeOrder(
      { username: req.user.sub, name: name.trim(), address: address.trim(), city, zip, total },
      lines
    )

    res.status(201).json(toOrder(findOrder.get(id, req.user.sub), findItems.all(id)))
  })

  return router
}
