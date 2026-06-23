import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { Verifier } from '@pact-foundation/pact'
import { mountSystem, mountAuth } from '../app.js'

/*
 * PROVIDER VERIFICATION (Pact). auth-service is the PROVIDER.
 *
 * We boot just the auth slice and let Pact replay the consumer's recorded
 * requests (pacts/shop-web-auth-service.json, authored by the `shop-web`
 * consumer in the playwright-typescript repo) against it, asserting the real
 * responses still satisfy the contract. If auth drifts — renames `token`,
 * changes a status — this FAILS. That is the build-breaking guarantee.
 *
 * The contract is OWNED by the consumer repo, so PACT_DIR points at it:
 *   - CI checks out playwright-typescript and sets PACT_DIR to its pacts/.
 *   - Locally: PACT_DIR="/path/to/playwright-typescript/pacts" npm run test:contract
 *
 * Lives in contract/ (NOT test/) so it stays out of the default `npm test`
 * discovery — it needs the cross-repo pact, so it runs as its own opt-in job.
 */
test('auth-service satisfies the shop-web consumer contract', async () => {
  const pactDir = process.env.PACT_DIR || path.resolve(import.meta.dirname, 'pacts')
  const pactFile = path.join(pactDir, 'shop-web-auth-service.json')
  assert.ok(
    fs.existsSync(pactFile),
    `Pact file not found at ${pactFile}. Set PACT_DIR to the consumer repo's pacts/ folder.`
  )

  const app = express()
  app.use(express.json())
  mountSystem(app)
  mountAuth(app)
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })
  const { port } = server.address()

  try {
    await new Verifier({
      provider: 'auth-service',
      providerBaseUrl: `http://localhost:${port}`,
      pactUrls: [pactFile],
      stateHandlers: {
        'standard_user is a registered user': async () => {
          // The demo user is hardcoded in auth.js, so it is always present —
          // nothing to seed. A real provider would set up the user here.
          return 'standard_user is present'
        },
      },
    }).verifyProvider()
  } finally {
    server.close()
  }
})
