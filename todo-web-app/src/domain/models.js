export function createId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function createList({ name, isDefault = false }) {
  return {
    id: createId('list'),
    name: name.trim(),
    isDefault,
    createdAt: new Date().toISOString(),
    order: Date.now(),
  }
}

export function createTask({ title, listId, dueDate = null, priority = 'none' }) {
  return {
    id: createId('task'),
    title: title.trim(),
    notes: '',
    listId,
    tagIds: [],
    subtasks: [],
    completed: false,
    completedAt: null,
    dueDate,
    reminderAt: null,
    priority,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order: Date.now(),
  }
}

export function createSubtask({ title }) {
  return {
    id: createId('sub'),
    title: title.trim(),
    completed: false,
  }
}

export function createTag({ name, color = '#4f46e5' }) {
  return {
    id: createId('tag'),
    name: name.trim(),
    color,
  }
}
