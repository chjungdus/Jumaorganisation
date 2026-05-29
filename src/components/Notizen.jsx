import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Trash2, X, Check } from 'lucide-react'

export default function Notizen() {
  const [notes, setNotes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', text: '' })

  useEffect(() => {
    const q = query(collection(db, 'notizen'), orderBy('updatedAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    const now = serverTimestamp()
    await addDoc(collection(db, 'notizen'), {
      title: form.title.trim(),
      text: form.text.trim(),
      createdAt: now,
      updatedAt: now,
    })
    setForm({ title: '', text: '' })
    setShowForm(false)
  }

  async function handleUpdate(id, title, text) {
    await updateDoc(doc(db, 'notizen', id), {
      title: title.trim(),
      text: text.trim(),
      updatedAt: serverTimestamp(),
    })
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, 'notizen', id))
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Notizen</h1>
        <button className="btn-icon" onClick={() => setShowForm(v => !v)}>
          {showForm ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <div className="form-header">
            <h3>Neue Notiz</h3>
            <button className="btn-icon-sm" onClick={() => setShowForm(false)}><X size={18} /></button>
          </div>
          <form onSubmit={handleAdd}>
            <label>
              Titel
              <input
                autoFocus
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Notiztitel"
                required
              />
            </label>
            <label>
              Text
              <textarea
                value={form.text}
                onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                rows={4}
                placeholder="Notizinhalt…"
              />
            </label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Abbrechen
              </button>
              <button type="submit" className="btn-primary">Speichern</button>
            </div>
          </form>
        </div>
      )}

      <div className="notes-grid">
        {loading && <div className="empty-state">Lädt…</div>}
        {!loading && notes.length === 0 && (
          <div className="empty-state">
            Noch keine Notizen.<br />Auf + drücken um eine zu erstellen.
          </div>
        )}
        {notes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        ))}
      </div>
    </div>
  )
}

function NoteCard({ note, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [title, setTitle] = useState(note.title)
  const [text, setText] = useState(note.text)

  useEffect(() => {
    if (!editing) {
      setTitle(note.title)
      setText(note.text)
    }
  }, [note.title, note.text, editing])

  function handleSave() {
    if (!title.trim()) return
    onUpdate(note.id, title, text)
    setEditing(false)
  }

  function handleCancel() {
    setTitle(note.title)
    setText(note.text)
    setEditing(false)
  }

  const updatedLabel = note.updatedAt?.toDate
    ? note.updatedAt.toDate().toLocaleDateString('de-DE', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : null

  if (editing) {
    return (
      <div className="note-card card editing">
        <input
          className="note-edit-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Titel"
          autoFocus
        />
        <textarea
          className="note-edit-text"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={5}
          placeholder="Text…"
        />
        <div className="note-actions">
          <button className="btn-icon-sm" onClick={handleCancel} title="Abbrechen">
            <X size={18} />
          </button>
          <button className="btn-icon-sm primary" onClick={handleSave} title="Speichern">
            <Check size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="note-card card" onClick={() => setEditing(true)}>
      <div className="note-header">
        <h3>{note.title}</h3>
        {confirmDelete ? (
          <div className="delete-confirm" onClick={e => e.stopPropagation()}>
            <span className="delete-confirm-text">Löschen?</span>
            <button className="btn-confirm-yes" onClick={e => { e.stopPropagation(); onDelete(note.id) }}>Ja</button>
            <button className="btn-confirm-no" onClick={e => { e.stopPropagation(); setConfirmDelete(false) }}>Nein</button>
          </div>
        ) : (
          <button className="btn-delete" onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}>
            <Trash2 size={16} />
          </button>
        )}
      </div>
      {note.text && <p className="note-text">{note.text}</p>}
      {updatedLabel && <span className="note-date">Zuletzt geändert: {updatedLabel}</span>}
    </div>
  )
}
