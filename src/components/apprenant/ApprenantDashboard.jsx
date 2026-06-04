import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { apiUrl, API_HEADERS } from '../../utils/api.js'
import { downloadAttestation } from '../../utils/attestation.js'
import { C, MONO, SANS, Logo, Icon, Btn, Card, Chip, Avatar, Kicker, H, Progress, Mark } from '../lhctrl-kit.jsx'


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

function ModuleRow({ titre, categorie, duree_min, statut, idx, onStart, session, collaboratorNom, orgNom }) {
  const done = statut === 'done', current = statut === 'current'
  const sessionPct = session && session.total_questions > 0
    ? Math.round((session.score / session.total_questions) * 100)
    : 0
  const canAttestation = done && session && sessionPct >= 70

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, background: C.white, border: `1px solid ${current ? C.signal : C.border}`, borderRadius: 13, boxShadow: current ? `0 0 0 3px ${C.signalSoft}` : "none", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px" }}>
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
            {done && session && <Chip tone={sessionPct >= 70 ? "default" : "ghost"}>{sessionPct}%</Chip>}
          </div>
        </div>
        {done ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Chip tone="default" icon="check">Terminé</Chip>
            <button onClick={onStart} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <Btn kind="ghost" size="sm" icon="play">Rejouer</Btn>
            </button>
          </div>
        ) : current ? (
          <button onClick={onStart} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
            <Btn kind="primary" icon="play">Démarrer</Btn>
          </button>
        ) : (
          <Btn kind="ghost" state="disabled">Démarrer</Btn>
        )}
      </div>
      {canAttestation && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "10px 18px", background: C.okBg }}>
          <button
            onClick={() => downloadAttestation({ collaboratorNom: collaboratorNom ?? 'Apprenant', moduleTitre: titre, score: session.score, total: session.total_questions, pct: sessionPct, orgNom })}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <Btn kind="ghost" size="sm" icon="doc">Télécharger l'attestation</Btn>
          </button>
        </div>
      )}
    </div>
  )
}

export default function ApprenantDashboard({ onStartModule, onLogout }) {
  const { collaborator, token, setCollaborator, companyConfig } = useApp()
  const [sessions, setSessions] = useState([])
  const [assignedModules, setAssignedModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [teamRoles, setTeamRoles] = useState([])

  const nomParts = (collaborator?.nom ?? '').trim().split(' ')
  const prenom = nomParts[0] ?? ''
  const nomFamille = nomParts.slice(1).join(' ')

  const startEdit = (field, value) => {
    setEditingField(field)
    setEditValues(v => ({ ...v, [field]: value }))
  }

  const saveEdit = async (field) => {
    setEditingField(null)
    const val = editValues[field]?.trim()
    if (!val || !collaborator?.id) return
    const newPrenom = field === 'prenom' ? val : prenom
    const newNom = field === 'nom' ? val : nomFamille
    const newRole = field === 'role' ? val : (collaborator?.role ?? '')
    const fullNom = `${newPrenom} ${newNom}`.trim()
    try {
      await fetch(apiUrl(`/api/collaborators/${collaborator.id}`), {
        method: 'PUT',
        headers: API_HEADERS,
        body: JSON.stringify({ nom: fullNom, role: newRole }),
      })
      setCollaborator({ ...collaborator, nom: fullNom, role: newRole })
    } catch { /* silencieux */ }
  }

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

  // Charger les modules assignés à l'équipe du collaborateur
  useEffect(() => {
    if (collaborator?.team_id) {
      fetch(apiUrl(`/api/modules/team/${collaborator.team_id}`), { headers: API_HEADERS })
        .then(r => r.ok ? r.json() : [])
        .then(data => setAssignedModules(Array.isArray(data) ? data : []))
        .catch(() => setAssignedModules([]))
    }
  }, [collaborator?.team_id])

  const totalXP = collaborator?.xp ?? 0

  // Niveau calculé depuis l'XP (pas depuis la BD qui n'est jamais mise à jour)
  const XP_LEVELS = [0, 100, 300, 600, 1000]
  const niveau = XP_LEVELS.reduce((lvl, threshold, i) => totalXP >= threshold ? i + 1 : lvl, 1)
  const xpLower = XP_LEVELS[niveau - 1] ?? 0
  const xpUpper = XP_LEVELS[niveau] ?? XP_LEVELS[XP_LEVELS.length - 1]
  const xpProgress = xpUpper > xpLower ? Math.min(1, (totalXP - xpLower) / (xpUpper - xpLower)) : 1

  const labelsMaturite = ['Émergent', 'Intermédiaire', 'Avancé', 'Expert', 'Expert']
  const labelMaturite = labelsMaturite[niveau - 1] ?? 'Expert'

  // Uniquement les modules réellement assignés à l'équipe
  const baseModules = assignedModules

  // Calcul dynamique de la progression réelle basée sur les sessions
  const completedModuleIds = new Set(sessions.map(s => s.module_id).filter(Boolean))
  const modules = baseModules.map((mod, index) => {
    let statut = 'todo'
    if (completedModuleIds.has(mod.id) || index < sessions.length) {
      statut = 'done'
    } else if (index === sessions.filter(s => !completedModuleIds.has(s.module_id) || completedModuleIds.size === 0).length || index === sessions.length) {
      statut = 'current'
    }
    // Premier module non terminé = current
    return { ...mod, statut }
  })
  // Recalcul propre : done si session avec ce module_id existe, current le premier non-done
  const propModules = baseModules.map((mod) => {
    const done = completedModuleIds.has(mod.id)
    return { ...mod, statut: done ? 'done' : null }
  })
  let firstCurrentSet = false
  const finalModules = propModules.map((mod) => {
    if (mod.statut === 'done') return mod
    if (!firstCurrentSet) { firstCurrentSet = true; return { ...mod, statut: 'current' } }
    return { ...mod, statut: 'todo' }
  })

  const modulesTermines = completedModuleIds.size || sessions.length
  const serie = sessions.length

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.ink, fontFamily: SANS }}>
      {/* Header */}
      <div style={{ height: 60, borderBottom: `1px solid ${C.border}`, background: C.white,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <Logo size={20} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Icon name="bell" size={19} color={C.inkSoft} />
          <div style={{ position: "relative" }}>
            <div onClick={() => setShowMenu(v => !v)} style={{ cursor: "pointer" }}>
              <Avatar size={32} label={getInitials(collaborator?.nom)} color={C.signal} />
            </div>
            {showMenu && (
              <>
                <div onClick={() => setShowMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
                <div style={{ position: "absolute", top: 40, right: 0, background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.1)", zIndex: 20, minWidth: 160, overflow: "hidden" }}>
                  <div onClick={() => {
              setShowMenu(false); setShowProfile(true)
              if (collaborator?.team_id) {
                fetch(apiUrl(`/api/teams/${collaborator.team_id}/roles`), { headers: API_HEADERS })
                  .then(r => r.ok ? r.json() : []).then(setTeamRoles).catch(() => setTeamRoles([]))
              }
            }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer", fontFamily: SANS, fontSize: 13.5, color: C.ink, borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Icon name="user" size={15} color={C.inkSoft} />
                    Profil
                  </div>
                  <div onClick={() => { setShowMenu(false); onLogout() }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer", fontFamily: SANS, fontSize: 13.5, color: C.bad }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Icon name="x" size={15} color={C.bad} />
                    Déconnexion
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Profil */}
      {showProfile && (
        <div onClick={() => setShowProfile(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.white, borderRadius: 20, padding: 32, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 18, color: C.ink }}>Mon profil</div>
              <div onClick={() => setShowProfile(false)} style={{ cursor: "pointer", color: C.inkMute }}>
                <Icon name="x" size={18} color={C.inkMute} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <Avatar size={72} label={getInitials(collaborator?.nom)} color={C.signal} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { field: 'prenom', label: "Prénom", value: prenom, editable: true },
                { field: 'nom', label: "Nom", value: nomFamille || '—', editable: true },
                { field: 'email', label: "Adresse e-mail", value: collaborator?.email || '—', editable: false },
                { field: 'role', label: "Rôle", value: collaborator?.role || '—', editable: true },
                { field: 'equipe', label: "Équipe", value: collaborator?.teamName || '—', editable: false },
              ].map(({ field, label, value, editable }) => (
                <div key={field} style={{ padding: "12px 16px", background: C.bg, borderRadius: 11, border: `1px solid ${editingField === field ? C.signal : C.border}`, transition: "border-color 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.inkMute, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
                    {editable && editingField !== field && (
                      <div onClick={() => startEdit(field, value === '—' ? '' : value)} style={{ cursor: "pointer", opacity: 0.4, transition: "opacity 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0.4}>
                        <Icon name="pencil" size={13} color={C.inkSoft} />
                      </div>
                    )}
                    {editable && editingField === field && (
                      <div onClick={() => saveEdit(field)} style={{ cursor: "pointer", fontFamily: MONO, fontSize: 11, color: C.signal, fontWeight: 700 }}>✓</div>
                    )}
                  </div>
                  {editable && editingField === field ? (
                    field === 'role' && teamRoles.length > 0 ? (
                      <select
                        autoFocus
                        value={editValues[field] ?? ''}
                        onChange={e => setEditValues(v => ({ ...v, [field]: e.target.value }))}
                        onBlur={() => saveEdit(field)}
                        style={{ width: "100%", border: "none", background: "transparent", fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: C.ink, outline: "none", padding: 0, cursor: "pointer" }}
                      >
                        <option value="">— Sélectionner —</option>
                        {teamRoles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <input
                        autoFocus
                        value={editValues[field] ?? ''}
                        onChange={e => setEditValues(v => ({ ...v, [field]: e.target.value }))}
                        onBlur={() => saveEdit(field)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(field); if (e.key === 'Escape') setEditingField(null) }}
                        style={{ width: "100%", border: "none", background: "transparent", fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: C.ink, outline: "none", padding: 0 }}
                      />
                    )
                  ) : (
                    <div style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: C.ink }}>{value}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
            
          </div>
        </div>

        {/* 3 Stats */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <StatCard icon="check" value={modulesTermines} label="Modules validés" />
          <StatCard icon="flame" value={serie > 0 ? `${serie} j` : "0 j"} label="Série en cours" tone="cyan" />
          <StatCard icon="target" value={`${totalXP} XP`} label={`Niveau ${niveau} — ${labelMaturite}`} />
        </div>

        {/* Modules assignés */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <H size={19}>Mes modules assignés</H>
            <span style={{ fontFamily: MONO, fontSize: 12, color: C.inkMute }}>
              {finalModules.filter(m => m.statut === 'done').length} / {finalModules.length} terminés
            </span>
          </div>
          {finalModules.length === 0 ? (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 13, padding: "32px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <Icon name="brain" size={32} color={C.inkMute} />
              <div style={{ fontFamily: MONO, fontSize: 14, color: C.inkMute }}>Aucun module assigné pour le moment</div>
              <div style={{ fontSize: 13, color: C.inkMute, fontFamily: SANS }}>Votre référent RH vous assignera bientôt un module de sensibilisation.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {finalModules.map((mod, i) => {
                const modSession = sessions
                  .filter(s => s.module_id === mod.id)
                  .sort((a, b) => (b.score / Math.max(b.total_questions, 1)) - (a.score / Math.max(a.total_questions, 1)))[0]
                return (
                  <ModuleRow
                    key={mod.id}
                    idx={i + 1}
                    {...mod}
                    onStart={() => onStartModule(mod)}
                    session={modSession}
                    collaboratorNom={collaborator?.nom}
                    orgNom={companyConfig?.companyName}
                  />
                )
              })}
            </div>
          )}
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

