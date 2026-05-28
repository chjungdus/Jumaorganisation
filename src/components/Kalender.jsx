import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Edit2 } from 'lucide-react'
import { PERSONEN, slug } from '../constants'

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const BETRIFFT = [...PERSONEN, 'Beide']
const EMPTY_FORM = { title: '', time: '', person: 'Beide' }
const PRIORITY_LABEL = { hoch: 'Hoch', mittel: 'Mittel', niedrig: 'Niedrig' }

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7
  const days = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
  return days
}

function pad(n) { return String(n).padStart(2, '0') }

export default function Kalender() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [events, setEvents] = useState([])
  const [todos, setTodos] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

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
    return events.filter(e => e.date === dateStr(day))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  }

  function todosForDay(day) {
    return todos.filter(t => t.dueDate === dateStr(day))
      .sort((a, b) => ({ hoch: 0, mittel: 1, niedrig: 2 }[a.priority] - { hoch: 0, mittel: 1, niedrig: 2 }[b.priority]))
  }

  function openAddForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEditForm(ev) {
    setEditingId(ev.id)
    setForm({ title: ev.title, time: ev.time || '', person: ev.person })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    if (editingId) {
      await updateDoc(doc(db, 'kalender', editingId), {
        title: form.title.trim(), time: form.time, person: form.person,
      })
    } else {
      if (!selectedDay) return
      await addDoc(collection(db, 'kalender'), {
        title: form.title.trim(), date: dateStr(selectedDay),
        time: form.time, person: form.person, createdAt: serverTimestamp(),
      })
    }
    setForm(EMPTY_FORM)
    setShowForm(false)
    setEditingId(null)
  }

  async function handleDeleteEvent(id) {
    await deleteDoc(doc(db, 'kalender', id))
  }

  async function toggleTodoDone(id, done) {
    await updateDoc(doc(db, 'todos', id), { done: !done, doneAt: !done ? serverTimestamp() : null })
  }

  const calDays = getCalendarDays(year, month)
  const isThisMonth = month === now.getMonth() && year === now.getFullYear()
  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : []
  const selectedTodos = selectedDay ? todosForDay(selectedDay) : []

  return (
    <div className="page">
      <div className="page-header">
        <h1>Kalender</h1>
        {selectedDay && (
          <button className="btn-icon" onClick={openAddForm}>
            <Plus size={22} />
          </button>
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
          const dayEvs = eventsForDay(day)
          const dayTodos = todosForDay(day).filter(t => !t.done)
          const isToday = isThisMonth && day === now.getDate()
          const isSelected = selectedDay === day
          return (
            <div key={day}
              className={['cal-day', isToday ? 'today' : '', isSelected && !isToday ? 'selected' : ''].filter(Boolean).join(' ')}
              onClick={() => setSelectedDay(day === selectedDay ? null : day)}>
              <span>{day}</span>
              {(dayEvs.length > 0 || dayTodos.length > 0) && (
                <div className="event-dots">
                  {dayEvs.slice(0, 2).map((ev, idx) => (
                    <span key={`e${idx}`} className={`dot dot-${slug(ev.person)}`} />
                  ))}
                  {dayTodos.slice(0, 2).map((t, idx) => (
                    <span key={`t${idx}`} className={`dot dot-todo-${t.priority}`} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedDay && (selectedEvents.length > 0 || selectedTodos.length > 0) && (
        <div className="day-events">
          <div className="day-events-header">{selectedDay}. {MONATE[month]} {year}</div>

          {selectedEvents.length > 0 && (
            <>
              {selectedTodos.length > 0 && <div className="day-section-title">Ereignisse</div>}
              {selectedEvents.map(ev => (
                <div key={ev.id} className={`event-item card person-border-${slug(ev.person)}`}>
                  <div className="event-info">
                    <span className={`person-chip chip-${slug(ev.person)}`}>{ev.person}</span>
                    <strong>{ev.title}</strong>
                    {ev.time && <span className="event-time">{ev.time} Uhr</span>}
                  </div>
                  <button className="btn-edit" onClick={() => openEditForm(ev)}><Edit2 size={15} /></button>
                  <button className="btn-delete" onClick={() => handleDeleteEvent(ev.id)}><Trash2 size={15} /></button>
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
        </div>
      )}

      {selectedDay && selectedEvents.length === 0 && selectedTodos.length === 0 && (
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
