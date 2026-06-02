import { useApp } from '../../context/AppContext.jsx'
import { C, MONO, SANS, Logo, Icon, Btn, Mark } from '../lhctrl-kit.jsx'

export default function AccrocheScreen({ onStart, onLogout, module }) {
  const { companyConfig, collaborator } = useApp()
  const prenom = collaborator?.nom?.split(' ')[0] ?? 'Apprenant'
  const moduleTitle = module?.titre || null
  const nbScenarios = (() => {
    if (!module?.contenu) return null
    try { return JSON.parse(module.contenu).length } catch { return null }
  })()

  return (
    <div style={{ minHeight: "100vh", background: C.night, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden", fontFamily: SANS }}>
      {/* Filigrane */}
      <div style={{ position: "absolute", right: -60, bottom: -60, opacity: 0.08 }}>
        <Mark size={380} color={C.cyan} />
      </div>

      {/* Header */}
      <div style={{ position: "absolute", top: 22, left: 28 }}>
        <Logo size={18} />
      </div>
      <button onClick={onLogout} style={{ position: "absolute", top: 22, right: 28, background: "none", border: "none", color: "rgba(255,255,255,.35)", fontFamily: MONO, fontSize: 12, cursor: "pointer" }}>
        Quitter
      </button>

      <div style={{ maxWidth: 520, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 2 }}>

        {/* Badge module */}
        {moduleTitle && (
          <div style={{ marginBottom: 20, padding: "5px 14px", borderRadius: 20, background: "rgba(0,229,255,.12)", border: "1px solid rgba(0,229,255,.25)", color: C.cyan, fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.cyan, display: "inline-block" }} />
            {moduleTitle}
          </div>
        )}

        {/* Titre */}
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 46, color: C.white, textAlign: "center", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          L'IA, ça<br /><span style={{ color: C.signal }}>se contrôle.</span>
        </div>

        {/* Principe */}
        <div style={{ marginTop: 28, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: "18px 22px", textAlign: "center" }}>
          <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.cyan, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            Principe LHC · Limitless Human Control
          </div>
          <p style={{ color: "rgba(255,255,255,.65)", fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
            Automatiser les tâches chronophages à faible valeur, garder l'humain
            maître des décisions à fort enjeu, sans jamais exposer l'information sensible.
          </p>
        </div>

        {/* Contexte */}
        <p style={{ color: "rgba(255,255,255,.45)", fontSize: 13.5, textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
          Bonjour <strong style={{ color: "rgba(255,255,255,.85)" }}>{prenom}</strong>.
          En <strong style={{ color: "rgba(255,255,255,.85)" }}>{nbScenarios ? `${nbScenarios * 3} min` : '10 minutes'}</strong>, traversez{' '}
          {nbScenarios ? <><strong style={{ color: "rgba(255,255,255,.85)" }}>{nbScenarios} scénario{nbScenarios > 1 ? 's' : ''}</strong> réels</> : '4 situations réelles'} et apprenez à arbitrer.
        </p>

        {/* Bouton */}
        <div onClick={onStart} style={{ marginTop: 32, width: 240 }}>
          <Btn kind="primary" size="lg" icon="play" full>Commencer</Btn>
        </div>

        <p style={{ marginTop: 14, fontSize: 11, color: "rgba(255,255,255,.2)", fontFamily: MONO }}>
          Usage individuel · Résultats sauvegardés
        </p>
      </div>
    </div>
  )
}
