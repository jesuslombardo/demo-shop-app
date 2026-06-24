/*
 * Order confirmation / detail page. Reads ?id from the URL and fetches the
 * order from /api/orders/:id (the server only returns orders owned by the
 * signed-in user). Doubles as the "view past order" target from the history.
 */
Session.initPage()

const el = document.getElementById('order-confirmation')

function money(n) {
  return `$${Number(n).toFixed(2)}`
}

function row(label, amount, opts = {}) {
  const r = document.createElement('div')
  r.className = opts.total ? 'summary-row total' : 'summary-row'
  if (opts.test) r.dataset.test = opts.test
  const l = document.createElement('span')
  l.textContent = label
  const a = document.createElement('span')
  a.textContent = amount
  r.append(l, a)
  return r
}

function renderError(message) {
  const p = document.createElement('p')
  p.className = 'error'
  p.dataset.test = 'confirmation-error'
  p.textContent = message
  el.append(p)
}

async function load() {
  const id = new URLSearchParams(window.location.search).get('id')
  if (!id) {
    renderError('No order id provided.')
    return
  }

  const res = await fetch(`/api/orders/${id}`, { headers: Session.authHeaders() })
  if (!res.ok) {
    renderError(res.status === 404 ? 'Order not found.' : 'Could not load the order.')
    return
  }

  const order = await res.json()

  const thanks = document.createElement('p')
  thanks.className = 'thanks'
  thanks.dataset.test = 'thank-you'
  thanks.textContent = 'Thank you! Your order has been placed.'

  const number = document.createElement('h2')
  number.dataset.test = 'order-number'
  number.textContent = `Order #${order.id}`

  const items = document.createElement('div')
  items.dataset.test = 'order-items'
  for (const it of order.items) {
    items.append(row(`${it.name} × ${it.quantity}`, money(it.lineTotal), { test: 'order-item' }))
  }

  const total = row('Total', money(order.total), { total: true, test: 'order-total' })

  const ship = document.createElement('p')
  ship.className = 'desc'
  ship.dataset.test = 'order-shipping'
  ship.textContent = `Shipping to ${order.customer.name}, ${order.customer.address}`

  el.append(thanks, number, items, total, ship)
}

load()
