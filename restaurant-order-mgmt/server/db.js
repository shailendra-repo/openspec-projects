import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const dbDir = path.join(rootDir, 'DB')
const dbPath = path.join(dbDir, 'app.db')

fs.mkdirSync(dbDir, { recursive: true })

export const db = new DatabaseSync(dbPath)

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cuisine TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderNumber INTEGER NOT NULL,
    orderDate TEXT NOT NULL,
    customerName TEXT NOT NULL,
    itemsJson TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PLACED','READY','FULFILLED')),
    placedAt TEXT NOT NULL,
    readyAt TEXT,
    fulfilledAt TEXT,
    announced INTEGER NOT NULL DEFAULT 0
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_number_date ON orders(orderNumber, orderDate);
`)

export { dbPath }
