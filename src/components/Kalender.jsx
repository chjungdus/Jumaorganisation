import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Edit2, RefreshCw } from 'lucide-react'
import { PERSONEN, slug } from '../constants'

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const BETRIFFT = [...PERSONEN, 'Beide']
const REPEAT_OPTIONS = ['keine', 'täglich', 'wöchentlich', 'monatlich', 'jährlich']
const REPEAT_LABEL = { keine: 'Keine', täglich: 'Täglich', wöchentlich: 'Wöchentl.', monatlich: 'Monatl.', jährlich: 'Jährlich' }
const EMPTY_FORM = { title: '', time: '', person: 'Beide', repeat: 'keine' }
const PRIORITY_LABEL = { hoch: 'Hoch', mittel: 'Mittel', niedrig: 'Niedrig' }

function pad(n) { return String(n).padStart(2, '0') }

function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d }
function fmtDate(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }

function getEaster(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

function getFeiertage(year) {
  const e = getEaster(year)
  const entries = [
    [`${year}-01-01`, 'Neujahr'],
    [`${year}-05-01`, 'Tag der Arbeit'],
    [`${year}-10-03`, 'Tag der Dt. Einheit'],
    [`${year}-12-25`, '1. Weihnachtstag'],
    [`${year}-12-26`, '2. Weihnachtstag'],
    [fmtDate(addDays(e, -2)), 'Karfreitag'],
    [fmtDate(e), 'Ostersonntag'],
    [fmtDate(addDays(e, 1)), 'Ostermontag'],
    [fmtDate(addDays(e, 39)), 'Christi Himmelfahrt'],
    [fmtDate(addDays(e, 49)), 'Pfingstsonntag'],
    [fmtDate(addDays(e, 50)), 'Pfingstmontag'],
  ]
  return Object.fromEntries(entries)
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7
  const days = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
  return days
}

function eventOccursOnDay(event, dateStr) {
  const repeat = event.repeat || 'keine'
  if (repeat === 'keine') return event.date === dateStr
  if (dateStr < event.date) return false
  if (repeat === 'täglich') return true
  const orig = new Date(event.date + 'T00:00:00')
  const target = new Date(dateStr + 'T00:00:00')
  if (repeat === 'wöchentlich') return orig.getDay() === target.getDay()
  if (repeat === 'monatlich') return orig.getDate() === target.getDate()
  if (repeat === 'jährlich') return orig.getMonth() === target.getMonth() && orig.getDate() === target.getDate()
  return false
}

export default function Kalender() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [events, setEvents] = useState([])
  const [todos, setTodos] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [makros, setMakros] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'kalender'), orderBy('date', 'asc'))
    const unsub = onSnapshot(q, snap => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'todos'), snap =>
      setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'training'), snap =>
      setWorkouts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'makros'), snap =>
      setMakros(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [])

  const feiertage = { ...getFeiertage(year - 1), ...getFeiertage(year), ...getFeiertage(year + 1) }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
    setSelectedDay(null)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  function dateStr(day) { return `${year}-${pad(month + 1)}-${pad(day)}` }

  function eventsForDay(day) {
    const ds = dateStr(day)
    return events.filter(e => eventOccursOnDay(e, ds))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  }

  function todosForDay(day) {
    return todos.filter(t => t.dueDate === dateStr(day))
      .sort((a, b) => ({ hoch: 0, mittel: 1, niedrig: 2 }[a.priority] - { hoch: 0, mittel: 1, niedrig: 2 }[b.priority]))
  }

  function workoutsForDay(day) {
    return workouts.filter(w => w.date === dateStr(day))
  }

  function macroTotalsForDay(day, person) {
    const entries = makros.filter(m => m.date === dateStr(day) && m.person === person)
    return {
      kcal: entries.reduce((s, m) => s + (m.kcal || 0), 0),
      protein: entries.reduce((s, m) => s + (m.protein || 0), 0),
    }
  }

  function openAddForm() {
    setEditingId(null); setForm(EMPTY_FORM); setShowForm(true)
  }

  function openEditForm(ev) {
    setEditingId(ev.id)
    setForm({ title: ev.title, time: ev.time || '', person: ev.person, repeat: ev.repeat || 'keine' })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    if (editingId) {
      await updateDoc(doc(db, 'kalender', editingId), {
        title: form.title.trim(), time: form.time, person: form.person, repeat: form.repeat,
      })
    } else {
      if (!selectedDay) return
      await addDoc(collection(db, 'kalender'), {
        title: form.title.trim(), date: dateStr(selectedDay),
        time: form.time, person: form.person, repeat: form.repeat,
        createdAt: serverTimestamp(),
      })
    }
    setForm(EMPTY_FORM); setShowForm(false); setEditingId(null)
  }

  async function handleDeleteEvent(id) { await deleteDoc(doc(db, 'kalender', id)) }

  async function toggleTodoDone(id, done) {
    await updateDoc(doc(db, 'todos', id), { done: !done, doneAt: !done ? serverTimestamp() : null })
  }

  const calDays = getCalendarDays(year, month)
  const isThisMonth = month === now.getMonth() && year === now.getFullYear()
  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : []
  const selectedTodos = selectedDay ? todosForDay(selectedDay) : []
  const selectedWorkouts = selectedDay ? workoutsForDay(selectedDay) : []
  const selectedFeiertag = selectedDay ? feiertage[dateStr(selectedDay)] : null

  return (
    <div className="page">
      <div className="page-header">
        <h1>Kalender</h1>
        {selectedDay && (
          <button className="btn-icon" onClick={openAddForm}><Plus size={22} /></button>
        )}
      </div>

      <div className="month-nav card">
        <button className="btn-icon-sm" onClick={prevMonth}><ChevronLeft size={22} /></button>
        <span className="month-title">{MONATE[month]} {year}</span>
        <button className="btn-icon-sm" onClick={nextMonth}><ChevronRight size={22} /></button>
      </div>

      <div className="calendar-grid card">
        {WOCHENTAGE.map(d => <div key={d} className="cal-weekday">{d}</div>)}
        {calDays.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />
          const ds = dateStr(day)
          const dayEvs = eventsForDay(day)
          const dayTodos = todosForDay(day).filter(t => !t.done)
          const isFeiertag = !!feiertage[ds]
          const isToday = isThisMonth && day === now.getDate()
          const isSelected = selectedDay === day
          return (
            <div key={day}
              className={['cal-day', isToday ? 'today' : '', isSelected && !isToday ? 'selected' : '', isFeiertag ? 'feiertag' : ''].filter(Boolean).join(' ')}
              onClick={() => setSelectedDay(day === selectedDay ? null : day)}>
              <span>{day}</span>
              <div className="event-dots">
                {isFeiertag && <span className="dot dot-feiertag" />}
                {dayEvs.slice(0, 1).map((ev, idx) => (
                  <span key={`e${idx}`} className={`dot dot-${slug(ev.person)}`} />
                ))}
                {dayTodos.slice(0, 1).map((t, idx) => (
                  <span key={`t${idx}`} className={`dot dot-todo-${t.priority}`} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {selectedDay && (selectedFeiertag || selectedEvents.length > 0 || selectedTodos.length > 0) && (
        <div className="day-events">
          <div className="day-events-header">{selectedDay}. {MONATE[month]} {year}</div>

          {selectedFeiertag && (
            <div className="feiertag-banner card">🎉 {selectedFeiertag}</div>
          )}

          {selectedEvents.length > 0 && (
            <>
              {selectedTodos.length > 0 && <div className="day-section-title">Ereignisse</div>}
              {selectedEvents.map(ev => (
                <div key={ev.id} className={`event-item card person-border-${slug(ev.person)}`}>
                  <div className="event-info">
                    <span className={`person-chip chip-${slug(ev.person)}`}>{ev.person}</span>
                    <strong>{ev.title}</strong>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {ev.time && <span className="event-time">{ev.time} Uhr</span>}
                      {ev.repeat && ev.repeat !== 'keine' && (
                        <span className="repeat-badge"><RefreshCw size={10} /> {ev.repeat}</span>
                      )}
                    </div>
                  </div>
                  <button className="btn-edit" onClick={() => openEditForm(ev)}><Edit2 size={15} /></button>
                  {confirmDeleteId === ev.id ? (
                    <div className="delete-confirm">
                      <span className="delete-confirm-text">Löschen?</span>
                      <button className="btn-confirm-yes" onClick={() => { setConfirmDeleteId(null); handleDeleteEvent(ev.id) }}>Ja</button>
                      <button className="btn-confirm-no" onClick={() => setConfirmDeleteId(null)}>Nein</button>
                    </div>
                  ) : (
                    <button className="btn-delete" onClick={() => setConfirmDeleteId(ev.id)}><Trash2 size={15} /></button>
                  )}
                </div>
              ))}
            </>
          )}

          {selectedTodos.length > 0 && (
            <>
              <div className="day-section-title">Fällige Aufgaben</div>
              {selectedTodos.map(todo => (
                <div key={todo.id} className={`todo-event-item card priority-border-${todo.priority} ${todo.done ? 'done-item' : ''}`}>
                  <button className={`checkbox ${todo.done ? 'checked' : ''}`} onClick={() => toggleTodoDone(todo.id, todo.done)}>
                    {todo.done && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20,6 9,17 4,12" /></svg>}
                  </button>
                  <div className="todo-content">
                    <span className="todo-title">{todo.title}</span>
                    <div className="todo-meta">
                      <span className={`person-chip chip-${slug(todo.person)}`}>{todo.person}</span>
                      <span className={`priority-badge priority-${todo.priority}`}>{PRIORITY_LABEL[todo.priority]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {selectedWorkouts.length > 0 && (
            <>
              <div className="day-section-title">Training</div>
              {selectedWorkouts.map(w => (
                <div key={w.id} className={`card event-item person-border-${slug(w.person)}`}>
                  <div className="event-info">
                    <span className={`person-chip chip-${slug(w.person)}`}>{w.person}</span>
                    <strong>{w.name}</strong>
                    {w.duration && <span className="event-time">{w.duration} min</span>}
                  </div>
                  <span className={`dash-pill ${w.done ? 'pill-green' : 'pill-muted'}`} style={{ flexShrink: 0 }}>
                    {w.done ? '✓' : 'Offen'}
                  </span>
                </div>
              ))}
            </>
          )}

          {(() => {
            const macroRows = PERSONEN.map(p => ({ p, t: macroTotalsForDay(selectedDay, p) })).filter(x => x.t.kcal > 0)
            if (!macroRows.length) return null
            return (
              <>
                <div className="day-section-title">Makros</div>
                <div className="card" style={{ padding: '10px 14px', display: 'flex', gap: 12 }}>
                  {macroRows.map(({ p, t }) => (
                    <div key={p} style={{ flex: 1 }}>
                      <div className={`comp-name ${slug(p)}`} style={{ fontSize: 12, marginBottom: 4 }}>{p}</div>
                      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{t.kcal} kcal · {t.protein}g P</div>
                    </div>
                  ))}
                </div>
              </>
            )
          })()}
        </div>
      )}

      {selectedDay && !selectedFeiertag && selectedEvents.length === 0 && selectedTodos.length === 0 && (
        <div className="empty-state small">Keine Ereignisse – auf + drücken um hinzuzufügen</div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditingId(null) }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Ereignis bearbeiten' : `Ereignis – ${selectedDay}. ${MONATE[month]}`}</h3>
              <button className="btn-icon-sm" onClick={() => { setShowForm(false); setEditingId(null) }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <label>Titel<input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ereignistitel" required /></label>
              <label>Uhrzeit (optional)<input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} /></label>
              <label>Betrifft
                <div className="person-select">
                  {BETRIFFT.map(p => (
                    <button key={p} type="button"
                      className={`person-btn ${form.person === p ? `active chip-${slug(p)}` : ''}`}
                      onClick={() => setForm(f => ({ ...f, person: p }))}>{p}</button>
                  ))}
                </div>
              </label>
              <label>Wiederholen
                <div className="repeat-select">
                  {REPEAT_OPTIONS.map(r => (
                    <button key={r} type="button"
                      className={`repeat-btn ${form.repeat === r ? 'active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, repeat: r }))}>{REPEAT_LABEL[r]}</button>
                  ))}
                </div>
              </label>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null) }}>Abbrechen</button>
                <button type="submit" className="btn-primary">{editingId ? 'Speichern' : 'Hinzufügen'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
