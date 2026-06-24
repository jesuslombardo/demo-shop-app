/*
 * The checkout page: shows the order summary, collects shipping details, and
 * POSTs the order to /api/orders. The server reprices every line and computes
 * the authoritative total, so the summary here is display-only. On success the
 * local cart is cleared and we land on the confirmation page.
 */
Session.initPage()

const grid = document.getElementById('checkout-grid')
const emptyEl = document.getElementById('cart-empty')
const linesEl = document.getElementById('summary-lines')
const totalEl = document.getElementById('summary-total')
const form = document.getElementById('checkout-form')
const errorEl = document.getElementById('checkout-error')

function money(n) {
  return `$${Number(n).toFixed(2)}`
}

function renderSummary() {
  const lines = Cart.items()
  if (lines.length === 0) {
    grid.hidden = true
    emptyEl.hidden = false
    return false
  }

  // Cart has items: reveal the form/summary and hide the empty state. (The
  // markup starts hidden; now that `.checkout-grid[hidden]` is honoured, the
  // grid must be explicitly un-hidden here — it isn't decorative CSS.)
  grid.hidden = false
  emptyEl.hidden = true

  linesEl.replaceChildren(
    ...lines.map((line) => {
      const row = document.createElement('div')
      row.className = 'summary-row'
      row.dataset.test = 'summary-line'

      const label = document.createElement('span')
      label.textContent = `${line.name} × ${line.quantity}`

      const amount = document.createElement('span')
      amount.textContent = money(line.price * line.quantity)

      row.append(label, amount)
      return row
    })
  )
  totalEl.textContent = money(Cart.subtotal())
  return true
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  errorEl.hidden = true

  const payload = {
    items: Cart.items().map((l) => ({ productId: l.productId, quantity: l.quantity })),
    customer: {
      name: document.getElementById('checkout-name').value,
      address: document.getElementById('checkout-address').value,
      city: document.getElementById('checkout-city').value,
      zip: document.getElementById('checkout-zip').value,
    },
  }

  const res = await Session.apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    errorEl.textContent = body.error || 'Could not place the order'
    errorEl.hidden = false
    return
  }

  const order = await res.json()
  Cart.clear()
  window.location.assign(`/confirmation.html?id=${order.id}`)
})

renderSummary()
