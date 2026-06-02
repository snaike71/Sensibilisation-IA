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

// phases : 'login' | 'role-select' | 'join-team' | 'apprenant-dashboard' | 'accroche' | 'quiz' | 'score' | 'admin' | 'admin-generate'

export default function App() {
  const { user, logout } = useApp()
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

  if (phase === 'login') return <LoginScreen onSuccess={() => setPhase('role-select')} />

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

  // Admin : dashboard principal (nouveau design lhctrl)
  if (phase === 'admin') {
    return (
      <AdminHub
        onBack={() => setPhase('role-select')}
        onGenerateModule={() => setPhase('admin-generate')}
      />
    )
  }

  // Admin : générateur IA de scénarios quiz (panneau de configuration IA)
  if (phase === 'admin-generate') {
    return <AdminScreen onBack={() => setPhase('admin')} />
  }

  if (phase === 'accroche') return <AccrocheScreen onStart={() => setPhase('quiz')} onLogout={handleLogout} />

  if (phase === 'quiz') return <Quiz onFinish={handleQuizFinish} />

  return <ScoreScreen score={score} total={total} onRestart={handleRestart} onGoToDashboard={() => setPhase('apprenant-dashboard')} />
}
