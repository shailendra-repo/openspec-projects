const crypto = require('crypto')
const { hashPassword, verifyPassword } = require('./auth.cjs')

function id(prefix) { return `${prefix}_${crypto.randomUUID()}` }
function now() { return new Date().toISOString() }

function createService(db) {
  function getUserByUsername(username) {
    return db.prepare('SELECT id, username, password_hash, created_at FROM users WHERE username = ? COLLATE NOCASE').get(username)
  }

  function ensureDefaultList(userId) {
    let inbox = db.prepare('SELECT * FROM lists WHERE user_id = ? AND is_default = 1').get(userId)
    if (!inbox) {
      const listId = id('list')
      db.prepare('INSERT INTO lists(id,user_id,name,is_default,"order",created_at) VALUES(?,?,?,?,?,?)')
        .run(listId, userId, 'Inbox', 1, 0, now())
      inbox = db.prepare('SELECT * FROM lists WHERE id = ?').get(listId)
    }
    return inbox
  }

  return {
    register({ username, password }) {
      username = (username || '').trim()
      if (!username || !password) throw new Error('Username and password are required')
      const existing = getUserByUsername(username)
      if (existing) throw new Error('Username is unavailable')
      const userId = id('user')
      db.prepare('INSERT INTO users(id,username,password_hash,created_at) VALUES(?,?,?,?)')
        .run(userId, username, hashPassword(password), now())
      ensureDefaultList(userId)
      return { id: userId, username }
    },

    login({ username, password }) {
      username = (username || '').trim()
      const user = getUserByUsername(username)
      if (!user || !verifyPassword(password || '', user.password_hash)) {
        throw new Error('Invalid username or password')
      }
      ensureDefaultList(user.id)
      return { id: user.id, username: user.username }
    },

    loadState(userId) {
      const lists = db.prepare('SELECT * FROM lists WHERE user_id = ? ORDER BY "order" ASC').all(userId)
      if (lists.length === 0) lists.push(ensureDefaultList(userId))
      const tags = db.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC').all(userId)
      const taskRows = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY "order" ASC').all(userId)
      const tasks = taskRows.map(r => {
        const tagIds = db.prepare('SELECT tag_id FROM task_tags WHERE task_id = ?').all(r.id).map(x => x.tag_id)
        let subtasks = []
        try { subtasks = JSON.parse(r.subtasks_json || '[]') } catch { subtasks = [] }
        return {
          id: r.id,
          title: r.title,
          notes: r.notes || '',
          listId: r.list_id,
          tagIds,
          subtasks,
          completed: !!r.completed,
          completedAt: r.completed_at,
          dueDate: r.due_date,
          reminderAt: r.reminder_at,
          priority: r.priority || 'none',
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          order: r.order,
        }
      })
      const themeRow = db.prepare('SELECT value FROM user_preferences WHERE user_id = ? AND key = ?').get(userId, 'themePreference')
      return { lists, tasks, tags, themePreference: themeRow ? themeRow.value : null }
    },

    saveTask(userId, task) {
      const stmt = db.prepare(`INSERT INTO tasks(id,user_id,title,notes,list_id,completed,completed_at,due_date,reminder_at,priority,"order",subtasks_json,created_at,updated_at)
        VALUES(@id,@user_id,@title,@notes,@list_id,@completed,@completed_at,@due_date,@reminder_at,@priority,@order,@subtasks_json,@created_at,@updated_at)
        ON CONFLICT(id) DO UPDATE SET title=excluded.title, notes=excluded.notes, list_id=excluded.list_id, completed=excluded.completed, completed_at=excluded.completed_at,
          due_date=excluded.due_date, reminder_at=excluded.reminder_at, priority=excluded.priority, "order"=excluded."order", subtasks_json=excluded.subtasks_json, updated_at=excluded.updated_at`)
      stmt.run({
        id: task.id,
        user_id: userId,
        title: task.title,
        notes: task.notes || '',
        list_id: task.listId,
        completed: task.completed ? 1 : 0,
        completed_at: task.completedAt || null,
        due_date: task.dueDate || null,
        reminder_at: task.reminderAt || null,
        priority: task.priority || 'none',
        order: task.order ?? 0,
        subtasks_json: JSON.stringify(task.subtasks || []),
        created_at: task.createdAt || now(),
        updated_at: now(),
      })
      db.prepare('DELETE FROM task_tags WHERE task_id = ?').run(task.id)
      const ins = db.prepare('INSERT OR IGNORE INTO task_tags(task_id, tag_id) VALUES(?,?)')
      for (const tagId of (task.tagIds || [])) ins.run(task.id, tagId)
      return { ...task, updatedAt: now() }
    },

    deleteTask(userId, taskId) {
      db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(taskId, userId)
    },

    saveList(userId, list) {
      db.prepare(`INSERT INTO lists(id,user_id,name,is_default,"order",created_at)
        VALUES(@id,@user_id,@name,@is_default,@order,@created_at)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name, is_default=excluded.is_default, "order"=excluded."order"`)
        .run({ id: list.id, user_id: userId, name: list.name, is_default: list.isDefault ? 1 : 0, order: list.order ?? 0, created_at: list.createdAt || now() })
      return list
    },

    deleteList(userId, listId) {
      const inbox = ensureDefaultList(userId)
      if (listId === inbox.id) throw new Error('Default Inbox cannot be deleted')
      const tx = db.transaction(() => {
        db.prepare('UPDATE tasks SET list_id = ? WHERE user_id = ? AND list_id = ?').run(inbox.id, userId, listId)
        db.prepare('DELETE FROM lists WHERE id = ? AND user_id = ? AND is_default = 0').run(listId, userId)
      })
      tx()
    },

    saveTag(userId, tag) {
      db.prepare(`INSERT INTO tags(id,user_id,name,color) VALUES(@id,@user_id,@name,@color)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name, color=excluded.color`)
        .run({ id: tag.id, user_id: userId, name: tag.name, color: tag.color || '#4f46e5' })
      return tag
    },

    deleteTag(userId, tagId) {
      db.prepare('DELETE FROM tags WHERE id = ? AND user_id = ?').run(tagId, userId)
    },

    saveThemePreference(userId, value) {
      if (value == null) {
        db.prepare('DELETE FROM user_preferences WHERE user_id = ? AND key = ?').run(userId, 'themePreference')
      } else {
        db.prepare(`INSERT INTO user_preferences(user_id,key,value) VALUES(?,?,?)
          ON CONFLICT(user_id,key) DO UPDATE SET value=excluded.value`).run(userId, 'themePreference', value)
      }
    },

    _getUserByUsername: getUserByUsername,
  }
}

module.exports = { createService }
