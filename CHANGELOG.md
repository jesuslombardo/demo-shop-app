# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [2.1.0](https://github.com/jesuslombardo/demo-shop-app/compare/v2.0.1...v2.1.0) (2026-06-24)


### Features

* gate shopping to customers — admins can't cart/checkout/order ([#19](https://github.com/jesuslombardo/demo-shop-app/issues/19)) ([9154e62](https://github.com/jesuslombardo/demo-shop-app/commit/9154e628ee72d46a508b26b1fbba6c9b0676a5b4))

## [2.0.1](https://github.com/jesuslombardo/demo-shop-app/compare/v2.0.0...v2.0.1) (2026-06-24)


### Bug Fixes

* reveal the checkout form when the cart has items ([#18](https://github.com/jesuslombardo/demo-shop-app/issues/18)) ([e288762](https://github.com/jesuslombardo/demo-shop-app/commit/e288762e9adf9680ec86cef0db6d02b57f163769))
* session recovery, visible logout, empty-cart checkout, and storefront a11y ([#16](https://github.com/jesuslombardo/demo-shop-app/issues/16)) ([4c1ee9c](https://github.com/jesuslombardo/demo-shop-app/commit/4c1ee9cd9bb68747c97ff0d3273c9e0e5a9b629c))

## [2.0.0] - 2026-06-24

### Added

- **Customer shopping experience** — the buyer journey that complements the
  admin catalogue:
  - **Storefront** — `products.html` adapts to the signed-in role: customers get
    a quantity + **Add to cart** (`data-test="add-to-cart"`) on each product.
  - **Cart** (`cart.html`) — a client-side cart in `localStorage` (`Cart`,
    `public/js/cart.js`): update quantities, remove lines, live subtotal and a
    topbar badge.
  - **Checkout** (`checkout.html`) — shipping form + order summary that POSTs to
    the new orders API.
  - **Confirmation** (`confirmation.html`) and **order history**
    (`orders.html`), backed by persisted orders.
- **Orders API** (`/api/orders`, owned by `products-service`):
  - `POST /api/orders` — place an order; the server **reprices every line from
    the live catalogue** and computes the total (client prices are never
    trusted), snapshotting name/price so history is stable.
  - `GET /api/orders` / `GET /api/orders/:id` — the signed-in user's history and
    a single order (scoped to the owner in the JWT).
  - New `orders` + `order_items` tables in `src/db.js`.
- **Roles** — two demo users: `standard_user` / `secret_sauce` (**customer**)
  and `admin` / `admin_sauce` (**admin**). The JWT and `/api/login` response now
  carry a `role`; `requireAdmin` middleware added.
- **Favicon** — a branded SVG icon (`public/favicon.svg`) linked from every page;
  the legacy `/favicon.ico` probe is answered with `204` so it no longer 404s in
  the browser console.

### Changed

- **BREAKING — product writes now require the `admin` role.** `POST/PUT/DELETE
  /api/products` return **403** for a valid non-admin token (still **401**
  without one). Log in as `admin` to manage the catalogue. The `/api/login`
  response gained a `role` field.

### Notes

- The cart is intentionally client-side; only **orders** are persisted
  server-side. Behaviour is identical in monolith and microservices modes
  (orders travel with `products-service`; the gateway already routes
  `/api/orders` there).
- Consumers of the `playwright-typescript` framework that create products as
  `standard_user` must switch to the `admin` credentials.

## [1.2.0] - 2026-06-24

### Fixed

- **Accessibility — color contrast (WCAG 2.1 AA).** axe-core flagged serious
  `color-contrast` violations on both pages:
  - muted text (`--muted`) was 4.0–4.4:1 on the light backgrounds — darkened to
    clear the 4.5:1 threshold;
  - the product price used the brand green `#3ddc91` (only **1.8:1** on white,
    and a `filter: brightness()` hack axe cannot evaluate) — replaced with an
    accessible dark green (`--price`).
  - Result: **0 serious/critical violations** on login and products.

### Added

- **Microservices mode** (additive; the monolith default is unchanged): the app
  can also run as `auth` + `products` + `gateway` services from one image via
  `docker compose up`, with a Pact provider-verification suite for `auth-service`.

### Notes

- The contrast fix is front-end-only (HTML/CSS); no API, schema, auth, or data
  changes. It lets the `playwright-typescript` framework run **axe-core
  accessibility tests** against a compliant surface (its ADR-021).

## [1.1.0] - 2026-06-23

### Added

- **Responsive products page** for mobile viewports (`≤ 600px`):
  - The top-bar actions (Logout) collapse behind a **☰ hamburger** button
    (`data-test="menu-toggle"`); they live in `data-test="topbar-nav"` and
    toggle open on tap.
  - The add-product form stacks from a 4-column grid into a **single column**.
- Accessibility attributes on the hamburger toggle (`aria-label`,
  `aria-controls`, `aria-expanded`).

### Notes

- **Desktop layout is unchanged**: the hamburger stays hidden and the Logout
  button is always visible.
- No API, schema, auth, or data changes — this is a front-end-only
  (HTML/CSS/JS) enhancement so the
  [`playwright-typescript`](https://github.com/jesuslombardo/playwright-typescript)
  framework can demonstrate **mobile-viewport tests** against a real responsive
  surface.

## [1.0.0] - 2026-06-22

### Added

- Initial release: a minimal full-stack demo shop as a purpose-built System
  Under Test — Express 5 + SQLite (`better-sqlite3`) + JWT + Swagger UI + a
  vanilla HTML/JS front end.
- `POST /api/login` and product CRUD (`/api/products`), with a seeded catalogue
  of the six Sauce Demo products.
- Unit + integration tests (`node --test`), ESLint flat config, a CI pyramid,
  and a Docker image published to GHCR.
