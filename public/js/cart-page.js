/*
 * The cart page: review lines, change quantities, remove items, then head to
 * checkout. Everything here is local (window.Cart); nothing hits the server
 * until the order is placed on the checkout page.
 */
Session.initPage()

const itemsEl = document.getElementById('cart-items')
const emptyEl = document.getElementById('cart-empty')
const summaryEl = document.getElementById('cart-summary')
const subtotalEl = document.getElementById('cart-subtotal')

function money(n) {
  return `$${Number(n).toFixed(2)}`
}

function renderLine(line) {
  const row = document.createElement('article')
  row.className = 'card cart-line'
  row.dataset.test = 'cart-line'

  const name = document.createElement('h3')
  name.dataset.test = 'cart-line-name'
  name.textContent = line.name

  const price = document.createElement('p')
  price.className = 'price'
  price.textContent = money(line.price)

  const qty = document.createElement('input')
  qty.dataset.test = 'cart-line-qty'
  qty.type = 'number'
  qty.min = '0'
  qty.value = String(line.quantity)
  qty.className = 'qty'
  qty.addEventListener('change', () => {
    Cart.setQty(line.productId, Math.floor(Number(qty.value) || 0))
    render()
  })

  const lineTotal = document.createElement('p')
  lineTotal.className = 'line-total'
  lineTotal.dataset.test = 'cart-line-total'
  lineTotal.textContent = money(line.price * line.quantity)

  const remove = document.createElement('button')
  remove.dataset.test = 'cart-line-remove'
  remove.className = 'danger'
  remove.textContent = 'Remove'
  remove.addEventListener('click', () => {
    Cart.remove(line.productId)
    render()
  })

  const actions = document.createElement('div')
  actions.className = 'actions'
  actions.append(qty, lineTotal, remove)

  row.append(name, price, actions)
  return row
}

function render() {
  const lines = Cart.items()
  itemsEl.replaceChildren(...lines.map(renderLine))

  const empty = lines.length === 0
  emptyEl.hidden = !empty
  summaryEl.hidden = empty
  subtotalEl.textContent = money(Cart.subtotal())
  Session.updateCartBadge()
}

document.getElementById('checkout-button').addEventListener('click', () => {
  window.location.assign('/checkout.html')
})

render()
