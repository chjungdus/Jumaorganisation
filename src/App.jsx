import { useState } from 'react'
import './App.css'
import Arbeitszeiten from './components/Arbeitszeiten'
import Kalender from './components/Kalender'
import TodoListe from './components/TodoListe'
import Notizen from './components/Notizen'
import Proteine from './components/Proteine'
import { Clock, Calendar, CheckSquare, FileText, Dumbbell } from 'lucide-react'

const TABS = [
  { id: 0, label: 'Arbeitszeiten', shortLabel: 'Zeiten', Icon: Clock, Component: Arbeitszeiten },
  { id: 1, label: 'Kalender', shortLabel: 'Kalender', Icon: Calendar, Component: Kalender },
  { id: 2, label: 'To-Do Liste', shortLabel: 'To-Do', Icon: CheckSquare, Component: TodoListe },
  { id: 3, label: 'Notizen', shortLabel: 'Notizen', Icon: FileText, Component: Notizen },
  { id: 4, label: 'Proteine', shortLabel: 'Protein', Icon: Dumbbell, Component: Proteine },
]

export default function App() {
  const [activeTab, setActiveTab] = useState(0)
  const { Component } = TABS[activeTab]

  return (
    <div className="app">
      <main className="main-content">
        <Component />
      </main>
      <nav className="bottom-nav">
        {TABS.map(({ id, shortLabel, Icon }) => (
          <button
            key={id}
            className={`nav-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 1.8} />
            <span>{shortLabel}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
