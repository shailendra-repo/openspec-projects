import { createList, createTask, createTag, createSubtask, createId } from '../domain/models.js'

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'same-origin',
    ...options,
  })
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    const msg = (data && data.error) || res.statusText || 'Request failed'
    throw new Error(msg)
  }
  return data
}

export async function getSession() {
  return request('/api/auth/session')
}

export async function register(username, password) {
  return request('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) })
}

export async function login(username, password) {
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
}

export async function logout() {
  return request('/api/auth/logout', { method: 'POST' })
}

export async function loadPlannerState() {
  const state = await request('/api/data/state')
  return {
    lists: (state.lists || []).sort((a,b)=>(a.order??0)-(b.order??0)),
    tasks: (state.tasks || []).sort((a,b)=>(a.order??0)-(b.order??0)),
    tags: state.tags || [],
    themePreference: state.themePreference ?? null,
  }
}

export async function persistThemePreference(value) {
  await request('/api/data/theme', { method: 'POST', body: JSON.stringify({ value: value ?? null }) })
}

export async function saveTask(task) { return request('/api/data/tasks', { method: 'POST', body: JSON.stringify(task) }) }
export async function deleteTask(id) { return request(`/api/data/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' }) }
export async function saveList(list) { return request('/api/data/lists', { method: 'POST', body: JSON.stringify(list) }) }
export async function deleteList(id) { return request(`/api/data/lists/${encodeURIComponent(id)}`, { method: 'DELETE' }) }
export async function saveTag(tag) { return request('/api/data/tags', { method: 'POST', body: JSON.stringify(tag) }) }
export async function deleteTag(id) { return request(`/api/data/tags/${encodeURIComponent(id)}`, { method: 'DELETE' }) }

export function getDefaultList(lists) {
  return lists.find(l => l.isDefault) || lists[0]
}

export { createList, createTask, createTag, createSubtask, createId }
