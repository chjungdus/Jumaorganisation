import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Trash2, X, Check, Folder, FolderPlus } from 'lucide-react'

const DEFAULT_FOLDER = 'Allgemein'

export default function Notizen() {
  const [notes, setNotes] = useState([])
  const [folders, setFolders] = useState([DEFAULT_FOLDER])
  const [activeFolder, setActiveFolder] = useState(DEFAULT_FOLDER)
  const [showForm, setShowForm] = useState(false)
  const [showFolderForm, setShowFolderForm] = useState(false)
  const [newFolder, setNewFolder] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', text: '', folder: DEFAULT_FOLDER })

  useEffect(() => {
    const q = query(collection(db, 'notizen'), orderBy('updatedAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setNotes(all)
      const allFolders = [...new Set([DEFAULT_FOLDER, ...all.map(n => n.folder || DEFAULT_FOLDER)])]
      setFolders(allFolders)
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  const visibleNotes = notes.filter(n => (n.folder || DEFAULT_FOLDER) === activeFolder)

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    const now = serverTimestamp()
    await addDoc(collection(db, 'notizen'), {
      title: form.title.trim(), text: form.text.trim(),
      folder: form.folder,
      createdAt: now, updatedAt: now,
    })
    setForm({ title: '', text: '', folder: activeFolder })
    setShowForm(false)
  }

  async function handleUpdate(id, title, text, folder) {
    await updateDoc(doc(db, 'notizen', id), {
      title: title.trim(), text: text.trim(),
      folder: folder || DEFAULT_FOLDER,
      updatedAt: serverTimestamp(),
    })
  }

  async function handleDelete(id) { await deleteDoc(doc(db, 'notizen', id)) }

  function addFolder() {
    const name = newFolder.trim()
    if (!name || folders.includes(name)) return
    setFolders(f => [...f, name])
    setActiveFolder(name)
    setNewFolder('')
    setShowFolderForm(false)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Notizen</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-icon-sm" onClick={() => setShowFolderForm(v => !v)} title="Ordner erstellen">
            <FolderPlus size={20} color="var(--primary)" />
          </button>
          <button className="btn-icon" onClick={() => { setShowForm(v => !v); setForm(f => ({ ...f, folder: activeFolder })) }}>
            {showForm ? <X size={22} /> : <Plus size={22} />}
          </button>
        </div>
      </div>

      {showFolderForm && (
        <div className="card" style={{ padding: '12px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Folder size={16} color="var(--primary)" />
          <input autoFocus value={newFolder} onChange={e => setNewFolder(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addFolder()}
            placeholder="Ordnername…"
            style={{ flex: 1, border: '1px solid var(--border-bright)', borderRadius: 8, padding: '7px 10px', fontSize: 14, fontFamily: 'inherit', color: 'var(--text)', background: 'var(--bg2)', outline: 'none' }} />
          <button className="btn-icon-sm primary" onClick={addFolder}><Check size={16} /></button>
          <button className="btn-icon-sm" onClick={() => setShowFolderForm(false)}><X size={16} /></button>
        </div>
      )}

      <div className="filter-tabs">
        {folders.map(f => (
          <button key={f}
            className={`filter-tab folder-tab ${activeFolder === f ? 'active' : ''}`}
            onClick={() => setActiveFolder(f)}>
            <Folder size={12} />
            {f}
            <span className="badge">{notes.filter(n => (n.folder || DEFAULT_FOLDER) === f).length}</span>
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card form-card">
          <div className="form-header">
            <h3>Neue Notiz</h3>
            <button className="btn-icon-sm" onClick={() => setShowForm(false)}><X size={18} /></button>
          </div>
          <form onSubmit={handleAdd}>
            <label>Titel<input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Notiztitel" required /></label>
            <label>Text<textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} rows={4} placeholder="Notizinhalt…" /></label>
            <label>Ordner
              <div className="folder-select">
                {folders.map(f => (
                  <button key={f} type="button"
                    className={`repeat-btn ${form.folder === f ? 'active' : ''}`}
                    onClick={() => setForm(fo => ({ ...fo, folder: f }))}>{f}</button>
                ))}
              </div>
            </label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Abbrechen</button>
              <button type="submit" className="btn-primary">Speichern</button>
            </div>
          </form>
        </div>
      )}

      <div className="notes-grid">
        {loading && <div className="empty-state">Lädt…</div>}
        {!loading && visibleNotes.length === 0 && (
          <div className="empty-state">
            Keine Notizen in «{activeFolder}».
            <br />
            <button className="btn-primary" onClick={() => { setShowForm(true); setForm(f => ({ ...f, folder: activeFolder })) }}>Erste Notiz erstellen</button>
          </div>
        )}
        {visibleNotes.map(note => (
          <NoteCard key={note.id} note={note} folders={folders} onDelete={handleDelete} onUpdate={handleUpdate} />
        ))}
      </div>
    </div>
  )
}

function NoteCard({ note, folders, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [title, setTitle] = useState(note.title)
  const [text, setText] = useState(note.text)
  const [folder, setFolder] = useState(note.folder || DEFAULT_FOLDER)

  useEffect(() => {
    if (!editing) { setTitle(note.title); setText(note.text); setFolder(note.folder || DEFAULT_FOLDER) }
  }, [note.title, note.text, note.folder, editing])

  function handleSave() {
    if (!title.trim()) return
    onUpdate(note.id, title, text, folder)
    setEditing(false)
  }

  const updatedLabel = note.updatedAt?.toDate
    ? note.updatedAt.toDate().toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  if (editing) {
    return (
      <div className="note-card card editing">
        <input className="note-edit-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Titel" autoFocus />
        <textarea className="note-edit-text" value={text} onChange={e => setText(e.target.value)} rows={5} placeholder="Text…" />
        <div className="folder-select" style={{ marginBottom: 12 }}>
          {folders.map(f => (
            <button key={f} type="button"
              className={`repeat-btn ${folder === f ? 'active' : ''}`}
              onClick={() => setFolder(f)}>{f}</button>
          ))}
        </div>
        <div className="note-actions">
          <button className="btn-icon-sm" onClick={() => setEditing(false)}><X size={18} /></button>
          <button className="btn-icon-sm primary" onClick={handleSave}><Check size={18} /></button>
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
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
        <span className="note-folder-badge"><Folder size={10} /> {note.folder || DEFAULT_FOLDER}</span>
        {updatedLabel && <span className="note-date" style={{ marginTop: 0 }}>{updatedLabel}</span>}
      </div>
    </div>
  )
}
