import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Trash2, X, Edit2 } from 'lucide-react'
import { PERSONEN, slug } from '../constants'

const PRIORITY_ORDER = { hoch: 0, mittel: 1, niedrig: 2 }
const PRIORITY_LABEL = { hoch: 'Hoch', mittel: 'Mittel', niedrig: 'Niedrig' }
const FILTER_OPTIONS = ['Alle', ...PERSONEN]

function sortTodos(todos) {
  return [...todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  })
}

export default function TodoListe() {
  const [todos, setTodos] = useState([])
  const [filter, setFilter] = useState(() => {
    const saved = localStorage.getItem('lastActivePerson')
    return (saved && PERSONEN.includes(saved)) ? saved : PERSONEN[0]
  })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', person: PERSONEN[0], priority: 'mittel', dueDate: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', person: PERSONEN[0], priority: 'mittel', dueDate: '' })
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'todos'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  const filtered = sortTodos(todos.filter(t => filter === 'Alle' || t.person === filter))
  const pendingCount = f => todos.filter(t => !t.done && (f === 'Alle' || t.person === f)).length

  function handleFilterChange(f) {
    setFilter(f)
    if (PERSONEN.includes(f)) localStorage.setItem('lastActivePerson', f)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    await addDoc(collection(db, 'todos'), {
      title: form.title.trim(), person: form.person, priority: form.priority,
      dueDate: form.dueDate || '',
      done: false, createdAt: serverTimestamp(), doneAt: null,
    })
    setForm({ title: '', person: form.person, priority: 'mittel', dueDate: '' })
    setShowForm(false)
  }

  function startEdit(todo) {
    setEditingId(todo.id)
    setEditForm({ title: todo.title, person: todo.person, priority: todo.priority, dueDate: todo.dueDate || '' })
    setShowForm(false)
  }

  async function handleEdit(e) {
    e.preventDefault()
    if (!editForm.title.trim()) return
    await updateDoc(doc(db, 'todos', editingId), {
      title: editForm.title.trim(),
      person: editForm.person,
      priority: editForm.priority,
      dueDate: editForm.dueDate || '',
    })
    setEditingId(null)
  }

  async function toggleDone(id, done) {
    await updateDoc(doc(db, 'todos', id), { done: !done, doneAt: !done ? serverTimestamp() : null })
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, 'todos', id))
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>To-Do Liste</h1>
        <button className="btn-icon" onClick={() => { setShowForm(v => !v); setEditingId(null) }}>
          {showForm ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>

      <div className="filter-tabs">
        {FILTER_OPTIONS.map(f => (
          <button key={f}
            className={['filter-tab', filter === f ? 'active' : '', filter === f && f !== 'Alle' ? `${slug(f)}-tab` : ''].filter(Boolean).join(' ')}
            onClick={() => handleFilterChange(f)}>
            {f}<span className="badge">{pendingCount(f)}</span>
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card form-card">
          <div className="form-header">
            <h3>Neue Aufgabe</h3>
            <button className="btn-icon-sm" onClick={() => setShowForm(false)}><X size={18} /></button>
          </div>
          <form onSubmit={handleAdd}>
            <label>Aufgabe<input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Was ist zu tun?" required /></label>
            <label>Zugewiesen an
              <div className="person-select">
                {PERSONEN.map(p => (
                  <button key={p} type="button" className={`person-btn ${form.person === p ? `active chip-${slug(p)}` : ''}`}
                    onClick={() => setForm(f => ({ ...f, person: p }))}>{p}</button>
                ))}
              </div>
            </label>
            <label>Priorität
              <div className="priority-select">
                {['hoch', 'mittel', 'niedrig'].map(pr => (
                  <button key={pr} type="button" className={`priority-btn ${form.priority === pr ? `active priority-${pr}` : ''}`}
                    onClick={() => setForm(f => ({ ...f, priority: pr }))}>{PRIORITY_LABEL[pr]}</button>
                ))}
              </div>
            </label>
            <label>Fällig am (optional)<input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Abbrechen</button>
              <button type="submit" className="btn-primary">Hinzufügen</button>
            </div>
          </form>
        </div>
      )}

      <div className="todo-list">
        {loading && <div className="empty-state">Lädt…</div>}
        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            Keine Aufgaben{filter !== 'Alle' ? ` für ${filter}` : ''}.
            <br />
            <button className="btn-primary" onClick={() => setShowForm(true)}>Erste Aufgabe erstellen</button>
          </div>
        )}
        {filtered.map(todo => (
          editingId === todo.id ? (
            <div key={todo.id} className="card edit-inline-form">
              <form onSubmit={handleEdit}>
                <label>Aufgabe<input autoFocus value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} required /></label>
                <label>Zugewiesen an
                  <div className="person-select">
                    {PERSONEN.map(p => (
                      <button key={p} type="button" className={`person-btn ${editForm.person === p ? `active chip-${slug(p)}` : ''}`}
                        onClick={() => setEditForm(f => ({ ...f, person: p }))}>{p}</button>
                    ))}
                  </div>
                </label>
                <label>Priorität
                  <div className="priority-select">
                    {['hoch', 'mittel', 'niedrig'].map(pr => (
                      <button key={pr} type="button" className={`priority-btn ${editForm.priority === pr ? `active priority-${pr}` : ''}`}
                        onClick={() => setEditForm(f => ({ ...f, priority: pr }))}>{PRIORITY_LABEL[pr]}</button>
                    ))}
                  </div>
                </label>
                <label>Fällig am (optional)<input type="date" value={editForm.dueDate} onChange={e => setEditForm(f => ({ ...f, dueDate: e.target.value }))} /></label>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>Abbrechen</button>
                  <button type="submit" className="btn-primary">Speichern</button>
                </div>
              </form>
            </div>
          ) : (
            <div key={todo.id} className={`todo-item card ${todo.done ? 'done' : ''}`}>
              <button className={`checkbox ${todo.done ? 'checked' : ''}`} onClick={() => toggleDone(todo.id, todo.done)}>
                {todo.done && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20,6 9,17 4,12" /></svg>}
              </button>
              <div className="todo-content">
                <span className="todo-title">{todo.title}</span>
                <div className="todo-meta">
                  <span className={`person-chip chip-${slug(todo.person)}`}>{todo.person}</span>
                  <span className={`priority-badge priority-${todo.priority}`}>{PRIORITY_LABEL[todo.priority]}</span>
                  {todo.dueDate && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                      📅 {new Date(todo.dueDate + 'T00:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
              <button className="btn-edit" onClick={() => startEdit(todo)}><Edit2 size={15} /></button>
              {confirmDeleteId === todo.id ? (
                <div className="delete-confirm">
                  <span className="delete-confirm-text">Löschen?</span>
                  <button className="btn-confirm-yes" onClick={() => { setConfirmDeleteId(null); handleDelete(todo.id) }}>Ja</button>
                  <button className="btn-confirm-no" onClick={() => setConfirmDeleteId(null)}>Nein</button>
                </div>
              ) : (
                <button className="btn-delete" onClick={() => setConfirmDeleteId(todo.id)}><Trash2 size={15} /></button>
              )}
            </div>
          )
        ))}
      </div>
    </div>
  )
}
