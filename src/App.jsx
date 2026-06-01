import { useState } from 'react'
import { useApp } from './context/AppContext.jsx'

import LoginScreen from './components/LoginScreen.jsx'
import AccrocheScreen from './components/AccrocheScreen.jsx'
import Quiz from './components/Quiz.jsx'
import ScoreScreen from './components/ScoreScreen.jsx'
import AdminScreen from './components/AdminScreen.jsx'

// phases : 'login' | 'accroche' | 'diagnostic' | 'quiz' | 'score' | 'admin'

export default function App() {
  const { user, logout } = useApp()
  const [phase, setPhase] = useState(user ? 'accroche' : 'login')

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

  if (phase === 'login') {
    return <LoginScreen onSuccess={() => setPhase('accroche')} />
  }

  if (phase === 'admin') {
    return <AdminScreen onBack={() => setPhase('accroche')} />
  }

  if (phase === 'accroche') {
    function handleLogout() { logout(); setPhase('login') }
    return <AccrocheScreen onStart={() => setPhase('quiz')} onAdmin={() => setPhase('admin')} onLogout={handleLogout} />
  }

  if (phase === 'quiz') {
    return <Quiz onFinish={handleQuizFinish} />
  }

  return <ScoreScreen score={score} total={total} onRestart={handleRestart} />
}
