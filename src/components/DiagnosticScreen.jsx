import { useState } from 'react'

const questions = [
  {
    id: 'frequence',
    texte: "À quelle fréquence utilisez-vous un outil IA (ChatGPT, Copilot…) au travail ?",
    options: [
      { value: 'jamais', label: 'Jamais' },
      { value: 'occasionnel', label: 'Occasionnellement' },
      { value: 'regulier', label: 'Régulièrement' },
      { value: 'quotidien', label: 'Tous les jours' },
    ],
  },
  {
    id: 'donnees',
    texte: "Vous est-il arrivé de copier des données professionnelles (emails, contrats, RH…) dans un outil IA grand public ?",
    options: [
      { value: 'non', label: 'Non, jamais' },
      { value: 'sans_penser', label: 'Oui, sans y penser' },
      { value: 'en_sachant', label: "Oui, en sachant que c'était risqué" },
      { value: 'pas_sure', label: "Je ne sais pas si c'est risqué" },
    ],
  },
  {
    id: 'charte',
    texte: "Votre organisation dispose-t-elle d'une charte ou d'une politique sur l'usage de l'IA ?",
    options: [
      { value: 'oui', label: 'Oui, je la connais' },
      { value: 'oui_pas_lu', label: "Oui, mais je ne l'ai pas lue" },
      { value: 'non', label: 'Non, pas à ma connaissance' },
      { value: 'nsp', label: 'Je ne sais pas' },
    ],
  },
]

export default function DiagnosticScreen({ onComplete }) {
  const [step, setStep] = useState(0)
  const [reponses, setReponses] = useState({})
  const [selected, setSelected] = useState(null)

  const question = questions[step]
  const isLast = step === questions.length - 1

  function handleNext() {
    if (!selected) return
    const newReponses = { ...reponses, [question.id]: selected }
    setReponses(newReponses)
    setSelected(null)
    if (isLast) {
      onComplete(newReponses)
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-6 text-brand-offwhite">

      {/* Progress dots */}
      <div className="flex gap-2 mb-10">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < step
                ? 'w-6 bg-brand-blue'
                : i === step
                ? 'w-6 bg-brand-offwhite'
                : 'w-2 bg-white/15'
            }`}
          />
        ))}
      </div>

      {/* Badge */}
      <p className="text-brand-cyan text-xs font-mono uppercase tracking-widest mb-6">
        Diagnostic · Question {step + 1}/{questions.length}
      </p>

      {/* Question */}
      <h2 className="font-mono font-bold text-xl md:text-2xl text-center max-w-xl mb-8 leading-snug">
        {question.texte}
      </h2>

      {/* Options */}
      <div className="flex flex-col gap-3 w-full max-w-md">
        {question.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelected(opt.value)}
            className={`
              w-full px-5 py-3.5 rounded-xl text-left font-sans font-medium text-sm transition-all duration-150 border
              ${selected === opt.value
                ? 'bg-brand-blue border-brand-blue text-white'
                : 'bg-white/[0.04] border-white/10 text-brand-offwhite/70 hover:bg-white/[0.08] hover:border-white/20'
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Bouton suivant */}
      <button
        onClick={handleNext}
        disabled={!selected}
        className={`
          mt-8 px-8 py-3 rounded-xl font-sans font-medium transition-all duration-150
          ${selected
            ? 'bg-brand-blue hover:bg-brand-blue/80 active:scale-95 text-white shadow-lg shadow-brand-blue/30'
            : 'bg-white/5 text-white/25 cursor-not-allowed'
          }
        `}
      >
        {isLast ? 'Démarrer les simulations →' : 'Suivant →'}
      </button>
    </div>
  )
}
