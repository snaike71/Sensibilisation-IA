import { useApp } from '../context/AppContext.jsx'
import { C, MONO, SANS, Logo, Icon, Btn } from './lhctrl-kit.jsx'

export default function RoleSelectScreen({ onAdmin, onApprenant, onLogout }) {
  const { user } = useApp()

  const card = (icon, kicker, title, desc, cta, primary, onClick) => (
    <div 
      onClick={onClick}
      className="lift" 
      style={{ 
        flex: 1, 
        background: C.white, 
        border: `1px solid ${C.border}`,
        borderRadius: 18, 
        padding: "38px 34px", 
        display: "flex", 
        flexDirection: "column", 
        gap: 18,
        cursor: "pointer", 
        boxShadow: primary ? `0 1px 0 ${C.border}` : "none",
        transition: "all 0.2s ease-in-out"
      }}
    >
      <div style={{ width: 60, height: 60, borderRadius: 14, background: primary ? C.signalSoft : C.cyan,
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={28} color={primary ? C.signal : C.night} />
      </div>
      <div>
        <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: primary ? C.signal : C.cyanDeep }}>
          {kicker}
        </div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1.15, marginTop: 8 }}>
          {title}
        </div>
        <div style={{ color: C.inkSoft, fontSize: 14.5, marginTop: 10, lineHeight: 1.5 }}>{desc}</div>
      </div>
      <div style={{ marginTop: "auto", paddingTop: 6 }}>
        <Btn kind={primary ? "primary" : "ghost"} size="lg" icon="arrowR">{cta}</Btn>
      </div>
    </div>
  )

  return (
    <div style={{ 
      width: "100%", 
      minHeight: "100vh", 
      background: C.bg, 
      position: "relative",
      fontFamily: SANS, 
      color: C.ink, 
      display: "flex", 
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 24px"
    }}>
      {/* Header avec déconnexion — uniquement si l'admin est connecté */}
      {user && (
        <div style={{ position: "absolute", top: 24, right: 32, display: "flex", alignItems: "center", gap: 12 }}>
          {user.name && <span style={{ fontFamily: MONO, fontSize: 11.5, color: C.inkMute }}>{user.name}</span>}
          <button
            onClick={onLogout}
            style={{ 
              background: "none", 
              border: "none", 
              padding: 0, 
              cursor: "pointer", 
              fontFamily: MONO, 
              fontSize: 11.5, 
              color: C.inkMute,
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => e.target.style.color = C.inkSoft}
            onMouseLeave={(e) => e.target.style.color = C.inkMute}
          >
            Déconnexion
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", maxWidth: 880 }}>
        <Logo size={44} />
        
        <div style={{ fontFamily: MONO, fontSize: 16, color: C.signal, marginTop: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>
          « L'IA, ça se contrôle. »
        </div>
        
        <div style={{ color: C.inkSoft, fontSize: 14.5, marginTop: 10, textAlign: "center" }}>
          Choisissez votre profil pour accéder à votre espace
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 mt-11 w-full">
          {card("shield", "Pour les RH / référents", "Espace Admin", "Profilez les usages IA, générez des modules de sensibilisation et pilotez le déploiement par équipe.", "Accéder à l'admin", true, onAdmin)}
          {card("rocket", "Pour les collaborateurs", "Espace Apprenant", "Rejoignez votre équipe avec un code d'accès et suivez vos modules de façon gamifiée.", "Rejoindre une équipe", false, onApprenant)}
        </div>
        
        <div style={{ marginTop: 48, fontFamily: MONO, fontSize: 11, color: C.inkMute }}>
          lhctrl. — sensibilisation IA en entreprise
        </div>
      </div>
    </div>
  )
}
