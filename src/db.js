import Database from 'better-sqlite3'

/*
 * Seed catalogue — borrowed from Sauce Demo so the data stays familiar and
 * the E2E suite reads naturally. Kept intentionally tiny and static.
 */
const SEED_PRODUCTS = [
  {
    name: 'Sauce Labs Backpack',
    price: 29.99,
    description: 'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
  },
  {
    name: 'Sauce Labs Bike Light',
    price: 9.99,
    description: "A red light isn't the desire to stop, it's the propensity to brake! This lightweight, water-resistant bike light is a must-have.",
  },
  {
    name: 'Sauce Labs Bolt T-Shirt',
    price: 15.99,
    description: 'Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton.',
  },
  {
    name: 'Sauce Labs Fleece Jacket',
    price: 49.99,
    description: "It's not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything.",
  },
  {
    name: 'Sauce Labs Onesie',
    price: 7.99,
    description: "Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure.",
  },
  {
    name: 'Test.allTheThings() T-Shirt (Red)',
    price: 15.99,
    description: 'This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests.',
  },
]

/**
 * Create (or open) the database, ensure the schema exists, and seed it once.
 *
 * Defaults to an in-memory database so every process start is deterministic
 * and clean — ideal for ephemeral CI and reproducible tests. Set DB_PATH to a
 * file path for local persistence across restarts.
 */
export function createDb(path = process.env.DB_PATH || ':memory:') {
  const db = new Database(path)
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT NOT NULL DEFAULT ''
    )
  `)
  seedIfEmpty(db)
  return db
}

function seedIfEmpty(db) {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM products').get()
  if (count > 0) return

  const insert = db.prepare('INSERT INTO products (name, price, description) VALUES (?, ?, ?)')
  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row.name, row.price, row.description)
  })
  insertMany(SEED_PRODUCTS)
}
