# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
