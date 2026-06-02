import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { apiUrl, API_HEADERS } from '../../utils/api.js'
import { C, MONO, SANS, Logo, Icon, Btn, Card, Kicker, H } from '../lhctrl-kit.jsx'

export default function JoinTeamScreen({ onSuccess, onBack }) {
  const { setCollaborator } = useApp()
  const [form, setForm] = useState({ code: '', nom: '', email: '', role: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [codeFocused, setCodeFocused] = useState(false)

  // Formater le code en AAAA-BBB ou AAAA-BBBB (supporte les deux formats)
  const formatCode = (val) => {
    const cleaned = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8)
    if (cleaned.length > 4) {
      return cleaned.slice(0, 4) + '-' + cleaned.slice(4)
    }
    return cleaned
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/join'), {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          nom: form.nom || null,
          email: form.email || null,
          role: form.role || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Code invalide')
      setCollaborator({ ...data.collaborator, teamName: data.team })
      onSuccess()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Bypass dev : pas besoin de backend
  function handleDevBypass() {
    setCollaborator({ id: 'dev-collab', nom: 'Dev Apprenant', teamName: 'Équipe Dev' })
    onSuccess()
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, color: C.ink, fontFamily: SANS, position: "relative" }}>
      {/* Retour */}
      <button
        onClick={onBack}
        style={{ position: "absolute", top: 24, left: 24, background: "none", border: "none", color: C.inkSoft, fontFamily: MONO, fontSize: 12.5, cursor: "pointer" }}
      >
        ← Retour
      </button>

      {/* Logo */}
      <div style={{ position: "absolute", top: 24, right: 24 }}>
        <Logo size={20} word={true} />
      </div>

      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Carré icône */}
        <div style={{ width: 64, height: 64, borderRadius: 16, background: C.cyan, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
          <Icon name="users" size={30} color={C.night} />
        </div>

        <Kicker color={C.signal}>Espace apprenant</Kicker>
        <H size={30} style={{ marginTop: 12, textAlign: "center" }}>Rejoignez votre équipe</H>
        
        <div style={{ color: C.inkSoft, fontSize: 14.5, marginTop: 10, maxWidth: 420, textAlign: "center", lineHeight: 1.4 }}>
          Saisissez le code d'accès fourni par votre référent RH pour démarrer votre parcours.
        </div>

        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", marginTop: 24 }}>
          
          {/* Saisie code monospace à cases */}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, position: "relative", cursor: "pointer", padding: "10px 0" }}>
            <input
              id="hidden-code-input"
              type="text"
              maxLength={9}
              value={form.code}
              onFocus={() => setCodeFocused(true)}
              onBlur={() => setCodeFocused(false)}
              onChange={(e) => {
                const formatted = formatCode(e.target.value)
                setForm({ ...form, code: formatted })
              }}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%", zIndex: 10, caretColor: "transparent" }}
            />
            {Array.from({ length: 9 }).map((_, i) => {
              if (i === 4) {
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", fontFamily: MONO, fontSize: 28, color: C.inkMute }}>—</div>
                )
              }
              const char = form.code[i] || ''
              const activeIndex = form.code.length === 4 ? 5 : form.code.length
              const isActive = codeFocused && activeIndex === i
              const isFilled = char !== ''

              return (
                <div
                  key={i}
                  style={{
                    width: 54,
                    height: 64,
                    borderRadius: 11,
                    border: `1.5px solid ${isActive ? C.signal : isFilled ? C.signal : C.border}`,
                    background: C.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: MONO,
                    fontWeight: 700,
                    fontSize: 28,
                    color: C.ink,
                    boxShadow: isActive ? `0 0 0 3px ${C.signalSoft}` : "none",
                    transform: isActive ? "scale(1.05)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  {char}
                </div>
              )
            })}
          </div>

          {error && (
            <p style={{ color: C.bad, fontSize: 12, fontFamily: MONO, textAlign: "center", marginTop: 18 }}>{error}</p>
          )}

          <div style={{ marginTop: 30, width: 300 }}>
            <button
              type="submit"
              disabled={loading || form.code.length < 7}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%", opacity: (loading || form.code.length < 7) ? 0.5 : 1 }}
            >
              <Btn kind="primary" size="lg" icon="arrowR" full>
                {loading ? 'Vérification...' : "Rejoindre l'équipe"}
              </Btn>
            </button>
          </div>
        </form>

        <div style={{ fontSize: 12.5, color: C.inkMute, marginTop: 18 }}>
          Pas de code ? <span style={{ color: C.signal, fontWeight: 600, cursor: "pointer" }}>Contactez votre RH</span>
        </div>

        {import.meta.env.DEV && (
          <button
            onClick={handleDevBypass}
            style={{ width: "100%", marginTop: 24, padding: "8px 12px", borderRadius: 9, border: `1.5px dashed ${C.warn}`, background: "none", color: C.warn, fontFamily: MONO, fontSize: 11, cursor: "pointer", transition: "all 0.2s" }}
          >
            ⚡ Bypass Dev (sans backend)
          </button>
        )}
      </div>
    </div>
  )
}

