const form = document.getElementById('login-form')
const errorEl = document.getElementById('error')

// Already authenticated? Skip straight to the catalogue.
if (localStorage.getItem('token')) {
  window.location.replace('/products.html')
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  errorEl.hidden = true

  const username = document.getElementById('username').value
  const password = document.getElementById('password').value

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      errorEl.textContent = body.error || 'Login failed'
      errorEl.hidden = false
      return
    }

    const { token } = await res.json()
    localStorage.setItem('token', token)
    window.location.assign('/products.html')
  } catch {
    errorEl.textContent = 'Network error — is the API running?'
    errorEl.hidden = false
  }
})
