import { createContext, useContext, useState, useEffect } from 'react'
import { apiUrl, API_HEADERS } from '../utils/api.js'

function normalizeReponse(val, categorie) {
  if (val === 'ia') return 'ia'
  if (val === 'humain' || val === 'manuel') return 'humain'
  if (categorie === 'possibilite') return 'ia'
  return 'humain'
}

function normalizeSituations(situations) {
  if (!Array.isArray(situations)) return situations
  return situations.map((s) => ({
    ...s,
    questions: Array.isArray(s.questions)
      ? s.questions.map((q) => ({
          ...q,
          bonneReponse: normalizeReponse(q.bonneReponse, s.categorie),
        }))
      : s.questions,
    // Ancien format plat
    bonneReponse: s.bonneReponse ? normalizeReponse(s.bonneReponse, s.categorie) : undefined,
  }))
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lhc_user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('lhc_token') || null)

  const [companyConfig, setCompanyConfig] = useState(null)
  const [customSituations, setCustomSituations] = useState(null)
  const [currentModuleId, setCurrentModuleId] = useState(null)
  
  const [collaborator, setCollaboratorState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lhc_collaborator')) } catch { return null }
  })

  function setCollaborator(val) {
    setCollaboratorState(val)
    if (val) {
      localStorage.setItem('lhc_collaborator', JSON.stringify(val))
    } else {
      localStorage.removeItem('lhc_collaborator')
    }
  }

  // Charge la config de l'org après connexion (token requis)
  async function loadConfig(jwt) {
    const t = jwt ?? token
    if (!t) return
    try {
      const r = await fetch(apiUrl('/api/config'), {
        headers: { ...API_HEADERS, Authorization: `Bearer ${t}` },
      })
      if (!r.ok) return
      const data = await r.json()
      if (data) {
        setCompanyConfig({
          companyName: data.company_name,
          sector: data.sector,
          size: data.size,
          tools: data.tools,
          context: data.context,
        })
        if (data.situations) setCustomSituations(normalizeSituations(data.situations))
      }
    } catch { /* silencieux */ }
  }

  // Charge la config de l'org pour le collaborateur (public par org_id)
  async function loadCollaboratorConfig(orgId) {
    if (!orgId) return
    try {
      const r = await fetch(apiUrl(`/api/config/org/${orgId}`))
      if (!r.ok) return
      const data = await r.json()
      if (data) {
        setCompanyConfig({
          companyName: data.company_name,
          sector: data.sector,
          size: data.size,
          tools: data.tools,
          context: data.context,
        })
        if (data.situations) setCustomSituations(normalizeSituations(data.situations))
      }
    } catch { /* silencieux */ }
  }

  // Recharge la config au démarrage si un token est déjà présent
  useEffect(() => { loadConfig() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Charge la config du collaborateur quand il se connecte
  useEffect(() => {
    if (collaborator?.org_id) {
      loadCollaboratorConfig(collaborator.org_id)
    }
  }, [collaborator?.org_id])

  function login(orgData, jwtToken) {
    const userData = {
      id: orgData.id,
      name: orgData.nom ?? orgData.name,
      email: orgData.email_admin ?? orgData.email,
      role: 'admin',
    }
    setUser(userData)
    setToken(jwtToken)
    localStorage.setItem('lhc_user', JSON.stringify(userData))
    localStorage.setItem('lhc_token', jwtToken)
    loadConfig(jwtToken)
  }

  function logout() {
    setUser(null)
    setToken(null)
    setCompanyConfig(null)
    setCustomSituations(null)
    setCollaborator(null)
    localStorage.removeItem('lhc_user')
    localStorage.removeItem('lhc_token')
  }

  async function saveConfig(config, situations) {
    setCompanyConfig(config)
    setCustomSituations(situations)
    await fetch(apiUrl('/api/config'), {
      method: 'PUT',
      headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        company_name: config.companyName,
        sector: config.sector,
        size: config.size,
        tools: config.tools,
        context: config.context,
        situations,
      }),
    })
  }

  async function saveResult(score, profil, reponses, totalQuestions = 4) {
    if (token) {
      await fetch(apiUrl('/api/results'), {
        method: 'POST',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score, profil, reponses }),
      })
    } else if (collaborator) {
      const xp_gagne = Math.round((score / Math.max(totalQuestions, 1)) * 150)
      const res = await fetch(apiUrl('/api/sessions'), {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({
          collaborator_id: collaborator.id,
          org_id: collaborator.org_id,
          module_id: currentModuleId ?? undefined,
          score,
          total_questions: totalQuestions,
          xp_gagne,
          duree_min: 10,
          concepts_maitrises: profil
        })
      })
      if (res.ok) {
        try {
          const freshRes = await fetch(apiUrl(`/api/collaborators/${collaborator.id}`))
          if (freshRes.ok) {
            const freshData = await freshRes.json()
            setCollaborator({ ...freshData, teamName: freshData.team_name || collaborator.teamName })
          }
        } catch { /* silencieux */ }
      }
    }
  }

  return (
    <AppContext.Provider value={{ user, token, login, logout, companyConfig, customSituations, saveConfig, saveResult, collaborator, setCollaborator, currentModuleId, setCurrentModuleId }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
