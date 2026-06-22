const token = localStorage.getItem('token')

// No token? Bounce back to login.
if (!token) {
  window.location.replace('/')
}

const listEl = document.getElementById('product-list')
const addForm = document.getElementById('add-form')
const addError = document.getElementById('add-error')

document.getElementById('logout').addEventListener('click', () => {
  localStorage.removeItem('token')
  window.location.assign('/')
})

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

function renderCard(p) {
  const card = document.createElement('article')
  card.className = 'card product'
  card.dataset.test = 'inventory-item'

  const name = document.createElement('h3')
  name.dataset.test = 'inventory-item-name'
  name.textContent = p.name

  const price = document.createElement('p')
  price.className = 'price'
  price.dataset.test = 'inventory-item-price'
  price.textContent = `$${Number(p.price).toFixed(2)}`

  const desc = document.createElement('p')
  desc.className = 'desc'
  desc.textContent = p.description || ''

  const remove = document.createElement('button')
  remove.dataset.test = 'delete-product'
  remove.className = 'danger'
  remove.textContent = 'Remove'
  remove.addEventListener('click', async () => {
    await fetch(`/api/products/${p.id}`, { method: 'DELETE', headers: authHeaders() })
    await loadProducts()
  })

  card.append(name, price, desc, remove)
  return card
}

async function loadProducts() {
  const res = await fetch('/api/products')
  const products = await res.json()
  listEl.replaceChildren(...products.map(renderCard))
}

addForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  addError.hidden = true

  const name = document.getElementById('new-product-name').value
  const price = Number(document.getElementById('new-product-price').value)
  const description = document.getElementById('new-product-description').value

  const res = await fetch('/api/products', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, price, description }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    addError.textContent = body.error || 'Could not add product'
    addError.hidden = false
    return
  }

  addForm.reset()
  await loadProducts()
})

loadProducts()
