import { useState } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import Arbeitszeiten from './components/Arbeitszeiten'
import Kalender from './components/Kalender'
import TodoListe from './components/TodoListe'
import Notizen from './components/Notizen'
import Makros from './components/Makros'
import Trainingsplan from './components/Trainingsplan'
import Tagesbuch from './components/Tagesbuch'
import Rezepte from './components/Rezepte'
import Essensplan from './components/Essensplan'
import Erinnerungen from './components/Erinnerungen'
import {
  Home, Calendar, CheckSquare, Dumbbell, MoreHorizontal,
  Clock, FileText, Utensils, BookOpen, ChefHat, Bell, Apple,
} from 'lucide-react'

const MAIN_TABS = [
  { id: 'dashboard',  label: 'Start',    Icon: Home,        Component: Dashboard },
  { id: 'kalender',   label: 'Kalender', Icon: Calendar,    Component: Kalender },
  { id: 'todos',      label: 'To-Do',    Icon: CheckSquare, Component: TodoListe },
  { id: 'training',   label: 'Training', Icon: Dumbbell,    Component: Trainingsplan },
]

const MEHR_TABS = [
  { id: 'makros',        label: 'Makros',        Icon: Utensils,  Component: Makros },
  { id: 'tagesbuch',     label: 'Tagesbuch',     Icon: BookOpen,  Component: Tagesbuch },
  { id: 'rezepte',       label: 'Rezepte',       Icon: ChefHat,   Component: Rezepte },
  { id: 'essensplan',   label: 'Essensplan',    Icon: Apple,     Component: Essensplan },
  { id: 'notizen',       label: 'Notizen',       Icon: FileText,  Component: Notizen },
  { id: 'erinnerungen',  label: 'Erinnerungen',  Icon: Bell,      Component: Erinnerungen },
  { id: 'arbeitszeiten', label: 'Arbeitszeiten', Icon: Clock,     Component: Arbeitszeiten },
]

const ALL_TABS = [...MAIN_TABS, ...MEHR_TABS]

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showMehr, setShowMehr] = useState(false)

  const ActiveComponent = ALL_TABS.find(t => t.id === activeTab)?.Component ?? Dashboard
  const isInMehr = MEHR_TABS.some(t => t.id === activeTab)

  function navigate(id) {
    setActiveTab(id)
    setShowMehr(false)
  }

  return (
    <div className="app">
      <main className="main-content">
        <ActiveComponent />
      </main>

      <nav className="bottom-nav">
        {MAIN_TABS.map(({ id, label, Icon }) => (
          <button key={id}
            className={`nav-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => navigate(id)}>
            <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 1.8} />
            <span>{label}</span>
          </button>
        ))}
        <button
          className={`nav-item ${isInMehr || showMehr ? 'active' : ''}`}
          onClick={() => setShowMehr(v => !v)}>
          <MoreHorizontal size={22} strokeWidth={isInMehr || showMehr ? 2.5 : 1.8} />
          <span>Mehr</span>
        </button>
      </nav>

      {showMehr && (
        <div className="mehr-overlay" onClick={() => setShowMehr(false)}>
          <div className="mehr-sheet" onClick={e => e.stopPropagation()}>
            <div className="mehr-handle" />
            <div className="mehr-grid">
              {MEHR_TABS.map(({ id, label, Icon }) => (
                <button key={id}
                  className={`mehr-item ${activeTab === id ? 'active' : ''}`}
                  onClick={() => navigate(id)}>
                  <Icon size={24} strokeWidth={activeTab === id ? 2.5 : 1.8} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
