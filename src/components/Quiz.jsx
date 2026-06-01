import { useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { situations as defaultSituations } from '../situations.js'
import { useApp } from '../context/AppContext.jsx'
import { useOllama } from '../hooks/useOllama.js'
import SituationCard from './SituationCard.jsx'
import DropZone from './DropZone.jsx'

const categorieColors = {
  possibilite: 'bg-brand-blue/15 text-brand-cyan border border-brand-blue/20',
  danger:      'bg-red-500/15 text-red-300 border border-red-500/20',
  limite:      'bg-amber-500/15 text-amber-300 border border-amber-500/20',
  cyber:       'bg-purple-500/15 text-purple-300 border border-purple-500/20',
}
const categorieLabels = {
  possibilite: 'Possibilité', danger: 'Danger', limite: 'Limite', cyber: 'Cyber',
}

function normalizeScenarios(raw) {
  if (!raw || raw.length === 0) return defaultSituations
  if (raw[0]?.questions) return raw
  return [{
    id: 1,
    categorie: raw[0]?.categorie ?? 'possibilite',
    titre: 'Situations',
    description: 'Analysez chaque situation et classez-la.',
    questions: raw.map((s, i) => ({
      id: String(s.id ?? i + 1),
      type: 'drag',
      texte: s.texte,
      bonneReponse: s.bonneReponse === 'manuel' ? 'humain' : (s.bonneReponse ?? 'ia'),
      explication: s.explication ?? s.feedbackCorrect?.texte ?? '',
    })),
  }]
}

// ── Feedback Modal inline ────────────────────────────────────
function FeedbackOverlay({ question, isCorrect, aiAnalysis, analyzing, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className={`border rounded-2xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-4 ${
        question.type === 'free'
          ? 'bg-slate-900 border-white/10'
          : isCorrect
          ? 'bg-emerald-950 border-emerald-500/30'
          : 'bg-red-950 border-red-500/30'
      }`}>
        {question.type === 'free' ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-brand-cyan text-xs font-mono uppercase tracking-widest">✨ Analyse IA</span>
            </div>
            {analyzing ? (
              <div className="flex items-center gap-3 py-2">
                <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-brand-cyan rounded-full animate-spin shrink-0" />
                <p className="text-white/50 text-sm">Analyse de ta réponse en cours…</p>
              </div>
            ) : aiAnalysis ? (
              <p className="text-brand-offwhite text-sm leading-relaxed">{aiAnalysis}</p>
            ) : (
              <>
                <p className="text-white/50 text-xs font-mono uppercase tracking-widest">Réponse de référence</p>
                <p className="text-brand-offwhite text-sm leading-relaxed">{question.modelAnswer}</p>
              </>
            )}
            {question.explication && !analyzing && (
              <p className="text-white/40 text-xs leading-relaxed border-t border-white/10 pt-3 italic">{question.explication}</p>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{isCorrect ? '✅' : '❌'}</span>
              <span className={`text-xl font-mono font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                {isCorrect ? 'Bonne réponse !' : 'Mauvaise réponse'}
              </span>
            </div>
            {!isCorrect && question.type === 'drag' && (
              <div className="bg-white/5 rounded-xl px-4 py-2 text-sm text-white/60 font-mono">
                Bonne réponse : <span className="text-white font-semibold">
                  {question.bonneReponse === 'ia' ? '✅ Déléguer à l\'IA' : '🧠 Garder en manuel'}
                </span>
              </div>
            )}
            {!isCorrect && question.type === 'mcq' && (
              <div className="bg-white/5 rounded-xl px-4 py-2 text-sm text-white/60 font-mono">
                Bonne réponse : <span className="text-white font-semibold">{question.bonneReponse}</span>
              </div>
            )}
            <p className="text-brand-offwhite/80 text-sm leading-relaxed">{question.explication}</p>
          </>
        )}
        <button
          onClick={onClose}
          disabled={analyzing}
          className={`mt-1 px-6 py-2.5 rounded-xl font-medium active:scale-95 transition-all ${
            analyzing ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-brand-blue hover:bg-brand-blue/80 text-white'
          }`}
        >
          {analyzing ? 'Analyse en cours…' : 'Continuer →'}
        </button>
      </div>
    </div>
  )
}

export default function Quiz({ onFinish }) {
  const { customSituations } = useApp()
  const { analyzeAnswer, analyzing } = useOllama()
  const scenarios = normalizeScenarios(customSituations ?? defaultSituations)

  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [questionIdx, setQuestionIdx] = useState(0)
  const [phase, setPhase] = useState('intro')
  const [answers, setAnswers] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [activeId, setActiveId] = useState(null)

  // MCQ state
  const [mcqSelected, setMcqSelected] = useState(null)
  // Free text state
  const [freeText, setFreeText] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const totalQuestions = scenarios.reduce((sum, s) => sum + s.questions.length, 0)
  const answeredCount = Object.keys(answers).length
  const currentScenario = scenarios[scenarioIdx]
  const currentQuestion = currentScenario?.questions[questionIdx]
  const questionNumber = scenarios.slice(0, scenarioIdx).reduce((sum, s) => sum + s.questions.length, 0) + questionIdx + 1

  async function submitAnswer(isCorrect, userText = null) {
    const newAnswers = { ...answers, [currentQuestion.id]: { correct: isCorrect } }
    setAnswers(newAnswers)
    setFeedback({ question: currentQuestion, isCorrect })
    setAiAnalysis(null)
    setPhase('feedback')

    // Pour les questions libres, lancer l'analyse IA en arrière-plan
    if (currentQuestion.type === 'free' && userText) {
      const analysis = await analyzeAnswer(
        currentQuestion.texte,
        currentQuestion.modelAnswer ?? '',
        userText
      )
      setAiAnalysis(analysis)
    }
  }

  function handleFeedbackClose() {
    setFeedback(null)
    setAiAnalysis(null)
    setMcqSelected(null)
    setFreeText('')
    const isLastQ = questionIdx >= currentScenario.questions.length - 1
    const isLastS = scenarioIdx >= scenarios.length - 1

    if (isLastQ && isLastS) {
      const finalAnswers = { ...answers, [currentQuestion.id]: { correct: feedback?.isCorrect ?? null } }
      const score = Object.values(finalAnswers).filter((a) => a.correct === true).length
      onFinish(score, totalQuestions)
    } else if (isLastQ) {
      setPhase('transition')
    } else {
      setQuestionIdx((i) => i + 1)
      setPhase('question')
    }
  }

  // ── DRAG handlers ──────────────────────────
  function handleDragStart({ active }) { setActiveId(active.id) }
  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over || phase !== 'question' || currentQuestion?.type !== 'drag') return
    const isCorrect = currentQuestion.bonneReponse === over.id
    submitAnswer(isCorrect)
  }

  // ── INTRO ───────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-6 text-brand-offwhite">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs font-mono text-brand-cyan uppercase tracking-widest">
              Scénario {scenarioIdx + 1} / {scenarios.length}
            </span>
            <span className="text-xs text-white/30 font-mono">{answeredCount}/{totalQuestions} questions</span>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full mb-4 inline-block ${categorieColors[currentScenario.categorie]}`}>
            {categorieLabels[currentScenario.categorie]}
          </span>
          <h2 className="text-3xl font-black mb-4 leading-tight mt-2">{currentScenario.titre}</h2>
          <p className="text-white/60 text-base leading-relaxed mb-4">{currentScenario.description}</p>
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-8 text-sm text-white/40 font-mono">
            {currentScenario.questions.length} question{currentScenario.questions.length > 1 ? 's' : ''} — formats variés
          </div>
          <button onClick={() => setPhase('question')}
            className="w-full px-6 py-4 rounded-xl bg-brand-blue hover:bg-brand-blue/80 font-bold text-white transition-all active:scale-95">
            Commencer →
          </button>
        </div>
      </div>
    )
  }

  // ── TRANSITION ─────────────────────────────
  if (phase === 'transition') {
    const qs = currentScenario.questions
    const correct = qs.filter((q) => answers[q.id]?.correct === true).length
    const scoreable = qs.filter((q) => q.type !== 'free').length
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-6 text-brand-offwhite">
        <div className="w-full max-w-lg text-center">
          <span className="text-4xl mb-4 block">
            {correct === scoreable ? '🎯' : correct >= scoreable / 2 ? '👍' : '💡'}
          </span>
          <h2 className="text-2xl font-black mb-2">Scénario terminé</h2>
          <p className="text-white/50 mb-2"><strong className="text-white">{currentScenario.titre}</strong></p>
          {scoreable > 0 && (
            <p className="text-white/40 text-sm mb-8">{correct} / {scoreable} bonne{correct > 1 ? 's' : ''} réponse{correct > 1 ? 's' : ''}</p>
          )}
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-6 text-sm text-white/40 font-mono">
            Prochain : <span className="text-white">{scenarios[scenarioIdx + 1]?.titre}</span>
          </div>
          <button onClick={() => { setScenarioIdx(i => i + 1); setQuestionIdx(0); setPhase('intro') }}
            className="w-full px-6 py-4 rounded-xl bg-brand-blue hover:bg-brand-blue/80 font-bold text-white transition-all active:scale-95">
            Scénario suivant →
          </button>
        </div>
      </div>
    )
  }

  // ── QUESTION ───────────────────────────────
  const isDrag = currentQuestion?.type === 'drag'
  const isMcq = currentQuestion?.type === 'mcq'
  const isFree = currentQuestion?.type === 'free'

  const QuestionContent = (
    <div className="min-h-screen bg-brand-black flex flex-col text-brand-offwhite">
      {/* Header */}
      <header className="py-5 px-6 flex items-center justify-between max-w-2xl mx-auto w-full">
        <div>
          <p className="text-xs font-mono text-brand-cyan uppercase tracking-widest">{currentScenario.titre}</p>
          <p className="text-xs text-white/20 font-mono mt-0.5">Question {questionIdx + 1}/{currentScenario.questions.length}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
            isDrag ? 'text-blue-300 border-blue-500/30 bg-blue-500/10' :
            isMcq ? 'text-purple-300 border-purple-500/30 bg-purple-500/10' :
            'text-amber-300 border-amber-500/30 bg-amber-500/10'
          }`}>
            {isDrag ? '↔ Glisser' : isMcq ? '☑ QCM' : '✏ Libre'}
          </span>
          <span className="text-sm text-brand-offwhite/30 font-mono">{questionNumber}/{totalQuestions}</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="px-6 max-w-2xl mx-auto w-full mb-6">
        <div className="w-full bg-white/10 rounded-full h-1">
          <div className="h-1 rounded-full bg-brand-blue transition-all duration-500"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 gap-6 pb-8">

        {/* ── DRAG ────────────────── */}
        {isDrag && (
          <>
            <div className="w-full max-w-sm flex flex-col items-center gap-3 min-h-32">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categorieColors[currentScenario.categorie]}`}>
                {categorieLabels[currentScenario.categorie]}
              </span>
              <SituationCard key={currentQuestion.id} situation={currentQuestion} isAnswered={false} />
            </div>
            <p className="text-brand-offwhite/25 text-xs font-mono">↓ Glissez la carte dans la bonne zone ↓</p>
            <div className="w-full max-w-2xl flex gap-4">
              <DropZone id="ia" label="Déléguer à l'IA" emoji="✅" colorClass="bg-brand-blue/5 border-brand-blue/20">
                {Object.entries(answers).filter(([, a]) => a.chosen === 'ia').map(([id]) => {
                  const q = scenarios.flatMap(s => s.questions).find(q => String(q.id) === id)
                  return q ? <div key={id} className="bg-white/5 rounded-lg px-3 py-2 text-xs text-brand-offwhite/60 line-clamp-2">{q.texte}</div> : null
                })}
              </DropZone>
              <DropZone id="humain" label="Garder en manuel" emoji="🧠" colorClass="bg-brand-navy/10 border-brand-navy/30">
                {Object.entries(answers).filter(([, a]) => a.chosen === 'humain').map(([id]) => {
                  const q = scenarios.flatMap(s => s.questions).find(q => String(q.id) === id)
                  return q ? <div key={id} className="bg-white/5 rounded-lg px-3 py-2 text-xs text-brand-offwhite/60 line-clamp-2">{q.texte}</div> : null
                })}
              </DropZone>
            </div>
          </>
        )}

        {/* ── QCM ─────────────────── */}
        {isMcq && (
          <div className="w-full max-w-lg flex flex-col gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full mb-3 inline-block ${categorieColors[currentScenario.categorie]}`}>
                {categorieLabels[currentScenario.categorie]}
              </span>
              <p className="text-brand-offwhite text-base leading-relaxed mt-2">{currentQuestion.texte}</p>
            </div>
            <div className="flex flex-col gap-3">
              {(currentQuestion.options ?? []).map((opt, idx) => {
                const letter = ['A', 'B', 'C', 'D'][idx]
                return (
                  <button key={letter}
                    onClick={() => setMcqSelected(letter)}
                    className={`w-full px-5 py-3.5 rounded-xl text-left font-sans text-sm transition-all border flex items-center gap-3 ${
                      mcqSelected === letter
                        ? 'bg-brand-blue border-brand-blue text-white'
                        : 'bg-white/5 border-white/10 text-brand-offwhite/70 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className={`font-mono font-bold shrink-0 w-6 ${mcqSelected === letter ? 'text-white' : 'text-white/30'}`}>{letter}</span>
                    {opt}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => { if (mcqSelected) submitAnswer(mcqSelected === currentQuestion.bonneReponse) }}
              disabled={!mcqSelected}
              className={`w-full px-6 py-3.5 rounded-xl font-bold transition-all active:scale-95 ${
                mcqSelected ? 'bg-brand-blue hover:bg-brand-blue/80 text-white' : 'bg-white/5 text-white/25 cursor-not-allowed'
              }`}
            >
              Valider →
            </button>
          </div>
        )}

        {/* ── LIBRE ───────────────── */}
        {isFree && (
          <div className="w-full max-w-lg flex flex-col gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full mb-3 inline-block ${categorieColors[currentScenario.categorie]}`}>
                {categorieLabels[currentScenario.categorie]}
              </span>
              <p className="text-brand-offwhite text-base leading-relaxed mt-2">{currentQuestion.texte}</p>
            </div>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              rows={4}
              placeholder="Écrivez votre réponse ici…"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 outline-none focus:border-brand-blue/50 transition-colors resize-none text-sm"
            />
            <p className="text-white/25 text-xs font-mono text-center">
              Votre réponse n'est pas notée — une réponse de référence s'affichera.
            </p>
            <button
              onClick={() => submitAnswer(null, freeText)}
              disabled={freeText.trim().length < 3}
              className={`w-full px-6 py-3.5 rounded-xl font-bold transition-all active:scale-95 ${
                freeText.trim().length >= 3 ? 'bg-brand-blue hover:bg-brand-blue/80 text-white' : 'bg-white/5 text-white/25 cursor-not-allowed'
              }`}
            >
              Voir la réponse de référence →
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <FeedbackOverlay
          question={feedback.question}
          isCorrect={feedback.isCorrect}
          aiAnalysis={aiAnalysis}
          analyzing={analyzing}
          onClose={handleFeedbackClose}
        />
      )}
    </div>
  )

  // Wrap in DndContext only for drag questions
  if (isDrag) {
    return (
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {QuestionContent}
        <DragOverlay>
          {activeId && currentQuestion ? (
            <div className="px-5 py-4 rounded-2xl shadow-xl bg-brand-navy border border-brand-blue/40 font-sans font-medium text-brand-offwhite text-sm rotate-2 opacity-95 max-w-xs">
              {currentQuestion.texte}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    )
  }

  return QuestionContent
}
