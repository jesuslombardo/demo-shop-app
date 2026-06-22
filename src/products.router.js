import { Router } from 'express'
import { requireAuth } from './auth.js'

export function isValidProduct(body) {
  return Boolean(
    body &&
      typeof body.name === 'string' &&
      body.name.trim() !== '' &&
      typeof body.price === 'number' &&
      Number.isFinite(body.price)
  )
}

/** Builds the /api/products router. Reads are public; writes require a token. */
export function productsRouter(db) {
  const router = Router()

  const findById = db.prepare('SELECT * FROM products WHERE id = ?')

  router.get('/', (req, res) => {
    res.json(db.prepare('SELECT * FROM products ORDER BY id').all())
  })

  router.get('/:id', (req, res) => {
    const product = findById.get(Number(req.params.id))
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  })

  router.post('/', requireAuth, (req, res) => {
    if (!isValidProduct(req.body)) {
      return res.status(400).json({ error: 'name (non-empty string) and price (number) are required' })
    }
    const { name, price, description = '' } = req.body
    const info = db
      .prepare('INSERT INTO products (name, price, description) VALUES (?, ?, ?)')
      .run(name.trim(), price, description)
    res.status(201).json(findById.get(info.lastInsertRowid))
  })

  router.put('/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id)
    const existing = findById.get(id)
    if (!existing) return res.status(404).json({ error: 'Product not found' })

    const merged = {
      name: req.body?.name ?? existing.name,
      price: req.body?.price ?? existing.price,
      description: req.body?.description ?? existing.description,
    }
    if (!isValidProduct(merged)) {
      return res.status(400).json({ error: 'name (non-empty string) and price (number) are required' })
    }
    db.prepare('UPDATE products SET name = ?, price = ?, description = ? WHERE id = ?').run(
      merged.name.trim(),
      merged.price,
      merged.description,
      id
    )
    res.json(findById.get(id))
  })

  router.delete('/:id', requireAuth, (req, res) => {
    const info = db.prepare('DELETE FROM products WHERE id = ?').run(Number(req.params.id))
    if (info.changes === 0) return res.status(404).json({ error: 'Product not found' })
    res.status(204).end()
  })

  return router
}
