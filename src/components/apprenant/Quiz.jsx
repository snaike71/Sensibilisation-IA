import { useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { situations as defaultSituations } from '../../situations.js'
import { useApp } from '../../context/AppContext.jsx'
import { useOllama } from '../../hooks/useOllama.js'
import SituationCard from './SituationCard.jsx'
import DropZone from './DropZone.jsx'
import { C, MONO, SANS, Logo, Icon, Btn, Card, Chip, Progress, H } from '../lhctrl-kit.jsx'

const categorieLabels = {
  possibilite: 'Possibilité',
  danger: 'Danger',
  limite: 'Limite',
  cyber: 'Cyber',
}

function getCategorieStyle(cat) {
  switch (cat) {
    case 'possibilite': return { bg: C.cyan, fg: C.night, border: C.cyan }
    case 'danger': return { bg: C.badBg, fg: C.bad, border: C.bad }
    case 'limite': return { bg: C.warnBg, fg: C.warn, border: C.warn }
    case 'cyber': return { bg: C.signalSoft, fg: C.signal, border: C.signal }
    default: return { bg: C.white, fg: C.inkSoft, border: C.border }
  }
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

function QuizOption({ letter, text, state, onClick, disabled }) {
  const [hovered, setHovered] = useState(false)
  const activeState = (state === 'neutral' && hovered && !disabled) ? 'hover' : state

  const skins = {
    neutral:   { bg: C.white, bd: C.border, fg: C.ink, ic: null, badge: null },
    hover:     { bg: C.signalSoft, bd: C.signal, fg: C.ink, ic: null, badge: "survol" },
    selected:  { bg: C.signalSoft, bd: C.signal, fg: C.ink, ic: null, badge: null },
    correct:   { bg: C.okBg, bd: C.ok, fg: C.ok, ic: "check", badge: "correct" },
    incorrect: { bg: C.badBg, bd: C.bad, fg: C.bad, ic: "x", badge: "incorrect" },
  }
  const s = skins[activeState] || skins.neutral

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      type="button"
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        textAlign: "left",
        gap: 14,
        padding: "16px 18px",
        borderRadius: 12,
        background: s.bg,
        border: `1.5px solid ${s.bd}`,
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: (disabled && state === 'neutral') ? 0.5 : 1,
        transition: "all 0.15s ease-in-out"
      }}
    >
      <div style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        flexShrink: 0,
        background: activeState === "correct" ? C.ok : activeState === "incorrect" ? C.bad : activeState === "hover" || activeState === "selected" ? C.signal : C.bg,
        border: `1px solid ${s.bd}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: MONO,
        fontWeight: 700,
        fontSize: 13,
        color: ["correct", "incorrect", "hover", "selected"].includes(activeState) ? C.white : C.inkSoft
      }}>
        {s.ic ? <Icon name={s.ic} size={16} color={C.white} /> : letter}
      </div>
      <div style={{ flex: 1, fontSize: 14.5, fontWeight: 500, color: activeState === "neutral" ? C.ink : s.fg, fontFamily: SANS }}>{text}</div>
      {s.badge && <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: s.fg,
        textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.badge}</span>}
    </button>
  )
}

export default function Quiz({ module, onFinish }) {
  const { customSituations, setCurrentModuleId } = useApp()
  const { analyzeAnswer, analyzing } = useOllama()

  // Priorité : contenu du module assigné > situations personnalisées > situations par défaut
  const moduleScenarios = (() => {
    if (!module?.contenu) return null
    try { return JSON.parse(module.contenu) } catch { return null }
  })()
  const scenarios = normalizeScenarios(moduleScenarios ?? customSituations ?? defaultSituations)

  // Mémoriser le module courant pour que ScoreScreen puisse l'inclure dans la session
  useState(() => { if (setCurrentModuleId && module?.id) setCurrentModuleId(module.id) })

  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [questionIdx, setQuestionIdx] = useState(0)
  const [phase, setPhase] = useState('intro') // 'intro' | 'question' | 'feedback' | 'transition'
  const [answers, setAnswers] = useState({})
  
  // MCQ states
  const [mcqSelected, setMcqSelected] = useState(null)
  
  // Free text states
  const [freeText, setFreeText] = useState('')
  const [aiAnalysis, setAiAnalysis] = useState(null)

  // Drag states
  const [activeId, setActiveId] = useState(null)
  const [dragResult, setDragResult] = useState(null) // { isCorrect }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const totalQuestions = scenarios.reduce((sum, s) => sum + s.questions.length, 0)
  const answeredCount = Object.keys(answers).length
  const currentScenario = scenarios[scenarioIdx]
  const currentQuestion = currentScenario?.questions[questionIdx]
  const questionNumber = scenarios.slice(0, scenarioIdx).reduce((sum, s) => sum + s.questions.length, 0) + questionIdx + 1

  const currentScore = Object.values(answers).filter(a => a.correct).length
  const currentPoints = currentScore * 100

  async function submitAnswer(isCorrect, userText = null, chosen = null) {
    const newAnswers = { ...answers, [currentQuestion.id]: { correct: isCorrect, chosen } }
    setAnswers(newAnswers)
    setPhase('feedback')

    if (currentQuestion.type === 'free' && userText) {
      const analysis = await analyzeAnswer(
        currentQuestion.texte,
        currentQuestion.modelAnswer ?? '',
        userText
      )
      setAiAnalysis(analysis)
    }
  }

  function handleFeedbackContinue() {
    setAiAnalysis(null)
    setMcqSelected(null)
    setFreeText('')
    setDragResult(null)
    
    const isLastQ = questionIdx >= currentScenario.questions.length - 1
    const isLastS = scenarioIdx >= scenarios.length - 1

    if (isLastQ && isLastS) {
      const finalAnswers = { ...answers, [currentQuestion.id]: { correct: answers[currentQuestion.id]?.correct ?? null } }
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
    setDragResult({ isCorrect })
    submitAnswer(isCorrect, null, over.id)
  }

  // ── INTRO ───────────────────────────────────
  if (phase === 'intro') {
    const catStyle = getCategorieStyle(currentScenario.categorie)
    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, color: C.ink, fontFamily: SANS }}>
        <div style={{ width: "100%", maxWidth: 512 }}>
          <Card pad={28}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <span style={{ fontSize: 11, fontFamily: MONO, color: C.signal, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Scénario {scenarioIdx + 1} / {scenarios.length}
              </span>
              <span style={{ fontSize: 11, fontFamily: MONO, color: C.inkMute }}>{answeredCount}/{totalQuestions} questions</span>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 7,
                background: catStyle.bg, color: catStyle.fg, border: `1px solid ${catStyle.border}`,
                fontFamily: MONO, fontWeight: 700, fontSize: 11
              }}>
                <Icon name="layers" size={13} color={catStyle.fg} />
                {categorieLabels[currentScenario.categorie] || 'Thème'}
              </span>
            </div>
            
            <H size={22} style={{ marginBottom: 16, marginTop: 8 }}>{currentScenario.titre}</H>
            <p style={{ color: C.inkSoft, fontSize: 14.5, lineHeight: 1.5, marginBottom: 24 }}>{currentScenario.description}</p>
            
            <div style={{ background: C.ph, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 32, fontSize: 13, color: C.inkMute, fontFamily: MONO }}>
              💡 {currentScenario.questions.length} question{currentScenario.questions.length > 1 ? 's' : ''} sur cette thématique.
            </div>
            
            <div onClick={() => setPhase('question')} style={{ width: "100%" }}>
              <Btn kind="primary" size="lg" full>Commencer l'évaluation</Btn>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // ── TRANSITION ─────────────────────────────
  if (phase === 'transition') {
    const qs = currentScenario.questions
    const correct = qs.filter((q) => answers[q.id]?.correct === true).length
    const scoreable = qs.filter((q) => q.type !== 'free').length
    const isPerfect = correct === scoreable
    const emoji = isPerfect ? '🎯' : correct >= scoreable / 2 ? '👍' : '💡'

    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, color: C.ink, fontFamily: SANS }}>
        <div style={{ width: "100%", maxWidth: 512 }}>
          <Card pad={28} style={{ textAlign: "center" }}>
            <span style={{ fontSize: 48, marginBottom: 16, display: "block" }}>{emoji}</span>
            <H size={24} style={{ marginBottom: 8 }}>Scénario terminé</H>
            <p style={{ color: C.inkSoft, fontSize: 14, marginBottom: 24 }}>
              Thématique : <strong style={{ color: C.ink }}>{currentScenario.titre}</strong>
            </p>
            
            {scoreable > 0 && (
              <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: 20, backgroundColor: C.signalSoft, border: `1px solid ${C.signal}`, fontFamily: MONO, fontSize: 13, color: C.signal, fontWeight: 700, marginBottom: 32 }}>
                Score : {correct} / {scoreable} correct{correct > 1 ? 's' : ''}
              </div>
            )}

            {scenarios[scenarioIdx + 1] && (
              <div style={{ background: C.ph, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 24, fontSize: 12, color: C.inkMute, fontFamily: MONO }}>
                Suivant : <span style={{ color: C.ink }}>{scenarios[scenarioIdx + 1]?.titre}</span>
              </div>
            )}
            
            <div onClick={() => { setScenarioIdx(i => i + 1); setQuestionIdx(0); setPhase('intro') }}>
              <Btn kind="primary" size="lg" icon="arrowR" full>
                Passer au scénario suivant
              </Btn>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // ── QUESTION & FEEDBACK INLINE ────────────────
  const isDrag = currentQuestion?.type === 'drag'
  const isMcq = currentQuestion?.type === 'mcq'
  const isFree = currentQuestion?.type === 'free'
  const isFeedbackPhase = phase === 'feedback'

  const QuestionContent = (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, display: "flex", flexDirection: "column", color: C.ink, fontFamily: SANS }}>
      {/* top bar quiz : progress + points */}
      <div style={{ height: 60, borderBottom: `1px solid ${C.border}`, background: C.white,
        display: "flex", alignItems: "center", gap: 20, padding: "0 32px" }}>
        
        {/* Abandonner */}
        <div 
          onClick={() => onFinish(currentScore, totalQuestions)} 
          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          title="Quitter le quiz"
        >
          <Icon name="x" size={20} color={C.inkSoft} />
        </div>

        {/* Barre de progression centrale */}
        <div style={{ flex: 1, position: "relative" }}>
          <Progress value={(answeredCount / totalQuestions)} h={9} />
        </div>
        
        <span style={{ fontFamily: MONO, fontSize: 12.5, color: C.inkMute, fontWeight: 700 }}>Q{questionNumber} / {totalQuestions}</span>
        
        {/* Score de points en cyan */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: 9, background: C.cyan }}>
          <Icon name="bolt" size={15} color={C.night} strokeWidth={2.5} />
          <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 14, color: C.night }}>{currentPoints} pts</span>
        </div>
      </div>

      <div style={{ padding: "44px 24px", display: "flex", justifyContent: "center", flex: 1 }}>
        <div style={{ width: "100%", maxWidth: 720 }}>
          
          {/* Scénario & tags */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 7,
              background: C.night, color: C.white, fontFamily: MONO, fontWeight: 700, fontSize: 11 }}>
              <Icon name="layers" size={13} color={C.cyan} /> SCÉNARIO
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11.5, color: C.inkMute }}>
              {currentScenario.titre} · {currentQuestion.type === 'mcq' ? 'QCM' : currentQuestion.type === 'drag' ? 'Classification' : 'Question Libre'}
            </span>
          </div>

          {/* Carte de Question */}
          <Card pad={28} style={{ position: "relative" }}>
            <H size={22} style={{ lineHeight: 1.35 }}>{currentQuestion.texte}</H>

            {/* MCQ */}
            {isMcq && (
              <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 24, position: "relative" }}>
                {(currentQuestion.options ?? []).map((opt, idx) => {
                  const letter = ['A', 'B', 'C', 'D'][idx]
                  
                  // Déterminer l'état visuel de l'option
                  let optionState = 'neutral'
                  if (isFeedbackPhase) {
                    const isCorrectAnswer = letter === currentQuestion.bonneReponse
                    const isUserSelection = mcqSelected === letter
                    
                    if (isCorrectAnswer) {
                      optionState = 'correct'
                    } else if (isUserSelection && !isCorrectAnswer) {
                      optionState = 'incorrect'
                    }
                  } else if (mcqSelected === letter) {
                    optionState = 'selected'
                  }

                  return (
                    <QuizOption
                      key={letter}
                      letter={letter}
                      text={opt}
                      state={optionState}
                      disabled={isFeedbackPhase}
                      onClick={() => setMcqSelected(letter)}
                    />
                  )
                })}
              </div>
            )}

            {/* DRAG (Glisser Déposer) */}
            {isDrag && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, marginTop: 24 }}>
                {/* Carte à glisser */}
                {!isFeedbackPhase ? (
                  <>
                    <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <SituationCard key={currentQuestion.id} situation={currentQuestion} isAnswered={false} />
                    </div>
                    <p style={{ color: C.inkMute, fontSize: 11, fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      ↓ Glissez la carte dans la bonne décision ↓
                    </p>
                    <div style={{ width: "100%", display: "flex", gap: 16 }}>
                      <DropZone id="ia" label="Déléguer à l'IA" emoji="✅" colorClass="bg-[#0511f3]/5 border-[#0511f3]/25 text-[#0511f3]">
                        {Object.entries(answers).filter(([, a]) => a.chosen === 'ia').map(([id]) => {
                          const q = scenarios.flatMap(s => s.questions).find(q => String(q.id) === id)
                          return q ? <div key={id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: C.inkSoft }}>{q.texte}</div> : null
                        })}
                      </DropZone>
                      <DropZone id="humain" label="Garder en manuel" emoji="🧠" colorClass="bg-slate-50 border-slate-200 text-slate-600">
                        {Object.entries(answers).filter(([, a]) => a.chosen === 'humain').map(([id]) => {
                          const q = scenarios.flatMap(s => s.questions).find(q => String(q.id) === id)
                          return q ? <div key={id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: C.inkSoft }}>{q.texte}</div> : null
                        })}
                      </DropZone>
                    </div>
                  </>
                ) : (
                  /* Affichage après dépôt (feedback) */
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: "100%",
                      maxWidth: 380,
                      padding: "16px 18px",
                      borderRadius: 12,
                      border: `1.5px solid ${dragResult?.isCorrect ? C.ok : C.bad}`,
                      background: dragResult?.isCorrect ? C.okBg : C.badBg,
                      color: dragResult?.isCorrect ? C.ok : C.bad,
                      display: "flex",
                      alignItems: "center",
                      gap: 14
                    }}>
                      <span style={{ fontSize: 24, flexShrink: 0 }}>{dragResult?.isCorrect ? '✅' : '❌'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {dragResult?.isCorrect ? 'Bonne décision !' : 'Mauvaise décision'}
                        </div>
                        <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 4 }}>
                          Recommandation : <span style={{ fontWeight: 700, color: C.ink }}>{
                            currentQuestion.bonneReponse === 'ia' ? "Déléguer à l'IA" : "Garder en manuel"
                          }</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FREE (Texte Libre avec Ollama) */}
            {isFree && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
                {!isFeedbackPhase ? (
                  <>
                    <textarea
                      value={freeText}
                      onChange={(e) => setFreeText(e.target.value)}
                      rows={4}
                      placeholder="Saisissez votre analyse ou solution ici..."
                      style={{
                        width: "100%",
                        padding: 16,
                        borderRadius: 12,
                        backgroundColor: C.bg,
                        border: `1px solid ${C.border}`,
                        color: C.ink,
                        outline: "none",
                        resize: "none",
                        fontSize: 14.5,
                        fontFamily: SANS,
                        transition: "border-color 0.2s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = C.signal}
                      onBlur={(e) => e.target.style.borderColor = C.border}
                    />
                    <p style={{ color: C.inkMute, fontSize: 11, fontFamily: MONO, textAlign: "center" }}>
                      Votre réponse est évaluée par l'IA locale pour conseils.
                    </p>
                  </>
                ) : (
                  /* Affichage de l'analyse IA */
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ background: C.signalSoft, border: `1px solid ${C.signalSoft}`, borderRadius: 12, padding: "16px 18px", color: C.ink }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ color: C.signal, fontSize: 11, fontFamily: MONO, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>✨ Analyse IA comparative</span>
                      </div>
                      
                      {analyzing ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", color: C.inkMute, fontSize: 12, fontFamily: MONO }}>
                          <span className="animate-spin inline-block w-4 h-4 border-2" style={{ borderColor: C.border, borderTopColor: C.signal, borderRadius: "50%", flexShrink: 0 }} />
                          L'IA analyse votre réponse...
                        </div>
                      ) : aiAnalysis ? (
                        <p style={{ color: C.ink, fontSize: 13.5, lineHeight: 1.5 }}>{aiAnalysis}</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ color: C.inkMute, fontSize: 10.5, fontFamily: MONO, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>Réponse de référence</div>
                          <p style={{ color: C.inkSoft, fontSize: 13.5, lineHeight: 1.5 }}>{currentQuestion.modelAnswer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ZONE DE FEEDBACK PÉDAGOGIQUE INLINE (s'affiche après validation) ── */}
            {isFeedbackPhase && (
              <div style={{ marginTop: 22, borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
                {/* Encart explication */}
                {currentQuestion.explication && (
                  <div style={{ marginTop: 12, background: C.cyan, borderRadius: 12, padding: "16px 18px", display: "flex", gap: 13, marginBottom: 20 }}>
                    <Icon name="bulb" size={19} color={C.night} />
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.night, letterSpacing: "0.04em", textTransform: "uppercase" }}>EXPLICATION</div>
                      <div style={{ fontSize: 13.5, color: C.night, marginTop: 4, lineHeight: 1.5 }}>
                        {currentQuestion.explication}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bouton de suite */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div onClick={handleFeedbackContinue}>
                    <Btn kind="primary" size="lg" icon="arrowR">Continuer</Btn>
                  </div>
                </div>
              </div>
            )}

            {/* ── BOUTONS DE VALIDATION (pendant la question) ── */}
            {!isFeedbackPhase && (
              <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end" }}>
                {isMcq && (
                  <div 
                    onClick={() => { if (mcqSelected) submitAnswer(mcqSelected === currentQuestion.bonneReponse) }}
                    style={{ opacity: !mcqSelected ? 0.4 : 1, pointerEvents: !mcqSelected ? "none" : "auto" }}
                  >
                    <Btn kind="primary" size="lg" icon="arrowR">Valider ma réponse</Btn>
                  </div>
                )}

                {isFree && (
                  <div 
                    onClick={() => submitAnswer(null, freeText)}
                    style={{ opacity: freeText.trim().length < 3 ? 0.4 : 1, pointerEvents: freeText.trim().length < 3 ? "none" : "auto" }}
                  >
                    <Btn kind="primary" size="lg" icon="bolt">Analyser la réponse</Btn>
                  </div>
                )}
              </div>
            )}

          </Card>
        </div>
      </div>
    </div>
  )

  // Wrap in DndContext only for drag questions
  if (isDrag) {
    return (
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {QuestionContent}
        <DragOverlay>
          {activeId && currentQuestion ? (
            <div style={{
              padding: "16px 20px",
              borderRadius: 16,
              background: C.white,
              border: `1px solid ${C.border}`,
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
              fontFamily: SANS,
              fontWeight: 500,
              color: C.ink,
              fontSize: 14,
              transform: "rotate(2deg)",
              opacity: 0.95,
              maxWidth: 320,
              cursor: "grabbing"
            }}>
              {currentQuestion.texte}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    )
  }

  return QuestionContent
}
