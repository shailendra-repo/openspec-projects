import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'

const VOICE_KEY = 'dashboard-voice-enabled'

function loadVoicePref() {
  try { return localStorage.getItem(VOICE_KEY) === 'true' } catch { return false }
}
function saveVoicePref(v) {
  try { localStorage.setItem(VOICE_KEY, v ? 'true' : 'false') } catch {}
}

export default function Dashboard() {
  const [orders, setOrders] = useState([])
  const [voiceEnabled, setVoiceEnabled] = useState(loadVoicePref)
  const [error, setError] = useState('')

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.getOrders({ status: 'in-transit' })
      setOrders(data)
      setError('')
    } catch (e) {
      setError(e.message || 'Failed to load orders')
    }
  }, [])

  useEffect(() => {
    loadOrders()
    const id = setInterval(loadOrders, 3000)
    return () => clearInterval(id)
  }, [loadOrders])

  useEffect(() => {
    saveVoicePref(voiceEnabled)
  }, [voiceEnabled])

  const placed = useMemo(() => orders.filter((o) => o.status === 'PLACED'), [orders])
  const ready = useMemo(() => orders.filter((o) => o.status === 'READY'), [orders])

  function speakReady(order) {
    const text = `Order ${order.orderNumber}, ${order.customerName}, is ready for pickup`
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
      }
    } catch {
      // best-effort; visual state remains authoritative
    }
  }

  async function markReady(id) {
    try {
      const updated = await api.updateOrderStatus(id, 'READY')
      if (voiceEnabled && !updated.announced) {
        speakReady(updated)
      }
      if (!updated.announced) {
        await api.markOrderAnnounced(id)
      }
      await loadOrders()
    } catch (e) {
      setError(e.message || 'Failed to mark ready')
    }
  }

  async function markPickedUp(id) {
    try {
      await api.updateOrderStatus(id, 'FULFILLED')
      await loadOrders()
    } catch (e) {
      setError(e.message || 'Failed to mark picked up')
    }
  }

  return (
    <section>
      <header className="header">
        <h2>Dashboard (In-Transit)</h2>
        <label className="voice-toggle">
          <input
            type="checkbox"
            checked={voiceEnabled}
            onChange={(e) => setVoiceEnabled(e.target.checked)}
          />
          Enable Voice
        </label>
      </header>
      <p className="hint">Shows only orders in transit (PLACED and READY). Suitable for another screen.</p>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <section className="board" aria-label="In-transit order board">
        <div className="column placed">
          <h3>PLACED <small>(yellow, in progress)</small></h3>
          {placed.length === 0 ? <p className="empty">No placed orders</p> : null}
          {placed.map((o) => (
            <article key={o.id} className="card">
              <div className="title">#{o.orderNumber} {o.customerName}</div>
              <div className="items">{(o.items || []).map((i) => i.name).join(', ')}</div>
              <button onClick={() => markReady(o.id)}>Mark Ready</button>
            </article>
          ))}
        </div>
        <div className="column ready">
          <h3>READY <small>(green, ready for pickup)</small></h3>
          {ready.length === 0 ? <p className="empty">No ready orders</p> : null}
          {ready.map((o) => (
            <article key={o.id} className="card">
              <div className="title">#{o.orderNumber} {o.customerName}</div>
              <div className="items">{(o.items || []).map((i) => i.name).join(', ')}</div>
              <button onClick={() => markPickedUp(o.id)}>Mark Picked Up</button>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}
