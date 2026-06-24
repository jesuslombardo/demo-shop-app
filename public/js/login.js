const form = document.getElementById('login-form')
const errorEl = document.getElementById('error')

// Already authenticated with a still-valid token? Skip straight to the
// catalogue. A stale/expired token is cleared instead, so the user sees the
// login form again rather than being bounced to a page they can't use.
if (Session.isLoggedIn()) {
  window.location.replace('/products.html')
} else {
  Session.clear()
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

    const { token, role, username: who } = await res.json()
    localStorage.setItem('token', token)
    localStorage.setItem('role', role)
    localStorage.setItem('username', who)
    window.location.assign('/products.html')
  } catch {
    errorEl.textContent = 'Network error — is the API running?'
    errorEl.hidden = false
  }
})
