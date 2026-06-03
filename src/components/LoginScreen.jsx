import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { apiUrl, API_HEADERS } from '../utils/api.js'
import { C, MONO, SANS, Logo, Icon, Btn, Card, Kicker, H } from './lhctrl-kit.jsx'

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.inkSoft, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{label}</div>
      {children}
    </div>
  )
}

function TextInput({ type = 'text', placeholder, value, onChange, icon }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {icon && (
        <div style={{ position: 'absolute', left: 14, pointerEvents: 'none' }}>
          <Icon name={icon} size={16} color={focused ? C.signal : C.inkMute} />
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required
        style={{
          width: '100%',
          height: 46,
          border: `1.5px solid ${focused ? C.signal : C.border}`,
          borderRadius: 10,
          background: C.white,
          padding: icon ? '0 14px 0 40px' : '0 14px',
          fontFamily: SANS,
          fontSize: 13.5,
          color: C.ink,
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
      />
    </div>
  )
}

export default function LoginScreen({ onSuccess, onBack }) {
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

      const res = await fetch(url, { method: 'POST', headers: API_HEADERS, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      login(data.org ?? data.user, data.token)
      onSuccess(mode === 'register')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: C.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: SANS,
      position: 'relative',
    }}>
      {/* Bouton retour */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            position: 'absolute', top: 24, left: 32,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: MONO, fontSize: 11.5, color: C.inkMute,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = C.inkSoft}
          onMouseLeave={(e) => e.currentTarget.style.color = C.inkMute}
        >
          <Icon name="chevL" size={14} color={C.inkMute} />
          Retour
        </button>
      )}

      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <Logo size={28} />
      </div>

      {/* Card */}
      <Card pad={36} style={{ width: '100%', maxWidth: 420 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Kicker color={C.signal} style={{ marginBottom: 8 }}>
            {mode === 'login' ? 'Espace référent IA' : 'Créer une organisation'}
          </Kicker>
          <H size={22} style={{ marginTop: 8 }}>
            {mode === 'login' ? 'Connexion' : 'Nouveau compte'}
          </H>
          <p style={{ color: C.inkSoft, fontSize: 13.5, marginTop: 6, fontFamily: SANS }}>
            {mode === 'login'
              ? 'Accédez à votre espace de pilotage IA'
              : 'Configurez votre organisation en quelques minutes'}
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <Field label="Nom de l'organisation">
              <TextInput
                placeholder="Ex : Groupe Nexia"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                icon="users"
              />
            </Field>
          )}

          <Field label="Email">
            <TextInput
              type="email"
              placeholder="admin@organisation.fr"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              icon="target"
            />
          </Field>

          <Field label="Mot de passe">
            <TextInput
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              icon="shield"
            />
          </Field>

          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 9,
              background: C.badBg,
              border: `1px solid ${C.bad}`,
              color: C.bad,
              fontSize: 12.5,
              fontFamily: SANS,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Icon name="x" size={14} color={C.bad} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ background: 'none', border: 'none', padding: 0, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, opacity: loading ? 0.6 : 1 }}
          >
            <Btn kind="primary" size="lg" icon={loading ? null : 'arrowR'} full>
              {loading ? 'Connexion…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
            </Btn>
          </button>
        </form>

        {/* Switch mode */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: MONO,
              fontSize: 11.5,
              color: C.inkMute,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => e.target.style.color = C.signal}
            onMouseLeave={(e) => e.target.style.color = C.inkMute}
          >
            {mode === 'login' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
          </button>
        </div>
      </Card>

      {/* Mention bas de page */}
      <div style={{ marginTop: 28, fontFamily: MONO, fontSize: 11, color: C.inkMute }}>
        lhctrl. — sensibilisation IA en entreprise
      </div>

      {/* Bypass dev */}
      {import.meta.env.DEV && (
        <button
          type="button"
          onClick={() => { login({ id: 'dev-org', nom: 'Organisation Dev', email: 'dev@dev.local' }, 'dev-bypass-token'); onSuccess() }}
          style={{
            marginTop: 16,
            padding: '8px 16px',
            borderRadius: 9,
            border: `1px dashed ${C.warn}`,
            background: 'none',
            cursor: 'pointer',
            fontFamily: MONO,
            fontSize: 11,
            color: C.warn,
          }}
        >
          ⚡ Accès Dev (bypass login)
        </button>
      )}
    </div>
  )
}
