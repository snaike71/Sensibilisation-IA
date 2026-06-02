import { useState } from 'react'
import { useApp } from './context/AppContext.jsx'
import { apiUrl, API_HEADERS } from './utils/api.js'

import LoginScreen from './components/LoginScreen.jsx'
import RoleSelectScreen from './components/RoleSelectScreen.jsx'
import JoinTeamScreen from './components/apprenant/JoinTeamScreen.jsx'
import ApprenantDashboard from './components/apprenant/ApprenantDashboard.jsx'
import AccrocheScreen from './components/apprenant/AccrocheScreen.jsx'
import Quiz from './components/apprenant/Quiz.jsx'
import ScoreScreen from './components/apprenant/ScoreScreen.jsx'
import OnboardingScreen from './components/admin/OnboardingScreen.jsx'
import AdminHub from './components/admin/AdminHub.jsx'
import AdminScreen from './components/admin/AdminScreen.jsx'

// phases : 'login' | 'role-select' | 'join-team' | 'apprenant-dashboard' | 'accroche' | 'quiz' | 'score' | 'admin' | 'admin-hub' | 'admin-generate'

export default function App() {
  const { user, token, logout } = useApp()
  const [phase, setPhase] = useState('login')

  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)

  function handleQuizFinish(finalScore, totalQuestions) {
    setScore(finalScore)
    setTotal(totalQuestions)
    setPhase('score')
  }

  function handleRestart() {
    setScore(0)
    setTotal(0)
    setPhase('accroche')
  }

  function handleLogout() {
    logout()
    setPhase('login')
  }

  // Sauvegarde onboarding → org + cas d'usage, puis accès au hub
  async function handleOnboardingComplete(data) {
    if (token) {
      try {
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
        // fail silently
      }
    }
    setPhase('admin-hub')
  }

  if (phase === 'login') {
    return <LoginScreen onSuccess={() => setPhase('role-select')} />
  }

  if (phase === 'role-select') {
    return (
      <RoleSelectScreen
        onAdmin={() => setPhase('admin')}
        onApprenant={() => setPhase('join-team')}
        onLogout={handleLogout}
      />
    )
  }

  if (phase === 'join-team') {
    return (
      <JoinTeamScreen
        onSuccess={() => setPhase('apprenant-dashboard')}
        onBack={() => setPhase('role-select')}
      />
    )
  }

  if (phase === 'apprenant-dashboard') {
    return (
      <ApprenantDashboard
        onStartModule={() => setPhase('accroche')}
        onLogout={handleLogout}
      />
    )
  }

  // Admin : Onboarding de configuration (4 étapes)
  if (phase === 'admin') {
    return (
      <OnboardingScreen
        onComplete={handleOnboardingComplete}
        onBack={() => setPhase('role-select')}
      />
    )
  }

  // Admin : Hub de pilotage (dashboard + équipes + modules + cas d'usage)
  if (phase === 'admin-hub') {
    return (
      <AdminHub
        onBack={() => setPhase('role-select')}
        onGenerateModule={() => setPhase('admin-generate')}
      />
    )
  }

  // Admin : Générateur IA de scénarios quiz
  if (phase === 'admin-generate') {
    return <AdminScreen onBack={() => setPhase('admin-hub')} />
  }

  if (phase === 'accroche') {
    return <AccrocheScreen onStart={() => setPhase('quiz')} onLogout={handleLogout} />
  }

  if (phase === 'quiz') {
    return <Quiz onFinish={handleQuizFinish} />
  }

  return <ScoreScreen score={score} total={total} onRestart={handleRestart} onGoToDashboard={() => setPhase('apprenant-dashboard')} />
}
