import { useState, Fragment } from 'react'
import { C, MONO, SANS, Logo, Icon, Btn, Card, Chip, RiskBadge } from '../lhctrl-kit.jsx'

// ─── Constants ──────────────────────────────────────────────────────────────

const SECTORS = [
  'Finance / Banque / Assurance',
  'Ressources Humaines',
  'Juridique / Conformité',
  'Santé / Médical',
  'Commerce / Distribution',
  'Industrie / Manufacturing',
  'Communication / Marketing',
  'Informatique / Tech',
  'Administration publique',
  'Éducation / Formation',
  'Autre',
]

const SIZES = [
  'PME < 250 salariés',
  'ETI 250–5000 salariés',
  'Grande entreprise > 5000 salariés',
]

const AI_TOOLS = [
  'ChatGPT',
  'Claude',
  'Gemini',
  'Copilot',
  'Mistral',
  'Midjourney',
  'Notion AI',
  'Autre',
]

const MATURITE_OPTIONS = [
  {
    value: 'emergent',
    label: 'Émergent',
    description: 'Peu ou pas de règles formalelles',
  },
  {
    value: 'structuration',
    label: 'En structuration',
    description: 'Quelques politiques en place',
  },
  {
    value: 'mature',
    label: 'Mature',
    description: 'Gouvernance formalisée et appliquée',
  },
]

const RISK_LEVELS = ['Faible', 'Modéré', 'Élevé']

// ─── Stepper ─────────────────────────────────────────────────────────────────

function OnboardStepper({ step }) {
  const steps = ["Entreprise", "Maturité IA", "Cas d'usage", "Récapitulatif"]
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%", maxWidth: 620 }}>
      {steps.map((s, i) => {
        const done = i < step
        const on = i === step
        return (
          <Fragment key={s}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, position: "relative" }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 32,
                background: done ? C.signal : on ? C.white : C.white,
                border: `2px solid ${done || on ? C.signal : C.border}`,
                color: done ? C.white : on ? C.signal : C.inkMute,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: MONO,
                fontWeight: 700,
                fontSize: 13
              }}>
                {done ? <Icon name="check" size={15} color={C.white} /> : i + 1}
              </div>
              <div style={{
                position: "absolute",
                top: 38,
                fontFamily: MONO,
                fontSize: 10.5,
                fontWeight: on ? 700 : 500,
                color: on ? C.signal : C.inkMute,
                whiteSpace: "nowrap"
              }}>{s}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < step ? C.signal : C.border, margin: "0 6px" }} />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function Field({ label, children, hint, w = "100%" }) {
  return (
    <div style={{ width: w }}>
      <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.inkSoft, letterSpacing: "0.03em", marginBottom: 7, textTransform: "uppercase" }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: C.inkMute, marginTop: 6, fontFamily: SANS }}>{hint}</div>}
    </div>
  )
}

function Input({ placeholder, value, onChange, w = "100%", mono }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        width: w,
        height: 44,
        border: `1px solid ${value ? C.inkSoft : C.border}`,
        borderRadius: 9,
        background: C.white,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        fontFamily: mono ? MONO : SANS,
        fontSize: 13.5,
        color: C.ink,
        outline: "none",
        boxSizing: "border-box"
      }}
    />
  )
}

function Select({ value, onChange, options, placeholder = "Sélectionner…", w = "100%" }) {
  return (
    <div style={{ width: w, position: "relative" }}>
      <select
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          height: 44,
          border: `1px solid ${value ? C.inkSoft : C.border}`,
          borderRadius: 9,
          background: C.white,
          padding: "0 36px 0 14px",
          fontSize: 13.5,
          color: value ? C.ink : C.inkMute,
          fontFamily: SANS,
          outline: "none",
          appearance: "none",
          cursor: "pointer",
          boxSizing: "border-box"
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt} style={{ color: C.ink }}>
            {opt}
          </option>
        ))}
      </select>
      <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center" }}>
        <Icon name="chevD" size={16} color={C.inkMute} />
      </div>
    </div>
  )
}

function OnboardFrame({ step, children, onBack }) {
  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: C.bg, 
      color: C.ink, 
      fontFamily: SANS, 
      display: "flex", 
      flexDirection: "column" 
    }}>
      {/* top bar minimal */}
      <div style={{ height: 64, borderBottom: `1px solid ${C.border}`, background: C.white,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: MONO,
            fontSize: 11.5,
            color: C.inkMute,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <Icon name="chevL" size={14} color={C.inkMute} />
          Retour
        </button>

        <Logo size={20} />
        
        <div style={{ fontFamily: MONO, fontSize: 11.5, color: C.inkMute }}>Étape {step} / 4</div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", paddingTop: 40, paddingLeft: 24, paddingRight: 24 }}>
        <OnboardStepper step={step - 1} />
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 56, padding: "0 24px 48px" }}>
        <Card pad={36} style={{ width: "100%", maxWidth: 640, position: "relative" }}>
          {children}
        </Card>
      </div>
    </div>
  )
}

// ─── Step 1 — Votre entreprise ────────────────────────────────────────────────

function Step1({ data, onChange, onNext }) {
  const canContinue = data.companyName.trim() && data.sector && data.size && data.email.trim()

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Kicker color={C.signal}>Étape 1 — Votre entreprise</Kicker>
      <H size={23} style={{ marginTop: 8 }}>Présentez votre organisation</H>
      <p style={{ color: C.inkSoft, fontSize: 13.5, marginTop: 4, marginBottom: 20 }}>
        Ces informations personnalisent les modules générés par l'IA.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Field label="Nom de l'entreprise">
          <Input
            placeholder="Ex : Groupe Nexia"
            value={data.companyName}
            onChange={(e) => onChange('companyName', e.target.value)}
          />
        </Field>

        <div className="flex flex-col sm:flex-row gap-4">
          <div style={{ flex: 1 }}>
            <Field label="Secteur d'activité">
              <Select
                value={data.sector}
                onChange={(e) => onChange('sector', e.target.value)}
                options={SECTORS}
                placeholder="Sélectionner un secteur"
              />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Taille">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {SIZES.map((s) => (
                  <div key={s} onClick={() => onChange('size', s)} style={{ cursor: "pointer" }}>
                    <Chip sel={data.size === s}>{s.split(' ')[0]}</Chip>
                  </div>
                ))}
              </div>
            </Field>
          </div>
        </div>

        <Field label="Référent IA (E-mail)">
          <Input
            placeholder="referent@organisation.fr"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            mono
          />
        </Field>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <div 
          onClick={() => { if (canContinue) onNext() }}
          style={{ opacity: !canContinue ? 0.4 : 1, pointerEvents: !canContinue ? "none" : "auto" }}
        >
          <Btn kind="primary" icon="arrowR">Continuer</Btn>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2 — Maturité IA ─────────────────────────────────────────────────────

function Step2({ data, onChange, onNext, onBack }) {
  const toggleTool = (tool) => {
    const updated = data.tools.includes(tool)
      ? data.tools.filter((t) => t !== tool)
      : [...data.tools, tool]
    onChange('tools', updated)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Kicker color={C.signal}>Étape 2 — Maturité IA</Kicker>
      <H size={23} style={{ marginTop: 8 }}>Quels outils IA sont déjà utilisés ?</H>
      <p style={{ color: C.inkSoft, fontSize: 13.5, marginTop: 4, marginBottom: 20 }}>
        Sélectionnez tous les outils présents dans votre organisation.
      </p>

      <Field label="Outils IA utilisés">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {AI_TOOLS.map((tool) => {
            const checked = data.tools.includes(tool)
            return (
              <div key={tool} onClick={() => toggleTool(tool)} style={{ cursor: "pointer" }}>
                <Chip sel={checked} icon={checked ? "check" : null}>
                  {tool}
                </Chip>
              </div>
            )
          })}
        </div>
      </Field>

      <div style={{ marginTop: 12 }}>
        <Field label="Niveau de gouvernance IA">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {MATURITE_OPTIONS.map((opt) => {
              const selected = data.maturite === opt.value
              return (
                <div 
                  key={opt.value} 
                  onClick={() => onChange('maturite', opt.value)} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 13, 
                    padding: "14px 16px",
                    border: `1px solid ${selected ? C.signal : C.border}`, 
                    borderRadius: 11, 
                    cursor: "pointer",
                    background: selected ? C.signalSoft : C.white,
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ 
                    width: 18, 
                    height: 18, 
                    borderRadius: 18, 
                    border: `2px solid ${selected ? C.signal : C.border}`,
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    {selected && <div style={{ width: 8, height: 8, borderRadius: 8, background: C.signal }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: C.ink, fontFamily: SANS }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: C.inkMute, fontFamily: SANS, marginTop: 2 }}>{opt.description}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Field>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <div onClick={onBack}>
          <Btn kind="ghost" icon="chevL">Retour</Btn>
        </div>
        <div onClick={onNext}>
          <Btn kind="primary" icon="arrowR">Continuer</Btn>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3 — Cas d'usage ─────────────────────────────────────────────────────

function Step3({ data, onChange, onNext, onBack }) {
  const [draft, setDraft] = useState({ description: '', team: '', risk: 'Faible', tool: '' })

  const addUseCase = () => {
    if (!draft.description.trim()) return
    onChange('usecases', [...data.usecases, { ...draft, id: Date.now() }])
    setDraft({ description: '', team: '', risk: 'Faible', tool: '' })
  }

  const removeUseCase = (id) => {
    onChange('usecases', data.usecases.filter((u) => u.id !== id))
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Kicker color={C.signal}>Étape 3 — Cas d'usage IA</Kicker>
      <H size={23} style={{ marginTop: 8 }}>Décrivez un usage concret de l'IA</H>
      <p style={{ color: C.inkSoft, fontSize: 13.5, marginTop: 4, marginBottom: 20 }}>
        L'IA en déduira les risques et les modules à générer.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Field label="Intitulé du cas d'usage">
          <Input 
            placeholder="Ex : Analyse de CV via IA" 
            value={draft.description} 
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </Field>
        <div className="flex flex-col sm:flex-row gap-4">
          <div style={{ flex: 1 }}>
            <Field label="Équipe concernée">
              <Input 
                placeholder="Ex : RH, Commercial…" 
                value={draft.team} 
                onChange={(e) => setDraft({ ...draft, team: e.target.value })}
              />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Outil principal">
              <Select 
                value={draft.tool} 
                onChange={(e) => setDraft({ ...draft, tool: e.target.value })}
                options={data.tools.length > 0 ? data.tools : AI_TOOLS}
                placeholder="Sélectionner…"
              />
            </Field>
          </div>
        </div>
        <Field label="Niveau de risque">
          <div style={{ display: "flex", gap: 8 }}>
            {RISK_LEVELS.map((r) => (
              <div key={r} onClick={() => setDraft({ ...draft, risk: r })} style={{ cursor: "pointer" }}>
                <Chip sel={draft.risk === r} tone="ghost" style={{
                  borderColor: draft.risk === r ? (r === 'Élevé' ? C.bad : r === 'Modéré' ? C.warn : C.ok) : C.border,
                  color: draft.risk === r ? (r === 'Élevé' ? C.bad : r === 'Modéré' ? C.warn : C.ok) : C.inkSoft,
                  background: draft.risk === r ? (r === 'Élevé' ? C.badBg : r === 'Modéré' ? C.warnBg : C.okBg) : C.white
                }}>
                  {r}
                </Chip>
              </div>
            ))}
          </div>
        </Field>
        
        <div onClick={addUseCase}>
          <Btn kind="soft" icon="plus" full state={draft.description.trim() ? undefined : 'disabled'}>
            Ajouter ce cas d'usage
          </Btn>
        </div>
      </div>

      {data.usecases.length > 0 && (
        <div style={{ marginTop: 12, borderTop: `1px dashed ${C.border}`, paddingTop: 18 }}>
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.inkMute, marginBottom: 10, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {data.usecases.length} cas d'usage déclaré{data.usecases.length > 1 ? 's' : ''}
          </div>
          {data.usecases.map((uc) => (
            <div key={uc.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.bg}` }}>
              <Icon name="check" size={16} color={C.ok} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: C.ink }}>{uc.description}</span>
                <span style={{ color: C.inkMute, fontSize: 12 }}> · {uc.team || 'Toutes équipes'}{uc.tool ? ` (${uc.tool})` : ''}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <RiskBadge level={uc.risk} />
                <button
                  type="button"
                  onClick={() => removeUseCase(uc.id)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontSize: 18,
                    color: C.inkMute,
                    lineHeight: 1,
                    transition: "color 0.2s"
                  }}
                  onMouseEnter={(e) => e.target.style.color = C.bad}
                  onMouseLeave={(e) => e.target.style.color = C.inkMute}
                  aria-label="Supprimer"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <div onClick={onBack}>
          <Btn kind="ghost" icon="chevL">Retour</Btn>
        </div>
        <div onClick={onNext}>
          <Btn kind="primary" icon="arrowR">Continuer</Btn>
        </div>
      </div>
    </div>
  )
}

// ─── Step 4 — Récapitulatif ───────────────────────────────────────────────────

function Step4({ data, onBack, onComplete }) {
  const handleGenerate = () => {
    onComplete({
      companyName: data.companyName,
      sector: data.sector,
      size: data.size,
      email: data.email,
      tools: data.tools,
      maturite: data.maturite,
      usecases: data.usecases,
    })
  }

  const companySummary = `${data.companyName} · ${data.sector} · ${data.size}`
  const toolsSummary = data.tools.length > 0 ? data.tools.join(', ') : 'Aucun outil déclaré'
  const maturiteLabel = MATURITE_OPTIONS.find((m) => m.value === data.maturite)?.label || '—'
  const highRiskCount = data.usecases.filter((u) => u.risk === 'Élevé').length
  const usecasesSummary = `${data.usecases.length} identifié${data.usecases.length > 1 ? 's' : ''} · ${highRiskCount} risque${highRiskCount > 1 ? 's' : ''} élevé${highRiskCount > 1 ? 's' : ''}`

  const summaryItems = [
    ["Entreprise", companySummary],
    ["Outils IA", toolsSummary],
    ["Maturité", maturiteLabel],
    ["Cas d'usage", usecasesSummary]
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Kicker color={C.signal}>Étape 4 — Récapitulatif</Kicker>
      <H size={23} style={{ marginTop: 8 }}>Tout est prêt, {data.companyName}</H>
      <p style={{ color: C.inkSoft, fontSize: 13.5, marginTop: 4, marginBottom: 20 }}>
        Vérifiez votre profil avant de générer vos modules.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {summaryItems.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "13px 16px", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <span style={{ fontFamily: MONO, fontSize: 11.5, color: C.inkMute, letterSpacing: "0.03em" }}>{k.toUpperCase()}</span>
            <span style={{ fontWeight: 600, fontSize: 13.5, color: C.ink, textAlign: "right" }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ background: C.night, borderRadius: 13, padding: "20px 22px", marginTop: 12,
        display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: "rgba(255,255,255,.12)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="brain" size={22} color={C.cyan} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.white, fontWeight: 700, fontSize: 14.5 }}>L'IA va générer 5 modules personnalisés</div>
          <div style={{ color: "rgba(255,255,255,.7)", fontSize: 12.5, marginTop: 3 }}>Adaptés à vos outils, vos équipes et vos risques. ~30 sec.</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <div onClick={onBack}>
          <Btn kind="ghost" icon="chevL">Retour</Btn>
        </div>
        <div onClick={handleGenerate}>
          <Btn kind="primary" size="lg" icon="bolt">Générer mes modules</Btn>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingScreen({ onComplete, onBack }) {
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    // Step 1
    companyName: '',
    sector: '',
    size: '',
    email: '',
    // Step 2
    tools: [],
    maturite: '',
    // Step 3
    usecases: [],
  })

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const next = () => setStep((s) => Math.min(s + 1, 4))
  const prev = () => setStep((s) => Math.max(s - 1, 1))

  const handleBack = () => {
    if (step === 1) {
      onBack()
    } else {
      prev()
    }
  }

  return (
    <OnboardFrame step={step} onBack={handleBack}>
      {step === 1 && (
        <Step1 data={formData} onChange={updateField} onNext={next} />
      )}
      {step === 2 && (
        <Step2 data={formData} onChange={updateField} onNext={next} onBack={prev} />
      )}
      {step === 3 && (
        <Step3 data={formData} onChange={updateField} onNext={next} onBack={prev} />
      )}
      {step === 4 && (
        <Step4 data={formData} onBack={prev} onComplete={onComplete} />
      )}
    </OnboardFrame>
  )
}
