import { useState } from 'react'
import './App.css'
import Arbeitszeiten from './components/Arbeitszeiten'
import Kalender from './components/Kalender'
import TodoListe from './components/TodoListe'
import Notizen from './components/Notizen'
import Makros from './components/Makros'
import Trainingsplan from './components/Trainingsplan'
import Tagesbuch from './components/Tagesbuch'
import Rezepte from './components/Rezepte'
import { Clock, Calendar, CheckSquare, FileText, Utensils, Dumbbell, BookOpen, ChefHat } from 'lucide-react'

const TABS = [
  { id: 0, label: 'Arbeitszeiten', shortLabel: 'Zeiten', Icon: Clock, Component: Arbeitszeiten },
  { id: 1, label: 'Kalender', shortLabel: 'Kalender', Icon: Calendar, Component: Kalender },
  { id: 2, label: 'To-Do Liste', shortLabel: 'To-Do', Icon: CheckSquare, Component: TodoListe },
  { id: 3, label: 'Notizen', shortLabel: 'Notizen', Icon: FileText, Component: Notizen },
  { id: 4, label: 'Makros', shortLabel: 'Makros', Icon: Utensils, Component: Makros },
  { id: 5, label: 'Training', shortLabel: 'Training', Icon: Dumbbell, Component: Trainingsplan },
  { id: 6, label: 'Tagesbuch', shortLabel: 'Tagebuch', Icon: BookOpen, Component: Tagesbuch },
  { id: 7, label: 'Rezepte', shortLabel: 'Rezepte', Icon: ChefHat, Component: Rezepte },
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
