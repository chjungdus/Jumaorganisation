import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { PERSONEN, slug, WORK_GOALS } from '../constants'
import { useGoals } from '../useGoals'

function calcWorkHours(start, end) {
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

function pad(n) { return String(n).padStart(2, '0') }
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

export default function Dashboard() {
  const { goals } = useGoals()
  const today = todayStr()
  const [todos, setTodos] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [makros, setMakros] = useState([])
  const [tagesbuch, setTagesbuch] = useState({})
  const [arbeitszeiten, setArbeitszeiten] = useState([])

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'todos'), snap =>
      setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    const u2 = onSnapshot(collection(db, 'training'), snap =>
      setWorkouts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    const u3 = onSnapshot(collection(db, 'makros'), snap =>
      setMakros(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    const u4 = onSnapshot(collection(db, 'tagesbuch'), snap => {
      const data = {}
      snap.docs.forEach(d => { data[d.id] = d.data() })
      setTagesbuch(data)
    })
    const u5 = onSnapshot(collection(db, 'arbeitszeiten'), snap =>
      setArbeitszeiten(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return () => { u1(); u2(); u3(); u4(); u5() }
  }, [])

  const dateLabel = new Date().toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="page">
      <div className="page-header">
        <h1>Heute</h1>
        <span className="dash-date">{dateLabel}</span>
      </div>

      {PERSONEN.map(person => {
        const openTodos = todos.filter(t => !t.done && t.person === person)
        const todayWorkouts = workouts.filter(w => w.date === today && w.person === person)
        const todayMakros = makros.filter(m => m.date === today && m.person === person)
        const totalKcal = todayMakros.reduce((s, m) => s + (m.kcal || 0), 0)
        const totalProtein = todayMakros.reduce((s, m) => s + (m.protein || 0), 0)
        const personGoals = goals[person]
        const tb = tagesbuch[`${person}_${today}`]
        const hasDoneWorkout = todayWorkouts.some(w => w.done)
        const workGoal = WORK_GOALS[person]
        const dailyWorkGoal = workGoal ? workGoal.weekly / 7 : 0
        const todayWorkHours = arbeitszeiten
          .filter(e => e.person === person && e.date === today)
          .reduce((s, e) => s + (e.hours ?? calcWorkHours(e.startTime, e.endTime)), 0)
        const allEmpty = openTodos.length === 0 && totalKcal === 0 && todayWorkouts.length === 0 && !tb && !workGoal

        return (
          <div key={person} className={`card dash-card person-border-${slug(person)}`}>
            <div className="dash-person-header">
              <span className={`dash-person-name ${slug(person)}`}>{person}</span>
              {tb?.stimmung && <span className="dash-mood">{tb.stimmung}</span>}
            </div>

            <div className="dash-macro-grid">
              <div>
                <div className="dash-macro-label">Kalorien</div>
                <div className="dash-macro-val">
                  <strong>{totalKcal}</strong>
                  <span className="dash-macro-unit"> / {personGoals.kcal}</span>
                </div>
                <div className="dash-track">
                  <div className="dash-fill" style={{
                    width: `${Math.min(100, (totalKcal / personGoals.kcal) * 100)}%`,
                    background: `var(--${slug(person)})`,
                  }} />
                </div>
              </div>
              <div>
                <div className="dash-macro-label">Protein</div>
                <div className="dash-macro-val">
                  <strong>{totalProtein}g</strong>
                  <span className="dash-macro-unit"> / {personGoals.protein}g</span>
                </div>
                <div className="dash-track">
                  <div className="dash-fill" style={{
                    width: `${Math.min(100, (totalProtein / personGoals.protein) * 100)}%`,
                    background: `var(--${slug(person)})`,
                    opacity: 0.65,
                  }} />
                </div>
              </div>
            </div>

            {workGoal && (
              <div className="dash-work-section">
                <div className="dash-macro-label">Arbeit heute</div>
                <div className="dash-macro-val">
                  <strong>{fmtHours(todayWorkHours)}</strong>
                  <span className="dash-macro-unit"> / {fmtHours(dailyWorkGoal)}</span>
                </div>
                <div className="dash-track">
                  <div className="dash-fill" style={{
                    width: `${Math.min(100, dailyWorkGoal > 0 ? (todayWorkHours / dailyWorkGoal) * 100 : 0)}%`,
                    background: `var(--${slug(person)})`,
                    opacity: 0.55,
                  }} />
                </div>
              </div>
            )}

            <div className="dash-pills">
              <span className={`dash-pill ${hasDoneWorkout ? 'pill-green' : todayWorkouts.length > 0 ? 'pill-yellow' : 'pill-muted'}`}>
                {hasDoneWorkout ? '✓ Training' : todayWorkouts.length > 0 ? `${todayWorkouts.length}× offen` : 'Kein Training'}
              </span>
              {tb?.wasser > 0 && <span className="dash-pill pill-blue">{tb.wasser}× Wasser</span>}
              {tb?.schlaf > 0 && <span className="dash-pill pill-muted">{tb.schlaf}h Schlaf</span>}
            </div>

            {openTodos.length > 0 && (
              <div className="dash-todos">
                {openTodos.slice(0, 3).map(t => (
                  <div key={t.id} className="dash-todo-row">
                    <span className={`dash-todo-dot priority-dot-${t.priority}`} />
                    <span className="dash-todo-text">{t.title}</span>
                  </div>
                ))}
                {openTodos.length > 3 && (
                  <span className="dash-more">+{openTodos.length - 3} weitere Aufgaben</span>
                )}
              </div>
            )}

            {allEmpty && (
              <div className="dash-empty">Noch keine Einträge heute</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
