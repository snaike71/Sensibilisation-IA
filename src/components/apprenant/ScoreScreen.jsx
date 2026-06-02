import { useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { C, MONO, SANS, Logo, Icon, Btn, Card, Kicker, H } from '../lhctrl-kit.jsx'

const profils = [
  {
    minPct: 90,
    nom: 'Contrôleur LHC',
    color: C.ok,
    textColor: C.ok,
    bgColor: C.okBg,
    emoji: '🏆',
    description: "Vous maîtrisez parfaitement l'arbitrage humain/IA. Partagez ces réflexes autour de vous.",
  },
  {
    minPct: 70,
    nom: 'Collaborateur averti',
    color: C.signal,
    textColor: C.signal,
    bgColor: C.signalSoft,
    emoji: '👍',
    description: "Bons réflexes globaux, quelques angles morts à affiner. Relisez les feedbacks des questions manquées.",
  },
  {
    minPct: 50,
    nom: 'Délégateur imprudent',
    color: C.warn,
    textColor: C.warn,
    bgColor: C.warnBg,
    emoji: '⚠️',
    description: "Vous avez tendance à sur-déléguer à l'IA ou à sous-estimer certains risques.",
  },
  {
    minPct: 0,
    nom: 'Assisté en danger',
    color: C.bad,
    textColor: C.bad,
    bgColor: C.badBg,
    emoji: '🚨',
    description: "Votre usage de l'IA expose votre organisation à des risques réels. Prenez le temps de relire chaque feedback.",
  },
]

function getProfil(score, total) {
  const pct = total > 0 ? (score / total) * 100 : 0
  return profils.find((p) => pct >= p.minPct) ?? profils[profils.length - 1]
}

function Ring({ value = 0.8, size = 180, color = C.signal }) {
  const r = (size - 18) / 2, c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(13, 13, 13, 0.06)" strokeWidth={14} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      <text x="50%" y="47%" textAnchor="middle" fontFamily={MONO} fontWeight="700" fontSize="42" fill={C.ink}>{Math.round(value * 100)}</text>
      <text x="50%" y="63%" textAnchor="middle" fontFamily={MONO} fontSize="13" fill={C.inkMute}>SCORE %</text>
    </svg>
  )
}

export default function ScoreScreen({ score, total, onRestart, onGoToDashboard }) {
  const profil = getProfil(score, total)
  const { saveResult, collaborator } = useApp()
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const xpGagne = Math.round(pct * 1.5) // ex: 80% → +120 XP

  useEffect(() => {
    saveResult(score, profil.nom, {}, total)
  }, []) // eslint-disable-line

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: C.bg,
      color: C.ink,
      fontFamily: SANS,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 24px",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Filigrane d'ambiance */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 500,
        height: 500,
        backgroundColor: C.signal,
        opacity: 0.04,
        borderRadius: "50%",
        filter: "blur(120px)",
        pointerEvents: "none"
      }} />

      {/* Logo en haut */}
      <div style={{ position: "absolute", top: 24, left: 24 }}>
        <Logo size={20} />
      </div>

      <div style={{ width: "100%", maxWidth: 440, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Kicker color={C.signal}>Module terminé</Kicker>
        
        <H size={30} style={{ marginTop: 12, marginBottom: 8 }}>
          Bravo, {collaborator?.nom?.split(' ')[0] ?? 'Apprenant'} !
        </H>
        
        <p style={{ color: C.inkSoft, fontSize: 14.5, marginBottom: 32, textAlign: "center" }}>
          « Prompt & confidentialité » validé.
        </p>

        {/* Jauge circulaire stylisée */}
        <div style={{ marginBottom: 32, cursor: "default" }}>
          <Ring value={pct / 100} color={profil.color} />
        </div>

        {/* XP & Streak */}
        <div style={{ display: "flex", gap: 14, width: "100%", marginBottom: 32 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 9, padding: "12px 20px", borderRadius: 12, background: C.cyan, border: `1px solid ${C.cyan}` }}>
            <Icon name="bolt" size={19} color={C.night} />
            <div>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 18, color: C.night, lineHeight: 1 }}>+{xpGagne} XP</div>
              <div style={{ fontSize: 10, color: C.inkMute, fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 4 }}>Acquis</div>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 9, padding: "12px 20px", borderRadius: 12, background: C.signalSoft, border: `1px solid ${C.signalSoft}` }}>
            <Icon name="flame" size={19} color={C.signal} />
            <div>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 18, color: C.signal, lineHeight: 1 }}>Série +1</div>
              <div style={{ fontSize: 10, color: C.inkMute, fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 4 }}>Jours conséc.</div>
            </div>
          </div>
        </div>

        {/* Profil d'usage de sensibilisation */}
        <Card pad={20} style={{ width: "100%", background: profil.bgColor, borderColor: profil.color, textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 10.5, fontFamily: MONO, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: C.inkMute, marginBottom: 6 }}>
            Votre profil d'apprenant
          </div>
          <div style={{ fontSize: 18, fontFamily: MONO, fontWeight: 700, color: profil.textColor, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
            <span>{profil.emoji}</span>
            <span>{profil.nom}</span>
          </div>
          <p style={{ color: C.inkSoft, fontSize: 13.5, lineHeight: 1.5 }}>
            {profil.description}
          </p>
        </Card>

        <div style={{ color: C.inkMute, fontSize: 12, fontFamily: MONO, marginBottom: 32 }}>
          {score} bonne{score > 1 ? 's' : ''} réponse{score > 1 ? 's' : ''} sur {total} questions
        </div>

        {/* 2 Boutons de navigation bas de page */}
        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <div onClick={onGoToDashboard} style={{ flex: 1 }}>
            <Btn kind="ghost" size="lg" icon="chevL" full>Mon parcours</Btn>
          </div>
          <div onClick={onRestart} style={{ flex: 1 }}>
            <Btn kind="primary" size="lg" icon="play" full>Recommencer</Btn>
          </div>
        </div>

      </div>
    </div>
  )
}
