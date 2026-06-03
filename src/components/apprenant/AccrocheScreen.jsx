import { useApp } from '../../context/AppContext.jsx'
import { C, MONO, SANS, Logo, Icon, Btn, Card, Chip, Mark } from '../lhctrl-kit.jsx'

export default function AccrocheScreen({ onStart, onLogout, module }) {
  const { collaborator } = useApp()
  const prenom = collaborator?.nom?.split(' ')[0] ?? 'Apprenant'
  const moduleTitle = module?.titre || null
  const nbScenarios = (() => {
    if (!module?.contenu) return null
    try { return JSON.parse(module.contenu).length } catch { return null }
  })()
  const dureeMin = nbScenarios ? nbScenarios * 3 : 10

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      display: "flex",
      flexDirection: "column",
      fontFamily: SANS,
    }}>
      {/* Header */}
      <div style={{
        height: 60,
        borderBottom: `1px solid ${C.border}`,
        background: C.white,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
      }}>
        <Logo size={18} />
        <button onClick={onLogout} style={{
          background: "none", border: "none",
          color: C.inkSoft, fontFamily: MONO, fontSize: 12,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
        }}>
          <Icon name="x" size={14} color={C.inkSoft} /> Quitter
        </button>
      </div>

      {/* Contenu centré */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Bannière sombre (comme le profil dans le dashboard) */}
          <div style={{
            background: C.night,
            borderRadius: 18,
            padding: "32px 36px",
            position: "relative",
            overflow: "hidden",
            textAlign: "center",
          }}>
            {/* Filigrane */}
            <div style={{ position: "absolute", right: -40, bottom: -40, opacity: 0.08 }}>
              <Mark size={220} color={C.cyan} />
            </div>

            {/* Badge module */}
            {moduleTitle && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                marginBottom: 18, padding: "5px 14px", borderRadius: 20,
                background: "rgba(0,229,255,.12)", border: "1px solid rgba(0,229,255,.25)",
                color: C.cyan, fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.cyan, display: "inline-block" }} />
                {moduleTitle}
              </div>
            )}

            {/* Titre */}
            <div style={{
              fontFamily: MONO, fontWeight: 700, fontSize: 40,
              color: C.white, lineHeight: 1.15, letterSpacing: "-0.02em",
              position: "relative", zIndex: 2,
            }}>
              L'IA, ça<br /><span style={{ color: C.signal }}>se contrôle.</span>
            </div>

            {/* Sous-titre */}
            <p style={{
              color: "rgba(255,255,255,.55)", fontSize: 13.5,
              marginTop: 14, lineHeight: 1.6, position: "relative", zIndex: 2,
            }}>
              Bonjour <strong style={{ color: "rgba(255,255,255,.9)" }}>{prenom}</strong>.{' '}
              En <strong style={{ color: C.cyan }}>{dureeMin} min</strong>, traversez{' '}
              {nbScenarios
                ? <><strong style={{ color: "rgba(255,255,255,.9)" }}>{nbScenarios} scénario{nbScenarios > 1 ? 's' : ''}</strong> réels</>
                : '4 situations réelles'
              } et apprenez à arbitrer.
            </p>
          </div>

          {/* Card info */}
          <Card pad={22}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: C.signalSoft, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="bulb" size={20} color={C.signal} />
              </div>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.signal, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                  Principe LHC · Limitless Human Control
                </div>
                <p style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.6, margin: 0 }}>
                  Automatiser les tâches chronophages à faible valeur, garder l'humain
                  maître des décisions à fort enjeu, sans jamais exposer l'information sensible.
                </p>
              </div>
            </div>
          </Card>

          {/* Chips résumé */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Chip icon="play">{dureeMin} min</Chip>
            {nbScenarios && <Chip tone="cyan">{nbScenarios} scénario{nbScenarios > 1 ? 's' : ''}</Chip>}
            <Chip>Usage individuel</Chip>
            <Chip>Résultats sauvegardés</Chip>
          </div>

          {/* Bouton */}
          <div onClick={onStart}>
            <Btn kind="primary" size="lg" icon="play" full>Commencer</Btn>
          </div>

        </div>
      </div>
    </div>
  )
}
