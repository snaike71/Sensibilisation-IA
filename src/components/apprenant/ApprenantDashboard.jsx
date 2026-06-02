import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { apiUrl, API_HEADERS } from '../../utils/api.js'
import { C, MONO, SANS, Logo, Icon, Btn, Card, Chip, Avatar, Kicker, H, Progress, Mark } from '../lhctrl-kit.jsx'

// Modules par défaut (remplacés par ceux du backend si disponibles)
const defaultModules = [
  {
    id: 'module-1',
    titre: 'Anonymiser avant de prompter',
    description: 'Apprenez à protéger les données sensibles avant tout usage d\'un outil IA.',
    categorie: 'Données',
    duree_min: 12,
    statut: 'done',
  },
  {
    id: 'module-2',
    titre: 'Prompt & confidentialité',
    description: 'Maîtrisez les bonnes pratiques de rédaction de prompts sans exposer d\'informations sensibles.',
    categorie: 'Gouvernance',
    duree_min: 10,
    statut: 'current',
  },
  {
    id: 'module-3',
    titre: 'Arbitrage humain / IA',
    description: 'Identifiez quand déléguer à l\'IA et quand garder la main sur les décisions.',
    categorie: 'Éthique',
    duree_min: 15,
    statut: 'todo',
  },
]

function getInitials(nom) {
  if (!nom) return '?'
  return nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function StatCard({ icon, value, label, tone }) {
  return (
    <Card pad={18} style={{ flex: 1, display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 11, background: tone === "cyan" ? C.cyan : C.signalSoft,
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon === "🏆" ? "trophy" : icon === "flame" ? "flame" : icon === "star" ? "star" : icon} size={21} color={tone === "cyan" ? C.night : C.signal} />
      </div>
      <div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: "-0.02em", color: C.ink }}>{value}</div>
        <div style={{ fontSize: 12.5, color: C.inkSoft }}>{label}</div>
      </div>
    </Card>
  )
}

function ModuleRow({ titre, categorie, duree_min, statut, idx, onStart }) {
  const done = statut === 'done', current = statut === 'current'
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px",
      background: C.white, border: `1px solid ${current ? C.signal : C.border}`, borderRadius: 13,
      boxShadow: current ? `0 0 0 3px ${C.signalSoft}` : "none" }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        background: done ? C.okBg : current ? C.signal : C.bg, border: `1px solid ${done ? C.okBg : current ? C.signal : C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: MONO, fontWeight: 700, fontSize: 13, color: done ? C.ok : current ? C.white : C.inkMute }}>
        {done ? <Icon name="check" size={16} color={C.ok} /> : idx}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: C.ink }}>{titre}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <Chip tone="cyan">{categorie}</Chip>
          <Chip icon="play">{duree_min} min</Chip>
        </div>
      </div>
      {done ? <Chip tone="default" icon="check">Terminé</Chip>
        : current ? (
          <button onClick={onStart} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
            <Btn kind="primary" icon="play">Démarrer</Btn>
          </button>
        ) : (
          <Btn kind="ghost" state="disabled">Démarrer</Btn>
        )}
    </div>
  )
}

export default function ApprenantDashboard({ onStartModule, onLogout }) {
  const { collaborator, token } = useApp()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetch(apiUrl('/api/sessions'), {
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : [])
        .then(data => setSessions(Array.isArray(data) ? data : []))
        .catch(() => setSessions([]))
        .finally(() => setLoading(false))
    } else if (collaborator?.id) {
      fetch(apiUrl(`/api/collaborators/${collaborator.id}/sessions`), {
        headers: API_HEADERS,
      })
        .then(r => r.ok ? r.json() : [])
        .then(data => setSessions(Array.isArray(data) ? data : []))
        .catch(() => setSessions([]))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token, collaborator?.id])

  const totalXP = collaborator?.xp ?? 0
  const niveau = collaborator?.niveau ?? 1
  
  let xpLower = 0
  let xpUpper = 100
  if (niveau === 2) { xpLower = 100; xpUpper = 300 }
  else if (niveau === 3) { xpLower = 300; xpUpper = 600 }
  else if (niveau >= 4) { xpLower = 600; xpUpper = 1000 }
  
  const xpInLevel = Math.max(0, totalXP - xpLower)
  const xpRange = xpUpper - xpLower
  const xpProgress = Math.min(1, xpInLevel / xpRange)

  const labelsMaturite = ['Émergent', 'Intermédiaire', 'Avancé', 'Expert']
  const labelMaturite = labelsMaturite[niveau - 1] ?? 'Expert'

  // Calcul dynamique des modules et de leur progression réelle
  const modules = defaultModules.map((mod, index) => {
    let statut = 'todo'
    if (index < sessions.length) {
      statut = 'done'
    } else if (index === sessions.length) {
      statut = 'current'
    }
    return { ...mod, statut }
  })

  const modulesTermines = sessions.length
  const nbBadges = niveau >= 2 ? (niveau >= 3 ? 2 : 1) : 0
  const serie = sessions.length // simplification : nb sessions = série

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.ink, fontFamily: SANS }}>
      {/* Header */}
      <div style={{ height: 60, borderBottom: `1px solid ${C.border}`, background: C.white,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <Logo size={20} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Icon name="bell" size={19} color={C.inkSoft} />
          <div onClick={onLogout} style={{ cursor: "pointer" }} title="Quitter">
            <Avatar size={32} label={getInitials(collaborator?.nom)} color={C.signal} />
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px", display: "flex", flexDirection: "column", gap: 22 }}>
        
        {/* Bannière de Profil Sombre */}
        <div style={{ background: C.night, borderRadius: 18, padding: "28px 32px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -30, bottom: -50, opacity: .12 }}><Mark size={230} color={C.cyan} /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative", zIndex: 2 }}>
            <Avatar size={70} label={getInitials(collaborator?.nom)} color={C.signal} ring={C.cyan} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 24, color: C.white }}>{collaborator?.nom ?? 'Apprenant'}</div>
                <span style={{ padding: "4px 10px", borderRadius: 6, background: C.cyan, color: C.night, fontFamily: MONO, fontWeight: 700, fontSize: 11 }}>NIVEAU {niveau} · {labelMaturite.toUpperCase()}</span>
              </div>
              <div style={{ color: "rgba(255,255,255,.66)", fontSize: 13.5, marginTop: 4 }}>
                {collaborator?.role ? `${collaborator.role} · ` : ''}Équipe {collaborator?.teamName ?? 'Générale'}
              </div>
              
              {/* Barre XP */}
              <div style={{ marginTop: 16, maxWidth: 460 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 11, color: "rgba(255,255,255,.8)", marginBottom: 6 }}>
                  <span>{totalXP} XP</span>
                  <span>Niveau {niveau + 1} → {xpUpper} XP</span>
                </div>
                <Progress value={xpProgress} h={9} color={C.cyan} track="rgba(255,255,255,.16)" />
              </div>
            </div>
            
            {/* Badges */}
            <div style={{ display: "flex", gap: 10 }}>
              {["flame", "target", "bolt", "star"].slice(0, Math.max(1, nbBadges + 1)).map((b, i) => (
                <div key={i} style={{ width: 46, height: 46, borderRadius: 11, background: "rgba(255,255,255,.1)",
                  border: "1px solid rgba(255,255,255,.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={b} size={20} color={C.cyan} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3 Stats */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <StatCard icon="check" value={modulesTermines} label="Modules validés" />
          <StatCard icon="flame" value={serie > 0 ? `${serie} j` : "0 j"} label="Série en cours" tone="cyan" />
          <StatCard icon="star" value={nbBadges} label="Badges obtenus" />
        </div>

        {/* Modules assignés */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <H size={19}>Mes modules assignés</H>
            <span style={{ fontFamily: MONO, fontSize: 12, color: C.inkMute }}>
              {modules.filter(m => m.statut === 'done').length} / {modules.length} terminés
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {modules.map((mod, i) => (
              <ModuleRow
                key={mod.id}
                idx={i + 1}
                {...mod}
                onStart={() => onStartModule(mod)}
              />
            ))}
          </div>
        </div>

        {/* Historique */}
        {!loading && sessions.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <H size={18} style={{ marginBottom: 12 }}>Historique de sensibilisation</H>
            <Card pad={0} style={{ overflow: "hidden" }}>
              {sessions.slice(0, 5).map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderBottom: i < Math.min(sessions.length, 5) - 1 ? `1px solid ${C.border}` : "none",
                    fontFamily: SANS
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: C.ink }}>{s.module_titre ?? 'Sensibilisation IA'}</div>
                    <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>
                      {new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <span style={{ fontSize: 12, color: C.signal, fontFamily: MONO, fontWeight: 700 }}>+{s.xp_gagne ?? 0} XP</span>
                    <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 14, color: s.score / s.total_questions >= 0.7 ? C.ok : C.inkSoft }}>
                      {s.score} / {s.total_questions}
                    </span>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

