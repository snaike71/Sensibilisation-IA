import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { apiUrl, API_HEADERS } from '../../utils/api.js'
import { C, MONO, SANS, Logo, Icon, Btn, Kicker, H, WaveBg } from '../lhctrl-kit.jsx'

// étapes : 'code' | 'email' | 'profile'

export default function JoinTeamScreen({ onSuccess, onBack }) {
  const { setCollaborator } = useApp()
  const [step, setStep] = useState('code')
  const [code, setCode] = useState('')
  const [codeFocused, setCodeFocused] = useState(false)
  const [email, setEmail] = useState('')
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [role, setRole] = useState('')
  const [teamInfo, setTeamInfo] = useState(null) // { team, team_id, org_id, roles }
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const formatCode = (val) => {
    const cleaned = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7)
    return cleaned.length > 4 ? cleaned.slice(0, 4) + '-' + cleaned.slice(4) : cleaned
  }

  // Étape 1 : validation du format du code → passe à l'email
  function handleCodeSubmit(e) {
    e.preventDefault()
    setError(null)
    if (code.length < 7) return setError('Code incomplet.')
    setStep('email')
  }

  // Étape 2 : vérification email via /api/join/check
  async function handleEmailSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/join/check'), {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({ code: code.trim().toUpperCase(), email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Code invalide')

      if (data.found) {
        setCollaborator({ ...data.collaborator, teamName: data.team })
        onSuccess()
      } else {
        setTeamInfo({ team: data.team, team_id: data.team_id, org_id: data.org_id, roles: data.roles ?? [] })
        setStep('profile')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Étape 3 : création du collaborateur
  async function handleProfileSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/join'), {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          nom: `${prenom.trim()} ${nom.trim()}`.trim(),
          email: email.trim(),
          role: role || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création')
      setCollaborator({ ...data.collaborator, teamName: data.team })
      onSuccess()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleDevBypass() {
    setCollaborator({ id: 'dev-collab', nom: 'Dev Apprenant', teamName: 'Équipe Dev' })
    onSuccess()
  }

  return (
      <div style={{ minHeight: "100vh", backgroundColor: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, color: C.ink, fontFamily: SANS, position: "relative" }}>
        <WaveBg />
        {/* Retour */}
        <button
            onClick={step === 'code' ? onBack : () => { setStep(step === 'profile' ? 'email' : 'code'); setError(null) }}
            style={{ position: "absolute", top: 24, left: 24, background: "none", border: "none", color: C.inkSoft, fontFamily: MONO, fontSize: 12.5, cursor: "pointer", zIndex: 1 }}
        >
          ← Retour
        </button>

        <div style={{ position: "absolute", top: 24, right: 24, zIndex: 1 }}>
          <Logo size={20} word={true} />
        </div>

        <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: C.cyan, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
            <Icon name={step === 'profile' ? 'user' : 'users'} size={30} color={C.night} />
          </div>

          <Kicker color={C.signal}>Espace apprenant</Kicker>

          {/* ── Étape 1 : code ─────────────────────────── */}
          {step === 'code' && (
              <>
                <H size={30} style={{ marginTop: 12, textAlign: "center" }}>Rejoignez votre équipe</H>
                <div style={{ color: C.inkSoft, fontSize: 14.5, marginTop: 10, maxWidth: 380, textAlign: "center", lineHeight: 1.4 }}>
                  Saisissez le code d'accès fourni par votre référent RH.
                </div>
                <form onSubmit={handleCodeSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", marginTop: 28 }}>

                  {/* Card de saisie */}
                  <div style={{
                    background: "#fff",
                    border: `2px solid ${codeFocused ? C.signal : C.border}`,
                    borderRadius: 20,
                    padding: "28px 32px 22px",
                    boxShadow: codeFocused
                      ? `0 0 0 5px ${C.signalSoft}, 0 8px 32px rgba(0,0,0,0.08)`
                      : `0 4px 24px rgba(0,0,0,0.07)`,
                    transition: "box-shadow 0.25s, border-color 0.25s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
                  }}>
                    <div style={{ fontSize: 11.5, fontFamily: MONO, color: C.inkMute, letterSpacing: "0.12em", textTransform: "uppercase" }}>Code d'accès</div>

                    <div style={{ display: "flex", justifyContent: "center", gap: 8, position: "relative", cursor: "pointer", padding: "4px 0" }}>
                      <input
                          id="hidden-code-input"
                          type="text"
                          maxLength={8}
                          value={code}
                          onFocus={() => setCodeFocused(true)}
                          onBlur={() => setCodeFocused(false)}
                          onChange={(e) => setCode(formatCode(e.target.value))}
                          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%", zIndex: 10, caretColor: "transparent" }}
                      />
                      {Array.from({ length: 8 }).map((_, i) => {
                        if (i === 4) return (
                          <div key={i} style={{ display: "flex", alignItems: "center", fontFamily: MONO, fontSize: 24, color: C.inkMute, paddingBottom: 4 }}>·</div>
                        )
                        const char = code[i] || ''
                        const activeIndex = code.length === 4 ? 5 : code.length
                        const isActive = codeFocused && activeIndex === i
                        const isFilled = char !== ''
                        return (
                          <div key={i} style={{
                            width: 52, height: 68,
                            borderRadius: 13,
                            border: `2px solid ${isActive ? C.signal : isFilled ? C.signal : '#e2e8f0'}`,
                            background: isFilled ? `${C.signalSoft}` : '#f8fafc',
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: MONO, fontWeight: 800, fontSize: 30,
                            color: isFilled ? C.signal : C.inkMute,
                            boxShadow: isActive ? `0 0 0 3px ${C.signalSoft}` : "none",
                            transform: isActive ? "scale(1.08) translateY(-2px)" : isFilled ? "scale(1.02)" : "none",
                            transition: "all 0.18s cubic-bezier(.34,1.56,.64,1)",
                          }}>
                            {char}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  {error && <p style={{ color: C.bad, fontSize: 12, fontFamily: MONO, textAlign: "center", marginTop: 18 }}>{error}</p>}
                  <div style={{ marginTop: 30, width: 300 }}>
                    <button type="submit" disabled={code.length < 7} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%", opacity: code.length < 7 ? 0.5 : 1 }}>
                      <Btn kind="primary" size="lg" icon="arrowR" full>Continuer</Btn>
                    </button>
                  </div>
                </form>
              </>
          )}

          {/* ── Étape 2 : email ────────────────────────── */}
          {step === 'email' && (
              <>
                <H size={30} style={{ marginTop: 12, textAlign: "center" }}>Votre adresse e-mail</H>
                <div style={{ color: C.inkSoft, fontSize: 14.5, marginTop: 10, maxWidth: 380, textAlign: "center", lineHeight: 1.4 }}>
                  Entrez votre e-mail professionnel pour accéder à votre espace.
                </div>
                <form onSubmit={handleEmailSubmit} style={{ width: "100%", marginTop: 28 }}>
                  <input
                      type="email"
                      required
                      autoFocus
                      placeholder="prenom.nom@entreprise.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: "100%", height: 52, border: `1.5px solid ${email ? C.signal : C.border}`, borderRadius: 12, background: C.white, padding: "0 18px", fontFamily: SANS, fontSize: 15, color: C.ink, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                  />
                  {error && <p style={{ color: C.bad, fontSize: 12, fontFamily: MONO, marginTop: 10 }}>{error}</p>}
                  <div style={{ marginTop: 20 }}>
                    <button type="submit" disabled={loading || !email} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%", opacity: (!email || loading) ? 0.5 : 1 }}>
                      <Btn kind="primary" size="lg" icon="arrowR" full>{loading ? 'Vérification…' : 'Accéder'}</Btn>
                    </button>
                  </div>
                </form>
              </>
          )}

          {/* ── Étape 3 : profil (nouvel utilisateur) ── */}
          {step === 'profile' && (
              <>
                <H size={28} style={{ marginTop: 12, textAlign: "center" }}>Créez votre profil</H>
                <div style={{ color: C.inkSoft, fontSize: 14.5, marginTop: 10, maxWidth: 380, textAlign: "center", lineHeight: 1.4 }}>
                  Première connexion dans <strong style={{ color: C.ink }}>{teamInfo?.team}</strong>. Renseignez vos informations.
                </div>
                <form onSubmit={handleProfileSubmit} style={{ width: "100%", marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <input
                        type="text"
                        required
                        autoFocus
                        placeholder="Prénom"
                        value={prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                        style={{ flex: 1, height: 52, border: `1.5px solid ${prenom ? C.signal : C.border}`, borderRadius: 12, background: C.white, padding: "0 16px", fontFamily: SANS, fontSize: 15, color: C.ink, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                    />
                    <input
                        type="text"
                        required
                        placeholder="Nom"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        style={{ flex: 1, height: 52, border: `1.5px solid ${nom ? C.signal : C.border}`, borderRadius: 12, background: C.white, padding: "0 16px", fontFamily: SANS, fontSize: 15, color: C.ink, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                    />
                  </div>
                  <div style={{ padding: "10px 16px", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, fontFamily: SANS, fontSize: 13.5, color: C.inkSoft }}>
                    📧 {email}
                  </div>
                  {teamInfo?.roles?.length > 0 && (
                      <select
                          value={role}
                          onChange={e => setRole(e.target.value)}
                          style={{ width: "100%", height: 52, border: `1.5px solid ${role ? C.signal : C.border}`, borderRadius: 12, background: C.white, padding: "0 16px", fontFamily: SANS, fontSize: 15, color: role ? C.ink : C.inkMute, outline: "none", boxSizing: "border-box", cursor: "pointer" }}
                      >
                        <option value="">Sélectionnez votre rôle…</option>
                        {teamInfo.roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                  )}
                  {error && <p style={{ color: C.bad, fontSize: 12, fontFamily: MONO, marginTop: 4 }}>{error}</p>}
                  <div style={{ marginTop: 6 }}>
                    <button type="submit" disabled={loading || !prenom || !nom} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%", opacity: (!prenom || !nom || loading) ? 0.5 : 1 }}>
                      <Btn kind="primary" size="lg" icon="arrowR" full>{loading ? 'Création…' : 'Démarrer mon parcours'}</Btn>
                    </button>
                  </div>
                </form>
              </>
          )}

          {step === 'code' && (
              <div style={{ fontSize: 12.5, color: C.inkMute, marginTop: 18 }}>
                Pas de code ? <span style={{ color: C.signal, fontWeight: 600, cursor: "pointer" }}>Contactez votre RH</span>
              </div>
          )}

          {import.meta.env.DEV && (
              <button
                  onClick={handleDevBypass}
                  style={{ width: "100%", marginTop: 24, padding: "8px 12px", borderRadius: 9, border: `1.5px dashed ${C.warn}`, background: "none", color: C.warn, fontFamily: MONO, fontSize: 11, cursor: "pointer" }}
              >
                ⚡ Bypass Dev (sans backend)
              </button>
          )}
        </div>
      </div>
  )
}