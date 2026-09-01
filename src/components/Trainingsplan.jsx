import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, X, Trash2, Edit2, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { PERSONEN, slug } from '../constants'

const WOCHENPLAN = [
  {
    tag: 'Montag', emoji: '💪', fokus: 'Rücken',
    exercises: [
      { name: 'Klimmzüge', sets: 4, reps: '6–8' },
      { name: 'Latzug (Untergriff)', sets: 3, reps: '12' },
      { name: 'Kabelrudern', sets: 3, reps: '12' },
      { name: 'Face Pulls', sets: 3, reps: '15' },
      { name: 'Bizeps Curls', sets: 3, reps: '12' },
    ],
  },
  {
    tag: 'Dienstag', emoji: '🏋️', fokus: 'Schultern',
    exercises: [
      { name: 'Schulterdrücken (Kurzhantel)', sets: 4, reps: '10' },
      { name: 'Seitheben', sets: 4, reps: '15' },
      { name: 'Vorgebeugtes Seitheben', sets: 3, reps: '12' },
      { name: 'Arnold Press', sets: 3, reps: '10' },
      { name: 'Shrugs', sets: 3, reps: '15' },
    ],
  },
  {
    tag: 'Mittwoch', emoji: '😴', fokus: 'Ruhetag',
    exercises: [],
    rest: true,
  },
  {
    tag: 'Donnerstag', emoji: '💪', fokus: 'Arme',
    exercises: [
      { name: 'Bizeps Curls (Langhantel)', sets: 4, reps: '10' },
      { name: 'Hammer Curls', sets: 3, reps: '12' },
      { name: 'Trizeps Dips', sets: 3, reps: '12' },
      { name: 'Seildrücken (Trizeps)', sets: 3, reps: '15' },
      { name: 'Skull Crushers', sets: 3, reps: '12' },
    ],
  },
  {
    tag: 'Freitag', emoji: '🏋️', fokus: 'Rücken + Schultern',
    exercises: [
      { name: 'Klimmzüge', sets: 3, reps: 'max' },
      { name: 'Einarm-Kurzhantelrudern', sets: 3, reps: '12' },
      { name: 'Seitheben', sets: 4, reps: '15' },
      { name: 'Face Pulls', sets: 3, reps: '15' },
      { name: 'Reverse Flyes', sets: 3, reps: '12' },
    ],
  },
  {
    tag: 'Samstag', emoji: '🦵', fokus: 'Beine + Waden',
    exercises: [
      { name: 'Kniebeugen', sets: 4, reps: '10' },
      { name: 'Beinpresse', sets: 3, reps: '12' },
      { name: 'Ausfallschritte', sets: 3, reps: '10/Seite' },
      { name: 'Wadenheben stehend', sets: 5, reps: '20' },
      { name: 'Wadenheben sitzend', sets: 4, reps: '20' },
    ],
  },
  {
    tag: 'Sonntag', emoji: '😴', fokus: 'Ruhetag',
    exercises: [],
    rest: true,
  },
]

const VORLAGEN = [
  { name: 'Push Day',  exercises: ['Bankdrücken', 'Schulterdrücken', 'Trizeps-Dips', 'Fliegende', 'Seitheben'] },
  { name: 'Pull Day',  exercises: ['Klimmzüge', 'Rudern', 'Bizeps-Curls', 'Latzug', 'Face Pulls'] },
  { name: 'Leg Day',   exercises: ['Kniebeugen', 'Beinpresse', 'Ausfallschritte', 'Beinstrecker', 'Wadenheben'] },
  { name: 'Core',      exercises: ['Plank', 'Crunches', 'Russian Twists', 'Beinheben', 'Mountainclimber'] },
  { name: 'Ganzkörper', exercises: ['Burpees', 'Kniebeugen', 'Liegestütze', 'Klimmzüge', 'Plank'] },
]

function pad(n) { return String(n).padStart(2, '0') }
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function fmtDate(str) {
  const d = new Date(str + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
}

function ExerciseInput({ exercises, onChange }) {
  function update(i, field, val) {
    const updated = exercises.map((ex, idx) => idx === i ? { ...ex, [field]: val } : ex)
    onChange(updated)
  }
  function add() { onChange([...exercises, { name: '', sets: '3', reps: '10', weight: '' }]) }
  function remove(i) { onChange(exercises.filter((_, idx) => idx !== i)) }

  return (
    <div className="exercise-list">
      {exercises.map((ex, i) => (
        <div key={i} className="exercise-row">
          <input className="ex-name" value={ex.name}
            onChange={e => update(i, 'name', e.target.value)} placeholder="Übung" />
          <input className="ex-num" type="number" min="1" value={ex.sets}
            onChange={e => update(i, 'sets', e.target.value)} placeholder="Sätze" />
          <span className="ex-sep">×</span>
          <input className="ex-num" type="number" min="1" value={ex.reps}
            onChange={e => update(i, 'reps', e.target.value)} placeholder="Wdh." />
          <input className="ex-weight" value={ex.weight}
            onChange={e => update(i, 'weight', e.target.value)} placeholder="kg" />
          <button type="button" className="btn-icon-sm" onClick={() => remove(i)}><X size={14} /></button>
        </div>
      ))}
      <button type="button" className="btn-add-exercise" onClick={add}>+ Übung hinzufügen</button>
    </div>
  )
}

function WorkoutCard({ workout, onDelete, onToggleDone, onEdit, onToggleExercise }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <div className={`card workout-card ${workout.done ? 'workout-done' : ''}`}>
      <div className="workout-header" onClick={() => setExpanded(v => !v)}>
        <div className="workout-header-left">
          <button className={`checkbox ${workout.done ? 'checked' : ''}`}
            onClick={e => { e.stopPropagation(); onToggleDone(workout.id, workout.done) }}>
            {workout.done && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20,6 9,17 4,12" /></svg>}
          </button>
          <div>
            <div className="workout-name">{workout.name}</div>
            <div className="workout-meta">
              <span className={`person-chip chip-${slug(workout.person)}`}>{workout.person}</span>
              <span className="workout-date">{fmtDate(workout.date)}</span>
              {workout.duration && <span className="workout-duration">{workout.duration} min</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="btn-edit" onClick={e => { e.stopPropagation(); onEdit(workout) }}><Edit2 size={14} /></button>
          {confirmDelete ? (
            <div className="delete-confirm" onClick={e => e.stopPropagation()}>
              <span className="delete-confirm-text">Löschen?</span>
              <button className="btn-confirm-yes" onClick={e => { e.stopPropagation(); onDelete(workout.id) }}>Ja</button>
              <button className="btn-confirm-no" onClick={e => { e.stopPropagation(); setConfirmDelete(false) }}>Nein</button>
            </div>
          ) : (
            <button className="btn-delete" onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}><Trash2 size={14} /></button>
          )}
          {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </div>
      </div>
      {expanded && workout.exercises?.length > 0 && (
        <div className="workout-exercises">
          {workout.exercises.map((ex, i) => (
            <div key={i} className="workout-exercise-row">
              <button
                className={`checkbox ${ex.done ? 'checked' : ''}`}
                onClick={() => onToggleExercise(workout.id, i, workout.exercises)}
              >
                {ex.done && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20,6 9,17 4,12" /></svg>}
              </button>
              <span className={`workout-ex-name${ex.done ? ' workout-ex-done' : ''}`}>{ex.name || '—'}</span>
              <span className="workout-ex-info">{ex.sets}×{ex.reps}{ex.weight ? ` · ${ex.weight}kg` : ''}</span>
            </div>
          ))}
          {workout.notes && <p className="workout-notes">{workout.notes}</p>}
        </div>
      )}
    </div>
  )
}

const EMPTY_FORM = {
  person: PERSONEN[0], name: '', date: todayStr(), duration: '',
  exercises: [{ name: '', sets: '3', reps: '10', weight: '' }], notes: ''
}

export default function Trainingsplan() {
  const [workouts, setWorkouts] = useState([])
  const [view, setView] = useState('heute')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    const q = query(collection(db, 'training'), orderBy('date', 'desc'))
    const unsub = onSnapshot(q, snap =>
      setWorkouts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [])

  const today = todayStr()
  const todayWorkouts = workouts.filter(w => w.date === today)
  const pastWorkouts = workouts.filter(w => w.date < today)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    const data = {
      person: form.person,
      name: form.name.trim(),
      date: form.date,
      duration: parseInt(form.duration) || null,
      exercises: form.exercises.filter(ex => ex.name.trim()),
      notes: form.notes.trim(),
    }
    if (editingId) {
      await updateDoc(doc(db, 'training', editingId), data)
      setEditingId(null)
    } else {
      await addDoc(collection(db, 'training'), { ...data, done: false, createdAt: serverTimestamp() })
    }
    setForm(EMPTY_FORM); setShowForm(false)
  }

  async function handleDelete(id) { await deleteDoc(doc(db, 'training', id)) }

  async function toggleDone(id, done) {
    await updateDoc(doc(db, 'training', id), { done: !done })
  }

  async function toggleExercise(workoutId, exerciseIndex, exercises) {
    const updated = exercises.map((ex, i) =>
      i === exerciseIndex ? { ...ex, done: !ex.done } : ex
    )
    await updateDoc(doc(db, 'training', workoutId), { exercises: updated })
  }

  function startEdit(w) {
    setEditingId(w.id)
    setForm({
      person: w.person, name: w.name, date: w.date,
      duration: w.duration ? String(w.duration) : '',
      exercises: w.exercises?.length ? w.exercises : [{ name: '', sets: '3', reps: '10', weight: '' }],
      notes: w.notes || '',
    })
    setShowForm(true)
  }

  function applyVorlage(v) {
    setForm(f => ({
      ...f, name: v.name,
      exercises: v.exercises.map(name => ({ name, sets: '3', reps: '10', weight: '' }))
    }))
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Training</h1>
        <button className="btn-icon" onClick={() => { setShowForm(v => !v); setEditingId(null); setForm(EMPTY_FORM) }}>
          {showForm ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>

      <div className="view-toggle">
        <button className={`view-toggle-btn ${view === 'heute' ? 'active' : ''}`} onClick={() => setView('heute')}>Heute</button>
        <button className={`view-toggle-btn ${view === 'wochenplan' ? 'active' : ''}`} onClick={() => setView('wochenplan')}>📅 Wochenplan</button>
        <button className={`view-toggle-btn ${view === 'historie' ? 'active' : ''}`} onClick={() => setView('historie')}>Historie</button>
        <button className={`view-toggle-btn ${view === 'vorlagen' ? 'active' : ''}`} onClick={() => setView('vorlagen')}>Vorlagen</button>
      </div>

      {showForm && (
        <div className="card form-card">
          <div className="form-header">
            <h3>{editingId ? 'Workout bearbeiten' : 'Workout eintragen'}</h3>
            <button className="btn-icon-sm" onClick={() => { setShowForm(false); setEditingId(null) }}><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <label>Person
              <div className="person-select">
                {PERSONEN.map(p => (
                  <button key={p} type="button"
                    className={`person-btn ${form.person === p ? `active chip-${slug(p)}` : ''}`}
                    onClick={() => setForm(f => ({ ...f, person: p }))}>{p}</button>
                ))}
              </div>
            </label>
            <label>Workout-Name<input autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="z.B. Push Day, Beine…" required /></label>
            <div className="row">
              <label>Datum<input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></label>
              <label>Dauer (min)<input type="number" min="1" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="60" /></label>
            </div>
            <label>Übungen</label>
            <ExerciseInput exercises={form.exercises} onChange={exs => setForm(f => ({ ...f, exercises: exs }))} />
            <label>Notizen<textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Wie lief das Training?" /></label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null) }}>Abbrechen</button>
              <button type="submit" className="btn-primary">{editingId ? 'Speichern' : 'Eintragen'}</button>
            </div>
          </form>
        </div>
      )}

      {view === 'heute' && (
        <>
          {todayWorkouts.length === 0 && (
            <div className="empty-state small">Noch kein Workout heute — auf + drücken oder eine Vorlage wählen</div>
          )}
          {todayWorkouts.map(w => (
            <WorkoutCard key={w.id} workout={w} onDelete={handleDelete} onToggleDone={toggleDone} onEdit={startEdit} onToggleExercise={toggleExercise} />
          ))}
        </>
      )}

      {view === 'historie' && (
        <>
          {pastWorkouts.length === 0 && <div className="empty-state">Noch keine vergangenen Workouts.</div>}
          {pastWorkouts.map(w => (
            <WorkoutCard key={w.id} workout={w} onDelete={handleDelete} onToggleDone={toggleDone} onEdit={startEdit} onToggleExercise={toggleExercise} />
          ))}
        </>
      )}

      {view === 'wochenplan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="ep-day-title" style={{ marginBottom: 4 }}>
            <span className="person-chip chip-mateo" style={{ fontSize: 13 }}>Mateo</span>
            <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Fokus: Schultern · Rücken · Waden · Arme</span>
          </div>
          {WOCHENPLAN.map(({ tag, emoji, fokus, exercises, rest }) => (
            <div key={tag} className={`card workout-card${rest ? ' workout-done' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: rest ? 0 : 10 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{emoji} {tag}</span>
                  <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-secondary)' }}>{fokus}</span>
                </div>
                {!rest && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{exercises.length} Übungen</span>}
              </div>
              {!rest && (
                <div className="workout-exercises" style={{ paddingTop: 0 }}>
                  {exercises.map((ex, i) => (
                    <div key={i} className="workout-exercise-row">
                      <span className="workout-ex-name">{ex.name}</span>
                      <span className="workout-ex-info">{ex.sets}×{ex.reps}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {view === 'vorlagen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {VORLAGEN.map(v => (
            <div key={v.name} className="card vorlage-card"
              onClick={() => { applyVorlage(v); setShowForm(true); setView('heute') }}>
              <div className="vorlage-name">{v.name}</div>
              <div className="vorlage-exercises">{v.exercises.join(' · ')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
