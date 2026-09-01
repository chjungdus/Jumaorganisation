import { useState, useEffect } from 'react'
import { collection, onSnapshot, setDoc, doc } from 'firebase/firestore'
import { db } from './firebase'
import { PERSONEN, slug } from './constants'

export const GOAL_DEFAULTS = {
  'Mateo':    { kcal: 3300, protein: 130, carbs: 392, fat: 112 },
  'Zhuo Jun': { kcal: 2200, protein: 105, carbs: 245, fat: 70 },
  'Julius':   { kcal: 2400, protein: 110, carbs: 260, fat: 75 },
}

export function useGoals() {
  const [goals, setGoals] = useState(GOAL_DEFAULTS)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'ziele'), snap => {
      setGoals(() => {
        const next = { ...GOAL_DEFAULTS }
        snap.docs.forEach(d => {
          const person = PERSONEN.find(p => slug(p) === d.id)
          if (person) next[person] = { ...GOAL_DEFAULTS[person], ...d.data() }
        })
        return next
      })
    })
    return unsub
  }, [])

  async function updateGoals(person, newGoals) {
    await setDoc(doc(db, 'ziele', slug(person)), {
      kcal:    Number(newGoals.kcal)    || 0,
      protein: Number(newGoals.protein) || 0,
      carbs:   Number(newGoals.carbs)   || 0,
      fat:     Number(newGoals.fat)     || 0,
    })
  }

  return { goals, updateGoals }
}
