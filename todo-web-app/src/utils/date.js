export function todayISO() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return toLocalDateISO(d)
}

export function toLocalDateISO(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isToday(dateStr) {
  if (!dateStr) return false
  return dateStr === todayISO()
}

export function isUpcoming(dateStr) {
  if (!dateStr) return false
  return dateStr > todayISO()
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
