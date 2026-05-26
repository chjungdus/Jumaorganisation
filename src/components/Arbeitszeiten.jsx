import { useState, useEffect } from 'react'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Trash2, Clock, X } from 'lucide-react'

function calcHours(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60)
}

function fmtHours(h) {
  const hours = Math.floor(h)
  const mins = Math.round((h - hours) * 60)
  if (hours === 0 && mins === 0) return '0h'
  if (mins === 0) return `${hours}h`
  if (hours === 0) return `${mins}min`
  return `${hours}h ${mins}min`
}

function getWeekBounds() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

const TODAY = new Date().toISOString().split('T')[0]

export default function Arbeitszeiten() {
  const [person, setPerson] = useState('Matteo')
  const [entries, setEntries] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    date: TODAY,
    startTime: '',
    endTime: '',
    description: '',
  })

  useEffect(() => {
    const q = query(collection(db, 'arbeitszeiten'), orderBy('date', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  const personEntries = entries.filter(e => e.person === person)

  const { monday, sunday } = getWeekBounds()
  const weekHours = personEntries
    .filter(e => { const d = new Date(e.date + 'T00:00:00'); return d >= monday && d <= sunday })
    .reduce((sum, e) => sum + calcHours(e.startTime, e.endTime), 0)

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.date || !form.startTime || !form.endTime) return
    await addDoc(collection(db, 'arbeitszeiten'), {
      person,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      description: form.description.trim(),
      hours: calcHours(form.startTime, form.endTime),
      createdAt: serverTimestamp(),
    })
    setForm({ date: TODAY, startTime: '', endTime: '', description: '' })
    setShowForm(false)
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, 'arbeitszeiten', id))
  }

  const grouped = personEntries.reduce((acc, entry) => {
    (acc[entry.date] = acc[entry.date] || []).push(entry)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="page">
      <div className="page-header">
        <h1>Arbeitszeiten</h1>
        <button className="btn-icon" onClick={() => setShowForm(v => !v)}>
          {showForm ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>

      <div className="person-tabs">
        {['Matteo', 'Georgine'].map(p => (
          <button
            key={p}
            className={`person-tab ${person === p ? `active ${p.toLowerCase()}` : ''}`}
            onClick={() => setPerson(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card form-card">
          <div className="form-header">
            <h3>Neue Einheit – {person}</h3>
            <button className="btn-icon-sm" onClick={() => setShowForm(false)}><X size={18} /></button>
          </div>
          <form onSubmit={handleAdd}>
            <label>
              Datum
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
              />
            </label>
            <div className="row">
              <label>
                Von
                <input
                  type="time"
                  value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  required
                />
              </label>
              <label>
                Bis
                <input
                  type="time"
                  value={form.endTime}
                  onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  required
                />
              </label>
            </div>
            <label>
              Beschreibung
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Was wurde gemacht?"
              />
            </label>
            {form.startTime && form.endTime && calcHours(form.startTime, form.endTime) > 0 && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Dauer: <strong>{fmtHours(calcHours(form.startTime, form.endTime))}</strong>
              </div>
            )}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Abbrechen
              </button>
              <button type="submit" className="btn-primary">Eintragen</button>
            </div>
          </form>
        </div>
      )}

      <div className={`week-summary ${person.toLowerCase()}-accent`}>
        <Clock size={18} />
        <span>Diese Woche: <strong>{fmtHours(weekHours)}</strong></span>
      </div>

      <div className="entries-list">
        {loading && <div className="empty-state">Lädt…</div>}
        {!loading && sortedDates.length === 0 && (
          <div className="empty-state">
            Noch keine Einträge für {person}.<br />Auf + drücken um zu beginnen.
          </div>
        )}
        {sortedDates.map(date => {
          const dateEntries = grouped[date]
          const dayHours = dateEntries.reduce((sum, e) => sum + calcHours(e.startTime, e.endTime), 0)
          const dateObj = new Date(date + 'T00:00:00')
          return (
            <div key={date} className="date-group">
              <div className="date-header">
                <span>
                  {dateObj.toLocaleDateString('de-DE', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'long',
                    year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                  })}
                </span>
                <span className="date-total">{fmtHours(dayHours)}</span>
              </div>
              {dateEntries.map(entry => (
                <div key={entry.id} className="entry-card card">
                  <div className="entry-time">
                    <span>{entry.startTime} – {entry.endTime}</span>
                    <span className="entry-hours">{fmtHours(calcHours(entry.startTime, entry.endTime))}</span>
                  </div>
                  {entry.description && <p className="entry-desc">{entry.description}</p>}
                  <button className="btn-delete" onClick={() => handleDelete(entry.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
