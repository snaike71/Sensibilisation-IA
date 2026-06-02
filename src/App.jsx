import { useState } from 'react'
import { useApp } from './context/AppContext.jsx'
import { apiUrl, API_HEADERS } from './utils/api.js'

import LoginScreen from './components/LoginScreen.jsx'
import RoleSelectScreen from './components/RoleSelectScreen.jsx'
import OnboardingScreen from './components/admin/OnboardingScreen.jsx'
import AdminHub from './components/admin/AdminHub.jsx'
import AdminScreen from './components/admin/AdminScreen.jsx'
import JoinTeamScreen from './components/apprenant/JoinTeamScreen.jsx'
import DiagnosticScreen from './components/apprenant/DiagnosticScreen.jsx'
import ApprenantDashboard from './components/apprenant/ApprenantDashboard.jsx'
import AccrocheScreen from './components/apprenant/AccrocheScreen.jsx'
import Quiz from './components/apprenant/Quiz.jsx'
import ScoreScreen from './components/apprenant/ScoreScreen.jsx'

/**
 * Phases :
 *  login → role-select
 *    → [admin] admin-onboarding → admin → admin-generate
 *    → [apprenant] join-team → diagnostic → apprenant-dashboard → accroche → quiz → score
 */
export default function App() {
  const { token, logout } = useApp()
  const [phase, setPhase] = useState('login')
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)

  function handleLogout() {
    logout()
    setPhase('login')
  }

  function handleQuizFinish(finalScore, totalQuestions) {
    setScore(finalScore)
    setTotal(totalQuestions)
    setPhase('score')
  }

  // Sauvegarde des données onboarding : mise à jour org + création des use cases
  async function handleOnboardingComplete(data) {
    if (!token) { setPhase('admin'); return }
    try {
      // 1. Mettre à jour l'organisation avec secteur / taille / outils / maturité
      await fetch(apiUrl('/api/organisations'), {
        method: 'PUT',
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          secteur: data.sector,
          taille: data.size,
          outils_ia: data.tools,
          maturite: data.maturite,
          statut_onboarding: 'Complété',
        }),
      })
      // 2. Créer chaque cas d'usage déclaré
      for (const uc of data.usecases) {
        await fetch(apiUrl('/api/usecases'), {
          method: 'POST',
          headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            intitule: uc.description,
            equipe: uc.team,
            outil_ia: uc.tool,
            niveau_risque: uc.risk,
          }),
        })
      }
    } catch {
      // fail silently — les données seront retentrées via AdminHub si besoin
    }
    setPhase('admin')
  }

  // ── Routing ──────────────────────────────────────────────────────────────────

  if (phase === 'login')
    return <LoginScreen onSuccess={() => setPhase('role-select')} />

  if (phase === 'role-select')
    return (
      <RoleSelectScreen
        onAdmin={() => setPhase('admin-onboarding')}
        onApprenant={() => setPhase('join-team')}
        onLogout={handleLogout}
      />
    )

  // ── Parcours Admin ────────────────────────────────────────────────────────────

  if (phase === 'admin-onboarding')
    return (
      <OnboardingScreen
        onComplete={handleOnboardingComplete}
        onBack={() => setPhase('role-select')}
      />
    )

  if (phase === 'admin')
    return (
      <AdminHub
        onBack={() => setPhase('role-select')}
        onGenerateModule={() => setPhase('admin-generate')}
      />
    )

  if (phase === 'admin-generate')
    return <AdminScreen onBack={() => setPhase('admin')} />

  // ── Parcours Apprenant ────────────────────────────────────────────────────────

  if (phase === 'join-team')
    return (
      <JoinTeamScreen
        onSuccess={() => setPhase('diagnostic')}
        onBack={() => setPhase('role-select')}
      />
    )

  if (phase === 'diagnostic')
    return <DiagnosticScreen onComplete={() => setPhase('apprenant-dashboard')} />

  if (phase === 'apprenant-dashboard')
    return (
      <ApprenantDashboard
        onStartModule={() => setPhase('accroche')}
        onLogout={handleLogout}
      />
    )

  if (phase === 'accroche')
    return <AccrocheScreen onStart={() => setPhase('quiz')} onLogout={handleLogout} />

  if (phase === 'quiz')
    return <Quiz onFinish={handleQuizFinish} />

  return (
    <ScoreScreen
      score={score}
      total={total}
      onRestart={() => { setScore(0); setTotal(0); setPhase('accroche') }}
      onGoToDashboard={() => setPhase('apprenant-dashboard')}
    />
  )
}
