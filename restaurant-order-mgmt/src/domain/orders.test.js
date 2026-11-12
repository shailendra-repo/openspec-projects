import { describe, it, expect } from 'vitest'
import {
  STATUSES,
  createOrder,
  markReady,
  markPickedUp,
  nextOrderNumber,
  isFulfilledToday,
} from './orders.js'

const item = { id: 'm1', name: 'Pizza', cuisine: 'Italian' }

describe('order domain model', () => {
  it('creates a PLACED order with required fields and timestamps', () => {
    const now = new Date('2026-11-11T10:00:00')
    const order = createOrder({ customerName: 'Sam', items: [item], orders: [], now })
    expect(order.orderNumber).toBe(1)
    expect(order.customerName).toBe('Sam')
    expect(order.items).toEqual([item])
    expect(order.status).toBe(STATUSES.PLACED)
    expect(order.placedAt).toBe(now.toISOString())
    expect(order.readyAt).toBeNull()
    expect(order.fulfilledAt).toBeNull()
    expect(order.announced).toBe(false)
  })

  it('rejects missing customer name', () => {
    expect(() => createOrder({ customerName: '  ', items: [item] })).toThrow(/Customer name/i)
  })

  it('rejects missing items', () => {
    expect(() => createOrder({ customerName: 'Sam', items: [] })).toThrow(/item/i)
  })

  it('allows only PLACED -> READY transition', () => {
    const placed = createOrder({ customerName: 'Sam', items: [item], now: '2026-11-11T10:00:00' })
    const ready = markReady(placed, '2026-11-11T10:05:00')
    expect(ready.status).toBe(STATUSES.READY)
    expect(ready.readyAt).toBe(new Date('2026-11-11T10:05:00').toISOString())
    expect(() => markReady(ready)).toThrow(/PLACED/i)
    expect(() => markPickedUp(placed)).toThrow(/READY/i)
  })

  it('allows only READY -> FULFILLED transition', () => {
    const placed = createOrder({ customerName: 'Sam', items: [item], now: '2026-11-11T10:00:00' })
    const ready = markReady(placed, '2026-11-11T10:05:00')
    const fulfilled = markPickedUp(ready, '2026-11-11T10:10:00')
    expect(fulfilled.status).toBe(STATUSES.FULFILLED)
    expect(fulfilled.fulfilledAt).toBe(new Date('2026-11-11T10:10:00').toISOString())
    expect(() => markPickedUp(fulfilled)).toThrow(/READY/i)
  })
})

describe('order numbering and today filtering', () => {
  it('generates unique, increasing order numbers for the same day', () => {
    const now = new Date('2026-11-11T09:00:00')
    const o1 = createOrder({ customerName: 'A', items: [item], orders: [], now })
    const o2 = createOrder({ customerName: 'B', items: [item], orders: [o1], now })
    expect(o1.orderNumber).toBe(1)
    expect(o2.orderNumber).toBe(2)
    expect(nextOrderNumber([o1, o2], now)).toBe(3)
  })

  it('counts only today\'s orders for numbering scope', () => {
    const yesterday = { orderNumber: 5, placedAt: '2026-11-10T12:00:00.000Z' }
    const today = new Date('2026-11-11T09:00:00')
    expect(nextOrderNumber([yesterday], today)).toBe(1)
  })

  it('includes only orders fulfilled during the current local day', () => {
    const now = new Date('2026-11-11T15:00:00')
    const fulfilledToday = {
      status: STATUSES.FULFILLED,
      fulfilledAt: '2026-11-11T12:00:00.000Z',
    }
    const fulfilledYesterday = {
      status: STATUSES.FULFILLED,
      fulfilledAt: '2026-11-10T12:00:00.000Z',
    }
    const ready = { status: STATUSES.READY, fulfilledAt: null }
    expect(isFulfilledToday(fulfilledToday, now)).toBe(true)
    expect(isFulfilledToday(fulfilledYesterday, now)).toBe(false)
    expect(isFulfilledToday(ready, now)).toBe(false)
  })
})
