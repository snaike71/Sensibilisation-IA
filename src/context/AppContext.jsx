import { createContext, useContext, useState, useEffect } from 'react'

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

  // Charger la config depuis l'API au démarrage
  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
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
      })
      .catch(() => {})
  }, [])

  function login(userData, jwtToken) {
    setUser(userData)
    setToken(jwtToken)
    localStorage.setItem('lhc_user', JSON.stringify(userData))
    localStorage.setItem('lhc_token', jwtToken)
  }

  function logout() {
    setUser(null)
    setToken(null)
    localStorage.removeItem('lhc_user')
    localStorage.removeItem('lhc_token')
  }

  async function saveConfig(config, situations) {
    setCompanyConfig(config)
    setCustomSituations(situations)
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

  async function saveResult(score, profil, reponses) {
    if (!token) return
    await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ score, profil, reponses }),
    })
  }

  return (
    <AppContext.Provider value={{ user, token, login, logout, companyConfig, customSituations, saveConfig, saveResult }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
