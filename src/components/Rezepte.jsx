import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, X, Trash2, Edit2, ChevronDown, ChevronUp, Clock, Users } from 'lucide-react'
import { PERSONEN, slug } from '../constants'

const TAG_OPTIONS = ['Muskelaufbau', 'Schnell', 'Proteinreich', 'Vegetarisch', 'Frühstück', 'Meal Prep']

const PRESET_REZEPTE = [
  {
    title: 'Hähnchen mit Reis & Brokkoli',
    person: 'Beide', time: 30, servings: 2, protein: 48, kcal: 520,
    tags: ['Muskelaufbau', 'Proteinreich', 'Meal Prep'],
    ingredients: ['300g Hähnchenbrustfilet', '150g Langkornreis (roh)', '200g Brokkoli', '1 EL Olivenöl', 'Salz, Pfeffer, Paprikapulver'],
    steps: ['Reis nach Packungsanleitung kochen.', 'Hähnchen in Streifen schneiden, mit Gewürzen marinieren.', 'Öl erhitzen, Hähnchen 6–8 Min. anbraten.', 'Brokkoli 5 Min. blanchieren.', 'Alles zusammen servieren.'],
  },
  {
    title: 'Proteinshake mit Haferflocken',
    person: 'Beide', time: 5, servings: 1, protein: 35, kcal: 450,
    tags: ['Muskelaufbau', 'Proteinreich', 'Frühstück', 'Schnell'],
    ingredients: ['1 Portion Proteinpulver (Vanille)', '60g Haferflocken', '300ml Vollmilch', '1 Banane', '1 EL Erdnussbutter'],
    steps: ['Alle Zutaten in einen Mixer geben.', '30 Sekunden mixen.', 'Sofort trinken.'],
  },
  {
    title: 'Rührei mit Avocado & Vollkorntoast',
    person: 'Beide', time: 10, servings: 1, protein: 28, kcal: 480,
    tags: ['Proteinreich', 'Frühstück', 'Schnell'],
    ingredients: ['4 Eier', '1 Avocado', '2 Scheiben Vollkorntoast', 'Salz, Pfeffer', 'Etwas Butter'],
    steps: ['Eier verquirlen, salzen und pfeffern.', 'Butter in Pfanne erhitzen, Eier bei niedriger Hitze stocken lassen.', 'Avocado in Scheiben schneiden.', 'Toast toasten und mit Rührei und Avocado belegen.'],
  },
  {
    title: 'Thunfisch-Pasta',
    person: 'Beide', time: 20, servings: 2, protein: 42, kcal: 580,
    tags: ['Muskelaufbau', 'Proteinreich', 'Schnell'],
    ingredients: ['200g Pasta', '2 Dosen Thunfisch (in Wasser)', '1 Dose gehackte Tomaten', '1 Zwiebel', '2 Knoblauchzehen', 'Olivenöl, Salz, Pfeffer, Basilikum'],
    steps: ['Pasta kochen.', 'Zwiebel und Knoblauch in Öl anbraten.', 'Tomaten dazugeben, 5 Min. köcheln.', 'Abgetropften Thunfisch einrühren.', 'Mit Pasta vermengen und abschmecken.'],
  },
  {
    title: 'Lachs mit Süßkartoffel',
    person: 'Beide', time: 35, servings: 2, protein: 44, kcal: 560,
    tags: ['Muskelaufbau', 'Proteinreich'],
    ingredients: ['2 Lachsfilets (à 150g)', '400g Süßkartoffeln', '1 Zitrone', '1 EL Olivenöl', 'Salz, Pfeffer, Knoblauchpulver'],
    steps: ['Süßkartoffeln würfeln, bei 200°C 25 Min. backen.', 'Lachs mit Öl, Zitronensaft und Gewürzen marinieren.', 'Lachs in Pfanne je 4 Min. pro Seite braten.', 'Mit Süßkartoffeln servieren.'],
  },
  {
    title: 'Griechisches Joghurt mit Granola',
    person: 'Beide', time: 5, servings: 1, protein: 22, kcal: 350,
    tags: ['Frühstück', 'Proteinreich', 'Schnell', 'Vegetarisch'],
    ingredients: ['250g Griechisches Joghurt (10%)', '40g Granola', '100g gemischte Beeren', '1 EL Honig'],
    steps: ['Joghurt in eine Schüssel geben.', 'Mit Granola und Beeren toppen.', 'Mit Honig beträufeln.'],
  },
  {
    title: 'Quark mit Früchten & Nüssen',
    person: 'Beide', time: 5, servings: 1, protein: 26, kcal: 380,
    tags: ['Frühstück', 'Proteinreich', 'Schnell', 'Vegetarisch'],
    ingredients: ['250g Magerquark', '100g gemischte Früchte', '30g Walnüsse', '1 EL Honig', '1 TL Zimt'],
    steps: ['Quark in eine Schüssel geben.', 'Früchte darüber verteilen.', 'Mit Nüssen, Honig und Zimt garnieren.'],
  },
]

const EMPTY_FORM = {
  title: '', person: 'Beide', time: '', servings: '',
  protein: '', kcal: '',
  ingredients: [''],
  steps: [''],
  tags: [],
}

function ListEditor({ label, items, placeholder, onChange }) {
  function update(i, val) { onChange(items.map((v, idx) => idx === i ? val : v)) }
  function add() { onChange([...items, '']) }
  function remove(i) { const next = items.filter((_, idx) => idx !== i); onChange(next.length ? next : ['']) }
  return (
    <div>
      <div className="tb-label" style={{ marginBottom: 6 }}>{label}</div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input value={item} onChange={e => update(i, e.target.value)}
            placeholder={`${placeholder} ${i + 1}`}
            style={{ flex: 1, border: '1px solid var(--border-bright)', borderRadius: 8, padding: '7px 10px', fontSize: 14, fontFamily: 'inherit', color: 'var(--text)', background: 'var(--bg2)', outline: 'none' }} />
          <button type="button" className="btn-icon-sm" onClick={() => remove(i)}><X size={14} /></button>
        </div>
      ))}
      <button type="button" className="btn-add-exercise" onClick={add}>+ {label} hinzufügen</button>
    </div>
  )
}

function RecipeCard({ recipe, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="card recipe-card">
      <div className="recipe-header" onClick={() => setExpanded(v => !v)}>
        <div className="recipe-header-left">
          <div className="recipe-title">{recipe.title}</div>
          <div className="recipe-meta">
            {recipe.person !== 'Beide' && (
              <span className={`person-chip chip-${slug(recipe.person)}`}>{recipe.person}</span>
            )}
            {recipe.time && <span className="recipe-badge"><Clock size={10} /> {recipe.time} min</span>}
            {recipe.servings && <span className="recipe-badge"><Users size={10} /> {recipe.servings}</span>}
            {recipe.protein && <span className="recipe-badge">{recipe.protein}g P</span>}
            {recipe.kcal && <span className="recipe-badge">{recipe.kcal} kcal</span>}
          </div>
          {recipe.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
              {recipe.tags.map(t => <span key={t} className="recipe-tag">{t}</span>)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <button className="btn-edit" onClick={e => { e.stopPropagation(); onEdit(recipe) }}><Edit2 size={14} /></button>
          {confirmDelete ? (
            <div className="delete-confirm" onClick={e => e.stopPropagation()}>
              <span className="delete-confirm-text">Löschen?</span>
              <button className="btn-confirm-yes" onClick={e => { e.stopPropagation(); onDelete(recipe.id) }}>Ja</button>
              <button className="btn-confirm-no" onClick={e => { e.stopPropagation(); setConfirmDelete(false) }}>Nein</button>
            </div>
          ) : (
            <button className="btn-delete" onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}><Trash2 size={14} /></button>
          )}
          {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </div>
      </div>
      {expanded && (
        <div className="recipe-body">
          {recipe.ingredients?.filter(Boolean).length > 0 && (
            <div className="recipe-section">
              <div className="tb-label">Zutaten</div>
              <ul className="recipe-list">
                {recipe.ingredients.filter(Boolean).map((ing, i) => <li key={i}>{ing}</li>)}
              </ul>
            </div>
          )}
          {recipe.steps?.filter(Boolean).length > 0 && (
            <div className="recipe-section">
              <div className="tb-label">Zubereitung</div>
              <ol className="recipe-list recipe-steps">
                {recipe.steps.filter(Boolean).map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PresetRecipeCard({ recipe, onAdd }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="card recipe-card">
      <div className="recipe-header" onClick={() => setExpanded(v => !v)}>
        <div className="recipe-header-left">
          <div className="recipe-title">{recipe.title}</div>
          <div className="recipe-meta">
            {recipe.time && <span className="recipe-badge"><Clock size={10} /> {recipe.time} min</span>}
            {recipe.servings && <span className="recipe-badge"><Users size={10} /> {recipe.servings} Port.</span>}
            {recipe.protein && <span className="recipe-badge">{recipe.protein}g P</span>}
            {recipe.kcal && <span className="recipe-badge">{recipe.kcal} kcal</span>}
          </div>
          {recipe.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
              {recipe.tags.map(t => <span key={t} className="recipe-tag">{t}</span>)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </div>
      </div>
      {expanded && (
        <div className="recipe-body">
          {recipe.ingredients?.length > 0 && (
            <div className="recipe-section">
              <div className="tb-label">Zutaten</div>
              <ul className="recipe-list">
                {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
              </ul>
            </div>
          )}
          {recipe.steps?.length > 0 && (
            <div className="recipe-section">
              <div className="tb-label">Zubereitung</div>
              <ol className="recipe-list recipe-steps">
                {recipe.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          )}
          <button className="btn-primary" style={{ width: '100%' }} onClick={e => { e.stopPropagation(); onAdd() }}>
            + Zu meinen Rezepten hinzufügen
          </button>
        </div>
      )}
    </div>
  )
}

export default function Rezepte() {
  const [recipes, setRecipes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filter, setFilter] = useState('Alle')
  const [view, setView] = useState('meine')

  useEffect(() => {
    const q = query(collection(db, 'rezepte'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap =>
      setRecipes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [])

  const FILTERS = ['Alle', ...PERSONEN]
  const filtered = recipes.filter(r =>
    filter === 'Alle' || r.person === filter || r.person === 'Beide'
  )

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    const data = {
      title: form.title.trim(),
      person: form.person,
      time: parseInt(form.time) || null,
      servings: parseInt(form.servings) || null,
      protein: parseInt(form.protein) || null,
      kcal: parseInt(form.kcal) || null,
      ingredients: form.ingredients.filter(Boolean),
      steps: form.steps.filter(Boolean),
      tags: form.tags,
    }
    if (editingId) {
      await updateDoc(doc(db, 'rezepte', editingId), data)
      setEditingId(null)
    } else {
      await addDoc(collection(db, 'rezepte'), { ...data, createdAt: serverTimestamp() })
    }
    setForm(EMPTY_FORM); setShowForm(false)
  }

  async function handleDelete(id) { await deleteDoc(doc(db, 'rezepte', id)) }

  function startEdit(r) {
    setEditingId(r.id)
    setForm({
      title: r.title, person: r.person,
      time: r.time ? String(r.time) : '',
      servings: r.servings ? String(r.servings) : '',
      protein: r.protein ? String(r.protein) : '',
      kcal: r.kcal ? String(r.kcal) : '',
      ingredients: r.ingredients?.length ? r.ingredients : [''],
      steps: r.steps?.length ? r.steps : [''],
      tags: r.tags || [],
    })
    setShowForm(true)
  }

  function toggleTag(t) {
    setForm(f => ({
      ...f, tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t]
    }))
  }

  async function savePreset(r) {
    await addDoc(collection(db, 'rezepte'), { ...r, createdAt: serverTimestamp() })
    setView('meine')
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Rezepte</h1>
        <button className="btn-icon" onClick={() => { setShowForm(v => !v); setEditingId(null); setForm(EMPTY_FORM); setView('meine') }}>
          {showForm ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>

      <div className="view-toggle">
        <button className={`view-toggle-btn ${view === 'meine' ? 'active' : ''}`} onClick={() => { setView('meine'); setShowForm(false) }}>Meine</button>
        <button className={`view-toggle-btn ${view === 'vorlagen' ? 'active' : ''}`} onClick={() => { setView('vorlagen'); setShowForm(false) }}>Vorlagen</button>
      </div>

      {view === 'meine' && (
        <div className="filter-tabs">
          {FILTERS.map(f => (
            <button key={f}
              className={['filter-tab', filter === f ? 'active' : '', filter === f && f !== 'Alle' ? `${slug(f)}-tab` : ''].filter(Boolean).join(' ')}
              onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      )}

      {showForm && (
        <div className="card form-card">
          <div className="form-header">
            <h3>{editingId ? 'Rezept bearbeiten' : 'Neues Rezept'}</h3>
            <button className="btn-icon-sm" onClick={() => { setShowForm(false); setEditingId(null) }}><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <label>Rezeptname<input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="z.B. Hähnchen mit Reis" required /></label>
            <label>Person
              <div className="person-select">
                {[...PERSONEN, 'Beide'].map(p => (
                  <button key={p} type="button"
                    className={`person-btn ${form.person === p ? `active chip-${slug(p)}` : ''}`}
                    onClick={() => setForm(f => ({ ...f, person: p }))}>{p}</button>
                ))}
              </div>
            </label>
            <div className="row">
              <label>Zeit (min)<input type="number" min="1" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} placeholder="25" /></label>
              <label>Portionen<input type="number" min="1" value={form.servings} onChange={e => setForm(f => ({ ...f, servings: e.target.value }))} placeholder="2" /></label>
            </div>
            <div className="row">
              <label>Protein (g)<input type="number" min="0" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} placeholder="40" /></label>
              <label>Kalorien<input type="number" min="0" value={form.kcal} onChange={e => setForm(f => ({ ...f, kcal: e.target.value }))} placeholder="500" /></label>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div className="tb-label" style={{ marginBottom: 8 }}>Tags</div>
              <div className="meal-chips">
                {TAG_OPTIONS.map(t => (
                  <button key={t} type="button"
                    className={`meal-chip ${form.tags.includes(t) ? 'active' : ''}`}
                    onClick={() => toggleTag(t)}>{t}</button>
                ))}
              </div>
            </div>
            <ListEditor label="Zutaten" items={form.ingredients} placeholder="Zutat"
              onChange={v => setForm(f => ({ ...f, ingredients: v }))} />
            <div style={{ marginTop: 14 }}>
              <ListEditor label="Zubereitungsschritte" items={form.steps} placeholder="Schritt"
                onChange={v => setForm(f => ({ ...f, steps: v }))} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null) }}>Abbrechen</button>
              <button type="submit" className="btn-primary">{editingId ? 'Speichern' : 'Hinzufügen'}</button>
            </div>
          </form>
        </div>
      )}

      {view === 'meine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 && (
            <div className="empty-state">Noch keine Rezepte.<br />Auf + drücken oder Vorlagen nutzen.</div>
          )}
          {filtered.map(r => (
            <RecipeCard key={r.id} recipe={r} onDelete={handleDelete} onEdit={startEdit} />
          ))}
        </div>
      )}

      {view === 'vorlagen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PRESET_REZEPTE.map((r, i) => (
            <PresetRecipeCard key={i} recipe={r} onAdd={() => savePreset(r)} />
          ))}
        </div>
      )}
    </div>
  )
}
