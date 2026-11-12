async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    const message = data && typeof data === 'object' && data.error ? data.error : `Request failed (${res.status})`
    throw new Error(message)
  }
  return data
}

export const api = {
  getItems: () => request('/api/items'),
  createItem: (payload) => request('/api/items', { method: 'POST', body: JSON.stringify(payload) }),
  getOrders: (params = {}) => {
    const qs = params.status ? `?status=${encodeURIComponent(params.status)}` : ''
    return request(`/api/orders${qs}`)
  },
  createOrder: (payload) => request('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
  updateOrderStatus: (id, status) => request(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  markOrderAnnounced: (id) => request(`/api/orders/${id}/announced`, { method: 'PATCH' }),
}
