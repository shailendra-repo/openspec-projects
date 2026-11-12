export const STATUSES = {
  PLACED: 'PLACED',
  READY: 'READY',
  FULFILLED: 'FULFILLED',
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

export function isSameLocalDay(a, b) {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

export function nextOrderNumber(orders = [], now = new Date()) {
  const day = new Date(now)
  const todays = orders.filter((o) => o.placedAt && isSameLocalDay(o.placedAt, day))
  const max = todays.reduce((m, o) => {
    const n = Number(o.orderNumber)
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return max + 1
}

export function createOrder({ customerName, items, orders = [], now = new Date() }) {
  const name = typeof customerName === 'string' ? customerName.trim() : ''
  assert(name.length > 0, 'Customer name is required')
  assert(Array.isArray(items) && items.length > 0, 'At least one item is required')

  const order = {
    orderNumber: nextOrderNumber(orders, now),
    customerName: name,
    items: items.map((it) => ({ ...it })),
    status: STATUSES.PLACED,
    placedAt: new Date(now).toISOString(),
    readyAt: null,
    fulfilledAt: null,
    announced: false,
  }
  return order
}

export function markReady(order, now = new Date()) {
  assert(order && order.status === STATUSES.PLACED, 'Only PLACED orders can be marked READY')
  return {
    ...order,
    status: STATUSES.READY,
    readyAt: new Date(now).toISOString(),
  }
}

export function markPickedUp(order, now = new Date()) {
  assert(order && order.status === STATUSES.READY, 'Only READY orders can be marked picked up')
  return {
    ...order,
    status: STATUSES.FULFILLED,
    fulfilledAt: new Date(now).toISOString(),
  }
}

export function isFulfilledToday(order, now = new Date()) {
  return (
    order &&
    order.status === STATUSES.FULFILLED &&
    !!order.fulfilledAt &&
    isSameLocalDay(order.fulfilledAt, now)
  )
}
