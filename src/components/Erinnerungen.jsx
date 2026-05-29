import { useState, useEffect, useRef } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, X, Trash2, Bell, BellOff, Check } from 'lucide-react'
import { PERSONEN, slug } from '../constants'

function pad(n) { return String(n).padStart(2, '0') }
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function fmtDateTime(date, time) {
  const d = new Date(date + 'T' + time)
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' + time + ' Uhr'
}
function isPast(date, time) {
  return new Date(date + 'T' + time) < new Date()
}

const EMPTY_FORM = { title: '', date: todayStr(), time: '09:00', person: PERSONEN[0], note: '' }

export default function Erinnerungen() {
  const [reminders, setReminders] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const notifiedRef = useRef(new Set())

  useEffect(() => {
    const q = query(collection(db, 'erinnerungen'), orderBy('date', 'asc'))
    const unsub = onSnapshot(q, snap =>
      setReminders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [])

  useEffect(() => {
    if (permission !== 'granted') return
    const interval = setInterval(() => {
      const now = new Date()
      reminders.forEach(r => {
        if (r.done || notifiedRef.current.has(r.id)) return
        const due = new Date(r.date + 'T' + r.time)
        if (due <= now && due > new Date(now - 60000)) {
          notifiedRef.current.add(r.id)
          new Notification('⏰ ' + r.title, {
            body: r.note || r.person,
            icon: '/vite.svg',
          })
        }
      })
    }, 15000)
    return () => clearInterval(interval)
  }, [reminders, permission])

  async function requestPermission() {
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    await addDoc(collection(db, 'erinnerungen'), {
      ...form, title: form.title.trim(), note: form.note.trim(),
      done: false, createdAt: serverTimestamp(),
    })
    setForm(EMPTY_FORM); setShowForm(false)
  }

  async function toggleDone(id, done) {
    await updateDoc(doc(db, 'erinnerungen', id), { done: !done })
  }

  async function handleDelete(id) { await deleteDoc(doc(db, 'erinnerungen', id)) }

  const upcoming = reminders.filter(r => !r.done && !isPast(r.date, r.time))
  const past = reminders.filter(r => r.done || isPast(r.date, r.time))

  return (
    <div className="page">
      <div className="page-header">
        <h1>Erinnerungen</h1>
        <button className="btn-icon" onClick={() => setShowForm(v => !v)}>
          {showForm ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>

      {permission !== 'granted' && (
        <div className="card reminder-permission-card" onClick={requestPermission}>
          {permission === 'denied'
            ? <><BellOff size={18} /> <span>Benachrichtigungen blockiert — in den Browser-Einstellungen erlauben</span></>
            : <><Bell size={18} /> <span>Benachrichtigungen erlauben für Erinnerungen</span></>}
        </div>
      )}

      {permission === 'granted' && (
        <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={15} color="var(--primary)" />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Benachrichtigungen aktiv</span>
        </div>
      )}

      {showForm && (
        <div className="card form-card">
          <div className="form-header">
            <h3>Neue Erinnerung</h3>
            <button className="btn-icon-sm" onClick={() => setShowForm(false)}><X size={18} /></button>
          </div>
          <form onSubmit={handleAdd}>
            <label>Titel<input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Woran erinnern?" required /></label>
            <div className="row">
              <label>Datum<input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></label>
              <label>Uhrzeit<input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required /></label>
            </div>
            <label>Person
              <div className="person-select">
                {PERSONEN.map(p => (
                  <button key={p} type="button"
                    className={`person-btn ${form.person === p ? `active chip-${slug(p)}` : ''}`}
                    onClick={() => setForm(f => ({ ...f, person: p }))}>{p}</button>
                ))}
              </div>
            </label>
            <label>Notiz (optional)<input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Details…" /></label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Abbrechen</button>
              <button type="submit" className="btn-primary">Erstellen</button>
            </div>
          </form>
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 && (
        <div className="empty-state">Noch keine Erinnerungen.<br />Auf + drücken um eine zu erstellen.</div>
      )}

      {upcoming.length > 0 && (
        <>
          <div className="stat-section-title">Bevorstehend</div>
          {upcoming.map(r => (
            <div key={r.id} className={`card reminder-card person-border-${slug(r.person)}`}>
              <button className="checkbox" onClick={() => toggleDone(r.id, r.done)}>
                <Check size={12} style={{ opacity: 0 }} />
              </button>
              <div className="reminder-info">
                <span className="reminder-title">{r.title}</span>
                <div className="reminder-meta">
                  <span className={`person-chip chip-${slug(r.person)}`}>{r.person}</span>
                  <span className="reminder-time">{fmtDateTime(r.date, r.time)}</span>
                </div>
                {r.note && <span className="reminder-note">{r.note}</span>}
              </div>
              {confirmDeleteId === r.id ? (
                <div className="delete-confirm">
                  <span className="delete-confirm-text">Löschen?</span>
                  <button className="btn-confirm-yes" onClick={() => { setConfirmDeleteId(null); handleDelete(r.id) }}>Ja</button>
                  <button className="btn-confirm-no" onClick={() => setConfirmDeleteId(null)}>Nein</button>
                </div>
              ) : (
                <button className="btn-delete" onClick={() => setConfirmDeleteId(r.id)}><Trash2 size={15} /></button>
              )}
            </div>
          ))}
        </>
      )}

      {past.length > 0 && (
        <>
          <div className="stat-section-title">Erledigt / Vergangen</div>
          {past.map(r => (
            <div key={r.id} className={`card reminder-card reminder-past`}>
              <button className={`checkbox ${r.done ? 'checked' : ''}`} onClick={() => toggleDone(r.id, r.done)}>
                {r.done && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20,6 9,17 4,12" /></svg>}
              </button>
              <div className="reminder-info">
                <span className="reminder-title">{r.title}</span>
                <div className="reminder-meta">
                  <span className={`person-chip chip-${slug(r.person)}`}>{r.person}</span>
                  <span className="reminder-time">{fmtDateTime(r.date, r.time)}</span>
                </div>
              </div>
              {confirmDeleteId === r.id ? (
                <div className="delete-confirm">
                  <span className="delete-confirm-text">Löschen?</span>
                  <button className="btn-confirm-yes" onClick={() => { setConfirmDeleteId(null); handleDelete(r.id) }}>Ja</button>
                  <button className="btn-confirm-no" onClick={() => setConfirmDeleteId(null)}>Nein</button>
                </div>
              ) : (
                <button className="btn-delete" onClick={() => setConfirmDeleteId(r.id)}><Trash2 size={15} /></button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
