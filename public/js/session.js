/*
 * Session — shared topbar/auth glue for every signed-in page.
 *
 * Login stores { token, role, username } in localStorage; these helpers read
 * them back, attach the Bearer header, and wire the common topbar controls
 * (logout, mobile hamburger, live cart badge). Exposed as window.Session so the
 * plain page scripts can reuse it. Depends on window.Cart for the badge, so
 * load cart.js before session.js.
 */
;(function () {
  const Session = {
    token: () => localStorage.getItem('token'),
    role: () => localStorage.getItem('role'),
    username: () => localStorage.getItem('username'),
    isAdmin: () => localStorage.getItem('role') === 'admin',

    /** No token? Bounce to login. Returns the token for convenience. */
    requireLogin() {
      const token = Session.token()
      if (!token) window.location.replace('/')
      return token
    },

    authHeaders() {
      return { 'Content-Type': 'application/json', Authorization: `Bearer ${Session.token()}` }
    },

    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('username')
      window.location.assign('/')
    },

    /** Refresh the topbar cart badge from the current cart contents. */
    updateCartBadge() {
      const el = document.getElementById('cart-count')
      if (el && window.Cart) el.textContent = String(window.Cart.count())
    },

    /**
     * Guard the page and wire the shared topbar. Call once on every signed-in
     * page. Each control is wired only if present, so pages can omit any of it.
     */
    initPage() {
      const token = Session.requireLogin()
      if (!token) return null

      const logout = document.getElementById('logout')
      if (logout) logout.addEventListener('click', Session.logout)

      const menuToggle = document.getElementById('menu-toggle')
      const topbarNav = document.getElementById('topbar-nav')
      if (menuToggle && topbarNav) {
        menuToggle.addEventListener('click', () => {
          const open = topbarNav.classList.toggle('open')
          menuToggle.setAttribute('aria-expanded', String(open))
        })
      }

      Session.updateCartBadge()
      return token
    },
  }

  window.Session = Session
})()
