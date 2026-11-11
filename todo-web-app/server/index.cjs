const path = require('path')
const express = require('express')
const cookieSession = require('cookie-session')
const { createStore } = require('./db.cjs')
const { createService } = require('./service.cjs')

const appRoot = path.join(__dirname, '..')
const { db } = createStore(appRoot)
const service = createService(db)

const app = express()
app.use(express.json({ limit: '1mb' }))
app.use(cookieSession({
  name: 'fwp_session',
  keys: [process.env.FWP_SESSION_SECRET || 'local-dev-session-secret-change-me'],
  httpOnly: true,
  sameSite: 'lax',
  secure: false, // localhost
  maxAge: 7 * 24 * 60 * 60 * 1000,
}))

function requireAuth(req, res, next) {
  const user = req.session && req.session.user
  if (!user || !user.id) return res.status(401).json({ error: 'Not authenticated' })
  req.user = user
  next()
}

// Auth
app.post('/api/auth/register', (req, res) => {
  try {
    const user = service.register(req.body || {})
    req.session.user = { id: user.id, username: user.username }
    res.json({ user: req.session.user })
  } catch (e) {
    const msg = e.message || 'Registration failed'
    const code = msg.includes('unavailable') || msg.includes('required') ? 400 : 500
    res.status(code).json({ error: msg })
  }
})
app.post('/api/auth/login', (req, res) => {
  try {
    const user = service.login(req.body || {})
    req.session.user = { id: user.id, username: user.username }
    res.json({ user: req.session.user })
  } catch (e) {
    res.status(401).json({ error: e.message || 'Invalid username or password' })
  }
})
app.post('/api/auth/logout', (req, res) => {
  req.session = null
  res.json({ ok: true })
})
app.get('/api/auth/session', (req, res) => {
  res.json({ user: (req.session && req.session.user) || null })
})

// Data (protected)
app.get('/api/data/state', requireAuth, (req, res) => {
  try { res.json(service.loadState(req.user.id)) } catch (e) { res.status(500).json({ error: e.message || 'Failed to load state' }) }
})
app.post('/api/data/tasks', requireAuth, (req, res) => {
  try { res.json(service.saveTask(req.user.id, req.body || {})) } catch (e) { res.status(500).json({ error: e.message || 'Failed to save task' }) }
})
app.delete('/api/data/tasks/:id', requireAuth, (req, res) => {
  try { service.deleteTask(req.user.id, req.params.id); res.json({ ok: true }) } catch (e) { res.status(500).json({ error: e.message || 'Failed to delete task' }) }
})
app.post('/api/data/lists', requireAuth, (req, res) => {
  try { res.json(service.saveList(req.user.id, req.body || {})) } catch (e) { res.status(500).json({ error: e.message || 'Failed to save list' }) }
})
app.delete('/api/data/lists/:id', requireAuth, (req, res) => {
  try { service.deleteList(req.user.id, req.params.id); res.json({ ok: true }) } catch (e) { const code = e.message?.includes('cannot be deleted') ? 400 : 500; res.status(code).json({ error: e.message || 'Failed to delete list' }) }
})
app.post('/api/data/tags', requireAuth, (req, res) => {
  try { res.json(service.saveTag(req.user.id, req.body || {})) } catch (e) { res.status(500).json({ error: e.message || 'Failed to save tag' }) }
})
app.delete('/api/data/tags/:id', requireAuth, (req, res) => {
  try { service.deleteTag(req.user.id, req.params.id); res.json({ ok: true }) } catch (e) { res.status(500).json({ error: e.message || 'Failed to delete tag' }) }
})
app.post('/api/data/theme', requireAuth, (req, res) => {
  try { service.saveThemePreference(req.user.id, (req.body || {}).value ?? null); res.json({ ok: true }) } catch (e) { res.status(500).json({ error: e.message || 'Failed to save theme' }) }
})

// Static client
const distPath = path.join(appRoot, 'dist')
app.use(express.static(distPath))
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const port = Number(process.env.PORT) || 3000
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Focused Work Planner server running at http://localhost:${port}`)
  })
}

module.exports = { app, service, db }
