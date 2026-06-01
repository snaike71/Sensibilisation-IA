import { useState } from 'react'
import { useOllama } from '../hooks/useOllama.js'
import { useApp } from '../context/AppContext.jsx'

const ADMIN_PASSWORD = 'lhc2026'

const SECTORS = [
  'Finance / Banque / Assurance',
  'Ressources Humaines',
  'Juridique / Conformité',
  'Santé / Médical',
  'Commerce / Distribution',
  'Industrie / Manufacturing',
  'Communication / Marketing',
  'Informatique / Tech',
  'Administration publique',
  'Éducation / Formation',
  'Autre',
]

const SIZES = [
  'PME (< 250 salariés)',
  'ETI (250–5 000 salariés)',
  'Grande entreprise (> 5 000 salariés)',
]

const categorieColors = {
  possibilite: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  danger: 'bg-red-500/20 text-red-300 border-red-500/30',
  limite: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  cyber: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
}

const categorieLabels = {
  possibilite: 'Possibilité',
  danger: 'Danger',
  limite: 'Limite',
  cyber: 'Cyber',
}

const BLANK_SITUATION = () => ({
  id: Date.now(),
  titre: '',
  texte: '',
  categorie: 'possibilite',
  bonneReponse: 'ia',
  explication: '',
})

export default function AdminScreen({ onBack }) {
  const { companyConfig, customSituations, saveConfig, user } = useApp()
  const { generateSituations, loading, error } = useOllama()

  const isAdmin = user?.role === 'admin'
  const [step, setStep] = useState(isAdmin ? (companyConfig ? 'active' : 'form') : 'login')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(false)
  const [preview, setPreview] = useState(null)
  const [editingIdx, setEditingIdx] = useState(null)

  // Scénarios éditables dans la vue "active"
  const [editableSituations, setEditableSituations] = useState(null)
  const activeSituations = editableSituations ?? customSituations ?? []

  const [form, setForm] = useState({
    companyName: '',
    sector: SECTORS[0],
    size: SIZES[0],
    tools: 'Microsoft Teams, Outlook, SharePoint',
    context: '',
    count: 3,
    questionsPerScenario: 3,
  })
  const [selectedIds, setSelectedIds] = useState(null) // null = tout sélectionné

  function handleLogin(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setLoginError(false)
      setStep(companyConfig ? 'active' : 'form')
    } else {
      setLoginError(true)
    }
  }

  async function handleGenerate(e) {
    e.preventDefault()
    const situations = await generateSituations(form, form.count, form.questionsPerScenario)
    if (situations) {
      setPreview(situations)
      setSelectedIds(situations.map((s) => s.id))
      setStep('preview')
    }
  }

  function handleSave() {
    const toSave = selectedIds ? preview.filter((s) => selectedIds.includes(s.id)) : preview
    saveConfig(form, toSave)
    setEditableSituations(null)
    setSelectedIds(null)
    setStep('active')
  }

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleReset() {
    saveConfig({ companyName: '', sector: SECTORS[0], size: SIZES[0], tools: '', context: '' }, [])
    setPreview(null)
    setEditableSituations(null)
    setForm({ companyName: '', sector: SECTORS[0], size: SIZES[0], tools: 'Microsoft Teams, Outlook, SharePoint', context: '' })
    setStep('form')
  }

  function handleRegenerate() {
    setForm({
      companyName: companyConfig.companyName,
      sector: companyConfig.sector,
      size: companyConfig.size,
      tools: companyConfig.tools,
      context: companyConfig.context,
    })
    setStep('form')
  }

  // Édition inline des scénarios actifs
  function initEdit() {
    setEditableSituations(activeSituations.map((s) => ({ ...s })))
  }

  function updateSituation(idx, field, value) {
    setEditableSituations((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  function removeSituation(idx) {
    setEditableSituations((prev) => prev.filter((_, i) => i !== idx))
  }

  function addSituation() {
    setEditableSituations((prev) => [...(prev ?? activeSituations.map(s => ({ ...s }))), BLANK_SITUATION()])
    setEditingIdx((activeSituations.length))
  }

  function saveEdits() {
    saveConfig(companyConfig, editableSituations)
    setEditingIdx(null)
  }

  function cancelEdits() {
    setEditableSituations(null)
    setEditingIdx(null)
  }

  return (
    <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-6 text-brand-offwhite">
      {/* Header */}
      <div className="w-full max-w-lg mb-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-white/40 hover:text-white text-sm transition-colors flex items-center gap-2"
        >
          ← Retour
        </button>
        <span className="text-brand-cyan text-xs font-mono uppercase tracking-widest">
          Panel Admin · LHC
        </span>
        <div className="w-16" />
      </div>

      {/* LOGIN */}
      {step === 'login' && (
        <div className="w-full max-w-sm">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-black text-center mb-2">Accès administrateur</h2>
            <p className="text-gray-400 text-sm text-center mb-8">
              Personnalisez le kit pour votre organisation.
            </p>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input
                type="password"
                placeholder="Mot de passe admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-white/30 outline-none focus:border-indigo-400 transition-colors ${
                  loginError ? 'border-red-500/60' : 'border-white/10'
                }`}
                autoFocus
              />
              {loginError && (
                <p className="text-red-400 text-xs text-center">Mot de passe incorrect.</p>
              )}
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 font-bold transition-all active:scale-95"
              >
                Connexion →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FORM */}
      {step === 'form' && (
        <div className="w-full max-w-lg">
          <h2 className="text-2xl font-black text-center mb-2">Personnaliser le kit</h2>
          <p className="text-gray-400 text-sm text-center mb-8">
            Renseignez le contexte de votre organisation. L'IA générera 4 scénarios sur mesure.
          </p>

          <form onSubmit={handleGenerate} className="flex flex-col gap-5">
            {/* Nom entreprise */}
            <div>
              <label className="text-xs text-indigo-300 font-mono uppercase tracking-widest mb-2 block">
                Nom de l'organisation *
              </label>
              <input
                type="text"
                required
                placeholder="ex : Groupe Lumière, Mairie de Bordeaux…"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-indigo-400 transition-colors"
              />
            </div>

            {/* Secteur */}
            <div>
              <label className="text-xs text-indigo-300 font-mono uppercase tracking-widest mb-2 block">
                Secteur d'activité *
              </label>
              <select
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white outline-none focus:border-indigo-400 transition-colors"
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Taille */}
            <div>
              <label className="text-xs text-indigo-300 font-mono uppercase tracking-widest mb-2 block">
                Taille de l'organisation *
              </label>
              <div className="flex gap-3 flex-wrap">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, size: s })}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      form.size === s
                        ? 'bg-indigo-500 border-indigo-400 text-white'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Outils */}
            <div>
              <label className="text-xs text-indigo-300 font-mono uppercase tracking-widest mb-2 block">
                Outils utilisés (Teams, Slack, SAP…) *
              </label>
              <input
                type="text"
                required
                placeholder="ex : Teams, SharePoint, Salesforce, SAP…"
                value={form.tools}
                onChange={(e) => setForm({ ...form, tools: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-indigo-400 transition-colors"
              />
            </div>

            {/* Contexte additionnel */}
            <div>
              <label className="text-xs text-indigo-300 font-mono uppercase tracking-widest mb-2 block">
                Contexte spécifique (optionnel)
              </label>
              <textarea
                rows={3}
                placeholder="ex : L'entreprise gère des données de santé, travaille avec des clients internationaux, vient de déployer Copilot…"
                value={form.context}
                onChange={(e) => setForm({ ...form, context: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-indigo-400 transition-colors resize-none"
              />
            </div>

            {/* Nombre de thèmes */}
            <div>
              <label className="text-xs text-indigo-300 font-mono uppercase tracking-widest mb-2 block">
                Nombre de thèmes
              </label>
              <div className="flex gap-2 flex-wrap">
                {[2, 3, 4].map((n) => (
                  <button key={n} type="button" onClick={() => setForm({ ...form, count: n })}
                    className={`w-12 h-12 rounded-xl text-sm font-bold border transition-all ${form.count === n ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre de questions par thème */}
            <div>
              <label className="text-xs text-indigo-300 font-mono uppercase tracking-widest mb-2 block">
                Questions par thème
              </label>
              <div className="flex gap-2 flex-wrap">
                {[2, 3, 4].map((n) => (
                  <button key={n} type="button" onClick={() => setForm({ ...form, questionsPerScenario: n })}
                    className={`w-12 h-12 rounded-xl text-sm font-bold border transition-all ${form.questionsPerScenario === n ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/25 mt-2">
                Total : <span className={`${form.count * form.questionsPerScenario > 9 ? 'text-amber-400' : 'text-white/50'}`}>
                  {form.count} × {form.questionsPerScenario} = {form.count * form.questionsPerScenario} questions
                  {form.count * form.questionsPerScenario > 9 ? ' — génération plus longue' : ''}
                </span>
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`mt-2 px-6 py-4 rounded-xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-3 ${
                loading
                  ? 'bg-indigo-500/40 cursor-not-allowed'
                  : 'bg-indigo-500 hover:bg-indigo-400 shadow-lg shadow-indigo-500/30'
              }`}
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Génération en cours…
                </>
              ) : (
                '✨ Générer les scénarios avec l\'IA →'
              )}
            </button>
          </form>
        </div>
      )}

      {/* PREVIEW */}
      {step === 'preview' && preview && (
        <div className="w-full max-w-2xl">
          <h2 className="text-2xl font-black text-center mb-1">Scénarios générés</h2>
          <p className="text-gray-400 text-sm text-center mb-2">
            {preview.length} scénarios pour <span className="text-white font-semibold">{form.companyName}</span>
          </p>
          <p className="text-indigo-300/70 text-xs text-center mb-6 font-mono">
            Coche ceux que tu veux activer — {selectedIds?.length ?? preview.length} sélectionné{(selectedIds?.length ?? preview.length) > 1 ? 's' : ''}
          </p>

          {/* Tout cocher / décocher */}
          <div className="flex gap-3 mb-4">
            <button onClick={() => setSelectedIds(preview.map(s => s.id))}
              className="text-xs text-white/40 hover:text-white font-mono transition-colors">
              ✓ Tout sélectionner
            </button>
            <span className="text-white/10">·</span>
            <button onClick={() => setSelectedIds([])}
              className="text-xs text-white/40 hover:text-white font-mono transition-colors">
              Tout désélectionner
            </button>
          </div>

          <div className="flex flex-col gap-4 mb-8">
            {preview.map((s) => {
              const isSelected = selectedIds?.includes(s.id) ?? true
              const questions = s.questions ?? []
              return (
                <div
                  key={s.id}
                  className={`rounded-xl border transition-all ${
                    isSelected ? 'bg-white/5 border-indigo-500/40' : 'bg-white/[0.02] border-white/5 opacity-40'
                  }`}
                >
                  {/* En-tête thème — cliquable pour cocher/décocher */}
                  <div
                    className="flex items-start gap-3 p-4 cursor-pointer"
                    onClick={() => toggleSelect(s.id)}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'bg-indigo-500 border-indigo-400' : 'border-white/20'
                    }`}>
                      {isSelected && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${categorieColors[s.categorie] ?? 'bg-white/10 text-white/60 border-white/20'}`}>
                          {categorieLabels[s.categorie] ?? s.categorie}
                        </span>
                        <span className="text-white font-bold text-sm">{s.titre}</span>
                      </div>
                      {s.description && <p className="text-gray-400 text-xs leading-relaxed">{s.description}</p>}
                      <p className="text-white/25 text-xs font-mono mt-1">{questions.length} question{questions.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Questions du thème */}
                  {questions.length > 0 && (
                    <div className="border-t border-white/5 px-4 pb-4 flex flex-col gap-3 pt-3">
                      {questions.map((q, qi) => (
                        <div key={q.id ?? qi} className="flex gap-3 items-start">
                          <span className="text-white/20 font-mono text-xs mt-1 shrink-0">Q{qi + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-300 text-xs leading-relaxed mb-1">{q.texte}</p>
                            <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                              q.bonneReponse === 'ia' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                            }`}>
                              {q.bonneReponse === 'ia' ? '✅ Déléguer à l\'IA' : '🧠 Garder en manuel'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('form')}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-semibold transition-all text-sm"
            >
              ← Régénérer
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedIds || selectedIds.length === 0}
              className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all active:scale-95 ${
                selectedIds && selectedIds.length > 0
                  ? 'bg-indigo-500 hover:bg-indigo-400 shadow-lg shadow-indigo-500/30'
                  : 'bg-indigo-500/20 text-white/30 cursor-not-allowed'
              }`}
            >
              ✓ Activer {selectedIds?.length ?? preview.length} scénario{(selectedIds?.length ?? preview.length) > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE CONFIG */}
      {step === 'active' && companyConfig && (
        <div className="w-full max-w-2xl">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black mb-0.5">✓ Kit activé · <span className="text-emerald-300">{companyConfig.companyName}</span></h2>
              <p className="text-white/40 text-xs">{companyConfig.sector} · {companyConfig.size}</p>
            </div>
            <button
              onClick={handleRegenerate}
              className="shrink-0 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono transition-all"
            >
              ✨ Régénérer avec l'IA
            </button>
          </div>

          {/* Scénarios éditables */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-white/40 font-mono uppercase tracking-widest">
              {activeSituations.length} scénario{activeSituations.length > 1 ? 's' : ''} actif{activeSituations.length > 1 ? 's' : ''}
            </p>
            {editableSituations ? (
              <div className="flex gap-2">
                <button onClick={cancelEdits} className="text-xs text-white/40 hover:text-white/70 font-mono transition-colors">Annuler</button>
                <button onClick={saveEdits} className="text-xs text-emerald-400 hover:text-emerald-300 font-mono font-bold transition-colors">✓ Sauvegarder</button>
              </div>
            ) : (
              <button onClick={initEdit} className="text-xs text-indigo-400 hover:text-indigo-300 font-mono transition-colors">✏ Modifier manuellement</button>
            )}
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {activeSituations.map((s, i) => (
              <div key={s.id ?? i} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                {/* En-tête cliquable */}
                <button
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
                  onClick={() => setEditingIdx(editingIdx === i ? null : i)}
                >
                  <span className="text-white/20 font-mono text-xs shrink-0">#{i + 1}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${categorieColors[s.categorie] ?? 'bg-white/10 text-white/60 border-white/20'}`}>
                    {categorieLabels[s.categorie] ?? s.categorie}
                  </span>
                  <span className="text-white text-sm font-semibold flex-1 truncate">{s.titre || <em className="text-white/30">Sans titre</em>}</span>
                  <span className="text-white/20 text-xs">{editingIdx === i ? '▲' : '▼'}</span>
                </button>

                {/* Détail / édition */}
                {editingIdx === i && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3 flex flex-col gap-3">
                    {editableSituations ? (
                      <>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="text-xs text-white/30 mb-1 block">Titre</label>
                            <input value={s.titre} onChange={(e) => updateSituation(i, 'titre', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-indigo-400" />
                          </div>
                          <div className="w-36">
                            <label className="text-xs text-white/30 mb-1 block">Catégorie</label>
                            <select value={s.categorie} onChange={(e) => updateSituation(i, 'categorie', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm outline-none focus:border-indigo-400">
                              {Object.entries(categorieLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-white/30 mb-1 block">Description (ce que l'employé lit)</label>
                          <textarea rows={3} value={s.texte} onChange={(e) => updateSituation(i, 'texte', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-indigo-400 resize-none" />
                        </div>
                        <div>
                          <label className="text-xs text-white/30 mb-1 block">Bonne réponse</label>
                          <div className="flex gap-2">
                            {['ia', 'humain'].map((v) => (
                              <button key={v} type="button" onClick={() => updateSituation(i, 'bonneReponse', v)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${s.bonneReponse === v ? (v === 'ia' ? 'bg-emerald-500/30 border-emerald-500/50 text-emerald-300' : 'bg-amber-500/30 border-amber-500/50 text-amber-300') : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}>
                                {v === 'ia' ? '✅ Déléguer à l\'IA' : '🧠 Garder en manuel'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-white/30 mb-1 block">Explication (feedback après réponse)</label>
                          <textarea rows={2} value={s.explication ?? ''} onChange={(e) => updateSituation(i, 'explication', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-indigo-400 resize-none" />
                        </div>
                        <button onClick={() => removeSituation(i)}
                          className="self-start text-xs text-red-400/60 hover:text-red-400 font-mono transition-colors">
                          🗑 Supprimer ce scénario
                        </button>
                      </>
                    ) : (
                      <>
                        {s.description && <p className="text-gray-400 text-sm leading-relaxed mb-2">{s.description}</p>}
                        {(s.questions ?? []).length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {(s.questions ?? []).map((q, qi) => (
                              <div key={q.id ?? qi} className="flex gap-2 items-start">
                                <span className="text-white/20 font-mono text-xs mt-0.5 shrink-0">Q{qi + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-400 text-xs leading-relaxed mb-1">{q.texte}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${q.bonneReponse === 'ia' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                                    {q.bonneReponse === 'ia' ? '✅ IA' : '🧠 Manuel'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            <p className="text-gray-400 text-sm leading-relaxed">{s.texte}</p>
                            {s.bonneReponse && (
                              <span className={`self-start text-xs px-2 py-1 rounded-lg font-mono ${s.bonneReponse === 'ia' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                {s.bonneReponse === 'ia' ? '✅ Déléguer à l\'IA' : '🧠 Garder en manuel'}
                              </span>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Ajouter un scénario */}
            {editableSituations && (
              <button onClick={addSituation}
                className="w-full px-4 py-3 rounded-xl border border-dashed border-white/20 hover:border-indigo-400/50 text-white/30 hover:text-indigo-300 text-sm font-mono transition-all">
                + Ajouter un scénario
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 font-semibold transition-all text-sm"
            >
              🗑 Réinitialiser tout
            </button>
            <button
              onClick={onBack}
              className="flex-1 px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 font-bold transition-all active:scale-95"
            >
              Lancer le kit →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/40 shrink-0">{label}</span>
      <span className="text-white text-right">{value}</span>
    </div>
  )
}
