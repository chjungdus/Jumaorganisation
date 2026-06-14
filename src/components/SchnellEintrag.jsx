import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { X, Search, ChevronUp, ChevronDown, Star, Check, Camera } from 'lucide-react'
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
  const [mode, setMode] = useState('suche') // 'suche' | 'manuell'
  const [query, setQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState(null)
  const [menge, setMenge] = useState(100)
  const [mahlzeit, setMahlzeit] = useState('')
  const [manForm, setManForm] = useState({ kcal: '', protein: '', carbs: '', fat: '' })
  const [alsVorlage, setAlsVorlage] = useState(false)
  const [vorlageName, setVorlageName] = useState('')
  const [vorlagen, setVorlagen] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [fotoFile, setFotoFile] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState(null)
  const inputRef = useRef(null)
  const fotoInputRef = useRef(null)
  const dropdownTimerRef = useRef(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'vorlagen'), snap =>
      setVorlagen(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [])

  function handleFotoSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
    setAnalyzeError(null)
  }

  async function resizeToBase64(file, maxDim = 1024) {
    return new Promise(resolve => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1])
      }
      img.src = url
    })
  }

  async function handleAnalyze() {
    if (!fotoFile) return
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const base64 = await resizeToBase64(fotoFile)
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: 'image/jpeg' }),
      })
      const data = await res.json()
      if (data.error) {
        setAnalyzeError(data.error)
      } else {
        setManForm({
          kcal:    String(data.kcal    || ''),
          protein: String(data.protein || ''),
          carbs:   String(data.carbs   || ''),
          fat:     String(data.fat     || ''),
        })
        if (data.beschreibung) setMahlzeit(data.beschreibung)
        setMode('manuell')
      }
    } catch {
      setAnalyzeError('Verbindungsfehler — bitte nochmal versuchen')
    }
    setAnalyzing(false)
  }

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

  const macros = mode === 'manuell'
    ? {
        kcal:    parseInt(manForm.kcal)    || 0,
        protein: parseInt(manForm.protein) || 0,
        carbs:   parseInt(manForm.carbs)   || 0,
        fat:     parseInt(manForm.fat)     || 0,
      }
    : selectedFood ? {
        kcal:    Math.round(selectedFood.kcalPer100    * menge / 100),
        protein: Math.round(selectedFood.proteinPer100 * menge / 100),
        carbs:   Math.round(selectedFood.carbsPer100   * menge / 100),
        fat:     Math.round(selectedFood.fatPer100     * menge / 100),
      } : null

  const canSave = macros && (macros.kcal > 0 || macros.protein > 0 || macros.carbs > 0 || macros.fat > 0)

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
    await addDoc(collection(db, 'makros'), {
      person,
      meal: mahlzeit.trim() || selectedFood?.name || '',
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
    } catch (err) {
      console.error('Fehler beim Speichern:', err)
    }
    setSaving(false)
    onClose()
  }

  return (
    <div className="schnell-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="schnell-sheet">
        <div className="schnell-handle" />

        <div className="schnell-header">
          <h3>Schnell eintragen</h3>
          <button className="btn-icon-sm" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="schnell-scrollable">
        {/* Person */}
        <div className="person-select" style={{ marginBottom: 14 }}>
          {PERSONEN.map(p => (
            <button key={p} type="button"
              className={`person-btn ${person === p ? `active chip-${slug(p)}` : ''}`}
              onClick={() => setPerson(p)}>{p}</button>
          ))}
        </div>

        {/* Mode Tabs */}
        <div className="schnell-tabs">
          <button className={`schnell-tab ${mode === 'suche' ? 'active' : ''}`} onClick={() => setMode('suche')}>
            <Search size={13} /> Suchen
          </button>
          <button className={`schnell-tab ${mode === 'foto' ? 'active' : ''}`} onClick={() => setMode('foto')}>
            <Camera size={13} /> Foto
          </button>
          <button className={`schnell-tab ${mode === 'manuell' ? 'active' : ''}`} onClick={() => setMode('manuell')}>
            ✏️ Manuell
          </button>
        </div>

        {/* Manuelle Eingabe */}
        {mode === 'manuell' && (
          <>
            <label style={{ marginBottom: 10 }}>
              Mahlzeit / Beschreibung
              <input
                autoFocus
                value={mahlzeit}
                onChange={e => setMahlzeit(e.target.value)}
                placeholder="z.B. Hähnchen mit Reis"
              />
            </label>
            <div className="row">
              <label>Kalorien (kcal)
                <input type="number" min="0" value={manForm.kcal}
                  onChange={e => setManForm(f => ({ ...f, kcal: e.target.value }))}
                  placeholder="z.B. 500" />
              </label>
              <label>Protein (g)
                <input type="number" min="0" value={manForm.protein}
                  onChange={e => setManForm(f => ({ ...f, protein: e.target.value }))}
                  placeholder="z.B. 40" />
              </label>
            </div>
            <div className="row">
              <label>Kohlenhydrate (g)
                <input type="number" min="0" value={manForm.carbs}
                  onChange={e => setManForm(f => ({ ...f, carbs: e.target.value }))}
                  placeholder="z.B. 60" />
              </label>
              <label>Fett (g)
                <input type="number" min="0" value={manForm.fat}
                  onChange={e => setManForm(f => ({ ...f, fat: e.target.value }))}
                  placeholder="z.B. 15" />
              </label>
            </div>
            {canSave && (
              <div className="schnell-food-card" style={{ marginTop: 4 }}>
                <div className="schnell-macro-preview">
                  {[
                    { val: macros.kcal,         lbl: 'kcal',      color: 'var(--primary)' },
                    { val: `${macros.protein}g`, lbl: 'Protein',   color: 'var(--mateo)'   },
                    { val: `${macros.carbs}g`,   lbl: 'Kohlenhydr.', color: '#f59e0b'      },
                    { val: `${macros.fat}g`,     lbl: 'Fett',      color: '#a78bfa'        },
                  ].map(({ val, lbl, color }) => (
                    <div key={lbl} className="schnell-macro-item">
                      <span className="schnell-macro-val" style={{ color }}>{val}</span>
                      <span className="schnell-macro-lbl">{lbl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Foto-Modus */}
        {mode === 'foto' && (
          <div className="foto-mode">
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFotoSelect}
            />
            {!fotoPreview ? (
              <button className="foto-upload-btn" onClick={() => fotoInputRef.current?.click()}>
                <Camera size={36} />
                <span>Foto aufnehmen oder auswählen</span>
                <span className="foto-hint">Kamera oder Galerie</span>
              </button>
            ) : (
              <div className="foto-preview-wrap">
                <img src={fotoPreview} className="foto-preview" alt="Essen" />
                <button className="foto-change-btn" onClick={() => fotoInputRef.current?.click()}>
                  Anderes Foto
                </button>
              </div>
            )}
            {analyzeError && (
              <div className="foto-error">{analyzeError}</div>
            )}
            {fotoPreview && !analyzing && (
              <button className="btn-primary foto-analyze-btn" onClick={handleAnalyze}>
                ✨ Makros mit Claude erkennen
              </button>
            )}
            {analyzing && (
              <div className="foto-analyzing">
                <span className="foto-spinner" />
                Claude analysiert dein Essen…
              </div>
            )}
          </div>
        )}

        {/* Suchfeld (nur im Such-Modus) */}
        {mode === 'suche' && <div className="schnell-search-wrap">
          <Search size={15} className="schnell-search-icon" />
          <input
            ref={inputRef}
            className="schnell-search"
            value={query}
            autoFocus
            placeholder="Lebensmittel suchen…"
            onChange={e => {
              if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current)
              setQuery(e.target.value)
              setShowDropdown(true)
              if (!e.target.value) setSelectedFood(null)
            }}
            onFocus={() => {
              if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current)
              setShowDropdown(true)
            }}
            onBlur={() => {
              dropdownTimerRef.current = setTimeout(() => setShowDropdown(false), 250)
            }}
          />
          {query && (
            <button className="schnell-clear" onClick={clearFood}><X size={14} /></button>
          )}
        </div>}

        {/* Dropdown + Schnellauswahl (nur im Such-Modus) */}
        {mode === 'suche' && (<>
        {showDropdown && filteredFoods.length > 0 && (
          <div className="schnell-dropdown">
            {filteredFoods.map((food, i) => (
              <button key={i} className="schnell-dropdown-item" onClick={() => selectFood(food)}>
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
        </>)}{/* end mode === 'suche' */}

        </div>{/* end schnell-scrollable */}
        <div className="schnell-actions">
          <button className="btn-secondary" onClick={onClose}>Abbrechen</button>
          <button className="btn-primary" onClick={handleSave} disabled={!canSave || saving}>
            {saving ? 'Wird gespeichert…' : 'Eintragen'}
          </button>
        </div>
      </div>
    </div>
  )
}
