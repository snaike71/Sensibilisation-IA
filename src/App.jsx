import { useState } from 'react'
import { useApp } from './context/AppContext.jsx'

import LoginScreen from './components/LoginScreen.jsx'
import RoleSelectScreen from './components/RoleSelectScreen.jsx'
import JoinTeamScreen from './components/apprenant/JoinTeamScreen.jsx'
import ApprenantDashboard from './components/apprenant/ApprenantDashboard.jsx'
import AccrocheScreen from './components/apprenant/AccrocheScreen.jsx'
import Quiz from './components/apprenant/Quiz.jsx'
import ScoreScreen from './components/apprenant/ScoreScreen.jsx'
import AdminHub from './components/admin/AdminHub.jsx'
import AdminScreen from './components/admin/AdminScreen.jsx'

// phases : 'role-select' | 'login' | 'join-team' | 'apprenant-dashboard' | 'accroche' | 'quiz' | 'score' | 'admin' | 'admin-generate'

export default function App() {
  const { user, token, collaborator, logout } = useApp()

  // Point d'entrée : role-select (sauf si déjà connecté au refresh)
  const [phase, setPhase] = useState(() => {
    if (user || token) return 'admin'          // admin déjà connecté → son hub
    if (collaborator) return 'apprenant-dashboard' // collaborateur → son dashboard
    return 'role-select'                        // sinon → choix du rôle
  })

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
    setPhase('role-select')
  }

  // Écran d'accueil : choix du rôle (pas de login ici)
  if (phase === 'role-select') {
    return (
      <RoleSelectScreen
        onAdmin={() => setPhase('login')}
        onApprenant={() => setPhase('join-team')}
        onLogout={handleLogout}
      />
    )
  }

  // Login admin uniquement (déclenché par "Accéder à l'admin")
  if (phase === 'login') {
    return <LoginScreen onSuccess={() => setPhase('admin')} onBack={() => setPhase('role-select')} />
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

  // Admin : hub de pilotage (pages du collègue)
  if (phase === 'admin') {
    return (
      <AdminHub
        onBack={() => setPhase('role-select')}
        onGenerateModule={() => setPhase('admin-generate')}
      />
    )
  }

  // Admin : génération IA de scénarios quiz
  if (phase === 'admin-generate') {
    return <AdminScreen onBack={() => setPhase('admin')} />
  }

  if (phase === 'accroche') {
    return <AccrocheScreen onStart={() => setPhase('quiz')} onLogout={handleLogout} />
  }

  if (phase === 'quiz') {
    return <Quiz onFinish={handleQuizFinish} />
  }

  return <ScoreScreen score={score} total={total} onRestart={handleRestart} onGoToDashboard={() => setPhase('apprenant-dashboard')} />
}
