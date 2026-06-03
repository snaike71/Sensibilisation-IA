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
        <div style={{
          width: 38, height: 38, borderRadius: 10, background: C.signalSoft,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Icon name={icon} size={19} color={C.signal} />
        </div>
        {delta && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3, fontFamily: MONO,
            fontSize: 11, fontWeight: 700, color: C.ok
          }}>▲ {delta}</span>
        )}
      </div>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 32, marginTop: 16, letterSpacing: "-0.02em", color: C.ink }}>
        {value}<span style={{ fontSize: 17, color: C.inkMute }}>{suffix}</span>
      </div>
      <div style={{ color: C.inkSoft, fontSize: 13, marginTop: 2, fontFamily: SANS }}>{label}</div>
    </Card>
  )
}

// ─── TeamFilterBar ────────────────────────────────────────────────────────────

function TeamFilterBar({ teams, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.inkMute, letterSpacing: "0.04em", textTransform: "uppercase", marginRight: 4 }}>Équipe</span>
      <button
        onClick={() => onChange(null)}
        style={{ padding: "5px 12px", borderRadius: 7, border: `1.5px solid ${!value ? C.signal : C.border}`, background: !value ? C.signalSoft : C.white, color: !value ? C.signal : C.inkSoft, fontFamily: SANS, fontSize: 12.5, fontWeight: !value ? 700 : 500, cursor: "pointer", transition: "all 0.15s" }}
      >
        Toutes
      </button>
      {teams.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.nom)}
          style={{ padding: "5px 12px", borderRadius: 7, border: `1.5px solid ${value === t.nom ? C.signal : C.border}`, background: value === t.nom ? C.signalSoft : C.white, color: value === t.nom ? C.signal : C.inkSoft, fontFamily: SANS, fontSize: 12.5, fontWeight: value === t.nom ? 700 : 500, cursor: "pointer", transition: "all 0.15s" }}
        >
          {t.nom}
        </button>
      ))}
    </div>
  )
}

// ─── MaturityChart ────────────────────────────────────────────────────────────

function MaturityChart({ teams, sessions }) {
  const rows = teams.map(t => {
    const teamSessions = sessions.filter(s => s.team_id === t.id)
    const score = teamSessions.length > 0
      ? Math.round((teamSessions.reduce((acc, s) => acc + (s.score / Math.max(s.total_questions, 1)), 0) / teamSessions.length) * 100)
      : null
    return { label: t.nom, score, hasSessions: teamSessions.length > 0 }
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
                {row.hasSessions && <div style={{ width: `${row.score}%`, height: "100%", background: row.score < 45 ? C.cyanDeep : C.signal, borderRadius: 7 }} />}
              </div>
              <div style={{ width: 38, fontFamily: MONO, fontSize: 12, fontWeight: 700, color: row.hasSessions ? C.ink : C.inkMute }}>
                {row.hasSessions ? row.score : '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── UseCase Card ─────────────────────────────────────────────────────────────

function UseCaseCard({ ucId, title, risk, desc, team, tool, risks, reco, teams, token, onGenerate, onRefresh, rawUc }) {
  const [showAssign, setShowAssign] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(team || '')
  const [assigning, setAssigning] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [recoExpanded, setRecoExpanded] = useState(false)
  const [editDraft, setEditDraft] = useState({ intitule: title, equipe: team || '', outil_ia: tool, niveau_risque: risk, description: desc })
  const [saving, setSaving] = useState(false)

  const handleAssignTeam = async () => {
    if (!selectedTeam) return
    setAssigning(true)
    try {
      await fetch(apiUrl(`/api/usecases/${ucId}`), {
        method: 'PUT',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify({ equipe: selectedTeam }),
      })
      setShowAssign(false)
      if (onRefresh) onRefresh()
    } catch { /* silencieux */ } finally { setAssigning(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await fetch(apiUrl(`/api/usecases/${ucId}`), {
        method: 'DELETE',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
      })
      if (onRefresh) onRefresh()
    } catch { /* silencieux */ } finally { setDeleting(false); setConfirmDelete(false) }
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      await fetch(apiUrl(`/api/usecases/${ucId}`), {
        method: 'PUT',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify(editDraft),
      })
      setShowEdit(false)
      if (onRefresh) onRefresh()
    } catch { /* silencieux */ } finally { setSaving(false) }
  }

  const panelOpen = showAssign || showEdit || confirmDelete

  return (
    <div>
      <Card pad={22} style={{ position: "relative", borderRadius: panelOpen ? "14px 14px 0 0" : 14 }}>
        <div className="flex flex-col md:flex-row gap-6" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 18, color: C.ink }}>{title}</div>
              <RiskBadge level={risk} />
              {team && (
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
            <div
              onClick={() => setRecoExpanded(v => !v)}
              style={{ marginTop: 16, background: C.cyan, borderRadius: 11, padding: "13px 16px", display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}
            >
              <Icon name="bulb" size={17} color={C.night} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.night, letterSpacing: "0.04em" }}>RECOMMANDATION IA</div>
                <div style={{
                  fontSize: 13, color: C.night, marginTop: 3, lineHeight: 1.45, fontFamily: SANS,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: recoExpanded ? "unset" : 1,
                  WebkitBoxOrient: "vertical",
                  textOverflow: recoExpanded ? "unset" : "ellipsis",
                }}>{reco}</div>
                {!recoExpanded && (
                  <div style={{ fontSize: 11, color: C.night, opacity: 0.6, marginTop: 3, fontFamily: MONO }}>Cliquer pour voir plus</div>
                )}
              </div>
            </div>
          </div>
          <div className="w-full md:w-auto" style={{ display: "flex", flexDirection: "column", gap: 9, alignItems: "stretch", minWidth: 168 }}>
            <div onClick={onGenerate}><Btn kind="primary" icon="brain" full>Générer module</Btn></div>
            <div onClick={() => { setShowAssign(v => !v); setShowEdit(false); setConfirmDelete(false) }}>
              <Btn kind="ghost" size="sm" icon="users" full>{showAssign ? 'Annuler' : team ? 'Changer équipe' : 'Assigner équipe'}</Btn>
            </div>
            <div onClick={() => { setShowEdit(v => !v); setShowAssign(false); setConfirmDelete(false) }}>
              <Btn kind="ghost" size="sm" icon="edit" full>{showEdit ? 'Annuler' : 'Modifier'}</Btn>
            </div>
            <div onClick={() => { setConfirmDelete(v => !v); setShowAssign(false); setShowEdit(false) }}>
              <Btn kind="ghost" size="sm" full><span style={{ color: C.bad }}>Supprimer</span></Btn>
            </div>
          </div>
        </div>
      </Card>

      {/* Assigner équipe */}
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

      {/* Modifier */}
      {showEdit && (
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 14px 14px", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: C.ink }}>Modifier le cas d'usage</div>
          <Field label="Intitulé">
            <Input placeholder="Intitulé" value={editDraft.intitule} onChange={e => setEditDraft({ ...editDraft, intitule: e.target.value })} />
          </Field>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field label="Équipe">
                <select value={editDraft.equipe} onChange={e => setEditDraft({ ...editDraft, equipe: e.target.value })}
                  style={{ width: "100%", height: 44, border: `1px solid ${C.border}`, borderRadius: 9, background: C.white, padding: "0 14px", fontFamily: SANS, fontSize: 13.5, color: C.ink, outline: "none" }}>
                  <option value="">Aucune équipe</option>
                  {(teams || []).map(t => <option key={t.id} value={t.nom}>{t.nom}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Outil IA">
                <select value={editDraft.outil_ia} onChange={e => setEditDraft({ ...editDraft, outil_ia: e.target.value })}
                  style={{ width: "100%", height: 44, border: `1px solid ${C.border}`, borderRadius: 9, background: C.white, padding: "0 14px", fontFamily: SANS, fontSize: 13.5, color: C.ink, outline: "none" }}>
                  {['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Mistral', 'Notion AI', 'Autre'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>
          </div>
          <Field label="Niveau de risque">
            <div style={{ display: "flex", gap: 8 }}>
              {['Faible', 'Modéré', 'Élevé'].map(r => (
                <div key={r} onClick={() => setEditDraft({ ...editDraft, niveau_risque: r })} style={{ cursor: "pointer" }}>
                  <Chip sel={editDraft.niveau_risque === r}>{r}</Chip>
                </div>
              ))}
            </div>
          </Field>
          <Field label="Description">
            <textarea value={editDraft.description} onChange={e => setEditDraft({ ...editDraft, description: e.target.value })} rows={2}
              style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 9, background: C.white, padding: "10px 14px", fontFamily: SANS, fontSize: 13.5, color: C.ink, outline: "none", resize: "none", boxSizing: "border-box" }} />
          </Field>
          <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
            <div onClick={() => setShowEdit(false)}><Btn kind="ghost" size="sm">Annuler</Btn></div>
            <div onClick={handleSaveEdit} style={{ opacity: saving ? 0.5 : 1, pointerEvents: saving ? "none" : "auto" }}>
              <Btn kind="primary" size="sm">{saving ? 'Enregistrement…' : 'Enregistrer'}</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Confirmer suppression */}
      {confirmDelete && (
        <div style={{ background: C.badBg, border: `1px solid ${C.bad}`, borderTop: "none", borderRadius: "0 0 14px 14px", padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontFamily: SANS, fontSize: 13, color: C.bad }}>Supprimer définitivement ce cas d'usage ?</span>
          <div style={{ display: "flex", gap: 9 }}>
            <div onClick={() => setConfirmDelete(false)}><Btn kind="ghost" size="sm">Annuler</Btn></div>
            <div onClick={handleDelete} style={{ opacity: deleting ? 0.5 : 1, pointerEvents: deleting ? "none" : "auto" }}>
              <Btn kind="primary" size="sm"><span style={{ color: C.white }}>{deleting ? '…' : 'Confirmer'}</span></Btn>
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
  danger: { bg: '#fee2e2', fg: '#dc2626' },
  limite: { bg: '#fef3c7', fg: '#d97706' },
  cyber: { bg: '#ede9fe', fg: '#7c3aed' },
}

function ModuleCard({ moduleId, code, title, desc, level, dur, team, contenu, teams, token, onRefresh }) {
  const [activePanel, setActivePanel] = useState(null) // 'preview' | 'editContent' | 'delete'
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  const parsedScenarios = (() => {
    try { return contenu ? JSON.parse(contenu) : [] } catch { return [] }
  })()

  // État mutable pour l'édition du contenu
  const [editScenarios, setEditScenarios] = useState(parsedScenarios)

  const toggle = (panel) => setActivePanel(p => p === panel ? null : panel)

  const handleSaveContent = async () => {
    setSaving(true)
    try {
      await fetch(apiUrl(`/api/modules/${moduleId}`), {
        method: 'PUT',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contenu: JSON.stringify(editScenarios) }),
      })
      setActivePanel(null)
      if (onRefresh) onRefresh()
    } catch { /* silencieux */ } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await fetch(apiUrl(`/api/modules/${moduleId}`), {
        method: 'DELETE',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
      })
      if (onRefresh) onRefresh()
    } catch { /* silencieux */ } finally { setDeleting(false); setActivePanel(null) }
  }

  const updateQuestion = (si, qi, field, val) => {
    setEditScenarios(prev => prev.map((s, i) => i !== si ? s : {
      ...s,
      questions: s.questions.map((q, j) => j !== qi ? q : { ...q, [field]: val })
    }))
  }

  const teamName = team ? ((teams || []).find(t => t.id === team || t.nom === team)?.nom || team) : ''

  const subStyle = { background: C.white, border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 14px 14px", padding: "18px 20px" }

  return (
    <div>
      <Card pad={20} style={{ position: "relative", borderRadius: activePanel ? "14px 14px 0 0" : 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          {/* Icône */}
          <div style={{ width: 48, height: 48, borderRadius: 12, background: C.signalSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="brain" size={22} color={C.signal} />
          </div>

          {/* Infos */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 16, color: C.ink }}>{title}</div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: C.signal, color: C.white, fontFamily: MONO, fontSize: 10, fontWeight: 700 }}>
                <Icon name="bolt" size={10} color={C.white} /> PERSONNALISÉ
              </span>
            </div>
            <div style={{ color: C.inkSoft, fontSize: 13, marginTop: 4, fontFamily: SANS }}>{desc}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              <Chip>{level}</Chip>
              <Chip icon="play">{dur}</Chip>
              {teamName
                ? <Chip tone="cyan" icon="users">{teamName}</Chip>
                : <span style={{ fontSize: 11.5, color: C.inkMute, fontFamily: SANS, alignSelf: "center" }}>Aucune équipe assignée</span>}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }} className="w-full md:w-auto">
            <div onClick={() => toggle('preview')}>
              <Btn kind="ghost" size="sm">{activePanel === 'preview' ? 'Masquer' : 'Aperçu'}</Btn>
            </div>
            <div onClick={() => { toggle('editContent'); setEditScenarios(parsedScenarios) }}>
              <Btn kind="ghost" size="sm" icon="pencil">{activePanel === 'editContent' ? 'Annuler' : 'Modifier'}</Btn>
            </div>
            <div onClick={() => toggle('delete')}>
              <Btn kind="ghost" size="sm" icon="trash"><span style={{ color: C.bad }}>Supprimer</span></Btn>
            </div>
          </div>
        </div>
      </Card>

      {/* Aperçu */}
      {activePanel === 'preview' && (
        <div style={subStyle}>
          {parsedScenarios.length === 0 ? (
            <div style={{ color: C.inkMute, fontSize: 13, fontFamily: SANS }}>Aucun contenu disponible.</div>
          ) : parsedScenarios.map((s, si) => {
            const col = catColors[s.categorie] || { bg: C.bg, fg: C.inkSoft }
            return (
              <div key={si} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ padding: "3px 9px", borderRadius: 6, background: col.bg, color: col.fg, fontFamily: MONO, fontWeight: 700, fontSize: 10 }}>{s.categorie?.toUpperCase() || 'THÈME'}</span>
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

      {/* Modifier le contenu (thèmes + questions) */}
      {activePanel === 'editContent' && (
        <div style={{ ...subStyle, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: C.ink }}>Modifier les thèmes et questions</div>
          {editScenarios.map((s, si) => {
            const col = catColors[s.categorie] || { bg: C.bg, fg: C.inkSoft }
            return (
              <div key={si} style={{ border: `1px solid ${C.border}`, borderRadius: 11, overflow: "hidden" }}>
                {/* Header du thème */}
                <div style={{ background: col.bg, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: col.fg }}>{s.categorie?.toUpperCase()}</span>
                  <input value={s.titre} onChange={e => setEditScenarios(prev => prev.map((sc, i) => i !== si ? sc : { ...sc, titre: e.target.value }))}
                    style={{ flex: 1, border: "none", background: "transparent", fontFamily: MONO, fontWeight: 700, fontSize: 13, color: col.fg, outline: "none" }} />
                </div>
                {/* Questions */}
                <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {(s.questions || []).map((q, qi) => (
                    <div key={qi} style={{ background: C.bg, borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: col.fg, background: col.bg, padding: "2px 7px", borderRadius: 5 }}>Q{qi + 1} {q.type?.toUpperCase()}</span>
                      </div>
                      <textarea value={q.texte} onChange={e => updateQuestion(si, qi, 'texte', e.target.value)} rows={2}
                        style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 7, background: C.white, padding: "8px 10px", fontFamily: SANS, fontSize: 13, color: C.ink, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                      {q.type === 'mcq' && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 7 }}>
                          {(q.options || []).map((opt, oi) => (
                            <div key={oi} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: q.bonneReponse === String.fromCharCode(65 + oi) ? C.ok : C.inkMute, width: 16 }}>{String.fromCharCode(65 + oi)}</span>
                              <input value={opt} onChange={e => {
                                const newOpts = [...(q.options || [])]
                                newOpts[oi] = e.target.value
                                updateQuestion(si, qi, 'options', newOpts)
                              }} style={{ flex: 1, height: 34, border: `1px solid ${C.border}`, borderRadius: 7, padding: "0 10px", fontFamily: SANS, fontSize: 12.5, color: C.ink, outline: "none", background: C.white }} />
                              <div onClick={() => updateQuestion(si, qi, 'bonneReponse', String.fromCharCode(65 + oi))} style={{ cursor: "pointer", width: 24, height: 24, borderRadius: 6, background: q.bonneReponse === String.fromCharCode(65 + oi) ? C.ok : C.bg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {q.bonneReponse === String.fromCharCode(65 + oi) && <Icon name="check" size={12} color={C.white} />}
                              </div>
                            </div>
                          ))}
                          <div style={{ fontSize: 11, color: C.inkMute, fontFamily: SANS }}>Cliquez sur le carré vert pour marquer la bonne réponse.</div>
                        </div>
                      )}
                      {q.type === 'free' && (
                        <div style={{ marginTop: 7 }}>
                          <div style={{ fontSize: 11, color: C.inkMute, fontFamily: MONO, marginBottom: 4 }}>RÉPONSE MODÈLE</div>
                          <textarea value={q.modelAnswer || ''} onChange={e => updateQuestion(si, qi, 'modelAnswer', e.target.value)} rows={2}
                            style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 7, background: C.white, padding: "8px 10px", fontFamily: SANS, fontSize: 12.5, color: C.inkSoft, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
            <div onClick={() => setActivePanel(null)}><Btn kind="ghost" size="sm">Annuler</Btn></div>
            <div onClick={handleSaveContent} style={{ opacity: saving ? 0.5 : 1, pointerEvents: saving ? "none" : "auto" }}>
              <Btn kind="primary" size="sm">{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Confirmer suppression */}
      {activePanel === 'delete' && (
        <div style={{ background: C.badBg, border: `1px solid ${C.bad}`, borderTop: "none", borderRadius: "0 0 14px 14px", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontFamily: SANS, fontSize: 13, color: C.bad }}>Supprimer définitivement ce module ?</span>
          <div style={{ display: "flex", gap: 9 }}>
            <div onClick={() => setActivePanel(null)}><Btn kind="ghost" size="sm">Annuler</Btn></div>
            <div onClick={handleDelete} style={{ opacity: deleting ? 0.5 : 1, pointerEvents: deleting ? "none" : "auto" }}>
              <Btn kind="primary" size="sm">{deleting ? '…' : 'Confirmer'}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Team Card ────────────────────────────────────────────────────────────────

function TeamCard({ teamId, name, desc, roles: initialRoles, count, code, token, onCopy, onInvite, onDelete, onRefresh }) {
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editDesc, setEditDesc] = useState(desc || '')
  const [editRoles, setEditRoles] = useState(initialRoles || [])
  const [editRoleInput, setEditRoleInput] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      if (onCopy) onCopy()
    })
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      await fetch(apiUrl(`/api/teams/${teamId}`), {
        method: 'PUT',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify({ description: editDesc, roles: editRoles }),
      })
      setShowEdit(false)
      if (onRefresh) onRefresh()
    } catch { /* silencieux */ } finally { setSaving(false) }
  }

  const handleViewMembers = async () => {
    if (showMembers) { setShowMembers(false); return }
    setShowMembers(true)
    setLoadingMembers(true)
    try {
      const res = await fetch(apiUrl(`/api/teams/${teamId}/members`), {
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setMembers(Array.isArray(data) ? data : [])
    } catch {
      setMembers([])
    } finally {
      setLoadingMembers(false)
    }
  }

  return (
    <Card pad={20} hover style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
        <div style={{ width: 52, height: 52, borderRadius: 13, background: C.cyan, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="users" size={24} color={C.night} />
        </div>
        {/* Infos équipe + actions équipe */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 18, color: C.ink }}>{name}</div>
            <Chip tone="default">{count} collaborateurs</Chip>
          </div>
          {desc && <div style={{ color: C.inkSoft, fontSize: 13, marginTop: 5, fontFamily: SANS }}>{desc}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <div onClick={handleViewMembers}>
              <Btn kind="ghost" size="sm" icon="users">{showMembers ? 'Masquer' : 'Voir les membres'}</Btn>
            </div>
            <div onClick={() => setShowEdit(v => !v)}>
              <Btn kind="ghost" size="sm" icon="edit">{showEdit ? 'Annuler' : 'Modifier'}</Btn>
            </div>
            {onDelete && (
              <div onClick={() => setConfirmDelete(true)}>
                <Btn kind="ghost" size="sm" icon="trash">Supprimer</Btn>
              </div>
            )}
          </div>
        </div>

        {/* Code d'accès + actions code */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }} className="w-full md:w-auto">
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: -18, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.inkMute, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>CODE D'ACCÈS</div>
            <div style={{
              fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: "0.14em", color: C.signal,
              background: C.signalSoft, border: `1px dashed ${C.signal}`, borderRadius: 9, padding: "10px 18px"
            }}>{code}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div onClick={handleCopy}>
              <Btn kind="ghost" size="sm" icon="doc">{copied ? 'Copié ! ✓' : 'Copier'}</Btn>
            </div>
            <div onClick={onInvite}>
              <Btn kind="ghost" size="sm" icon="send">Inviter</Btn>
            </div>
          </div>
        </div>
      </div>

      {/* Panel édition */}
      {showEdit && (
        <div style={{ marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: C.ink }}>Modifier l'équipe</div>

          <div>
            <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.inkMute, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 7 }}>Description</div>
            <input
              type="text"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              placeholder="Description de l'équipe…"
              style={{ width: "100%", height: 42, border: `1px solid ${C.border}`, borderRadius: 9, background: C.white, padding: "0 14px", fontFamily: SANS, fontSize: 13.5, color: C.ink, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.inkMute, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 7 }}>Rôles disponibles</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                value={editRoleInput}
                onChange={e => setEditRoleInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const r = editRoleInput.trim(); if (r && !editRoles.includes(r)) setEditRoles(v => [...v, r]); setEditRoleInput('') } }}
                placeholder="Ajouter un rôle…"
                style={{ flex: 1, height: 42, border: `1px solid ${C.border}`, borderRadius: 9, background: C.white, padding: "0 14px", fontFamily: SANS, fontSize: 13.5, color: C.ink, outline: "none", boxSizing: "border-box" }}
              />
              <button type="button" onClick={() => { const r = editRoleInput.trim(); if (r && !editRoles.includes(r)) setEditRoles(v => [...v, r]); setEditRoleInput('') }}
                style={{ height: 42, width: 42, borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", fontFamily: MONO, fontWeight: 700, fontSize: 18, color: C.inkSoft }}>+</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {editRoles.map(r => (
                <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 7, background: C.signalSoft, fontFamily: SANS, fontSize: 12.5, color: C.signal, fontWeight: 600 }}>
                  {r}
                  <span onClick={() => setEditRoles(v => v.filter(x => x !== r))} style={{ cursor: "pointer", fontWeight: 700 }}>×</span>
                </span>
              ))}
              {editRoles.length === 0 && <span style={{ fontFamily: SANS, fontSize: 12.5, color: C.inkMute }}>Aucun rôle défini</span>}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={handleSaveEdit} disabled={saving} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", opacity: saving ? 0.5 : 1 }}>
              <Btn kind="primary" size="sm">{saving ? 'Enregistrement…' : 'Enregistrer'}</Btn>
            </button>
          </div>
        </div>
      )}

      {/* Panel membres */}
      {showMembers && (
        <div style={{ marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
          {loadingMembers ? (
            <div style={{ fontFamily: SANS, fontSize: 13, color: C.inkMute }}>Chargement…</div>
          ) : members.length === 0 ? (
            <div style={{ fontFamily: SANS, fontSize: 13, color: C.inkMute }}>Aucun membre dans cette équipe.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.inkMute, letterSpacing: "0.04em", marginBottom: 4 }}>
                MEMBRES ({members.length})
              </div>
              {members.map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: C.bg, borderRadius: 9 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 32, background: C.night, display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.white, flexShrink: 0
                  }}>
                    {m.nom ? m.nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13.5, color: C.ink }}>{m.nom || '—'}</div>
                    <div style={{ fontFamily: SANS, fontSize: 12, color: C.inkMute }}>{m.email || ''}{m.role ? ` · ${m.role}` : ''}</div>
                  </div>
                  <Chip tone="cyan">{m.xp} XP</Chip>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation suppression */}
      {confirmDelete && (
        <div style={{ marginTop: 12, padding: "12px 16px", background: '#fff0f0', border: `1px solid ${C.bad}`, borderRadius: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: SANS, fontSize: 13, color: C.bad, flex: 1 }}>
            Supprimer <strong>{name}</strong> et ses {count} collaborateurs ?
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <div onClick={() => setConfirmDelete(false)}><Btn kind="ghost" size="sm">Annuler</Btn></div>
            <div onClick={() => { setConfirmDelete(false); onDelete() }}><Btn kind="danger" size="sm" icon="trash">Confirmer</Btn></div>
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Org Profile View ─────────────────────────────────────────────────────────

const SECTEURS = ['Technologie', 'Finance', 'Santé', 'Éducation', 'Industrie', 'Commerce & Retail', 'Services', 'Média & Communication', 'Autre']
const TAILLES = ['1 – 10', '11 – 50', '51 – 200', '201 – 1 000', '1 000+']
const OUTILS_LIST = ['ChatGPT', 'Microsoft Copilot', 'Gemini', 'Claude', 'Midjourney', 'Stable Diffusion', 'Perplexity', 'Notion AI', 'GitHub Copilot', 'Autre']
const MATURITES = ['Débutant', 'En cours', 'Avancé', 'Expert']

function OrgProfileView({ token }) {
  const [org, setOrg] = useState(null)
  const [draft, setDraft] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(apiUrl('/api/organisations'), { headers: { ...API_HEADERS, Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) { setOrg(data); setDraft(data) } })
      .catch(() => { })
  }, [token])

  const toggleOutil = (o) => setDraft(d => ({
    ...d,
    outils_ia: Array.isArray(d.outils_ia)
      ? d.outils_ia.includes(o) ? d.outils_ia.filter(x => x !== o) : [...d.outils_ia, o]
      : [o]
  }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(apiUrl('/api/organisations'), {
        method: 'PUT',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify({ secteur: draft.secteur, taille: draft.taille, outils_ia: draft.outils_ia, maturite: draft.maturite }),
      })
      if (res.ok) { const data = await res.json(); setOrg(data); setDraft(data) }
      setEditing(false)
    } catch { } finally { setSaving(false) }
  }

  if (!org) return <div style={{ fontFamily: SANS, color: C.inkMute, padding: 40 }}>Chargement…</div>

  const chipStyle = (active) => ({
    padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${active ? C.signal : C.border}`,
    background: active ? C.signalSoft : C.white, cursor: editing ? "pointer" : "default",
    fontFamily: SANS, fontSize: 13, color: active ? C.signal : C.ink, fontWeight: active ? 700 : 400, transition: "all 0.15s"
  })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
      <PageHead
        title="Profil organisation"
        sub={org.nom}
        actions={editing
          ? <><div onClick={() => { setEditing(false); setDraft(org) }}><Btn kind="ghost">Annuler</Btn></div><div onClick={handleSave}><Btn kind="primary" icon="check">{saving ? 'Enregistrement…' : 'Enregistrer'}</Btn></div></>
          : <div onClick={() => setEditing(true)}><Btn kind="ghost" icon="pencil">Modifier</Btn></div>
        }
      />

      {/* Infos fixes */}
      <Card pad={22}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: C.inkMute, marginBottom: 16, letterSpacing: "0.04em" }}>INFORMATIONS GÉNÉRALES</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[{ label: "Nom", value: org.nom }, { label: "Email admin", value: org.email_admin }, { label: "Plan", value: org.plan ?? 'Essai' }, { label: "Statut", value: org.statut_onboarding ?? '—' }].map(({ label, value }) => (
            <div key={label} style={{ padding: "12px 16px", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.inkMute, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: C.ink }}>{value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Secteur */}
      <Card pad={22}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: C.inkMute, marginBottom: 14, letterSpacing: "0.04em" }}>SECTEUR D'ACTIVITÉ</div>
        {editing ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SECTEURS.map(s => <button key={s} onClick={() => setDraft(d => ({ ...d, secteur: s }))} style={chipStyle(draft.secteur === s)}>{s}</button>)}
          </div>
        ) : (
          <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: C.ink }}>{org.secteur ?? '—'}</div>
        )}
      </Card>

      {/* Taille */}
      <Card pad={22}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: C.inkMute, marginBottom: 14, letterSpacing: "0.04em" }}>TAILLE DE L'ORGANISATION</div>
        {editing ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {TAILLES.map(t => <button key={t} onClick={() => setDraft(d => ({ ...d, taille: t }))} style={chipStyle(draft.taille === t)}>{t} collaborateurs</button>)}
          </div>
        ) : (
          <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: C.ink }}>{org.taille ? `${org.taille} collaborateurs` : '—'}</div>
        )}
      </Card>

      {/* Outils IA */}
      <Card pad={22}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: C.inkMute, marginBottom: 14, letterSpacing: "0.04em" }}>OUTILS IA UTILISÉS</div>
        {editing ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {OUTILS_LIST.map(o => <button key={o} onClick={() => toggleOutil(o)} style={chipStyle(Array.isArray(draft.outils_ia) && draft.outils_ia.includes(o))}>{o}</button>)}
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Array.isArray(org.outils_ia) && org.outils_ia.length > 0
              ? org.outils_ia.map(o => <Chip key={o} tone="cyan">{o}</Chip>)
              : <span style={{ fontFamily: SANS, fontSize: 14, color: C.inkMute }}>—</span>}
          </div>
        )}
      </Card>

      {/* Maturité */}
      <Card pad={22}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: C.inkMute, marginBottom: 14, letterSpacing: "0.04em" }}>MATURITÉ IA</div>
        {editing ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {MATURITES.map(m => <button key={m} onClick={() => setDraft(d => ({ ...d, maturite: m }))} style={chipStyle(draft.maturite === m)}>{m}</button>)}
          </div>
        ) : (
          <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: C.ink }}>{org.maturite ?? '—'}</div>
        )}
      </Card>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function AdminSidebar({ activeTab, setActiveTab, onBack, user, avgMaturity }) {
  const items = [
    { tab: "dashboard", label: "Vue d'ensemble", icon: "grid" },
    { tab: "usecases", label: "Cas d'usage", icon: "bulb" },
    { tab: "modules", label: "Modules", icon: "brain" },
    { tab: "teams", label: "Équipes", icon: "users" },
    { tab: "org-profile", label: "Profil organisation", icon: "shield" },
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
    const teamSessions = sessions.filter(s => s.team_id === t.id)
    if (teamSessions.length === 0) return false
    const score = Math.round((teamSessions.reduce((acc, s) => acc + (s.score / Math.max(s.total_questions, 1)), 0) / teamSessions.length) * 100)
    return score < 45
  }).length

  const teamsWithSessions = teams.filter(t => sessions.some(s => s.team_id === t.id)).length

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
      <div style={{
        background: C.night, borderRadius: 16, padding: "26px 30px",
        display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", overflow: "hidden"
      }} className="flex-col md:flex-row gap-6">
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
            {sessions.length === 0
              ? "Aucune session complétée pour le moment. Assignez des modules à vos équipes pour démarrer."
              : lowMaturityTeamsCount > 0
                ? `${lowMaturityTeamsCount} équipe${lowMaturityTeamsCount > 1 ? 's sont' : ' est'} sous le seuil de maturité recommandé. Générez un module ciblé pour les remettre à niveau.`
                : `${teamsWithSessions} équipe${teamsWithSessions > 1 ? 's ont' : ' a'} atteint le seuil de maturité recommandé. Excellent pilotage !`}
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
                <div style={{
                  width: 30, height: 30, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
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
  const teamsOptions = teams || []
  const [saving, setSaving] = useState(false)
  const [generatingReco, setGeneratingReco] = useState(false)
  const { generateRecommendation, generateRisques } = useOllama()
  const [filterTeam, setFilterTeam] = useState(null)

  const filteredUsecases = filterTeam
    ? usecases.filter(uc => uc.equipe === filterTeam)
    : usecases

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!draft.intitule.trim()) return
    setSaving(true)
    try {
      const res = await fetch(apiUrl('/api/usecases'), {
        method: 'POST',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify(draft),
      })
      const created = res.ok ? await res.json() : null
      setDraft({ intitule: '', equipe: '', outil_ia: 'ChatGPT', niveau_risque: 'Modéré', description: '' })
      setShowForm(false)
      setSaving(false)
      if (onRefresh) onRefresh()

      // Génération asynchrone recommandation + tags de risques en parallèle
      if (created?.id) {
        setGeneratingReco(true)
        try {
          const [reco, risques] = await Promise.all([
            generateRecommendation(draft),
            generateRisques(draft),
          ])
          const payload = {}
          if (reco) payload.recommandation = reco
          if (risques) payload.risques = risques
          if (Object.keys(payload).length > 0) {
            await fetch(apiUrl(`/api/usecases/${created.id}`), {
              method: 'PUT',
              headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
              body: JSON.stringify(payload),
            })
            if (onRefresh) onRefresh()
          }
        } catch { /* silencieux */ } finally { setGeneratingReco(false) }
      }
    } catch { /* silencieux */ } finally { setSaving(false) }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHead
        title="Cas d'usage IA"
        sub={`${filteredUsecases.length} / ${usecases.length} usage${usecases.length > 1 ? 's' : ''} affiché${filteredUsecases.length > 1 ? 's' : ''}`}
        actions={
          <div onClick={() => setShowForm(v => !v)}>
            <Btn kind="primary" icon={showForm ? "x" : "plus"}>{showForm ? 'Annuler' : 'Ajouter un cas'}</Btn>
          </div>
        }
      />

      {/* Indicateur génération recommandation IA */}
      {generatingReco && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 9,
          background: C.signalSoft, border: `1px solid ${C.signal}`, fontFamily: MONO, fontSize: 12, color: C.signal }}>
          <Icon name="brain" size={14} color={C.signal} />
          L'IA génère une recommandation personnalisée…
        </div>
      )}
      {teamsOptions.length > 0 && (
        <TeamFilterBar teams={teamsOptions} value={filterTeam} onChange={setFilterTeam} />
      )}

      {/* Formulaire d'ajout */}
      {showForm && (
        <form onSubmit={handleAdd} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 15, color: C.ink }}>Nouveau cas d'usage</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Intitulé du cas d'usage">
              <Input placeholder="Ex : Analyse de CV via IA" value={draft.intitule} onChange={e => setDraft({ ...draft, intitule: e.target.value })} />
            </Field>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Field label="Équipe concernée" hint={teamsOptions.length === 0 ? "Créez d'abord une équipe dans l'onglet Équipes." : ""}>
                  {teamsOptions.length > 0 ? (
                    <select value={draft.equipe} onChange={e => setDraft({ ...draft, equipe: e.target.value })}
                      style={{ width: "100%", height: 44, border: `1px solid ${draft.equipe ? C.inkSoft : C.border}`, borderRadius: 9, background: C.white, padding: "0 14px", fontFamily: SANS, fontSize: 13.5, color: draft.equipe ? C.ink : C.inkMute, outline: "none" }}>
                      <option value="">Sélectionner une équipe…</option>
                      {teamsOptions.map(t => <option key={t.id} value={t.nom}>{t.nom}</option>)}
                    </select>
                  ) : (
                    <Input placeholder="Ex : RH, Commercial…" value={draft.equipe} onChange={e => setDraft({ ...draft, equipe: e.target.value })} />
                  )}
                </Field>
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Outil IA utilisé">
                  <select value={draft.outil_ia} onChange={e => setDraft({ ...draft, outil_ia: e.target.value })}
                    style={{ width: "100%", height: 44, border: `1px solid ${C.border}`, borderRadius: 9, background: C.white, padding: "0 14px", fontFamily: SANS, fontSize: 13.5, color: C.ink, outline: "none", appearance: "none" }}>
                    {AI_TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              </div>
            </div>
            <Field label="Niveau de risque">
              <div style={{ display: "flex", gap: 8 }}>
                {RISK_LEVELS.map(r => (
                  <div key={r} onClick={() => setDraft({ ...draft, niveau_risque: r })} style={{ cursor: "pointer" }}>
                    <Chip sel={draft.niveau_risque === r}>{r}</Chip>
                  </div>
                ))}
              </div>
            </Field>
            <Field label="Description (optionnel)">
              <textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })}
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
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredUsecases.length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: C.inkMute, fontFamily: SANS, fontSize: 13.5 }}>
              Aucun cas d'usage pour l'équipe <strong>{filterTeam}</strong>.
            </div>
          )}
          {filteredUsecases.map((uc) => {
            const rawRisques = uc.risques
            const risks = Array.isArray(rawRisques) && rawRisques.length > 0
              ? rawRisques
              : typeof rawRisques === 'string' && rawRisques.trim()
                ? rawRisques.split(',').map(r => r.trim()).filter(Boolean)
                : (uc.niveau_risque === 'Élevé' ? ["Biais", "RGPD", "Discrimination"] : ["Fuite de données", "Confidentialité"])
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
  const { generateSituations, abortGeneration, loading, error } = useOllama()

  const [selectedUcIds, setSelectedUcIds] = useState(prefillUsecase ? [String(prefillUsecase.id)] : [])
  const [count, setCount] = useState(2)
  const [questionsPerScenario, setQuestionsPerScenario] = useState(3)
  const [pdfText, setPdfText] = useState('')
  const [pdfName, setPdfName] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [genProgress, setGenProgress] = useState(null)
  const [genError, setGenError] = useState(null)

  const allUsecases = usecases || []
  const selectedUcs = allUsecases.filter(u => selectedUcIds.includes(String(u.id)))

  function toggleUc(id) {
    const sid = String(id)
    setSelectedUcIds(prev => prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid])
  }

  function toggleTeam(teamName) {
    const teamIds = allUsecases.filter(uc => uc.equipe === teamName).map(uc => String(uc.id))
    const allChecked = teamIds.every(id => selectedUcIds.includes(id))
    if (allChecked) {
      setSelectedUcIds(prev => prev.filter(id => !teamIds.includes(id)))
    } else {
      setSelectedUcIds(prev => [...new Set([...prev, ...teamIds])])
    }
  }

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

    let situations

    if (selectedUcs.length > 0) {
      // Mode multi-cas d'usage : 1 thème par cas d'usage sélectionné
      const usecaseConfigs = selectedUcs.map(uc => ({
        companyName: companyConfig?.companyName || 'Organisation',
        sector: uc.equipe
          ? `${companyConfig?.sector || 'Entreprise'} — équipe ${uc.equipe}`
          : (companyConfig?.sector || 'Entreprise'),
        size: companyConfig?.size || '',
        tools: uc.outil_ia || companyConfig?.tools || 'ChatGPT',
        context: `Cas d'usage : ${uc.intitule}. Niveau de risque : ${uc.niveau_risque || 'Modéré'}. ${uc.description || ''} ${uc.recommandation || ''}`,
        documentContext: pdfText ? pdfText.slice(0, 6000) : undefined,
      }))
      setGenProgress({ current: 0, total: selectedUcs.length })
      situations = await generateSituations(null, selectedUcs.length, questionsPerScenario, (c, t) => setGenProgress({ current: c, total: t }), usecaseConfigs)
    } else {
      // Mode générique : N thèmes depuis le profil organisation
      const config = {
        companyName: companyConfig?.companyName || 'Organisation',
        sector: companyConfig?.sector || 'Entreprise',
        size: companyConfig?.size || '',
        tools: companyConfig?.tools || 'ChatGPT',
        context: '',
        documentContext: pdfText ? pdfText.slice(0, 6000) : undefined,
      }
      setGenProgress({ current: 0, total: count })
      situations = await generateSituations(config, count, questionsPerScenario, (c, t) => setGenProgress({ current: c, total: t }))
      await saveConfig(config, situations)
    }

    setGenProgress(null)
    if (!situations) { setGenError(error || 'Génération échouée'); return }

    // Déduire l'équipe cible : commune à tous les UCs sélectionnés, sinon null
    const firstEquipe = selectedUcs[0]?.equipe || null
    const equipe = selectedUcs.length > 0 && selectedUcs.every(uc => uc.equipe === firstEquipe) ? firstEquipe : null
    const nbThemes = situations.length
    const titre = selectedUcs.length === 1
      ? `${selectedUcs[0].intitule} — ${companyConfig?.companyName || 'Organisation'}`
      : selectedUcs.length > 1
        ? `Sensibilisation multi-thèmes — ${companyConfig?.companyName || 'Organisation'}`
        : `Sensibilisation IA — ${companyConfig?.companyName || 'Organisation'}`

    try {
      await fetch(apiUrl('/api/modules'), {
        method: 'POST',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          titre,
          description: `${nbThemes} thème${nbThemes > 1 ? 's' : ''} · ${questionsPerScenario} questions/thème${equipe ? ` · Équipe ${equipe}` : ''}`,
          categorie: equipe || companyConfig?.sector || 'Fondamentaux',
          niveau: selectedUcs.some(uc => uc.niveau_risque === 'Élevé') ? 'advanced' : 'intermediate',
          duree_min: nbThemes * questionsPerScenario * 2,
          personnalise: true,
          contenu: JSON.stringify(situations),
          equipes_ciblees: equipe || null,
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
        <div onClick={() => { abortGeneration(); onCancel() }}><Btn kind="ghost" size="sm" icon="x">Annuler</Btn></div>
      </div>

      <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Multi-sélection de cas d'usage */}
        <Field
          label="Cas d'usage à inclure"
          hint={allUsecases.length === 0
            ? "Aucun cas d'usage — le module sera de sensibilisation générale."
            : "Chaque cas d'usage sélectionné génère 1 thème dédié. Sans sélection → sensibilisation générale."
          }
        >
          {/* Filtres rapides par équipe */}
          {[...new Set(allUsecases.map(uc => uc.equipe).filter(Boolean))].length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10, alignItems: "center" }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: C.inkMute }}>Équipes :</span>
              {[...new Set(allUsecases.map(uc => uc.equipe).filter(Boolean))].map(team => {
                const teamIds = allUsecases.filter(uc => uc.equipe === team).map(uc => String(uc.id))
                const allChecked = teamIds.every(id => selectedUcIds.includes(id))
                return (
                  <button type="button" key={team} onClick={() => toggleTeam(team)}
                    style={{ padding: "4px 11px", borderRadius: 6, border: `1px solid ${allChecked ? C.signal : C.border}`,
                      background: allChecked ? C.signalSoft : C.bg, cursor: "pointer", fontFamily: SANS, fontSize: 12,
                      color: allChecked ? C.signal : C.ink, fontWeight: allChecked ? 700 : 400 }}>
                    {team}
                  </button>
                )
              })}
              {selectedUcIds.length > 0 && (
                <button type="button" onClick={() => setSelectedUcIds([])}
                  style={{ padding: "4px 11px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg,
                    cursor: "pointer", fontFamily: SANS, fontSize: 12, color: C.inkMute }}>
                  Tout désélectionner
                </button>
              )}
            </div>
          )}

          {/* Liste de cases à cocher */}
          {(() => {
            // Équipe verrouillée = équipe du premier UC coché (null si aucun coché)
            const lockedTeam = selectedUcs.length > 0 ? (selectedUcs[0].equipe || null) : null
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto", paddingRight: 4, scrollbarWidth: "thin", scrollbarColor: `${C.border} transparent` }}>
                {allUsecases.length === 0 ? (
                  <div style={{ padding: "12px 14px", color: C.inkMute, fontSize: 13, fontFamily: SANS, background: C.bg, borderRadius: 8 }}>
                    Créez d'abord des cas d'usage dans l'onglet dédié.
                  </div>
                ) : allUsecases.map(uc => {
                  const checked = selectedUcIds.includes(String(uc.id))
                  const blocked = !checked && lockedTeam !== null && (uc.equipe || null) !== lockedTeam
                  return (
                    <label key={uc.id} title={blocked ? `Réservé à l'équipe "${uc.equipe || 'sans équipe'}" — un module ne peut couvrir qu'une seule équipe` : undefined}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                        borderRadius: 9,
                        background: checked ? C.signalSoft : blocked ? C.ph : C.bg,
                        border: `1px solid ${checked ? C.signal : blocked ? C.border : C.border}`,
                        cursor: blocked ? "not-allowed" : "pointer",
                        opacity: blocked ? 0.45 : 1,
                        userSelect: "none" }}>
                      <input type="checkbox" checked={checked} disabled={blocked} onChange={() => !blocked && toggleUc(uc.id)}
                        style={{ width: 16, height: 16, cursor: blocked ? "not-allowed" : "pointer", accentColor: C.signal }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: checked ? 600 : 400, color: blocked ? C.inkMute : C.ink }}>{uc.intitule}</span>
                        <span style={{ fontFamily: MONO, fontSize: 11, color: C.inkMute, marginLeft: 8 }}>
                          {uc.equipe && `${uc.equipe} · `}{uc.niveau_risque || ''}
                        </span>
                      </div>
                      {uc.outil_ia && <Chip tone="default">{uc.outil_ia}</Chip>}
                    </label>
                  )
                })}
              </div>
            )
          })()}

          {/* Résumé sélection */}
          {selectedUcs.length > 0 && (
            <div style={{ marginTop: 8, padding: "8px 14px", borderRadius: 8, background: C.cyan,
              fontFamily: MONO, fontSize: 12, color: C.night, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="check" size={14} color={C.night} />
              {selectedUcs.length} cas d'usage · {selectedUcs.length} thème{selectedUcs.length > 1 ? 's' : ''} · {selectedUcs.length * questionsPerScenario} questions au total
            </div>
          )}
        </Field>

        <div style={{ display: "flex", gap: 24 }}>
          {selectedUcs.length === 0 && numInput("Nombre de thèmes", count, setCount, 1, 5)}
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
            {loading
              ? `Génération en cours…`
              : selectedUcs.length > 0
                ? `Générer ${selectedUcs.length} thème${selectedUcs.length > 1 ? 's' : ''} (${selectedUcs.length * questionsPerScenario} questions)`
                : `Générer ${count} thème${count > 1 ? 's' : ''} (${count * questionsPerScenario} questions)`
            }
          </Btn>
        </button>
      </form>
    </Card>
  )
}

// ─── Modules View ─────────────────────────────────────────────────────────────

function ModulesView({ modules, teams, usecases, token, companyConfig, pendingUsecase, onModuleSaved }) {
  const [showGenerate, setShowGenerate] = useState(!!pendingUsecase)
  const [filterTeam, setFilterTeam] = useState(null)

  // Si un cas d'usage arrive en attente, ouvrir automatiquement le panneau
  useState(() => { if (pendingUsecase) setShowGenerate(true) })

  const filteredModules = filterTeam
    ? modules.filter(m => m.equipes_ciblees === filterTeam || (teams || []).find(t => t.id === m.equipes_ciblees)?.nom === filterTeam)
    : modules

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHead
        title="Modules"
        sub={`${filteredModules.length} / ${modules.length} module${modules.length > 1 ? 's' : ''} affiché${filteredModules.length > 1 ? 's' : ''}`}
        actions={
          <div onClick={() => setShowGenerate(v => !v)}>
            <Btn kind="primary" icon={showGenerate ? "x" : "bolt"}>{showGenerate ? 'Annuler' : 'Générer un module'}</Btn>
          </div>
        }
      />

      {(teams || []).length > 0 && (
        <TeamFilterBar teams={teams || []} value={filterTeam} onChange={setFilterTeam} />
      )}

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

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filteredModules.length === 0 && modules.length > 0 && (
          <div style={{ textAlign: "center", padding: 32, color: C.inkMute, fontFamily: SANS, fontSize: 13.5 }}>
            Aucun module pour l'équipe <strong>{filterTeam}</strong>.
          </div>
        )}
        {filteredModules.map((mod) => (
          <ModuleCard
            key={mod.id}
            moduleId={mod.id}
            code={mod.code}
            title={mod.titre}
            desc={mod.description || "Module de sensibilisation à l'IA personnalisé."}
            level={mod.niveau}
            dur={`${mod.duree_min} min`}
            team={mod.equipes_ciblees}
            contenu={mod.contenu}
            teams={teams}
            token={token}
            onRefresh={onModuleSaved}
          />
        ))}


      </div>
    </div>
  )
}

// ─── Teams View ───────────────────────────────────────────────────────────────

function TeamsView({ teams, token, onTeamCreated, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [formNom, setFormNom] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formRoles, setFormRoles] = useState([])
  const [roleInput, setRoleInput] = useState('')
  const [creating, setCreating] = useState(false)

  const handleAddRole = () => {
    const r = roleInput.trim()
    if (r && !formRoles.includes(r)) setFormRoles(v => [...v, r])
    setRoleInput('')
  }

  const handleDelete = async (teamId) => {
    try {
      await fetch(apiUrl(`/api/teams/${teamId}`), {
        method: 'DELETE',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
      })
      if (onRefresh) onRefresh()
    } catch { /* silencieux */ }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formNom.trim()) return
    setCreating(true)
    try {
      const res = await fetch(apiUrl('/api/teams'), {
        method: 'POST',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nom: formNom.trim(), description: formDesc.trim(), roles: formRoles }),
      })
      if (!res.ok) throw new Error('API error')
      setFormNom(''); setFormDesc(''); setFormRoles([]); setRoleInput('')
      setShowForm(false)
      if (onTeamCreated) onTeamCreated()
    } catch {
      setFormNom(''); setFormDesc(''); setFormRoles([]); setRoleInput('')
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

            <Field label="Rôles disponibles" hint="Appuyez sur Entrée ou cliquez + pour ajouter un rôle">
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Ex : Commercial, Développeur, RH…"
                  value={roleInput}
                  onChange={e => setRoleInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddRole() } }}
                  style={{ flex: 1, height: 44, border: `1px solid ${roleInput ? C.inkSoft : C.border}`, borderRadius: 9, background: C.white, padding: "0 14px", fontFamily: SANS, fontSize: 13.5, color: C.ink, outline: "none", boxSizing: "border-box" }}
                />
                <button type="button" onClick={handleAddRole} style={{ height: 44, width: 44, borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", fontFamily: MONO, fontWeight: 700, fontSize: 18, color: C.inkSoft }}>+</button>
              </div>
              {formRoles.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {formRoles.map(r => (
                    <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 7, background: C.signalSoft, fontFamily: SANS, fontSize: 12.5, color: C.signal, fontWeight: 600 }}>
                      {r}
                      <span onClick={() => setFormRoles(v => v.filter(x => x !== r))} style={{ cursor: "pointer", fontWeight: 700, color: C.signal }}>×</span>
                    </span>
                  ))}
                </div>
              )}
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
              teamId={team.id}
              name={team.nom}
              desc={team.description || ''}
              roles={team.roles || []}
              count={team.nb_collaborateurs}
              code={team.code_acces}
              token={token}
              onInvite={() => alert(`Invitation envoyée pour l'équipe ${team.nom} !`)}
              onDelete={() => handleDelete(team.id)}
              onRefresh={onRefresh}
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
            onRefresh={fetchData}
          />
        )}
        {activeTab === 'org-profile' && (
          <OrgProfileView token={token} />
        )}
      </div>
    </div>
  )
}
