import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useOllama } from '../../hooks/useOllama.js'
import { apiUrl, API_HEADERS } from '../../utils/api.js'
import { extractPdfText } from '../../utils/pdfExtract.js'
import { C, MONO, SANS, Logo, Icon, Btn, Card, Chip, RiskBadge, Mark } from '../lhctrl-kit.jsx'

// ─── Header UI Atom ───────────────────────────────────────────────────────────

function PageHead({ title, sub, actions }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
      <div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 25, color: C.ink, letterSpacing: "-0.02em" }}>{title}</div>
        {sub && <div style={{ color: C.inkSoft, fontSize: 14, marginTop: 6, fontFamily: SANS }}>{sub}</div>}
      </div>
      <div style={{ display: "flex", gap: 10 }}>{actions}</div>
    </div>
  )
}

function Field({ label, children, hint }) {
  return (
    <div style={{ width: "100%" }}>
      <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.inkSoft, letterSpacing: "0.03em", marginBottom: 7, textTransform: "uppercase" }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: C.inkMute, marginTop: 6, fontFamily: SANS }}>{hint}</div>}
    </div>
  )
}

function Input({ placeholder, value, onChange }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        height: 44,
        border: `1px solid ${value ? C.inkSoft : C.border}`,
        borderRadius: 9,
        background: C.white,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        fontFamily: SANS,
        fontSize: 13.5,
        color: C.ink,
        outline: "none",
        boxSizing: "border-box"
      }}
    />
  )
}

// ─── KpiCard ─────────────────────────────────────────────────────────────

function KpiCard({ label, value, suffix, delta, icon }) {
  return (
    <Card pad={18} hover style={{ flex: 1, minWidth: 160 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: C.signalSoft,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={19} color={C.signal} />
        </div>
        {delta && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: MONO,
            fontSize: 11, fontWeight: 700, color: C.ok }}>▲ {delta}</span>
        )}
      </div>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 32, marginTop: 16, letterSpacing: "-0.02em", color: C.ink }}>
        {value}<span style={{ fontSize: 17, color: C.inkMute }}>{suffix}</span>
      </div>
      <div style={{ color: C.inkSoft, fontSize: 13, marginTop: 2, fontFamily: SANS }}>{label}</div>
    </Card>
  )
}

// ─── MaturityChart ───────────────────────────────────────────────────────────

function MaturityChart({ teams, sessions }) {
  const rows = teams.map(t => {
    // Find sessions for collaborators in this team
    const teamSessions = sessions.filter(s => s.concepts_maitrises === t.nom)
    const score = teamSessions.length > 0
      ? Math.round((teamSessions.reduce((acc, s) => acc + (s.score / s.total_questions), 0) / teamSessions.length) * 100)
      : 50 // fallback to baseline maturity
    return { label: t.nom, score }
  })

  return (
    <Card pad={22} style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 16, color: C.ink }}>Maturité IA par équipe</div>
          <div style={{ fontSize: 12.5, color: C.inkMute, marginTop: 3, fontFamily: SANS }}>Score moyen de sensibilisation</div>
        </div>
        <Chip tone="cyan">{teams.length} équipe{teams.length > 1 ? 's' : ''}</Chip>
      </div>
      
      {teams.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160, color: C.inkMute, fontSize: 13, fontFamily: SANS }}>
          Aucune équipe créée pour le moment.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {rows.map((row) => (
            <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 92, fontSize: 12.5, color: C.inkSoft, fontWeight: 600, textAlign: "right", fontFamily: SANS, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.label}</div>
              <div style={{ flex: 1, height: 14, background: C.bg, borderRadius: 7, overflow: "hidden", border: `1px solid ${C.border}` }}>
                <div style={{ width: `${row.score}%`, height: "100%", background: row.score < 45 ? C.cyanDeep : C.signal, borderRadius: 7 }} />
              </div>
              <div style={{ width: 38, fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.ink }}>{row.score}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── UseCase Card ─────────────────────────────────────────────────────────────

function UseCaseCard({ ucId, title, risk, desc, team, tool, risks, reco, teams, token, onGenerate, onRefresh }) {
  const [showAssign, setShowAssign] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(team || '')
  const [assigning, setAssigning] = useState(false)
  const [assigned, setAssigned] = useState(!!team)

  const handleAssignTeam = async () => {
    if (!selectedTeam) return
    setAssigning(true)
    try {
      await fetch(apiUrl(`/api/usecases/${ucId}`), {
        method: 'PUT',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify({ equipe: selectedTeam }),
      })
      setAssigned(true)
      setShowAssign(false)
      if (onRefresh) onRefresh()
    } catch { /* silencieux */ } finally { setAssigning(false) }
  }

  return (
    <div>
      <Card pad={22} style={{ position: "relative" }}>
        <div className="flex flex-col md:flex-row gap-6" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 18, color: C.ink }}>{title}</div>
              <RiskBadge level={risk} />
              {assigned && team && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 6, background: '#e0f2fe', color: '#0369a1', fontFamily: MONO, fontSize: 10, fontWeight: 700 }}>
                  <Icon name="users" size={10} color="#0369a1" /> {team}
                </span>
              )}
            </div>
            <div style={{ color: C.inkSoft, fontSize: 13.5, lineHeight: 1.5, maxWidth: 720, fontFamily: SANS }}>{desc}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              <Chip icon="bolt">{tool}</Chip>
              {risks.map((r) => <Chip key={r} tone="cyan">{r}</Chip>)}
            </div>
            <div style={{ marginTop: 16, background: C.cyan, borderRadius: 11, padding: "13px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Icon name="bulb" size={17} color={C.night} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.night, letterSpacing: "0.04em" }}>RECOMMANDATION IA</div>
                <div style={{ fontSize: 13, color: C.night, marginTop: 3, lineHeight: 1.45, fontFamily: SANS }}>{reco}</div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-auto" style={{ display: "flex", flexDirection: "column", gap: 9, alignItems: "stretch", minWidth: 168 }}>
            <div onClick={onGenerate}>
              <Btn kind="primary" icon="brain" full>Générer module</Btn>
            </div>
            <div onClick={() => setShowAssign(v => !v)}>
              <Btn kind="ghost" size="sm" icon="users" full>{showAssign ? 'Annuler' : team ? 'Changer équipe' : 'Assigner équipe'}</Btn>
            </div>
          </div>
        </div>
      </Card>

      {showAssign && (
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 14px 14px", padding: "16px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: C.ink }}>Associer ce cas d'usage à une équipe</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
              style={{ flex: 1, height: 44, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, padding: "0 14px", fontFamily: SANS, fontSize: 13.5, color: selectedTeam ? C.ink : C.inkMute, outline: "none" }}>
              <option value="">Sélectionner une équipe…</option>
              {(teams || []).map(t => <option key={t.id} value={t.nom}>{t.nom} ({t.nb_collaborateurs} collaborateurs)</option>)}
            </select>
            <div onClick={handleAssignTeam} style={{ opacity: !selectedTeam || assigning ? 0.4 : 1, pointerEvents: !selectedTeam || assigning ? "none" : "auto", flexShrink: 0 }}>
              <Btn kind="primary" size="sm">{assigning ? '…' : 'Confirmer'}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Module Card ──────────────────────────────────────────────────────────────

const catColors = {
  possibilite: { bg: '#e0f2fe', fg: '#0369a1' },
  danger:      { bg: '#fee2e2', fg: '#dc2626' },
  limite:      { bg: '#fef3c7', fg: '#d97706' },
  cyber:       { bg: '#ede9fe', fg: '#7c3aed' },
}

function ModuleCard({ moduleId, code, title, desc, level, dur, team, contenu, teams, token, onRefresh }) {
  const [showPreview, setShowPreview] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [assignTeam, setAssignTeam] = useState('')
  const [assigning, setAssigning] = useState(false)

  const scenarios = (() => {
    try { return contenu ? JSON.parse(contenu) : [] } catch { return [] }
  })()

  const handleAssign = async () => {
    if (!assignTeam) return
    setAssigning(true)
    try {
      // Trouver le module correspondant par son code pour avoir son ID
      // Le code est passé via la prop `code`
      const res = await fetch(apiUrl(`/api/modules/${moduleId}`), {
        method: 'PUT',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify({ equipes_ciblees: assignTeam }),
      })
      if (res.ok) {
        setShowAssign(false)
        setAssignTeam('')
        if (onRefresh) onRefresh()
      }
    } catch { /* silencieux */ } finally { setAssigning(false) }
  }

  return (
    <div>
      <Card pad={20} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 14, justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: C.signalSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="brain" size={21} color={C.signal} />
              </div>
              <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.inkMute }}>{code}</div>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 6, background: C.signal, color: C.white, fontFamily: MONO, fontSize: 10, fontWeight: 700 }}>
              <Icon name="bolt" size={11} color={C.white} /> PERSONNALISÉ
            </span>
          </div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 17, color: C.ink }}>{title}</div>
          <div style={{ color: C.inkSoft, fontSize: 13, marginTop: 7, lineHeight: 1.5, fontFamily: SANS }}>{desc}</div>
        </div>

        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
            <Chip>{level}</Chip><Chip icon="play">{dur}</Chip><Chip tone="cyan" icon="users">{team}</Chip>
          </div>
          <div style={{ display: "flex", gap: 9 }}>
            <div onClick={() => { setShowPreview(v => !v); setShowAssign(false) }} style={{ flex: 1 }}>
              <Btn kind="ghost" size="sm" full>{showPreview ? 'Masquer' : 'Aperçu'}</Btn>
            </div>
            <div onClick={() => { setShowAssign(v => !v); setShowPreview(false) }} style={{ flex: 1 }}>
              <Btn kind="primary" size="sm" icon="send" full>Assigner</Btn>
            </div>
          </div>
        </div>
      </Card>

      {/* Aperçu des scénarios */}
      {showPreview && (
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 14px 14px", padding: "16px 20px" }}>
          {scenarios.length === 0 ? (
            <div style={{ color: C.inkMute, fontSize: 13, fontFamily: SANS }}>Aucun contenu disponible pour ce module.</div>
          ) : scenarios.map((s, si) => {
            const col = catColors[s.categorie] || { bg: C.bg, fg: C.inkSoft }
            return (
              <div key={si} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ padding: "3px 9px", borderRadius: 6, background: col.bg, color: col.fg, fontFamily: MONO, fontWeight: 700, fontSize: 10 }}>
                    {s.categorie?.toUpperCase() || 'THÈME'}
                  </span>
                  <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: C.ink }}>{s.titre}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 12, borderLeft: `3px solid ${col.bg}` }}>
                  {(s.questions || []).map((q, qi) => (
                    <div key={qi} style={{ fontSize: 12.5, color: C.inkSoft, fontFamily: SANS }}>
                      <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 10, color: col.fg, marginRight: 6 }}>Q{qi + 1} {q.type?.toUpperCase()}</span>
                      {q.texte}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Assigner à une équipe */}
      {showAssign && (
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 14px 14px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: C.ink }}>Assigner ce module à une équipe</div>
          <select value={assignTeam} onChange={e => setAssignTeam(e.target.value)}
            style={{ width: "100%", height: 44, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, padding: "0 14px", fontFamily: SANS, fontSize: 13.5, color: assignTeam ? C.ink : C.inkMute, outline: "none" }}>
            <option value="">Sélectionner une équipe…</option>
            {(teams || []).map(t => <option key={t.id} value={t.id}>{t.nom} ({t.nb_collaborateurs} collaborateurs)</option>)}
          </select>
          <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
            <div onClick={() => setShowAssign(false)}><Btn kind="ghost" size="sm">Annuler</Btn></div>
            <div onClick={handleAssign} style={{ opacity: !assignTeam || assigning ? 0.4 : 1, pointerEvents: !assignTeam || assigning ? "none" : "auto" }}>
              <Btn kind="primary" size="sm" icon="send">{assigning ? 'Assignation…' : 'Confirmer'}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Team Card ────────────────────────────────────────────────────────────────

function TeamCard({ name, desc, count, code, onCopy, onInvite }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      if (onCopy) onCopy()
    })
  }

  return (
    <Card pad={20} hover style={{ position: "relative", display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }} className="flex-col md:flex-row">
      <div style={{ width: 52, height: 52, borderRadius: 13, background: C.cyan, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name="users" size={24} color={C.night} />
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 18, color: C.ink }}>{name}</div>
          <Chip tone="default">{count} collaborateurs</Chip>
        </div>
        <div style={{ color: C.inkSoft, fontSize: 13, marginTop: 5, fontFamily: SANS }}>{desc}</div>
      </div>
      
      {/* code d'accès */}
      <div style={{ textAlign: "center" }} className="w-full md:w-auto">
        <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.inkMute, letterSpacing: "0.06em", marginBottom: 6 }}>CODE D'ACCÈS</div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: "0.14em", color: C.signal,
          background: C.signalSoft, border: `1px dashed ${C.signal}`, borderRadius: 9, padding: "10px 18px" }}>{code}</div>
      </div>
      
      <div className="w-full md:w-auto" style={{ display: "flex", gap: 8, justifyStyle: "flex-end", justifyContent: "flex-end" }}>
        <div onClick={handleCopy}>
          <Btn kind="ghost" size="sm" icon="doc">{copied ? 'Copié ! ✓' : 'Copier'}</Btn>
        </div>
        <div onClick={onInvite}>
          <Btn kind="ghost" size="sm" icon="send">Inviter</Btn>
        </div>
      </div>
    </Card>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function AdminSidebar({ activeTab, setActiveTab, onBack, user, avgMaturity }) {
  const items = [
    { tab: "dashboard", label: "Vue d'ensemble", icon: "grid" },
    { tab: "usecases", label: "Cas d'usage", icon: "bulb" },
    { tab: "modules", label: "Modules", icon: "brain" },
    { tab: "teams", label: "Équipes", icon: "users" },
  ]
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : "AD"
  const userName = user?.name || "Administrateur"

  return (
    <div style={{ 
      width: 222, 
      minHeight: "100vh", 
      background: C.white, 
      borderRight: `1px solid ${C.border}`,
      display: "flex", 
      flexDirection: "column", 
      flexShrink: 0,
      boxSizing: "border-box"
    }}>
      <div style={{ padding: "22px 20px 18px" }}>
        <Logo size={22} />
      </div>
      
      <div style={{ height: 1, background: C.border, margin: "0 16px 14px" }} />
      
      <nav style={{ display: "flex", flexDirection: "column", gap: 3, padding: "0 12px", flex: 1 }}>
        {items.map((it) => {
          const on = it.tab === activeTab
          return (
            <div 
              key={it.tab} 
              onClick={() => setActiveTab(it.tab)}
              className="nav-item" 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 11,
                padding: "10px 12px", 
                borderRadius: 9, 
                cursor: "pointer",
                background: on ? C.signalSoft : "transparent",
                color: on ? C.signal : C.inkSoft, 
                fontWeight: on ? 700 : 500, 
                fontSize: 13.5,
                transition: "all 0.15s ease"
              }}
            >
              <Icon name={it.icon} size={17} color={on ? C.signal : C.inkMute} />
              {it.label}
            </div>
          )
        })}
      </nav>
      
      <div style={{ padding: 12, marginTop: "auto" }}>
        {/* Maturity Score */}
        <div style={{ background: C.cyan, borderRadius: 12, padding: "13px 14px" }}>
          <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.night, letterSpacing: "0.04em" }}>MATURITÉ IA</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, color: C.night, marginTop: 4 }}>{avgMaturity}<span style={{ fontSize: 14 }}>/100</span></div>
          <div style={{ fontSize: 11, color: C.night, opacity: .75, marginTop: 2 }}>Niveau organisation</div>
        </div>

        {/* User Card */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 8px 4px", marginTop: 8 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 32,
            background: C.night,
            color: C.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 700
          }}>
            {initials}
          </div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontWeight: 700, fontSize: 12.5, color: C.ink, fontFamily: SANS }}>{userName}</div>
            <div style={{ fontSize: 11, color: C.inkMute, fontFamily: SANS }}>Admin RH</div>
          </div>
        </div>

        {/* Quit */}
        <button
          onClick={onBack}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            padding: "8px 0 0",
            cursor: "pointer",
            fontFamily: MONO,
            fontSize: 11.5,
            color: C.inkMute,
            textAlign: "left",
            paddingLeft: 8
          }}
        >
          ← Déconnexion
        </button>
      </div>
    </div>
  )
}

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView({ setActiveTab, teams, usecases, sessions, companyConfig }) {
  const totalCollaborators = teams.reduce((acc, t) => acc + (t.nb_collaborateurs || 0), 0)
  const modulesFollowedPct = totalCollaborators > 0 ? Math.round((sessions.length / totalCollaborators) * 100) : 0
  
  const avgScore = sessions.length > 0
    ? Math.round((sessions.reduce((acc, s) => acc + (s.score / s.total_questions), 0) / sessions.length) * 100)
    : 0

  const lowMaturityTeamsCount = teams.filter(t => {
    const teamSessions = sessions.filter(s => s.concepts_maitrises === t.nom)
    const score = teamSessions.length > 0
      ? Math.round((teamSessions.reduce((acc, s) => acc + (s.score / s.total_questions), 0) / teamSessions.length) * 100)
      : 50
    return score < 45
  }).length

  // Parse recent activity items directly from sessions
  const activityItems = sessions.length > 0
    ? sessions.slice(0, 4).map(s => {
        const who = s.collaborateur_nom || "Collaborateur"
        const what = `a terminé « ${s.module_titre || 'Quiz'} » (${s.score}/${s.total_questions})`
        const icon = s.score === s.total_questions ? "trophy" : "check"
        const color = s.score === s.total_questions ? C.signal : C.inkMute
        return [who, what, icon, color]
      })
    : [["Aucune activité", "Aucun collaborateur n'a encore complété de module.", "users", C.inkMute]]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHead 
        title="Vue d'ensemble" 
        sub={`Pilotage de la sensibilisation IA — ${companyConfig?.companyName || 'Mon Organisation'}`}
        actions={<><Btn kind="ghost" icon="doc">Exporter</Btn><Btn kind="primary" icon="rocket">Déployer</Btn></>} 
      />

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Collaborateurs" value={String(totalCollaborators)} icon="users" />
        <KpiCard label="Modules suivis" value={String(modulesFollowedPct)} suffix="%" icon="brain" />
        <KpiCard label="Cas d'usage" value={String(usecases.length)} icon="bulb" />
        <KpiCard label="Score moyen" value={String(avgScore)} suffix="%" icon="target" />
      </div>

      {/* Sombre banner */}
      <div style={{ background: C.night, borderRadius: 16, padding: "26px 30px",
        display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", overflow: "hidden" }} className="flex-col md:flex-row gap-6">
        <div style={{ position: "absolute", right: -20, top: -30, opacity: .14 }}>
          <Mark size={200} color={C.cyan} />
        </div>
        <div style={{ position: "relative", flex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.cyan }}>
            Rappel de gouvernance
          </div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, color: C.white, marginTop: 10, letterSpacing: "-0.02em" }}>
            « L'IA, ça se contrôle. »
          </div>
          <div style={{ color: "rgba(255,255,255,.72)", fontSize: 13.5, marginTop: 8, maxWidth: 520, fontFamily: SANS, lineHeight: 1.5 }}>
            {lowMaturityTeamsCount > 0
              ? `${lowMaturityTeamsCount} équipe${lowMaturityTeamsCount > 1 ? 's sont' : ' est'} sous le seuil de maturité recommandé. Générez un module ciblé pour les remettre à niveau.`
              : "Toutes les équipes ont atteint le seuil de maturité recommandé. Excellent pilotage !"}
          </div>
        </div>
        <div onClick={() => setActiveTab('usecases')} style={{ position: "relative" }}>
          <Btn kind="soft" size="lg" icon="arrowR">Voir les recommandations</Btn>
        </div>
      </div>

      {/* Chart and activity */}
      <div className="flex flex-col lg:flex-row gap-4" style={{ alignItems: "stretch" }}>
        <MaturityChart teams={teams} sessions={sessions} />
        
        <Card pad={22} style={{ flexShrink: 0 }} className="w-full lg:w-80">
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 16, color: C.ink, marginBottom: 16 }}>Activité récente</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {activityItems.map(([who, what, ic, col], i) => (
              <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={ic} size={15} color={col} />
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.4, color: C.ink, fontFamily: SANS }}>
                  <span style={{ fontWeight: 700 }}>{who}</span> <span style={{ color: C.inkSoft }}>{what}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── UseCases View ────────────────────────────────────────────────────────────

const RISK_LEVELS = ['Faible', 'Modéré', 'Élevé']
const AI_TOOLS = ['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Mistral', 'Notion AI', 'Autre']

function UseCasesView({ usecases, teams, onGenerateModule, token, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState({ intitule: '', equipe: '', outil_ia: 'ChatGPT', niveau_risque: 'Modéré', description: '' })
  const [saving, setSaving] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!draft.intitule.trim()) return
    setSaving(true)
    try {
      await fetch(apiUrl('/api/usecases'), {
        method: 'POST',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify(draft),
      })
      setDraft({ intitule: '', equipe: '', outil_ia: 'ChatGPT', niveau_risque: 'Modéré', description: '' })
      setShowForm(false)
      if (onRefresh) onRefresh()
    } catch { /* silencieux */ } finally { setSaving(false) }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHead
        title="Cas d'usage IA"
        sub={`${usecases.length} usage${usecases.length > 1 ? 's' : ''} identifié${usecases.length > 1 ? 's' : ''} — triés par niveau de risque`}
        actions={
          <div onClick={() => setShowForm(v => !v)}>
            <Btn kind="primary" icon={showForm ? "x" : "plus"}>{showForm ? 'Annuler' : 'Ajouter un cas'}</Btn>
          </div>
        }
      />

      {/* Formulaire d'ajout */}
      {showForm && (
        <form onSubmit={handleAdd} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 15, color: C.ink }}>Nouveau cas d'usage</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Intitulé du cas d'usage">
              <Input placeholder="Ex : Analyse de CV via IA" value={draft.intitule} onChange={e => setDraft({...draft, intitule: e.target.value})} />
            </Field>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Field label="Équipe concernée">
                  <Input placeholder="Ex : RH, Commercial…" value={draft.equipe} onChange={e => setDraft({...draft, equipe: e.target.value})} />
                </Field>
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Outil IA utilisé">
                  <select value={draft.outil_ia} onChange={e => setDraft({...draft, outil_ia: e.target.value})}
                    style={{ width: "100%", height: 44, border: `1px solid ${C.border}`, borderRadius: 9, background: C.white, padding: "0 14px", fontFamily: SANS, fontSize: 13.5, color: C.ink, outline: "none", appearance: "none" }}>
                    {AI_TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              </div>
            </div>
            <Field label="Niveau de risque">
              <div style={{ display: "flex", gap: 8 }}>
                {RISK_LEVELS.map(r => (
                  <div key={r} onClick={() => setDraft({...draft, niveau_risque: r})} style={{ cursor: "pointer" }}>
                    <Chip sel={draft.niveau_risque === r}>{r}</Chip>
                  </div>
                ))}
              </div>
            </Field>
            <Field label="Description (optionnel)">
              <textarea value={draft.description} onChange={e => setDraft({...draft, description: e.target.value})}
                placeholder="Décrivez le contexte d'usage…" rows={2}
                style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 9, background: C.white, padding: "10px 14px", fontFamily: SANS, fontSize: 13.5, color: C.ink, outline: "none", resize: "none", boxSizing: "border-box" }} />
            </Field>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" style={{ background: "none", border: "none", padding: 0, cursor: saving ? "not-allowed" : "pointer" }} disabled={saving}>
              <Btn kind="primary" size="sm">{saving ? 'Enregistrement…' : 'Ajouter ce cas'}</Btn>
            </button>
          </div>
        </form>
      )}

      {usecases.length === 0 && !showForm ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 48, background: C.white, border: `1px solid ${C.border}`, borderRadius: 14 }}>
          <span style={{ fontSize: 40 }}>💡</span>
          <div style={{ fontFamily: MONO, fontSize: 14, color: C.inkMute }}>Aucun cas d'usage déclaré</div>
          <div onClick={() => setShowForm(true)}><Btn kind="primary" size="sm">Déclarer le premier cas</Btn></div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {usecases.map((uc) => {
            const risks = uc.risques || (uc.niveau_risque === 'Élevé' ? ["Biais", "RGPD", "Discrimination"] : ["Fuite de données", "Confidentialité"])
            return (
              <UseCaseCard
                key={uc.id}
                ucId={uc.id}
                title={uc.intitule}
                risk={uc.niveau_risque}
                desc={uc.description || "Cas d'usage identifié dans l'organisation."}
                team={uc.equipe || ""}
                tool={uc.outil_ia || uc.outil || "ChatGPT"}
                risks={risks}
                reco={uc.recommandation || "Sensibilisez l'équipe aux risques liés à cet usage IA."}
                teams={teams}
                token={token}
                onGenerate={() => onGenerateModule(uc)}
                onRefresh={onRefresh}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Generate Module Panel (inline dans Modules) ──────────────────────────────

function GenerateModulePanel({ token, companyConfig, usecases, prefillUsecase, onSaved, onCancel }) {
  const { saveConfig } = useApp()
  const { generateSituations, loading, error } = useOllama()

  const [selectedUcId, setSelectedUcId] = useState(prefillUsecase?.id || '')
  const [count, setCount] = useState(2)
  const [questionsPerScenario, setQuestionsPerScenario] = useState(3)
  const [pdfText, setPdfText] = useState('')
  const [pdfName, setPdfName] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [genProgress, setGenProgress] = useState(null)
  const [genError, setGenError] = useState(null)

  // Cas d'usage sélectionné (soit pré-rempli, soit choisi dans la liste)
  const selectedUc = prefillUsecase || (usecases || []).find(u => u.id === selectedUcId) || null

  async function handlePdf(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setExtracting(true)
    try {
      const text = await extractPdfText(file)
      setPdfText(text)
      setPdfName(file.name)
    } catch { setPdfText('') } finally { setExtracting(false) }
  }

  async function handleGenerate(e) {
    e.preventDefault()
    setGenError(null)

    // Construire le contexte à partir du profil org + cas d'usage (plus de doublons)
    const config = {
      companyName: companyConfig?.companyName || 'Organisation',
      sector: selectedUc?.equipe
        ? `${companyConfig?.sector || 'Entreprise'} — équipe ${selectedUc.equipe}`
        : (companyConfig?.sector || 'Entreprise'),
      size: companyConfig?.size || '',
      tools: selectedUc?.outil_ia || companyConfig?.tools || 'ChatGPT',
      context: selectedUc
        ? `Cas d'usage : ${selectedUc.intitule}. Niveau de risque : ${selectedUc.niveau_risque || 'Modéré'}. ${selectedUc.description || ''} ${selectedUc.recommandation || ''}`
        : '',
      documentContext: pdfText ? pdfText.slice(0, 6000) : undefined,
    }

    setGenProgress({ current: 0, total: count })
    const situations = await generateSituations(config, count, questionsPerScenario, (c, t) => setGenProgress({ current: c, total: t }))
    setGenProgress(null)
    if (!situations) { setGenError(error || 'Génération échouée'); return }

    await saveConfig(config, situations)

    try {
      const titre = selectedUc
        ? `${selectedUc.intitule} — ${companyConfig?.companyName || 'Organisation'}`
        : `Sensibilisation IA — ${companyConfig?.companyName || 'Organisation'}`
      await fetch(apiUrl('/api/modules'), {
        method: 'POST',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          titre,
          description: `${count} thème${count > 1 ? 's' : ''} · ${questionsPerScenario} questions/thème${selectedUc?.equipe ? ` · Équipe ${selectedUc.equipe}` : ''}`,
          categorie: selectedUc?.equipe || companyConfig?.sector || 'Fondamentaux',
          niveau: selectedUc?.niveau_risque === 'Élevé' ? 'advanced' : 'intermediate',
          duree_min: count * questionsPerScenario * 2,
          personnalise: true,
          contenu: JSON.stringify(situations),
        }),
      })
    } catch { /* silencieux */ }

    if (onSaved) onSaved()
  }

  const numInput = (label, val, setVal, min, max) => (
    <Field label={label}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button type="button" onClick={() => setVal(v => Math.max(min, v - 1))}
          style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", fontFamily: MONO, fontWeight: 700, fontSize: 16, color: C.ink }}>−</button>
        <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 20, color: C.ink, minWidth: 28, textAlign: "center" }}>{val}</span>
        <button type="button" onClick={() => setVal(v => Math.min(max, v + 1))}
          style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", fontFamily: MONO, fontWeight: 700, fontSize: 16, color: C.ink }}>+</button>
      </div>
    </Field>
  )

  return (
    <Card pad={26}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 17, color: C.ink }}>Générer un module IA</div>
          <div style={{ fontSize: 12.5, color: C.inkMute, marginTop: 3, fontFamily: SANS }}>L'IA crée des scénarios quiz à partir du profil de l'organisation et du cas d'usage.</div>
        </div>
        <div onClick={onCancel}><Btn kind="ghost" size="sm" icon="x">Annuler</Btn></div>
      </div>

      <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Sélecteur de cas d'usage */}
        {!prefillUsecase && (
          <Field label="Cas d'usage ciblé" hint="Choisissez le cas d'usage pour lequel générer ce module de formation.">
            <select value={selectedUcId} onChange={e => setSelectedUcId(e.target.value)}
              style={{ width: "100%", height: 44, border: `1px solid ${selectedUcId ? C.signal : C.border}`, borderRadius: 9, background: C.white, padding: "0 14px", fontFamily: SANS, fontSize: 13.5, color: selectedUcId ? C.ink : C.inkMute, outline: "none" }}>
              <option value="">Aucun — module générique</option>
              {(usecases || []).map(uc => (
                <option key={uc.id} value={uc.id}>
                  {uc.intitule} {uc.niveau_risque ? `(${uc.niveau_risque})` : ''} {uc.equipe ? `— ${uc.equipe}` : ''}
                </option>
              ))}
            </select>
          </Field>
        )}

        {/* Résumé du cas d'usage sélectionné */}
        {selectedUc && (
          <div style={{ background: C.signalSoft, border: `1px solid ${C.signal}`, borderRadius: 11, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <Icon name="bulb" size={16} color={C.signal} />
            <div style={{ fontSize: 13, color: C.ink, fontFamily: SANS, lineHeight: 1.5 }}>
              <strong>{selectedUc.intitule}</strong>
              {selectedUc.equipe && <> · Équipe <strong>{selectedUc.equipe}</strong></>}
              {selectedUc.outil_ia && <> · Outil <strong>{selectedUc.outil_ia}</strong></>}
              {selectedUc.niveau_risque && <> · Risque <strong>{selectedUc.niveau_risque}</strong></>}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 24 }}>
          {numInput("Nombre de thèmes", count, setCount, 1, 5)}
          {numInput("Questions / thème", questionsPerScenario, setQuestionsPerScenario, 1, 10)}
        </div>

        {/* PDF */}
        <Field label="Document de contexte (PDF, optionnel)" hint="Le contenu du PDF alimente la génération des scénarios.">
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: `1px dashed ${C.border}`, borderRadius: 9, cursor: "pointer", background: pdfName ? C.cyan : C.bg }}>
            <Icon name="doc" size={16} color={pdfName ? C.night : C.inkMute} />
            <span style={{ fontFamily: SANS, fontSize: 13, color: pdfName ? C.night : C.inkMute }}>
              {extracting ? 'Lecture du PDF…' : pdfName ? `✓ ${pdfName}` : 'Choisir un PDF…'}
            </span>
            <input type="file" accept=".pdf" onChange={handlePdf} style={{ display: "none" }} />
          </label>
        </Field>

        {(genError || error) && (
          <div style={{ padding: "10px 14px", borderRadius: 9, background: C.badBg, border: `1px solid ${C.bad}`, color: C.bad, fontSize: 12.5, fontFamily: SANS }}>
            {genError || error}
          </div>
        )}

        {genProgress && (
          <div style={{ padding: "12px 16px", borderRadius: 9, background: C.signalSoft, border: `1px solid ${C.signal}`, fontFamily: MONO, fontSize: 12, color: C.signal }}>
            Génération thème {genProgress.current}/{genProgress.total}…
          </div>
        )}

        <button type="submit" disabled={loading} style={{ background: "none", border: "none", padding: 0, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
          <Btn kind="primary" size="lg" icon="brain" full>
            {loading ? `Génération en cours…` : `Générer ${count} thème${count > 1 ? 's' : ''} (${count * questionsPerScenario} questions)`}
          </Btn>
        </button>
      </form>
    </Card>
  )
}

// ─── Modules View ─────────────────────────────────────────────────────────────

function ModulesView({ modules, teams, usecases, token, companyConfig, pendingUsecase, onModuleSaved }) {
  const [showGenerate, setShowGenerate] = useState(!!pendingUsecase)

  // Si un cas d'usage arrive en attente, ouvrir automatiquement le panneau
  useState(() => { if (pendingUsecase) setShowGenerate(true) })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHead
        title="Modules"
        sub={`${modules.length} module${modules.length > 1 ? 's' : ''} disponible${modules.length > 1 ? 's' : ''} pour l'organisation`}
        actions={
          <div onClick={() => setShowGenerate(v => !v)}>
            <Btn kind="primary" icon={showGenerate ? "x" : "bolt"}>{showGenerate ? 'Annuler' : 'Générer un module'}</Btn>
          </div>
        }
      />

      {pendingUsecase && showGenerate && (
        <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 11, padding: "11px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <Icon name="bulb" size={16} color="#0369a1" />
          <span style={{ fontFamily: SANS, fontSize: 13.5, color: '#0369a1' }}>
            Génération liée au cas d'usage <strong>"{pendingUsecase.intitule}"</strong>
            {pendingUsecase.equipe ? ` — équipe ${pendingUsecase.equipe}` : ''}.
            Le contexte a été pré-rempli.
          </span>
        </div>
      )}

      {showGenerate && (
        <GenerateModulePanel
          token={token}
          companyConfig={companyConfig}
          usecases={usecases}
          prefillUsecase={pendingUsecase}
          onSaved={() => { setShowGenerate(false); if (onModuleSaved) onModuleSaved() }}
          onCancel={() => setShowGenerate(false)}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {modules.map((mod) => (
          <ModuleCard
            key={mod.id}
            moduleId={mod.id}
            code={mod.code}
            title={mod.titre}
            desc={mod.description || "Module de sensibilisation à l'IA personnalisé."}
            level={mod.niveau}
            dur={`${mod.duree_min} min`}
            team={mod.categorie}
            contenu={mod.contenu}
            teams={teams}
            token={token}
            onRefresh={onModuleSaved}
          />
        ))}

        {!showGenerate && (
          <div
            onClick={() => setShowGenerate(true)}
            style={{ border: `2px dashed ${C.border}`, borderRadius: 14, padding: 20, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, minHeight: 200, cursor: "pointer" }}
          >
            <div style={{ width: 46, height: 46, borderRadius: 12, background: C.cyan, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="plus" size={22} color={C.night} />
            </div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 14, color: C.ink }}>Générer un nouveau module</div>
            <div style={{ fontSize: 12.5, color: C.inkMute, textAlign: "center", maxWidth: 240, fontFamily: SANS }}>L'IA crée des scénarios quiz à partir du profil de votre organisation.</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Teams View ───────────────────────────────────────────────────────────────

function TeamsView({ teams, token, onTeamCreated }) {
  const [showForm, setShowForm] = useState(false)
  const [formNom, setFormNom] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formNom.trim()) return
    setCreating(true)
    try {
      const res = await fetch(apiUrl('/api/teams'), {
        method: 'POST',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nom: formNom.trim(), description: formDesc.trim() }),
      })
      if (!res.ok) throw new Error('API error')
      setFormNom('')
      setFormDesc('')
      setShowForm(false)
      if (onTeamCreated) onTeamCreated()
    } catch {
      // Fallback fallback visual team mock creation if offline or fail
      setFormNom('')
      setFormDesc('')
      setShowForm(false)
      if (onTeamCreated) onTeamCreated()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHead 
        title="Équipes" 
        sub="Partagez un code d'accès pour rattacher les collaborateurs"
        actions={
          <div onClick={() => setShowForm((v) => !v)}>
            <Btn kind="primary" icon={showForm ? "x" : "plus"}>
              {showForm ? 'Annuler' : 'Créer une équipe'}
            </Btn>
          </div>
        } 
      />

      {/* Formulaire de création */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginBottom: 8
          }}
        >
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 16, color: C.ink }}>Nouvelle équipe</div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Nom de l'équipe">
              <Input
                placeholder="Ex : Commercial, Marketing..."
                value={formNom}
                onChange={(e) => setFormNom(e.target.value)}
              />
            </Field>
            
            <Field label="Description">
              <Input
                placeholder="Ex : Force de vente terrain & grands comptes"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </Field>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button type="submit" style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }} disabled={creating}>
              <Btn kind="primary" size="sm">{creating ? 'Création…' : 'Créer l\'équipe'}</Btn>
            </button>
          </div>
        </form>
      )}

      {/* Teams List */}
      {teams.length === 0 && !showForm ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 48, background: C.white, border: `1px solid ${C.border}`, borderRadius: 14 }}>
          <span style={{ fontSize: 40 }}>👥</span>
          <div style={{ fontFamily: MONO, fontSize: 14, color: C.inkMute }}>Aucune équipe créée</div>
          <div onClick={() => setShowForm(true)}>
            <Btn kind="primary" size="sm">Créer la première équipe</Btn>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {teams.map((team) => (
            <TeamCard 
              key={team.id} 
              name={team.nom}
              desc={team.description || (team.nom === "Commercial" ? "Force de vente terrain & grands comptes" : team.nom === "RH" ? "Recrutement, paie & formation" : "Membres de l'équipe de sensibilisation.")}
              count={team.nb_collaborateurs}
              code={team.code_acces}
              onInvite={() => alert(`Invitation envoyée pour l'équipe ${team.nom} !`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── AdminHub (main export) ───────────────────────────────────────────────────

export default function AdminHub({ onBack, onGenerateModule }) {
  const { user, token, companyConfig } = useApp()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [pendingUsecase, setPendingUsecase] = useState(null) // use case à pré-remplir dans la génération

  // Unified lists state
  const [usecases, setUsecases] = useState([])
  const [modules, setModules] = useState([])
  const [teams, setTeams] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const [resUsecases, resModules, resTeams, resSessions] = await Promise.all([
        fetch(apiUrl('/api/usecases'), { headers: { ...API_HEADERS, Authorization: `Bearer ${token}` } }),
        fetch(apiUrl('/api/modules'), { headers: { ...API_HEADERS, Authorization: `Bearer ${token}` } }),
        fetch(apiUrl('/api/teams'), { headers: { ...API_HEADERS, Authorization: `Bearer ${token}` } }),
        fetch(apiUrl('/api/sessions'), { headers: { ...API_HEADERS, Authorization: `Bearer ${token}` } }),
      ])

      const uData = resUsecases.ok ? await resUsecases.json() : []
      const mData = resModules.ok ? await resModules.json() : []
      const tData = resTeams.ok ? await resTeams.json() : []
      const sData = resSessions.ok ? await resSessions.json() : []

      setUsecases(uData && uData.length > 0 ? uData : [])
      setModules(mData && mData.length > 0 ? mData.filter(m => m.code !== 'QUIZ_CONFIG') : [])
      setTeams(tData && tData.length > 0 ? tData : [])
      setSessions(sData && sData.length > 0 ? sData : [])
    } catch {
      // fail silent, keeps states
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [token])

  // Depuis un cas d'usage : bascule vers l'onglet Modules avec le contexte pré-rempli
  const handleGenerateModule = (uc) => {
    if (uc) setPendingUsecase(uc)
    setActiveTab('modules')
  }

  const avgMaturity = sessions.length > 0
    ? Math.round((sessions.reduce((acc, s) => acc + (s.score / s.total_questions), 0) / sessions.length) * 100)
    : 0

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
        <span className="animate-pulse" style={{ fontFamily: MONO, fontSize: 14, color: C.inkMute }}>Chargement des données de l'organisation…</span>
      </div>
    )
  }

  return (
    <div style={{ 
      width: "100%", 
      minHeight: "100vh", 
      background: C.bg, 
      fontFamily: SANS, 
      color: C.ink, 
      display: "flex" 
    }}>
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} onBack={onBack} user={user} avgMaturity={avgMaturity} />
      
      <div style={{ flex: 1, padding: "30px 36px", overflowY: "auto", boxSizing: "border-box" }} className="h-screen">
        {activeTab === 'dashboard' && (
          <DashboardView 
            setActiveTab={setActiveTab} 
            teams={teams} 
            usecases={usecases} 
            sessions={sessions} 
            companyConfig={companyConfig} 
          />
        )}
        {activeTab === 'usecases' && (
          <UseCasesView
            usecases={usecases}
            teams={teams}
            onGenerateModule={handleGenerateModule}
            token={token}
            onRefresh={fetchData}
          />
        )}
        {activeTab === 'modules' && (
          <ModulesView
            modules={modules}
            teams={teams}
            usecases={usecases}
            token={token}
            companyConfig={companyConfig}
            pendingUsecase={pendingUsecase}
            onModuleSaved={() => { setPendingUsecase(null); fetchData() }}
          />
        )}
        {activeTab === 'teams' && (
          <TeamsView 
            teams={teams} 
            token={token} 
            onTeamCreated={fetchData} 
          />
        )}
      </div>
    </div>
  )
}
