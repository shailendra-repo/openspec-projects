import { describe, it, expect } from 'vitest'
import { loadState, saveState, getDefaultState } from './storage.js'

function makeStorage() {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  }
}

describe('persistence', () => {
  it('saves and loads orders and voice preference', () => {
    const storage = makeStorage()
    const state = {
      orders: [
        { orderNumber: 1, customerName: 'Sam', status: 'FULFILLED', fulfilledAt: new Date().toISOString(), announced: true, items: [] },
      ],
      voiceEnabled: true,
    }
    saveState(state, storage)
    const loaded = loadState(storage)
    expect(loaded.orders).toHaveLength(1)
    expect(loaded.orders[0].customerName).toBe('Sam')
    expect(loaded.orders[0].announced).toBe(true)
    expect(loaded.voiceEnabled).toBe(true)
  })

  it('returns default state when nothing stored', () => {
    const storage = makeStorage()
    expect(loadState(storage)).toEqual(getDefaultState())
  })
})
