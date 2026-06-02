import { useApp } from '../../context/AppContext.jsx'

export default function AccrocheScreen({ onStart, onLogout }) {
  const { companyConfig, collaborator } = useApp()
  const prenom = collaborator?.nom?.split(' ')[0]

  return (
    <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-6 text-brand-offwhite">

      {/* Header */}
      <div className="absolute top-5 right-6 flex items-center gap-3">
        {prenom && (
          <span className="text-white/30 text-xs font-mono">{collaborator.nom}</span>
        )}
        <button
          onClick={onLogout}
          className="text-white/20 hover:text-white/60 text-xs font-mono transition-colors"
        >
          Quitter
        </button>
      </div>

      {/* Logo */}
      <img src="/logo-white.svg" alt="lhctrl." className="h-10 mb-10 opacity-90" />

      {/* Bandeau entreprise si configuré */}
      {companyConfig && (
        <div className="mb-6 px-5 py-2 rounded-full bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan text-xs font-mono tracking-widest uppercase flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse inline-block" />
          Scénarios personnalisés · {companyConfig.companyName}
        </div>
      )}

      {/* Titre */}
      <h1 className="font-mono font-bold text-4xl md:text-5xl text-center leading-tight mb-4">
        L'IA, ça<br />
        <span className="text-brand-blue">se contrôle.</span>
      </h1>

      {/* Principe LHC */}
      <div className="mt-6 max-w-lg bg-white/[0.04] border border-white/10 rounded-2xl p-5 text-center">
        <p className="text-xs text-brand-cyan font-mono uppercase tracking-widest mb-2">
          Principe LHC · Limitless Human Control
        </p>
        <p className="text-brand-offwhite/70 text-sm leading-relaxed font-sans">
          Automatiser les tâches chronophages à faible valeur, garder l'humain
          maître des décisions à fort enjeu, sans jamais exposer l'information
          sensible.
        </p>
      </div>

      {/* Contexte */}
      <div className="mt-6 max-w-lg text-center">
        <p className="text-brand-offwhite/50 text-sm leading-relaxed font-sans">
          {companyConfig ? (
            <>
              Vous êtes salarié·e chez{' '}
              <strong className="text-brand-offwhite">{companyConfig.companyName}</strong>.
              En <strong className="text-brand-offwhite">10 minutes</strong>, traversez
              4 situations réelles et apprenez à arbitrer.
            </>
          ) : (
            <>
              Vous êtes salarié·e dans une organisation qui vient d'adopter des
              outils IA. En <strong className="text-brand-offwhite">10 minutes</strong>, vous
              allez traverser 4 situations réelles et apprendre à arbitrer.
            </>
          )}
        </p>
      </div>

      {/* Bouton */}
      <button
        onClick={onStart}
        className="mt-10 px-8 py-4 rounded-xl bg-brand-blue hover:bg-brand-blue/80 active:scale-95 transition-all font-sans font-medium text-base text-white shadow-lg shadow-brand-blue/30"
      >
        Commencer →
      </button>

      <p className="mt-4 text-xs text-brand-offwhite/25 font-mono">~10 minutes · Usage individuel</p>

    </div>
  )
}
