import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getSession, register, login, logout,
  loadPlannerState, persistThemePreference,
  saveTask, deleteTask as apiDeleteTask, saveList, deleteList as apiDeleteList, saveTag, deleteTag as apiDeleteTag,
  createTask, createList, createTag, createSubtask, getDefaultList
} from './store/planner.js'
import { isToday, isUpcoming, formatDate, todayISO } from './utils/date.js'

const VIEWS = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'all', label: 'All tasks' },
]

function getInitialTheme(saved) {
  if (saved === 'light' || saved === 'dark') return saved
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
}

export default function App() {
  const [sessionUser, setSessionUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [lists, setLists] = useState([])
  const [tasks, setTasks] = useState([])
  const [tags, setTags] = useState([])
  const [theme, setTheme] = useState('light')
  const [view, setView] = useState('inbox')
  const [selectedListId, setSelectedListId] = useState(null)
  const [quickTitle, setQuickTitle] = useState('')
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [undo, setUndo] = useState(null)
  const [notice, setNotice] = useState('')
  const [dragId, setDragId] = useState(null)
  const [editingIds, setEditingIds] = useState(new Set())
  const reminderTimers = useRef(new Map())

  useEffect(() => {
    (async () => {
      try {
        if (!window.plannerAPI) {
          setAuthLoading(false)
          return
        }
        const res = await getSession()
        if (res?.user) {
          setSessionUser(res.user)
          await loadForUser(res.user)
        } else {
          applyTheme(getInitialTheme(null))
        }
      } catch (e) {
        showNotice(e.message || 'Failed to initialize session')
      } finally {
        setAuthLoading(false)
      }
    })()
  }, [])

  useEffect(() => { applyTheme(theme) }, [theme])

  useEffect(() => {
    reminderTimers.current.forEach(clearTimeout)
    reminderTimers.current.clear()
    tasks.forEach(task => {
      if (!task.reminderAt || task.completed) return
      const ms = new Date(task.reminderAt).getTime() - Date.now()
      if (ms > 0 && ms < 2147483647) {
        const id = setTimeout(() => {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Task reminder', { body: task.title })
          } else {
            setNotice(`Reminder: ${task.title}`)
          }
        }, ms)
        reminderTimers.current.set(task.id, id)
      }
    })
    return () => reminderTimers.current.forEach(clearTimeout)
  }, [tasks])

  const defaultList = useMemo(() => getDefaultList(lists), [lists])

  async function loadForUser(user) {
    setLoading(true)
    try {
      const state = await loadPlannerState()
      setLists(state.lists)
      setTasks(state.tasks)
      setTags(state.tags)
      const t = getInitialTheme(state.themePreference)
      setTheme(t)
      applyTheme(t)
      setSelectedListId(getDefaultList(state.lists)?.id || state.lists[0]?.id || null)
      setView('inbox')
      setSearch(''); setFilterTag(''); setFilterStatus('all'); setQuickTitle('')
    } finally {
      setLoading(false)
    }
  }

  function showNotice(msg) {
    setNotice(msg)
    setTimeout(() => setNotice(n => (n === msg ? '' : n)), 4000)
  }

  async function handleAuthSuccess(user) {
    setSessionUser(user)
    await loadForUser(user)
  }

  async function handleLogout() {
    try {
      await logout()
    } finally {
      setSessionUser(null)
      setLists([]); setTasks([]); setTags([])
      setUndo(null)
      const t = getInitialTheme(null)
      setTheme(t); applyTheme(t)
      showNotice('You have been logged out.')
    }
  }

  async function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyTheme(next)
    try {
      if (sessionUser) await persistThemePreference(next)
    } catch (e) { showNotice(e.message || 'Failed to save theme preference') }
  }

  async function addTask(e) {
    e.preventDefault()
    const title = quickTitle.trim()
    if (!title) return
    let targetListId = selectedListId || defaultList?.id || lists[0]?.id
    if (view === 'inbox') targetListId = defaultList?.id || targetListId
    const task = createTask({ title, listId: targetListId })
    if (view === 'today') task.dueDate = todayISO()
    const maxOrder = Math.max(0, ...tasks.filter(t => t.listId === task.listId).map(t => t.order || 0))
    task.order = maxOrder + 1
    const saved = await saveTask(task)
    setTasks(prev => [...prev, saved])
    setQuickTitle('')
  }

  async function replaceTask(task) {
    const saved = await saveTask({ ...task })
    setTasks(prev => prev.map(t => t.id === saved.id ? saved : t))
    return saved
  }

  async function toggleComplete(task) {
    if (!task.completed) {
      const prevTask = { ...task }
      const completedTask = { ...task, completed: true, completedAt: new Date().toISOString() }
      const saved = await saveTask(completedTask)
      setTasks(prev => prev.map(t => t.id === saved.id ? saved : t))
      if (undo?.timer) clearTimeout(undo.timer)
      const timer = setTimeout(() => setUndo(null), 6000)
      setUndo({ task: prevTask, timer })
    } else {
      const updated = { ...task, completed: false, completedAt: null }
      const saved = await saveTask(updated)
      setTasks(prev => prev.map(t => t.id === saved.id ? saved : t))
    }
  }

  async function undoComplete() {
    if (!undo) return
    clearTimeout(undo.timer)
    const saved = await saveTask(undo.task)
    setTasks(prev => prev.map(t => t.id === saved.id ? saved : t))
    setUndo(null)
  }

  async function removeTask(task) {
    if (!window.confirm(`Delete task "${task.title}"?`)) return
    await apiDeleteTask(task.id)
    setTasks(prev => prev.filter(t => t.id !== task.id))
  }

  async function addSubtask(task, title) {
    const st = createSubtask({ title })
    await replaceTask({ ...task, subtasks: [...(task.subtasks || []), st] })
  }
  async function toggleSubtask(task, subId) {
    await replaceTask({ ...task, subtasks: (task.subtasks || []).map(s => s.id === subId ? { ...s, completed: !s.completed } : s) })
  }
  async function removeSubtask(task, subId) {
    await replaceTask({ ...task, subtasks: (task.subtasks || []).filter(s => s.id !== subId) })
  }

  async function addList(name) {
    const trimmed = name.trim()
    if (!trimmed) return
    const list = createList({ name: trimmed })
    list.order = Math.max(0, ...lists.map(l => l.order || 0)) + 1
    const saved = await saveList(list)
    setLists(prev => [...prev, saved].sort((a,b)=>(a.order??0)-(b.order??0)))
    setSelectedListId(saved.id)
    setView('list')
  }
  async function renameList(list, name) {
    const saved = await saveList({ ...list, name: name.trim() || list.name })
    setLists(prev => prev.map(l => l.id === saved.id ? { ...l, ...saved } : l))
  }
  async function removeList(list) {
    if (list.isDefault) { showNotice('Default Inbox cannot be deleted.'); return }
    if (!window.confirm(`Delete list "${list.name}"? Tasks will be moved to Inbox.`)) return
    const inbox = defaultList
    await apiDeleteList(list.id)
    // reload to reflect moved tasks accurately
    const state = await loadPlannerState()
    setLists(state.lists); setTasks(state.tasks); setTags(state.tags)
    if (selectedListId === list.id) setSelectedListId(inbox?.id || state.lists[0]?.id)
  }

  async function addTag(name) {
    const trimmed = name.trim()
    if (!trimmed) return
    if (tags.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) return
    const saved = await saveTag(createTag({ name: trimmed }))
    setTags(prev => [...prev, saved].sort((a,b)=>a.name.localeCompare(b.name)))
  }
  async function toggleTaskTag(task, tagId) {
    const has = (task.tagIds || []).includes(tagId)
    const tagIds = has ? task.tagIds.filter(id => id !== tagId) : [...(task.tagIds || []), tagId]
    await replaceTask({ ...task, tagIds })
  }

  async function requestReminderPermission() {
    if (!('Notification' in window)) { showNotice('Notifications are not supported in this runtime.'); return false }
    const res = await Notification.requestPermission()
    if (res !== 'granted') showNotice('Notification permission denied or unavailable; reminders are best-effort only.')
    return res === 'granted'
  }

  function setTaskEditing(taskId, isEditing) {
    setEditingIds(prev => {
      const next = new Set(prev)
      if (isEditing) next.add(taskId)
      else next.delete(taskId)
      return next
    })
  }

  function visibleTasks() {
    let list = [...tasks]
    if (view === 'today') list = list.filter(t => isToday(t.dueDate))
    else if (view === 'upcoming') list = list.filter(t => isUpcoming(t.dueDate))
    else if (view === 'all') { /* all */ }
    else {
      const lid = view === 'inbox' ? defaultList?.id : selectedListId
      if (lid) list = list.filter(t => t.listId === lid || editingIds.has(t.id))
    }
    if (filterStatus === 'active') list = list.filter(t => !t.completed)
    if (filterStatus === 'completed') list = list.filter(t => t.completed)
    if (filterTag) list = list.filter(t => (t.tagIds || []).includes(filterTag))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t => t.title.toLowerCase().includes(q) || (t.notes||'').toLowerCase().includes(q))
    }
    if (view === 'upcoming') {
      list.sort((a,b)=>(a.dueDate||'').localeCompare(b.dueDate||'') || (a.order||0)-(b.order||0))
    } else {
      list.sort((a,b)=>(a.order??0)-(b.order??0))
    }
    return list
  }

  async function reorderTasks(draggedId, targetId, contextTasks) {
    if (!draggedId || !targetId || draggedId === targetId) return
    const ids = contextTasks.map(t => t.id)
    const from = ids.indexOf(draggedId)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    ids.splice(from, 1)
    ids.splice(to, 0, draggedId)
    const updates = []
    const next = tasks.map(t => {
      const idx = ids.indexOf(t.id)
      if (idx === -1) return t
      const updated = { ...t, order: idx + 1 }
      updates.push(updated)
      return updated
    })
    setTasks(next)
    for (const u of updates) await saveTask(u)
  }

  if (authLoading) return <div className="app-shell"><main className="main"><p>Loading…</p></main></div>
  if (!sessionUser) return <AuthScreen onAuth={handleAuthSuccess} notice={notice} showNotice={showNotice} theme={theme} onToggleTheme={toggleTheme} />

  if (loading) return <div className="app-shell"><main className="main"><p>Loading your planner…</p></main></div>

  const shown = visibleTasks()

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Focused Work Planner</h1>
        <div className="header-actions">
          <span className="meta">Signed in as <strong>{sessionUser.username}</strong></span>
          <button className="btn" onClick={toggleTheme} aria-label="Toggle theme">Theme: {theme === 'dark' ? 'Dark' : 'Light'}</button>
          <button className="btn" onClick={handleLogout}>Log out</button>
        </div>
      </header>
      {notice && <div className="notice" role="status">{notice}</div>}
      <div className="layout">
        <aside className="sidebar">
          <div className="section">
            <h2>Views</h2>
            <ul className="nav-list">
              {VIEWS.map(v => (
                <li key={v.id}><button className={`nav-btn ${view===v.id?'active':''}`} onClick={() => { setView(v.id); if(v.id==='inbox') setSelectedListId(defaultList?.id); }}>{v.label}</button></li>
              ))}
            </ul>
          </div>
          <div className="section">
            <h2>Lists / Projects</h2>
            <ul className="nav-list">
              {lists.map(l => (
                <li key={l.id}>
                  <button className={`nav-btn ${((view==='list'||view==='inbox') && selectedListId===l.id)?'active':''}`} onClick={() => { setView(l.isDefault ? 'inbox' : 'list'); setSelectedListId(l.id); }}>
                    {l.name}{l.isDefault ? ' (default)' : ''}
                  </button>
                </li>
              ))}
            </ul>
            <ListManager lists={lists} onAdd={addList} onRename={renameList} onDelete={removeList} />
          </div>
          <div className="section">
            <h2>Tags</h2>
            <TagManager tags={tags} onAdd={addTag} />
          </div>
          <div className="section">
            <p className="meta">Local-only: data is stored in a SQLite database in the app <code>DB/</code> folder via the local server. Reminders are best-effort and depend on browser notification permissions/behavior.</p>
          </div>
        </aside>
        <main className="main">
          <div className="card section">
            <form onSubmit={addTask} className="row" aria-label="Quick add task">
              <input className="grow" type="text" placeholder="Quick add a task…" value={quickTitle} onChange={e=>setQuickTitle(e.target.value)} />
              <button className="btn primary" type="submit">Add</button>
            </form>
            <div className="meta">Adding to: {lists.find(l=>l.id===selectedListId)?.name || defaultList?.name || 'Inbox'}{view==='today' ? ' (due today)' : ''}</div>
          </div>

          <div className="toolbar card">
            <div className="field"><label>Search<input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks" /></label></div>
            <div className="field"><label>Status
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                <option value="all">All</option><option value="active">Active</option><option value="completed">Completed</option>
              </select></label></div>
            <div className="field"><label>Tag
              <select value={filterTag} onChange={e=>setFilterTag(e.target.value)}>
                <option value="">All tags</option>
                {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select></label></div>
            <div className="field"><label>List context
              <select value={selectedListId || ''} onChange={e=>setSelectedListId(e.target.value)}>
                {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select></label></div>
          </div>

          <section className="section">
            <h2>
              {view === 'today' ? 'Today' : view === 'upcoming' ? 'Upcoming' : view === 'all' ? 'All tasks' : (lists.find(l=>l.id===selectedListId)?.name || 'Tasks')}
              <span className="meta"> ({shown.length})</span>
            </h2>
            {shown.length === 0 ? <p className="muted">No tasks to show.</p> : (
              <ul className="task-list">
                {shown.map(task => (
                  <TaskItem key={task.id}
                    task={task} lists={lists} tags={tags}
                    isDragTarget={dragId && dragId !== task.id}
                    onToggleComplete={() => toggleComplete(task)}
                    onDelete={() => removeTask(task)}
                    onSave={replaceTask}
                    onAddSubtask={(title)=>addSubtask(task,title)}
                    onToggleSubtask={(sid)=>toggleSubtask(task,sid)}
                    onRemoveSubtask={(sid)=>removeSubtask(task,sid)}
                    onToggleTag={(tagId)=>toggleTaskTag(task, tagId)}
                    onRequestReminder={requestReminderPermission}
                    onEditingChange={(isEditing)=>setTaskEditing(task.id, isEditing)}
                    draggableProps={{
                      draggable: true,
                      onDragStart: () => setDragId(task.id),
                      onDragEnd: () => setDragId(null),
                      onDragOver: (e) => e.preventDefault(),
                      onDrop: async (e) => { e.preventDefault(); await reorderTasks(dragId, task.id, shown); setDragId(null) },
                    }}
                  />
                ))}
              </ul>
            )}
            <p className="meta">Tip: drag tasks to reorder within this view/context. Reordering is saved.</p>
          </section>
        </main>
      </div>
      {undo && (
        <div className="undo-bar" role="status">
          <span>Task completed.</span>
          <button className="btn small" onClick={undoComplete}>Undo</button>
        </div>
      )}
    </div>
  )
}

function AuthScreen({ onAuth, notice, showNotice, theme, onToggleTheme }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = mode === 'login'
        ? await login(username, password)
        : await register(username, password)
      onAuth(res.user)
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Focused Work Planner</h1>
        <div className="header-actions">
          <button className="btn" onClick={onToggleTheme} aria-label="Toggle theme">Theme: {theme === 'dark' ? 'Dark' : 'Light'}</button>
        </div>
      </header>
      <main className="main" style={{maxWidth: 480, margin: '2rem auto'}}>
        <div className="card">
          <h2>{mode === 'login' ? 'Log in' : 'Create local account'}</h2>
          <p className="meta">Local-only web app. Accounts and planner data are stored in the app <code>DB/</code> folder on this device via the local server.</p>
          {notice && <div className="notice" role="status">{notice}</div>}
          {error && <div className="notice" role="alert">{error}</div>}
          <form onSubmit={submit} style={{display:'grid', gap:'.6rem'}}>
            <label>Username<input type="text" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" required /></label>
            <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==='login'?'current-password':'new-password'} required /></label>
            <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : (mode === 'login' ? 'Log in' : 'Create account')}</button>
          </form>
          <p style={{marginTop:'.75rem'}}>
            {mode === 'login' ? (
              <>Need an account? <button className="btn small" onClick={()=>{setMode('register'); setError('')}}>Create one</button></>
            ) : (
              <>Already have an account? <button className="btn small" onClick={()=>{setMode('login'); setError('')}}>Log in</button></>
            )}
          </p>
        </div>
      </main>
    </div>
  )
}

function ListManager({ lists, onAdd, onRename, onDelete }) {
  const [name, setName] = useState('')
  return (
    <div style={{marginTop:'.5rem'}}>
      <form className="row" onSubmit={e=>{e.preventDefault(); onAdd(name); setName('')}}>
        <input className="grow" type="text" placeholder="New list" value={name} onChange={e=>setName(e.target.value)} />
        <button className="btn small" type="submit">Add</button>
      </form>
      <ul className="nav-list" style={{marginTop:'.4rem'}}>
        {lists.filter(l=>!l.isDefault).map(l => (
          <li key={l.id} className="row">
            <input className="grow" value={l.name} onChange={e=>onRename(l, e.target.value)} />
            <button className="btn small danger" onClick={()=>onDelete(l)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TagManager({ tags, onAdd }) {
  const [name, setName] = useState('')
  return (
    <div>
      <form className="row" onSubmit={e=>{e.preventDefault(); onAdd(name); setName('')}}>
        <input className="grow" type="text" placeholder="New tag" value={name} onChange={e=>setName(e.target.value)} />
        <button className="btn small" type="submit">Add</button>
      </form>
      <div className="row" style={{marginTop:'.4rem', flexWrap:'wrap'}}>
        {tags.map(t => <span key={t.id} className="badge">{t.name}</span>)}
      </div>
    </div>
  )
}

function TaskItem({ task, lists, tags, onToggleComplete, onDelete, onSave, onAddSubtask, onToggleSubtask, onRemoveSubtask, onToggleTag, onRequestReminder, onEditingChange, draggableProps, isDragTarget }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes || '')
  const [subtaskTitle, setSubtaskTitle] = useState('')
  useEffect(()=>{ setTitle(task.title); setNotes(task.notes||'') }, [task.title, task.notes])
  useEffect(() => { onEditingChange?.(editing); return () => onEditingChange?.(false) }, [editing])
  const total = (task.subtasks||[]).length
  const done = (task.subtasks||[]).filter(s=>s.completed).length

  async function saveEdit() {
    await onSave({ ...task, title: title.trim() || task.title, notes })
    setEditing(false)
  }
  async function setDueDate(val) { await onSave({ ...task, dueDate: val || null }) }
  async function setReminder(val) {
    if (val) await onRequestReminder()
    await onSave({ ...task, reminderAt: val || null })
  }
  async function setList(listId) { await onSave({ ...task, listId }) }

  return (
    <li className={`task-item ${task.completed ? 'completed' : ''} ${isDragTarget ? 'drop-target' : ''}`} {...draggableProps}>
      <div className="row" style={{alignItems:'flex-start'}}>
        <input type="checkbox" checked={!!task.completed} onChange={onToggleComplete} aria-label={`Complete ${task.title}`} />
        <div className="grow">
          <div className="task-title">{task.title}</div>
          <div className="meta">
            {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
            {task.reminderAt ? ` · Reminder ${new Date(task.reminderAt).toLocaleString()}` : ''}
          </div>
          <div style={{marginTop:'.25rem'}}>
            {(task.tagIds||[]).map(id => { const t = tags.find(x=>x.id===id); return t ? <span key={id} className="badge">{t.name}</span> : null })}
          </div>
          {total > 0 && <div className="progress">Checklist: {done}/{total} complete</div>}
        </div>
        <div className="row">
          <button className="btn small" onClick={()=>setEditing(e=>!e)}>{editing?'Close':'Edit'}</button>
          <button className="btn small danger" onClick={onDelete}>Delete</button>
        </div>
      </div>

      {editing && (
        <div className="inline-edit">
          <label>Title<input type="text" value={title} onChange={e=>setTitle(e.target.value)} /></label>
          <label>Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)} /></label>
          <div className="row">
            <label className="grow">List
              <select value={task.listId} onChange={e=>setList(e.target.value)}>
                {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </label>
            <label className="grow">Due date<input type="date" value={task.dueDate || ''} onChange={e=>setDueDate(e.target.value)} /></label>
            <label className="grow">Reminder<input type="datetime-local" value={task.reminderAt ? task.reminderAt.slice(0,16) : ''} onChange={e=>setReminder(e.target.value ? new Date(e.target.value).toISOString() : '')} /></label>
          </div>
          <div>
            <div className="meta">Tags</div>
            <div className="row" style={{flexWrap:'wrap'}}>
              {tags.map(t => (
                <label key={t.id} className="badge" style={{cursor:'pointer'}}>
                  <input type="checkbox" checked={(task.tagIds||[]).includes(t.id)} onChange={()=>onToggleTag(t.id)} /> {t.name}
                </label>
              ))}
              {tags.length===0 && <span className="meta">No tags yet. Add tags from the sidebar.</span>}
            </div>
          </div>
          <div className="row"><button className="btn primary small" onClick={saveEdit}>Save changes</button></div>
        </div>
      )}

      <div className="subtasks">
        {(task.subtasks||[]).map(s => (
          <div key={s.id} className="subtask">
            <input type="checkbox" checked={!!s.completed} onChange={()=>onToggleSubtask(s.id)} />
            <span style={{textDecoration: s.completed?'line-through':'none', color: s.completed?'var(--muted)':'inherit', flex:1}}>{s.title}</span>
            <button className="btn small" onClick={()=>onRemoveSubtask(s.id)}>Remove</button>
          </div>
        ))}
        <form className="row" onSubmit={e=>{e.preventDefault(); if(subtaskTitle.trim()){ onAddSubtask(subtaskTitle.trim()); setSubtaskTitle(''); }}}>
          <input className="grow" type="text" placeholder="Add subtask" value={subtaskTitle} onChange={e=>setSubtaskTitle(e.target.value)} />
          <button className="btn small" type="submit">Add subtask</button>
        </form>
      </div>
    </li>
  )
}
