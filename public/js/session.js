/*
 * Session — shared topbar/auth glue for every signed-in page.
 *
 * Login stores { token, role, username } in localStorage; these helpers read
 * them back, attach the Bearer header, and wire the common topbar controls
 * (logout, mobile hamburger, live cart badge). Exposed as window.Session so the
 * plain page scripts can reuse it. Depends on window.Cart for the badge, so
 * load cart.js before session.js (the login page omits both — it only needs
 * the token-freshness helpers below).
 *
 * A token isn't "present or absent" — it EXPIRES (1h TTL, see src/auth.js). So
 * "logged in" means a token that exists AND hasn't expired. Treating a stale
 * token as a live session is what trapped users on a page they couldn't use
 * (login redirected away, checkout 401'd). Everything here checks freshness.
 */
;(function () {
  /** Decode a JWT's payload claims. No signature check — this is display/UX
   * only; the server stays authoritative. Returns the claims, or null if the
   * token is missing or unparseable. */
  function decodeClaims(token) {
    try {
      const part = token.split('.')[1]
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
      return JSON.parse(atob(padded))
    } catch {
      return null
    }
  }

  /** True only if the token exists and its `exp` is still in the future. */
  function tokenIsFresh(token) {
    const claims = token && decodeClaims(token)
    if (!claims || typeof claims.exp !== 'number') return false
    return claims.exp * 1000 > Date.now()
  }

  const Session = {
    token: () => localStorage.getItem('token'),
    role: () => localStorage.getItem('role'),
    username: () => localStorage.getItem('username'),
    isAdmin: () => localStorage.getItem('role') === 'admin',

    /** A usable session = a token that exists and hasn't expired. */
    isLoggedIn: () => tokenIsFresh(Session.token()),

    /** Forget the stored session (without navigating). */
    clear() {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('username')
    },

    /** No usable session? Drop any stale token and bounce to login. Returns the
     * token for convenience. */
    requireLogin() {
      if (!Session.isLoggedIn()) {
        Session.clear()
        window.location.replace('/')
        return null
      }
      return Session.token()
    },

    authHeaders() {
      return { 'Content-Type': 'application/json', Authorization: `Bearer ${Session.token()}` }
    },

    /**
     * fetch() for authenticated API calls: attaches the Bearer header and, if
     * the server rejects the token (401 — expired/invalid), clears the session
     * and returns to login. The returned promise then never settles, so callers
     * don't read a response we're already navigating away from. Use this for
     * every protected request; the public GET /api/products can use plain fetch.
     */
    async apiFetch(url, options = {}) {
      const res = await fetch(url, {
        ...options,
        headers: { ...Session.authHeaders(), ...(options.headers || {}) },
      })
      if (res.status === 401) {
        Session.logout()
        return new Promise(() => {})
      }
      return res
    },

    logout() {
      Session.clear()
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
