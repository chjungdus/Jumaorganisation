import { useState } from 'react'
import { Info } from 'lucide-react'
import ExerciseDemo from './ExerciseDemo'
import { findExercise } from '../exerciseData'

// Anleitung mit animierter Grafik zu einer Übung
export function ExerciseGuide({ name }) {
  const info = findExercise(name)
  if (!info) return <p className="exd-none">Zu dieser Übung gibt es noch keine Anleitung.</p>
  return (
    <div className="exd-panel">
      <ExerciseDemo demo={info.demo} />
      <div className="exd-muscles"><span>Trainiert:</span> {info.muscles}</div>
      <h4>Einstellung</h4>
      <p>{info.setup}</p>
      <h4>Ausführung</h4>
      <ol>{info.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      <h4>Darauf achten</h4>
      <ul>{info.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
  )
}

// Button, der die Anleitung unter einer Übung auf- und zuklappt
export function GuideButton({ open, onClick }) {
  return (
    <button type="button" className={`exd-btn${open ? ' open' : ''}`}
      onClick={e => { e.stopPropagation(); onClick() }} aria-expanded={open}>
      <Info size={13} /> Anleitung
    </button>
  )
}

export function useGuide() {
  const [open, setOpen] = useState(false)
  return [open, () => setOpen(v => !v)]
}
