import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { apiUrl, API_HEADERS } from '../utils/api.js'

export default function LoginScreen({ onSuccess }) {
  const { login } = useApp()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', name: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const url = apiUrl(mode === 'login' ? '/api/auth/login' : '/api/auth/register')
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { nom: form.name, email: form.email, password: form.password }

      const res = await fetch(url, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      // Le nouveau backend renvoie { org, token }, l'ancien renvoyait { user, token }
      login(data.org ?? data.user, data.token)
      onSuccess()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-6 text-brand-offwhite">
      <img src="/logo-white.svg" alt="lhctrl." className="h-9 mb-10 opacity-90" />

      <div className="w-full max-w-sm">
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8">
          <h2 className="font-mono font-bold text-xl text-center mb-1">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h2>
          <p className="text-brand-offwhite/40 text-sm text-center mb-8 font-sans">
            {mode === 'login' ? 'Accédez à votre espace' : 'Rejoignez votre organisation'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'register' && (
              <input
                type="text"
                placeholder="Prénom Nom"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-brand-offwhite placeholder-white/25 outline-none focus:border-brand-blue transition-colors font-sans text-sm"
              />
            )}
            <input
              type="email"
              placeholder="Email professionnel"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-brand-offwhite placeholder-white/25 outline-none focus:border-brand-blue transition-colors font-sans text-sm"
            />
            <input
              type="password"
              placeholder="Mot de passe"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-brand-offwhite placeholder-white/25 outline-none focus:border-brand-blue transition-colors font-sans text-sm"
            />

            {error && (
              <p className="text-red-400 text-xs text-center font-sans">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 px-6 py-3 rounded-xl bg-brand-blue hover:bg-brand-blue/80 font-sans font-medium text-white transition-all active:scale-95 shadow-lg shadow-brand-blue/30 disabled:opacity-50"
            >
              {loading ? 'Chargement…' : mode === 'login' ? 'Se connecter →' : 'Créer le compte →'}
            </button>
          </form>
        </div>

        <button
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
          className="w-full mt-4 text-brand-offwhite/30 hover:text-brand-offwhite/60 text-xs font-mono transition-colors text-center"
        >
          {mode === 'login' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </button>
      </div>
    </div>
  )
}
