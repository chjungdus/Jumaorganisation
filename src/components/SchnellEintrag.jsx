import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { X, Search, ChevronUp, ChevronDown, Star, Check } from 'lucide-react'
import { PERSONEN, slug } from '../constants'

function pad(n) { return String(n).padStart(2, '0') }
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const LEBENSMITTEL = [
  { name: 'Hähnchenbrust',         kcalPer100: 165, proteinPer100: 31,   carbsPer100: 0,    fatPer100: 3.6 },
  { name: 'Haferflocken',           kcalPer100: 375, proteinPer100: 13,   carbsPer100: 66,   fatPer100: 7   },
  { name: 'Reis (gekocht)',          kcalPer100: 130, proteinPer100: 2.7,  carbsPer100: 28,   fatPer100: 0.3 },
  { name: 'Ei (1 Stück = 60g)',     kcalPer100: 155, proteinPer100: 13,   carbsPer100: 1.1,  fatPer100: 11  },
  { name: 'Thunfisch (Dose)',       kcalPer100: 116, proteinPer100: 26,   carbsPer100: 0,    fatPer100: 1   },
  { name: 'Lachs',                  kcalPer100: 208, proteinPer100: 20,   carbsPer100: 0,    fatPer100: 13  },
  { name: 'Magerquark',             kcalPer100: 67,  proteinPer100: 12,   carbsPer100: 4,    fatPer100: 0.2 },
  { name: 'Griechischer Joghurt',   kcalPer100: 133, proteinPer100: 9,    carbsPer100: 6,    fatPer100: 8   },
  { name: 'Whey Protein',           kcalPer100: 380, proteinPer100: 75,   carbsPer100: 7,    fatPer100: 5   },
  { name: 'Banane',                 kcalPer100: 89,  proteinPer100: 1.1,  carbsPer100: 23,   fatPer100: 0.3 },
  { name: 'Süßkartoffel',           kcalPer100: 86,  proteinPer100: 1.6,  carbsPer100: 20,   fatPer100: 0.1 },
  { name: 'Brokkoli',               kcalPer100: 34,  proteinPer100: 2.8,  carbsPer100: 7,    fatPer100: 0.4 },
  { name: 'Avocado',                kcalPer100: 160, proteinPer100: 2,    carbsPer100: 9,    fatPer100: 15  },
  { name: 'Mandeln',                kcalPer100: 579, proteinPer100: 21,   carbsPer100: 22,   fatPer100: 50  },
  { name: 'Vollmilch',              kcalPer100: 61,  proteinPer100: 3.2,  carbsPer100: 4.8,  fatPer100: 3.3 },
  { name: 'Vollkornbrot',           kcalPer100: 247, proteinPer100: 8,    carbsPer100: 41,   fatPer100: 3.5 },
  { name: 'Nudeln (gekocht)',        kcalPer100: 158, proteinPer100: 5.8,  carbsPer100: 31,   fatPer100: 0.9 },
  { name: 'Kartoffeln (gekocht)',    kcalPer100: 77,  proteinPer100: 2,    carbsPer100: 17,   fatPer100: 0.1 },
  { name: 'Rindfleisch (mager)',     kcalPer100: 179, proteinPer100: 26,   carbsPer100: 0,    fatPer100: 8   },
  { name: 'Cottage Cheese',         kcalPer100: 98,  proteinPer100: 11,   carbsPer100: 3.4,  fatPer100: 4.3 },
  { name: 'Erdnussbutter',          kcalPer100: 588, proteinPer100: 25,   carbsPer100: 20,   fatPer100: 50  },
  { name: 'Schwarzbrot',            kcalPer100: 209, proteinPer100: 7.7,  carbsPer100: 38,   fatPer100: 1.4 },
  { name: 'Linsen (gekocht)',        kcalPer100: 116, proteinPer100: 9,    carbsPer100: 20,   fatPer100: 0.4 },
  { name: 'Kichererbsen (gekocht)', kcalPer100: 164, proteinPer100: 8.9,  carbsPer100: 27,   fatPer100: 2.6 },
  { name: 'Hüttenkäse',             kcalPer100: 98,  proteinPer100: 11,   carbsPer100: 3.4,  fatPer100: 4.3 },
]

export default function SchnellEintrag({ defaultPerson, onClose }) {
  const [person, setPerson] = useState(defaultPerson || PERSONEN[0])
  const [query, setQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState(null)
  const [menge, setMenge] = useState(100)
  const [mahlzeit, setMahlzeit] = useState('')
  const [alsVorlage, setAlsVorlage] = useState(false)
  const [vorlageName, setVorlageName] = useState('')
  const [vorlagen, setVorlagen] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'vorlagen'), snap =>
      setVorlagen(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [])

  const allFoods = [
    ...vorlagen.map(v => ({ ...v, isVorlage: true })),
    ...LEBENSMITTEL,
  ]

  const filteredFoods = query.length >= 1
    ? allFoods.filter(f => f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 7)
    : []

  function selectFood(food) {
    setSelectedFood(food)
    setQuery(food.name)
    setMahlzeit(food.name)
    setMenge(food.standardMenge || 100)
    setShowDropdown(false)
  }

  function clearFood() {
    setSelectedFood(null)
    setQuery('')
    setMahlzeit('')
    inputRef.current?.focus()
  }

  const macros = selectedFood ? {
    kcal:    Math.round(selectedFood.kcalPer100    * menge / 100),
    protein: Math.round(selectedFood.proteinPer100 * menge / 100),
    carbs:   Math.round(selectedFood.carbsPer100   * menge / 100),
    fat:     Math.round(selectedFood.fatPer100     * menge / 100),
  } : null

  const canSave = macros && (macros.kcal > 0 || macros.protein > 0)

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    await addDoc(collection(db, 'makros'), {
      person,
      meal: mahlzeit.trim() || selectedFood.name,
      kcal:    macros.kcal,
      protein: macros.protein,
      carbs:   macros.carbs,
      fat:     macros.fat,
      date: todayStr(),
      createdAt: serverTimestamp(),
    })
    if (alsVorlage && selectedFood) {
      const name = vorlageName.trim() || selectedFood.name
      if (!vorlagen.some(v => v.name.toLowerCase() === name.toLowerCase())) {
        await addDoc(collection(db, 'vorlagen'), {
          name,
          kcalPer100:    selectedFood.kcalPer100,
          proteinPer100: selectedFood.proteinPer100,
          carbsPer100:   selectedFood.carbsPer100,
          fatPer100:     selectedFood.fatPer100,
          standardMenge: menge,
          createdAt:     serverTimestamp(),
        })
      }
    }
    setSaving(false)
    onClose()
  }

  return (
    <div className="schnell-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="schnell-sheet">
        <div className="schnell-handle" />

        <div className="schnell-header">
          <h3>Schnell eintragen</h3>
          <button className="btn-icon-sm" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Person */}
        <div className="person-select" style={{ marginBottom: 14 }}>
          {PERSONEN.map(p => (
            <button key={p} type="button"
              className={`person-btn ${person === p ? `active chip-${slug(p)}` : ''}`}
              onClick={() => setPerson(p)}>{p}</button>
          ))}
        </div>

        {/* Suchfeld */}
        <div className="schnell-search-wrap">
          <Search size={15} className="schnell-search-icon" />
          <input
            ref={inputRef}
            className="schnell-search"
            value={query}
            autoFocus
            placeholder="Lebensmittel suchen…"
            onChange={e => {
              setQuery(e.target.value)
              setShowDropdown(true)
              if (!e.target.value) setSelectedFood(null)
            }}
            onFocus={() => setShowDropdown(true)}
          />
          {query && (
            <button className="schnell-clear" onClick={clearFood}><X size={14} /></button>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && filteredFoods.length > 0 && (
          <div className="schnell-dropdown">
            {filteredFoods.map((food, i) => (
              <button key={i} className="schnell-dropdown-item" onMouseDown={() => selectFood(food)}>
                <span className="schnell-food-name">
                  {food.isVorlage && <Star size={10} style={{ marginRight: 4, color: 'var(--mittel)', verticalAlign: 'middle' }} />}
                  {food.name}
                </span>
                <span className="schnell-food-meta">{food.kcalPer100} kcal/100g</span>
              </button>
            ))}
          </div>
        )}

        {/* Schnellauswahl (gespeicherte Vorlagen) */}
        {vorlagen.length > 0 && !selectedFood && (
          <div style={{ marginBottom: 14 }}>
            <div className="schnell-section-label">Schnellauswahl</div>
            <div className="schnell-quickpicks">
              {vorlagen.slice(0, 8).map((v, i) => (
                <button key={i} className="schnell-quickpick" onClick={() => selectFood(v)}>
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ausgewähltes Lebensmittel + Menge */}
        {selectedFood && macros && (
          <>
            <div className="schnell-food-card">
              <div className="schnell-food-title">{selectedFood.name}</div>

              <div className="schnell-menge-row">
                <button className="schnell-menge-btn" onClick={() => setMenge(m => Math.max(10, m - 10))}>
                  <ChevronDown size={16} />
                </button>
                <div className="schnell-menge-input-wrap">
                  <input
                    type="number"
                    className="schnell-menge-input"
                    value={menge}
                    min={10}
                    max={2000}
                    onChange={e => setMenge(Math.max(10, parseInt(e.target.value) || 100))}
                  />
                  <span className="schnell-menge-unit">g</span>
                </div>
                <button className="schnell-menge-btn" onClick={() => setMenge(m => m + 10)}>
                  <ChevronUp size={16} />
                </button>
              </div>

              <div className="schnell-macro-preview">
                {[
                  { val: macros.kcal,    lbl: 'kcal',     color: 'var(--primary)' },
                  { val: `${macros.protein}g`, lbl: 'Protein',  color: 'var(--mateo)'   },
                  { val: `${macros.carbs}g`,   lbl: 'Kohlenhydr.', color: '#f59e0b'    },
                  { val: `${macros.fat}g`,     lbl: 'Fett',     color: '#a78bfa'        },
                ].map(({ val, lbl, color }) => (
                  <div key={lbl} className="schnell-macro-item">
                    <span className="schnell-macro-val" style={{ color }}>{val}</span>
                    <span className="schnell-macro-lbl">{lbl}</span>
                  </div>
                ))}
              </div>
            </div>

            <label style={{ marginBottom: 10 }}>
              Bezeichnung (optional)
              <input
                value={mahlzeit}
                onChange={e => setMahlzeit(e.target.value)}
                placeholder={selectedFood.name}
              />
            </label>

            <button
              className={`schnell-vorlage-toggle ${alsVorlage ? 'active' : ''}`}
              onClick={() => { setAlsVorlage(v => !v); setVorlageName(selectedFood.name) }}>
              <Star size={13} />
              Als Vorlage speichern
              {alsVorlage && <Check size={13} style={{ marginLeft: 'auto' }} />}
            </button>

            {alsVorlage && (
              <input
                value={vorlageName}
                onChange={e => setVorlageName(e.target.value)}
                placeholder="Vorlagenname…"
                style={{ marginTop: 8 }}
              />
            )}
          </>
        )}

        <div className="form-actions" style={{ marginTop: 18 }}>
          <button className="btn-secondary" onClick={onClose}>Abbrechen</button>
          <button className="btn-primary" onClick={handleSave} disabled={!canSave || saving}>
            {saving ? 'Wird gespeichert…' : 'Eintragen'}
          </button>
        </div>
      </div>
    </div>
  )
}
