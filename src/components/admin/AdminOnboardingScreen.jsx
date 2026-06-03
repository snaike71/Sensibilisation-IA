import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { apiUrl, API_HEADERS } from '../../utils/api.js'
import { C, MONO, SANS, Logo, Btn, Kicker, H } from '../lhctrl-kit.jsx'

const SECTEURS = ['Technologie', 'Finance', 'Santé', 'Éducation', 'Industrie', 'Commerce & Retail', 'Services', 'Média & Communication', 'Autre']
const TAILLES = ['1 – 10', '11 – 50', '51 – 200', '201 – 1 000', '1 000+']
const OUTILS = ['ChatGPT', 'Microsoft Copilot', 'Gemini', 'Claude', 'Midjourney', 'Stable Diffusion', 'Perplexity', 'Notion AI', 'GitHub Copilot', 'Autre']
const MATURITES = [
  { value: 'Débutant', desc: 'Peu ou pas d\'usage de l\'IA en interne' },
  { value: 'En cours', desc: 'Quelques expérimentations en cours' },
  { value: 'Avancé', desc: 'Usages réguliers dans plusieurs équipes' },
  { value: 'Expert', desc: 'IA intégrée dans les processus clés' },
]

function Step({ current, total }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i < current ? C.signal : C.border, transition: "background 0.3s" }} />
      ))}
    </div>
  )
}

export default function AdminOnboardingScreen({ onSuccess }) {
  const { token } = useApp()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ secteur: '', taille: '', outils_ia: [], maturite: '' })
  const [saving, setSaving] = useState(false)

  const toggleOutil = (o) => setForm(f => ({
    ...f,
    outils_ia: f.outils_ia.includes(o) ? f.outils_ia.filter(x => x !== o) : [...f.outils_ia, o]
  }))

  const canNext = () => {
    if (step === 1) return !!form.secteur
    if (step === 2) return !!form.taille
    if (step === 3) return form.outils_ia.length > 0
    if (step === 4) return !!form.maturite
    return true
  }

  const handleNext = () => { if (step < 4) setStep(s => s + 1) }

  const handleFinish = async () => {
    setSaving(true)
    try {
      await fetch(apiUrl('/api/organisations'), {
        method: 'PUT',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, statut_onboarding: 'Complet' }),
      })
    } catch { /* silencieux */ } finally {
      setSaving(false)
      onSuccess()
    }
  }

  const selectStyle = (active) => ({
    padding: "14px 18px", borderRadius: 12, border: `2px solid ${active ? C.signal : C.border}`,
    background: active ? C.signalSoft : C.white, cursor: "pointer", fontFamily: SANS,
    fontSize: 14, color: active ? C.signal : C.ink, fontWeight: active ? 700 : 400,
    transition: "all 0.15s", textAlign: "left"
  })

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)" }}>
        <Logo size={20} />
      </div>

      <div style={{ width: "100%", maxWidth: 480, marginTop: 60 }}>
        <Step current={step} total={4} />

        <Kicker color={C.signal} style={{ marginBottom: 8 }}>Configuration de l'organisation</Kicker>

        {/* Étape 1 : Secteur */}
        {step === 1 && (
          <>
            <H size={26} style={{ marginBottom: 6 }}>Dans quel secteur opérez-vous ?</H>
            <div style={{ color: C.inkSoft, fontSize: 14, marginBottom: 24 }}>Cela nous permet de personnaliser les scénarios de sensibilisation.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SECTEURS.map(s => (
                <button key={s} onClick={() => setForm(f => ({ ...f, secteur: s }))} style={selectStyle(form.secteur === s)}>{s}</button>
              ))}
            </div>
          </>
        )}

        {/* Étape 2 : Taille */}
        {step === 2 && (
          <>
            <H size={26} style={{ marginBottom: 6 }}>Quelle est la taille de votre organisation ?</H>
            <div style={{ color: C.inkSoft, fontSize: 14, marginBottom: 24 }}>Nombre de collaborateurs.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {TAILLES.map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, taille: t }))} style={selectStyle(form.taille === t)}>{t} collaborateurs</button>
              ))}
            </div>
          </>
        )}

        {/* Étape 3 : Outils IA */}
        {step === 3 && (
          <>
            <H size={26} style={{ marginBottom: 6 }}>Quels outils IA utilisez-vous ?</H>
            <div style={{ color: C.inkSoft, fontSize: 14, marginBottom: 24 }}>Sélectionnez tous ceux que vos équipes utilisent.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {OUTILS.map(o => (
                <button key={o} onClick={() => toggleOutil(o)} style={selectStyle(form.outils_ia.includes(o))}>{o}</button>
              ))}
            </div>
          </>
        )}

        {/* Étape 4 : Maturité */}
        {step === 4 && (
          <>
            <H size={26} style={{ marginBottom: 6 }}>Quel est votre niveau de maturité IA ?</H>
            <div style={{ color: C.inkSoft, fontSize: 14, marginBottom: 24 }}>Votre auto-évaluation actuelle.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {MATURITES.map(m => (
                <button key={m.value} onClick={() => setForm(f => ({ ...f, maturite: m.value }))} style={selectStyle(form.maturite === m.value)}>
                  <div style={{ fontWeight: 700 }}>{m.value}</div>
                  <div style={{ fontSize: 12.5, color: form.maturite === m.value ? C.signal : C.inkSoft, marginTop: 2 }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </>
        )}

        <div style={{ marginTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {step > 1
            ? <button onClick={() => setStep(s => s - 1)} style={{ background: "none", border: "none", fontFamily: MONO, fontSize: 12.5, color: C.inkSoft, cursor: "pointer" }}>← Retour</button>
            : <div />
          }
          <button
            onClick={step === 4 ? handleFinish : handleNext}
            disabled={!canNext() || saving}
            style={{ background: "none", border: "none", padding: 0, cursor: canNext() ? "pointer" : "not-allowed", opacity: canNext() ? 1 : 0.4 }}
          >
            <Btn kind="primary" size="lg" icon="arrowR">
              {saving ? 'Enregistrement…' : step === 4 ? 'Accéder au tableau de bord' : 'Continuer'}
            </Btn>
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={onSuccess} style={{ background: "none", border: "none", fontFamily: MONO, fontSize: 11.5, color: C.inkMute, cursor: "pointer" }}>
            Passer cette étape →
          </button>
        </div>
      </div>
    </div>
  )
}
