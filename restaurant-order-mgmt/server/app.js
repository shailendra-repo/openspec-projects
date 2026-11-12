import express from 'express'
import cors from 'cors'
import { db, dbPath } from './db.js'

function localDateKey(d = new Date()) {
  const dt = new Date(d)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseOrder(row) {
  if (!row) return null
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    customerName: row.customerName,
    items: JSON.parse(row.itemsJson || '[]'),
    status: row.status,
    placedAt: row.placedAt,
    readyAt: row.readyAt,
    fulfilledAt: row.fulfilledAt,
    announced: !!row.announced,
  }
}

function nextOrderNumber(orderDate) {
  const row = db
    .prepare('SELECT MAX(orderNumber) as maxNum FROM orders WHERE orderDate = ?')
    .get(orderDate)
  const maxNum = Number(row?.maxNum || 0)
  return maxNum + 1
}

export function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((r) => r.name)
    res.json({ ok: true, dbPath, tables })
  })

  // Items
  app.get('/api/items', (_req, res) => {
    const items = db
      .prepare('SELECT id, name, cuisine, createdAt FROM items ORDER BY id ASC')
      .all()
    res.json(items)
  })

  app.post('/api/items', (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    const cuisine = typeof req.body?.cuisine === 'string' ? req.body.cuisine.trim() : ''
    if (!name || !cuisine) {
      return res.status(400).json({ error: 'Item name and cuisine/category are required' })
    }
    const createdAt = new Date().toISOString()
    const info = db
      .prepare('INSERT INTO items (name, cuisine, createdAt) VALUES (?, ?, ?)')
      .run(name, cuisine, createdAt)
    const item = db
      .prepare('SELECT id, name, cuisine, createdAt FROM items WHERE id = ?')
      .get(Number(info.lastInsertRowid))
    res.status(201).json(item)
  })

  // Orders
  app.get('/api/orders', (req, res) => {
    const { status } = req.query
    let rows
    if (status === 'in-transit') {
      rows = db
        .prepare("SELECT * FROM orders WHERE status IN ('PLACED','READY') ORDER BY id ASC")
        .all()
    } else if (typeof status === 'string' && status) {
      rows = db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY id ASC').all(status)
    } else {
      rows = db.prepare('SELECT * FROM orders ORDER BY id ASC').all()
    }
    res.json(rows.map(parseOrder))
  })

  app.post('/api/orders', (req, res) => {
    const customerName = typeof req.body?.customerName === 'string' ? req.body.customerName.trim() : ''
    const items = Array.isArray(req.body?.items) ? req.body.items : []
    if (!customerName) {
      return res.status(400).json({ error: 'Customer name is required' })
    }
    if (items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' })
    }

    const now = new Date()
    const orderDate = localDateKey(now)
    const orderNumber = nextOrderNumber(orderDate)
    const placedAt = now.toISOString()
    const itemsJson = JSON.stringify(items.map((it) => ({ ...it })))

    const info = db
      .prepare(
        `INSERT INTO orders (orderNumber, orderDate, customerName, itemsJson, status, placedAt, readyAt, fulfilledAt, announced)
         VALUES (?, ?, ?, ?, 'PLACED', ?, NULL, NULL, 0)`
      )
      .run(orderNumber, orderDate, customerName, itemsJson, placedAt)

    const order = parseOrder(
      db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(info.lastInsertRowid))
    )
    res.status(201).json(order)
  })

  app.patch('/api/orders/:id/status', (req, res) => {
    const id = Number(req.params.id)
    const nextStatus = req.body?.status
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
    if (!order) return res.status(404).json({ error: 'Order not found' })

    const now = new Date().toISOString()
    if (nextStatus === 'READY') {
      if (order.status !== 'PLACED') {
        return res.status(400).json({ error: 'Only PLACED orders can be marked READY' })
      }
      db.prepare('UPDATE orders SET status = ?, readyAt = ? WHERE id = ?').run('READY', now, id)
    } else if (nextStatus === 'FULFILLED') {
      if (order.status !== 'READY') {
        return res.status(400).json({ error: 'Only READY orders can be marked picked up' })
      }
      db.prepare('UPDATE orders SET status = ?, fulfilledAt = ? WHERE id = ?').run('FULFILLED', now, id)
    } else {
      return res.status(400).json({ error: 'Invalid status transition' })
    }

    const updated = parseOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(id))
    res.json(updated)
  })

  app.patch('/api/orders/:id/announced', (req, res) => {
    const id = Number(req.params.id)
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    db.prepare('UPDATE orders SET announced = 1 WHERE id = ?').run(id)
    const updated = parseOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(id))
    res.json(updated)
  })

  return app
}

export default createApp()
