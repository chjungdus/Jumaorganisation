import { useState, useEffect } from 'react'
import {
  collection, doc, setDoc, onSnapshot, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PERSONEN, slug } from '../constants'

const MOOD_LABELS = ['', '😞 Schlecht', '😕 Mäßig', '😐 Ok', '😊 Gut', '😄 Super']
const PROD_LABELS = ['', '🐌 Sehr wenig', '😴 Wenig', '⚡ Normal', '🔥 Viel', '🚀 Sehr viel']

function pad(n) { return String(n).padStart(2, '0') }
function fmtDate(str) {
  const d = new Date(str + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
}
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function offsetDate(str, days) {
  const d = new Date(str + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function calcSleep(ein, auf) {
  if (!ein || !auf) return null
  const [eh, em] = ein.split(':').map(Number)
  const [ah, am] = auf.split(':').map(Number)
  let mins = (ah * 60 + am) - (eh * 60 + em)
  if (mins < 0) mins += 24 * 60
  const h = Math.floor(mins / 60), m = mins % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

const EMPTY = { schlafEin: '', schlafAuf: '', stimmung: 0, produktivitaet: 0, wasser: 0, bildschirmzeit: '', sport: false, notiz: '' }

function EintragForm({ person, date, initial, onSave }) {
  const [f, setF] = useState({ ...EMPTY, ...initial })

  useEffect(() => { setF({ ...EMPTY, ...initial }) }, [person, date])

  function set(key, val) { setF(prev => ({ ...prev, [key]: val })) }

  async function save() {
    const id = `${person.replace(/\s/g, '_')}_${date}`
    await setDoc(doc(db, 'tagesbuch', id), {
      person, date, ...f, updatedAt: new Date().toISOString()
    }, { merge: true })
    onSave()
  }

  const sleepDur = calcSleep(f.schlafEin, f.schlafAuf)

  return (
    <div className="card form-card">
      <div className="form-header" style={{ marginBottom: 16 }}>
        <h3 style={{ color: `var(--${slug(person)})` }}>{person}</h3>
        {sleepDur && <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700 }}>😴 {sleepDur}</span>}
      </div>

      <div className="tb-section">
        <div className="tb-label">Schlafenszeit</div>
        <div className="row">
          <label>Eingeschlafen<input type="time" value={f.schlafEin} onChange={e => set('schlafEin', e.target.value)} /></label>
          <label>Aufgewacht<input type="time" value={f.schlafAuf} onChange={e => set('schlafAuf', e.target.value)} /></label>
        </div>
      </div>

      <div className="tb-section">
        <div className="tb-label">Stimmung</div>
        <div className="rating-row">
          {[1,2,3,4,5].map(n => (
            <button key={n} type="button"
              className={`rating-btn ${f.stimmung === n ? 'active' : ''}`}
              onClick={() => set('stimmung', f.stimmung === n ? 0 : n)}>
              {MOOD_LABELS[n].split(' ')[0]}
            </button>
          ))}
          {f.stimmung > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{MOOD_LABELS[f.stimmung]}</span>}
        </div>
      </div>

      <div className="tb-section">
        <div className="tb-label">Produktivität</div>
        <div className="rating-row">
          {[1,2,3,4,5].map(n => (
            <button key={n} type="button"
              className={`rating-btn ${f.produktivitaet === n ? 'active' : ''}`}
              onClick={() => set('produktivitaet', f.produktivitaet === n ? 0 : n)}>
              {PROD_LABELS[n].split(' ')[0]}
            </button>
          ))}
          {f.produktivitaet > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{PROD_LABELS[f.produktivitaet]}</span>}
        </div>
      </div>

      <div className="tb-section">
        <div className="row">
          <label>Wasser (Gläser)
            <div className="water-row">
              <button type="button" className="btn-icon-sm" onClick={() => set('wasser', Math.max(0, f.wasser - 1))}>−</button>
              <span className="water-count">{f.wasser}</span>
              <button type="button" className="btn-icon-sm" onClick={() => set('wasser', f.wasser + 1)}>+</button>
            </div>
          </label>
          <label>Bildschirmzeit (h)<input type="number" min="0" max="24" step="0.5" value={f.bildschirmzeit} onChange={e => set('bildschirmzeit', e.target.value)} placeholder="z.B. 3.5" /></label>
        </div>
      </div>

      <div className="tb-section">
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={f.sport} onChange={e => set('sport', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textTransform: 'none', letterSpacing: 0 }}>Heute Sport gemacht 🏋️</span>
        </label>
      </div>

      <label>Notiz (optional)<textarea rows={2} value={f.notiz} onChange={e => set('notiz', e.target.value)} placeholder="Wie war dein Tag?" /></label>

      <div className="form-actions">
        <button type="button" className="btn-primary" onClick={save}>Speichern</button>
      </div>
    </div>
  )
}

export default function Tagesbuch() {
  const [entries, setEntries] = useState([])
  const [date, setDate] = useState(todayStr())
  const [person, setPerson] = useState(PERSONEN[0])
  const [saved, setSaved] = useState(false)
  const today = todayStr()

  useEffect(() => {
    const q = query(collection(db, 'tagesbuch'), orderBy('date', 'desc'))
    const unsub = onSnapshot(q, snap =>
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [])

  useEffect(() => { setSaved(false) }, [date, person])

  function entryFor(p, d) {
    return entries.find(e => e.person === p && e.date === d) || {}
  }

  const weeks = Array.from({ length: 7 }, (_, i) => offsetDate(today, -6 + i))

  return (
    <div className="page">
      <div className="page-header">
        <h1>Tagesbuch</h1>
      </div>

      <div className="month-nav card" style={{ padding: '10px 14px' }}>
        <button className="btn-icon-sm" onClick={() => { setDate(d => offsetDate(d, -1)); setSaved(false) }}>
          <ChevronLeft size={22} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, textAlign: 'center' }}>
          {date === today ? 'Heute' : fmtDate(date)}
        </span>
        <button className="btn-icon-sm"
          onClick={() => { if (date < today) { setDate(d => offsetDate(d, 1)); setSaved(false) } }}
          style={{ opacity: date >= today ? 0.2 : 1 }}>
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="person-tabs">
        {PERSONEN.map(p => (
          <button key={p} className={`person-tab ${person === p ? `active ${slug(p)}` : ''}`}
            onClick={() => setPerson(p)}>{p}</button>
        ))}
      </div>

      {saved && <div className="empty-state small" style={{ color: 'var(--niedrig)' }}>✓ Gespeichert</div>}

      <EintragForm
        key={`${person}-${date}`}
        person={person}
        date={date}
        initial={entryFor(person, date)}
        onSave={() => setSaved(true)}
      />

      <div className="tb-week-title">Letzte 7 Tage</div>
      <div className="card tb-week-grid">
        {weeks.map(d => {
          const e1 = entryFor(PERSONEN[0], d)
          const e2 = entryFor(PERSONEN[1], d)
          const label = d === today ? 'Heute' : new Date(d + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' })
          return (
            <div key={d} className={`tb-week-day ${d === date ? 'tb-day-active' : ''}`} onClick={() => setDate(d)}>
              <span className="tb-day-label">{label}</span>
              <span>{e1.stimmung ? MOOD_LABELS[e1.stimmung].split(' ')[0] : '·'}</span>
              <span>{e2.stimmung ? MOOD_LABELS[e2.stimmung].split(' ')[0] : '·'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
