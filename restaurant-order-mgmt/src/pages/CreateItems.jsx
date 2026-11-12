import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

export default function CreateItems() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [error, setError] = useState('')
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

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !cuisine.trim()) {
      setError('Item name and cuisine/category are required')
      return
    }
    try {
      await api.createItem({ name, cuisine })
      setName('')
      setCuisine('')
      await loadItems()
    } catch (e) {
      setError(e.message || 'Failed to create item')
    }
  }

  return (
    <section>
      <h2>Create Items</h2>
      <form onSubmit={onSubmit} className="panel">
        <label className="field">
          <span>Item name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Margherita Pizza" />
        </label>
        <label className="field">
          <span>Cuisine / category</span>
          <input value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="e.g. Italian" />
        </label>
        {error ? <p className="error" role="alert">{error}</p> : null}
        <button type="submit">Create Item</button>
      </form>

      <div className="panel">
        <h3>Saved Items</h3>
        {loading ? <p>Loading...</p> : null}
        {!loading && items.length === 0 ? <p className="empty">No items are saved yet.</p> : null}
        {!loading && items.length > 0 ? (
          <ul className="saved-items">
            {items.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong> <em>({item.cuisine})</em>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
