import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import { auth, googleProvider, ERLAUBTE_EMAILS } from './firebase'

const box = {
  minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center',
  fontFamily: 'system-ui, -apple-system, sans-serif',
}
const btn = {
  padding: '12px 20px', borderRadius: 10, border: 'none', background: '#5b5bd6',
  color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer',
}

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined)
  const [fehler, setFehler] = useState('')

  useEffect(() => onAuthStateChanged(auth, u => setUser(u)), [])

  const anmelden = async () => {
    setFehler('')
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, googleProvider)
      } else if (e.code !== 'auth/popup-closed-by-user') {
        setFehler('Anmeldung fehlgeschlagen. Bitte nochmal versuchen.')
      }
    }
  }

  if (user === undefined) return <div style={box}>Lädt…</div>

  if (!user) {
    return (
      <div style={box}>
        <div style={{ fontSize: 48 }}>📋</div>
        <h1 style={{ margin: 0, fontSize: 22 }}>Juma Organisation</h1>
        <p style={{ margin: 0, opacity: 0.7 }}>Bitte mit Google anmelden.</p>
        <button style={btn} onClick={anmelden}>Mit Google anmelden</button>
        {fehler && <p style={{ color: '#d33', margin: 0 }}>{fehler}</p>}
      </div>
    )
  }

  if (!ERLAUBTE_EMAILS.includes((user.email || '').toLowerCase())) {
    return (
      <div style={box}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Kein Zugriff</h1>
        <p style={{ margin: 0, opacity: 0.7 }}>{user.email} ist für diese App nicht freigeschaltet.</p>
        <button style={btn} onClick={() => signOut(auth)}>Abmelden</button>
      </div>
    )
  }

  return children
}
