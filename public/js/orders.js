/*
 * Order history: lists the signed-in user's past orders (newest first) from
 * GET /api/orders. Each row links to the confirmation page, which reuses the
 * same endpoint to show the full order detail.
 */
Session.initPage()

const listEl = document.getElementById('orders-list')
const emptyEl = document.getElementById('orders-empty')

function money(n) {
  return `$${Number(n).toFixed(2)}`
}

function unitCount(order) {
  return order.items.reduce((n, it) => n + it.quantity, 0)
}

function renderOrder(order) {
  const card = document.createElement('a')
  card.className = 'card order-row'
  card.dataset.test = 'order-row'
  card.href = `/confirmation.html?id=${order.id}`

  const head = document.createElement('div')
  head.className = 'order-row-head'

  const number = document.createElement('h3')
  number.textContent = `Order #${order.id}`

  const total = document.createElement('span')
  total.className = 'price'
  total.dataset.test = 'order-row-total'
  total.textContent = money(order.total)

  head.append(number, total)

  const meta = document.createElement('p')
  meta.className = 'desc'
  const units = unitCount(order)
  meta.textContent = `${order.createdAt} · ${units} item${units === 1 ? '' : 's'}`

  card.append(head, meta)
  return card
}

async function load() {
  const res = await Session.apiFetch('/api/orders')
  if (!res.ok) {
    emptyEl.textContent = 'Could not load your orders.'
    emptyEl.hidden = false
    return
  }

  const orders = await res.json()
  if (orders.length === 0) {
    emptyEl.hidden = false
    return
  }
  listEl.replaceChildren(...orders.map(renderOrder))
}

load()
