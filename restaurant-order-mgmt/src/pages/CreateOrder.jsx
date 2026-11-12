import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

export default function CreateOrder() {
  const [items, setItems] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadItems() {
    try {
      const data = await api.getItems()
      setItems(data)
    } catch (e) {
      setError(e.message || 'Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  function toggleItem(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (items.length === 0) {
      setError('Items must be created before an order can be placed.')
      return
    }
    if (!customerName.trim() || selectedIds.length === 0) {
      setError('Customer name and at least one saved item are required.')
      return
    }
    const selectedItems = items.filter((i) => selectedIds.includes(i.id))
    try {
      const order = await api.createOrder({ customerName, items: selectedItems })
      setCustomerName('')
      setSelectedIds([])
      setSuccess(`Order #${order.orderNumber} placed for ${order.customerName}.`)
    } catch (e) {
      setError(e.message || 'Failed to create order')
    }
  }

  return (
    <section>
      <h2>Create Order</h2>
      <p className="hint">Order creation only. View and manage in-transit orders on the Dashboard.</p>
      <form onSubmit={onSubmit} className="panel">
        <label className="field">
          <span>Customer name</span>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter customer name"
          />
        </label>
        <div className="field">
          <span>Saved items</span>
          {loading ? <p>Loading items...</p> : null}
          {!loading && items.length === 0 ? (
            <p className="empty">No saved items available. Create items first before placing an order.</p>
          ) : null}
          {!loading && items.length > 0 ? (
            <ul className="menu-list">
              {items.map((item) => (
                <li key={item.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                    />
                    {item.name} <em>({item.cuisine})</em>
                  </label>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {error ? <p className="error" role="alert">{error}</p> : null}
        {success ? <p className="success">{success}</p> : null}
        <button type="submit">Place Order</button>
      </form>
    </section>
  )
}
