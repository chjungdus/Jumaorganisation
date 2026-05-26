import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Trash2, X } from 'lucide-react'

const PRIORITY_ORDER = { hoch: 0, mittel: 1, niedrig: 2 }
const PRIORITY_LABEL = { hoch: 'Hoch', mittel: 'Mittel', niedrig: 'Niedrig' }

function sortTodos(todos) {
  return [...todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    const po = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (po !== 0) return po
    return 0
  })
}

export default function TodoListe() {
  const [todos, setTodos] = useState([])
  const [filter, setFilter] = useState('Alle')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', person: 'Matteo', priority: 'mittel' })

  useEffect(() => {
    const q = query(collection(db, 'todos'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  const filtered = sortTodos(
    todos.filter(t => filter === 'Alle' || t.person === filter)
  )

  const pendingCount = (f) =>
    todos.filter(t => !t.done && (f === 'Alle' || t.person === f)).length

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    await addDoc(collection(db, 'todos'), {
      title: form.title.trim(),
      person: form.person,
      priority: form.priority,
      done: false,
      createdAt: serverTimestamp(),
      doneAt: null,
    })
    setForm({ title: '', person: form.person, priority: 'mittel' })
    setShowForm(false)
  }

  async function toggleDone(id, done) {
    await updateDoc(doc(db, 'todos', id), {
      done: !done,
      doneAt: !done ? serverTimestamp() : null,
    })
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, 'todos', id))
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>To-Do Liste</h1>
        <button className="btn-icon" onClick={() => setShowForm(v => !v)}>
          {showForm ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>

      <div className="filter-tabs">
        {['Alle', 'Matteo', 'Georgine'].map(f => (
          <button
            key={f}
            className={[
              'filter-tab',
              filter === f ? 'active' : '',
              filter === f && f !== 'Alle' ? `${f.toLowerCase()}-tab` : '',
            ].filter(Boolean).join(' ')}
            onClick={() => setFilter(f)}
          >
            {f}
            <span className="badge">{pendingCount(f)}</span>
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
            <label>
              Aufgabe
              <input
                autoFocus
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Was ist zu tun?"
                required
              />
            </label>
            <label>
              Zugewiesen an
              <div className="person-select">
                {['Matteo', 'Georgine'].map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`person-btn ${form.person === p ? `active chip-${p.toLowerCase()}` : ''}`}
                    onClick={() => setForm(f => ({ ...f, person: p }))}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </label>
            <label>
              Priorität
              <div className="priority-select">
                {['hoch', 'mittel', 'niedrig'].map(pr => (
                  <button
                    key={pr}
                    type="button"
                    className={`priority-btn ${form.priority === pr ? `active priority-${pr}` : ''}`}
                    onClick={() => setForm(f => ({ ...f, priority: pr }))}
                  >
                    {PRIORITY_LABEL[pr]}
                  </button>
                ))}
              </div>
            </label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Abbrechen
              </button>
              <button type="submit" className="btn-primary">Hinzufügen</button>
            </div>
          </form>
        </div>
      )}

      <div className="todo-list">
        {loading && <div className="empty-state">Lädt…</div>}
        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            Keine Aufgaben{filter !== 'Alle' ? ` für ${filter}` : ''}.<br />
            Auf + drücken um eine hinzuzufügen.
          </div>
        )}
        {filtered.map(todo => (
          <div key={todo.id} className={`todo-item card ${todo.done ? 'done' : ''}`}>
            <button
              className={`checkbox ${todo.done ? 'checked' : ''}`}
              onClick={() => toggleDone(todo.id, todo.done)}
              aria-label={todo.done ? 'Als offen markieren' : 'Als erledigt markieren'}
            >
              {todo.done && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              )}
            </button>
            <div className="todo-content">
              <span className="todo-title">{todo.title}</span>
              <div className="todo-meta">
                <span className={`person-chip chip-${todo.person.toLowerCase()}`}>{todo.person}</span>
                <span className={`priority-badge priority-${todo.priority}`}>
                  {PRIORITY_LABEL[todo.priority]}
                </span>
              </div>
            </div>
            <button className="btn-delete" onClick={() => handleDelete(todo.id)}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
