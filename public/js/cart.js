/*
 * Cart — a tiny client-side shopping cart kept in localStorage.
 *
 * The cart is intentionally a CLIENT concern: it's snappy, survives reloads,
 * and needs no server round-trips. Each line stores a name/price snapshot so
 * the cart and checkout pages render without re-fetching the catalogue. None of
 * it is trusted at checkout — the server reprices every line from the live
 * catalogue when the order is placed (see src/orders.router.js).
 *
 * Exposed as window.Cart so plain (non-module) page scripts can share it.
 */
;(function () {
  const KEY = 'cart'

  function read() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items))
  }

  window.Cart = {
    items: read,

    /** Total number of units across all lines (for the topbar badge). */
    count() {
      return read().reduce((n, line) => n + line.quantity, 0)
    },

    /** Sum of price × quantity. Display-only; the server is authoritative. */
    subtotal() {
      return read().reduce((sum, line) => sum + line.price * line.quantity, 0)
    },

    /** Add one (or `qty`) of a product, merging into an existing line. */
    add(product, qty = 1) {
      const items = read()
      const line = items.find((l) => l.productId === product.id)
      if (line) {
        line.quantity += qty
      } else {
        items.push({ productId: product.id, name: product.name, price: product.price, quantity: qty })
      }
      write(items)
    },

    /** Set an exact quantity; a quantity ≤ 0 removes the line. */
    setQty(productId, qty) {
      let items = read()
      if (qty <= 0) {
        items = items.filter((l) => l.productId !== productId)
      } else {
        const line = items.find((l) => l.productId === productId)
        if (line) line.quantity = qty
      }
      write(items)
    },

    remove(productId) {
      write(read().filter((l) => l.productId !== productId))
    },

    clear() {
      localStorage.removeItem(KEY)
    },
  }
})()
