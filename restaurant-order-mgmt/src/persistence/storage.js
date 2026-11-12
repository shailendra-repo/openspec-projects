const STORAGE_KEY = 'restaurant-order-dashboard-v1'

export function getDefaultState() {
  return {
    orders: [],
    voiceEnabled: false,
  }
}

export function loadState(storage = globalThis.localStorage) {
  try {
    if (!storage) return getDefaultState()
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultState()
    const parsed = JSON.parse(raw)
    return {
      orders: Array.isArray(parsed?.orders) ? parsed.orders : [],
      voiceEnabled: !!parsed?.voiceEnabled,
    }
  } catch {
    return getDefaultState()
  }
}

export function saveState(state, storage = globalThis.localStorage) {
  try {
    if (!storage) return
    storage.setItem(STORAGE_KEY, JSON.stringify({
      orders: Array.isArray(state?.orders) ? state.orders : [],
      voiceEnabled: !!state?.voiceEnabled,
    }))
  } catch {
    // ignore persistence errors; visual state remains authoritative
  }
}
