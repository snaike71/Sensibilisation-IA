export default function FeedbackModal({ feedback, onClose }) {
  if (!feedback) return null

  const { isCorrect, question } = feedback

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`border rounded-2xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-4 ${
        isCorrect
          ? 'bg-emerald-950 border-emerald-500/30'
          : 'bg-red-950 border-red-500/30'
      }`}>

        {/* Résultat */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">{isCorrect ? '✅' : '❌'}</span>
          <span className={`text-xl font-mono font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
            {isCorrect ? 'Bonne réponse !' : 'Mauvaise réponse'}
          </span>
        </div>

        {/* Bonne réponse si incorrect */}
        {!isCorrect && (
          <div className="bg-white/5 rounded-xl px-4 py-2 text-sm text-white/60 font-mono">
            Bonne réponse : <span className="text-white font-semibold">
              {question.bonneReponse === 'ia' ? '✅ Déléguer à l\'IA' : '🧠 Garder en manuel'}
            </span>
          </div>
        )}

        {/* Explication */}
        <p className="text-brand-offwhite/80 text-sm leading-relaxed font-sans">
          {question.explication}
        </p>

        <button
          onClick={onClose}
          className="mt-1 px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/80 text-white font-sans font-medium active:scale-95 transition-all"
        >
          Continuer →
        </button>
      </div>
    </div>
  )
}
