/*
 * The catalogue page, adapted to the signed-in user's role:
 *   - admin    → management view: an "Add product" form + Edit/Remove per card.
 *   - customer → storefront view: a quantity + "Add to cart" per card.
 * Reads are public; the admin write calls go through Session.authHeaders().
 */
Session.initPage()

const isAdmin = Session.isAdmin()
const listEl = document.getElementById('product-list')

// Role badge in the topbar.
const roleBadge = document.getElementById('role-badge')
roleBadge.textContent = isAdmin ? 'admin' : 'customer'
roleBadge.hidden = false

// Reveal the slice of the UI that matches the role.
document.getElementById(isAdmin ? 'admin-tools' : 'shop-hint').hidden = false

/* ----- customer storefront card: quantity + add to cart ----- */
function renderShopCard(p) {
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

  const qty = document.createElement('input')
  qty.dataset.test = 'add-quantity'
  qty.type = 'number'
  qty.min = '1'
  qty.value = '1'
  qty.className = 'qty'

  const add = document.createElement('button')
  add.dataset.test = 'add-to-cart'
  add.textContent = 'Add to cart'
  add.addEventListener('click', () => {
    const n = Math.max(1, Math.floor(Number(qty.value) || 1))
    Cart.add(p, n)
    Session.updateCartBadge()
    add.textContent = 'Added ✓'
    setTimeout(() => (add.textContent = 'Add to cart'), 900)
  })

  const actions = document.createElement('div')
  actions.className = 'actions'
  actions.append(qty, add)

  card.append(name, price, desc, actions)
  return card
}

/* ----- admin management card: edit / remove ----- */
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

  const edit = document.createElement('button')
  edit.dataset.test = 'edit-product'
  edit.className = 'ghost'
  edit.textContent = 'Edit'
  // Swap THIS card for its editable twin; the rest of the list is untouched.
  edit.addEventListener('click', () => card.replaceWith(renderEditCard(p)))

  const remove = document.createElement('button')
  remove.dataset.test = 'delete-product'
  remove.className = 'danger'
  remove.textContent = 'Remove'
  remove.addEventListener('click', async () => {
    await fetch(`/api/products/${p.id}`, { method: 'DELETE', headers: Session.authHeaders() })
    await loadProducts()
  })

  const actions = document.createElement('div')
  actions.className = 'actions'
  actions.append(edit, remove)

  card.append(name, price, desc, actions)
  return card
}

/** The edit twin of a product card: same slot, fields become inputs. Saving
 * PUTs to /api/products/:id (admin only); Cancel restores the read-only card
 * without a round-trip. */
function renderEditCard(p) {
  const card = document.createElement('article')
  card.className = 'card product editing'
  card.dataset.test = 'inventory-item'

  const nameInput = document.createElement('input')
  nameInput.dataset.test = 'edit-product-name'
  nameInput.value = p.name

  const priceInput = document.createElement('input')
  priceInput.dataset.test = 'edit-product-price'
  priceInput.type = 'number'
  priceInput.step = '0.01'
  priceInput.value = p.price

  const descInput = document.createElement('input')
  descInput.dataset.test = 'edit-product-description'
  descInput.placeholder = 'Description (optional)'
  descInput.value = p.description || ''

  const error = document.createElement('p')
  error.dataset.test = 'edit-error'
  error.className = 'error'
  error.hidden = true

  const save = document.createElement('button')
  save.dataset.test = 'save-product'
  save.textContent = 'Save'
  save.addEventListener('click', async () => {
    error.hidden = true
    const res = await fetch(`/api/products/${p.id}`, {
      method: 'PUT',
      headers: Session.authHeaders(),
      body: JSON.stringify({
        name: nameInput.value,
        price: Number(priceInput.value),
        description: descInput.value,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      error.textContent = body.error || 'Could not update product'
      error.hidden = false
      return
    }
    await loadProducts()
  })

  const cancel = document.createElement('button')
  cancel.dataset.test = 'cancel-edit'
  cancel.className = 'ghost'
  cancel.textContent = 'Cancel'
  cancel.addEventListener('click', () => card.replaceWith(renderCard(p)))

  const actions = document.createElement('div')
  actions.className = 'actions'
  actions.append(save, cancel)

  card.append(nameInput, priceInput, descInput, error, actions)
  return card
}

async function loadProducts() {
  const res = await fetch('/api/products')
  const products = await res.json()
  const render = isAdmin ? renderCard : renderShopCard
  listEl.replaceChildren(...products.map(render))
}

// The add form only exists for admins.
if (isAdmin) {
  const addForm = document.getElementById('add-form')
  const addError = document.getElementById('add-error')

  addForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    addError.hidden = true

    const name = document.getElementById('new-product-name').value
    const price = Number(document.getElementById('new-product-price').value)
    const description = document.getElementById('new-product-description').value

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: Session.authHeaders(),
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
}

loadProducts()
