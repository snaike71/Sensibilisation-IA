const reglesOr = [
  {
    numero: '01',
    titre: 'Automatise le chronophage, garde la main sur le stratégique.',
    detail: "L'IA est un accélérateur sur les tâches répétitives à faible enjeu — pas un décideur sur les sujets qui engagent l'humain.",
  },
  {
    numero: '02',
    titre: 'Ne jamais coller de données sensibles dans un outil grand public.',
    detail: "Contrats, données RH, informations clients — utilisez uniquement les solutions validées par votre DSI.",
  },
  {
    numero: '03',
    titre: "L'IA assiste, elle ne décide pas.",
    detail: "Recrutement, licenciement, signature, virement urgent : la responsabilité reste toujours humaine. Vérifiez, appelez, confirmez.",
  },
]

const profils = [
  {
    minPct: 90,
    nom: 'Contrôleur LHC',
    color: '#10b981',
    emoji: '🏆',
    description:
      "Vous maîtrisez parfaitement l'arbitrage humain/IA. Vous savez déléguer sans abdiquer et protéger sans bloquer. Partagez ces réflexes autour de vous.",
  },
  {
    minPct: 70,
    nom: 'Collaborateur averti',
    color: '#3b82f6',
    emoji: '👍',
    description:
      "Bons réflexes globaux, quelques angles morts à affiner. Relisez les feedbacks des questions manquées — les risques sont souvent dans les détails.",
  },
  {
    minPct: 50,
    nom: 'Délégateur imprudent',
    color: '#f59e0b',
    emoji: '⚠️',
    description:
      "Vous avez tendance à sur-déléguer à l'IA ou à sous-estimer certains risques. Les 3 règles d'or ci-dessous sont faites pour vous.",
  },
  {
    minPct: 0,
    nom: 'Assisté en danger',
    color: '#ef4444',
    emoji: '🚨',
    description:
      "Votre usage de l'IA expose votre organisation à des risques réels : fuites de données, décisions biaisées, fraudes. Prenez le temps de relire chaque feedback.",
  },
]

function getProfil(score, total) {
  const pct = total > 0 ? (score / total) * 100 : 0
  return profils.find((p) => pct >= p.minPct) ?? profils[profils.length - 1]
}

import { useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'

export default function ScoreScreen({ score, total, onRestart }) {
  const profil = getProfil(score, total)
  const { saveResult } = useApp()

  useEffect(() => {
    saveResult(score, profil.nom, {})
  }, [])  // eslint-disable-line

  return (
    <div className="min-h-screen bg-brand-black text-brand-offwhite flex flex-col items-center py-12 px-6">

      {/* Logo */}
      <img src="/logo-white.svg" alt="lhctrl." className="h-8 mb-10 opacity-60" />

      {/* Score */}
      <div className="flex flex-col items-center mb-8">
        <span className="text-7xl mb-3">{profil.emoji}</span>
        <div className="flex items-end gap-1">
          <span className="text-6xl font-mono font-bold">{score}</span>
          <span className="text-3xl text-brand-offwhite/30 font-mono mb-1">/{total}</span>
        </div>
      </div>

      {/* Profil */}
      <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 max-w-md w-full mb-8 text-center">
        <p className="text-brand-cyan text-xs font-mono uppercase tracking-widest mb-3">
          Votre profil de contrôle
        </p>
        <span
          className="inline-block text-2xl font-mono font-bold mb-3"
          style={{ color: profil.color }}
        >
          {profil.nom}
        </span>
        <p className="text-brand-offwhite/60 text-sm leading-relaxed font-sans">{profil.description}</p>
      </div>

      {/* 3 règles d'or */}
      <div className="max-w-md w-full mb-8">
        <p className="text-brand-cyan text-xs font-mono uppercase tracking-widest mb-4 text-center">
          3 règles d'or LHC
        </p>
        <div className="flex flex-col gap-3">
          {reglesOr.map((r) => (
            <div key={r.numero} className="bg-white/[0.04] border border-white/10 rounded-xl p-4 flex gap-4">
              <span className="text-brand-blue font-mono font-bold text-lg shrink-0">{r.numero}</span>
              <div>
                <p className="font-sans font-medium text-sm text-brand-offwhite mb-1">{r.titre}</p>
                <p className="text-brand-offwhite/50 text-xs leading-relaxed font-sans">{r.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slogan */}
      <div className="max-w-md w-full bg-brand-blue/5 border border-brand-blue/20 rounded-xl p-4 text-center mb-8">
        <p className="text-brand-cyan font-mono text-sm">
          "L'IA, ça se contrôle."
        </p>
        <p className="text-brand-offwhite/30 text-xs font-mono mt-1">Limitless Human Control</p>
      </div>

      <button
        onClick={onRestart}
        className="px-8 py-3 rounded-xl bg-brand-blue hover:bg-brand-blue/80 text-white font-sans font-medium transition-all active:scale-95 shadow-lg shadow-brand-blue/20"
      >
        Recommencer
      </button>
    </div>
  )
}
