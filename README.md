# Demo Shop App 🛒

[![CI](https://github.com/jesuslombardo/demo-shop-app/actions/workflows/ci.yml/badge.svg)](https://github.com/jesuslombardo/demo-shop-app/actions/workflows/ci.yml)

A **minimal full-stack demo shop** built as a purpose-made **System Under Test (SUT)** for the
[`playwright-typescript`](https://github.com/jesuslombardo/playwright-typescript) automation framework.

It exists so that framework can demonstrate a **real testing pyramid**: API tests and end-to-end
tests running against the **same application**, with the API layer gating the slower E2E layer in CI.

## Stack

| Layer    | Choice                                  | Why                                                    |
| -------- | --------------------------------------- | ------------------------------------------------------ |
| API      | **Express 5**                           | Tiny, ubiquitous, zero ceremony                        |
| Storage  | **SQLite** (`better-sqlite3`, in-memory) | Real SQL, zero setup, deterministic on each boot       |
| Auth     | **JWT** (`jsonwebtoken`)                | Mirrors a realistic Bearer-token flow                  |
| Docs     | **Swagger UI** (`swagger-ui-express`)   | Browsable, self-documenting contract                   |
| UI       | **Vanilla HTML/JS** served by Express   | No framework, no build step → starts in ~1s, easy E2E  |

## Endpoints

| Method   | Path                 | Auth   | Description                          |
| -------- | -------------------- | ------ | ------------------------------------ |
| `GET`    | `/health`            | —      | Readiness probe (`{ status: 'ok' }`) |
| `POST`   | `/api/login`         | —      | Exchange credentials for a JWT       |
| `GET`    | `/api/products`      | —      | List all products                    |
| `GET`    | `/api/products/:id`  | —      | Get one product                      |
| `POST`   | `/api/products`      | Bearer | Create a product                     |
| `PUT`    | `/api/products/:id`  | Bearer | Update a product                     |
| `DELETE` | `/api/products/:id`  | Bearer | Delete a product                     |
| `GET`    | `/api/docs`          | —      | Swagger UI                           |
| `GET`    | `/api/openapi.json`  | —      | Raw OpenAPI spec                      |

**Demo credentials** (public by design, mirroring Sauce Demo): `standard_user` / `secret_sauce`.

The catalogue is seeded with the six Sauce Demo products on startup.

## Run it

### Local (Node)

```bash
npm ci
npm start        # http://localhost:3000  (Swagger at /api/docs)
```

### Docker

```bash
docker build -t demo-shop-app .
docker run --rm -p 3000:3000 demo-shop-app
```

### Pull the published image (GHCR)

```bash
docker run --rm -p 3000:3000 ghcr.io/jesuslombardo/demo-shop-app:latest
```

## Configuration

| Env var         | Default              | Purpose                                        |
| --------------- | -------------------- | ---------------------------------------------- |
| `PORT`          | `3000`               | HTTP port                                      |
| `DB_PATH`       | `:memory:`           | SQLite path; a file persists data across boots |
| `JWT_SECRET`    | `demo-shop-dev-secret` | Signing secret                               |
| `DEMO_USER`     | `standard_user`      | Demo username                                  |
| `DEMO_PASSWORD` | `secret_sauce`       | Demo password                                  |

## Tests & CI

Two tiers, run with Node's built-in test runner (`node --test`, no extra deps):

- `npm run test:unit` — **unit tests** of pure functions (`authenticate`, `requireAuth`/JWT, `isValidProduct`); no HTTP, no DB.
- `npm run test:integration` — **integration tests** that boot the app and exercise it over HTTP (health, auth, CRUD round-trip).
- `npm test` — both. `npm run lint` — ESLint (flat config).

**CI** (`.github/workflows/ci.yml`) runs a mini-pyramid, cheap-first / fail-fast:

```
lint → unit → integration → build & publish image to GHCR (on main)
```

The published image is consumed by the `playwright-typescript` pipeline, which spins it up
ephemerally to run API tests first, then E2E — the testing pyramid across both repos.

There's also a separate cross-repo check (`.github/workflows/e2e.yml`): every PR here runs that
framework's **API + @smoke** suite against the PR's app version, as a required gate.
