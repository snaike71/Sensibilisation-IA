/* ============================================================
   lhctrl — Kit wireframe partagé
   Palette de marque, logo, primitives low/medium-fi,
   système d'annotation. Exposé sur window et exporté.
   ============================================================ */

/* ---------- Palette de marque lhctrl ---------- */
export const C = {
  bg:      "#f8f8f6", // Blanc cassé
  signal:  "#0511f3", // Bleu signal (primaire)
  night:   "#182573", // Bleu nuit (accent)
  cyan:    "#c4eef2", // Bleu cyan (surfaces/tags)
  border:  "#e8e8e4", // Gris perle (bordures)
  ink:     "#0d0d0d", // Noir graphite (texte)
  white:   "#ffffff",
  // dérivés wireframe
  ph:      "#ececea", // remplissage placeholder
  phLine:  "#dcdcd6", // hachure placeholder
  inkSoft: "#5b5b57", // texte secondaire
  inkMute: "#9a9a93", // texte tertiaire / labels
  signalSoft:"#e6e7fe", // fond bleu très clair
  cyanDeep:"#7fd6de",
  ok:      "#0c8a4d",
  okBg:    "#dff5e8",
  bad:     "#c2253a",
  badBg:   "#fce4e7",
  warn:    "#b06a00",
  warnBg:  "#fbedd6",
};
export const MONO = "'Space Mono', ui-monospace, monospace";
export const SANS = "'DM Sans', system-ui, sans-serif";

/* ---------- Logo lhctrl (mark + wordmark) ---------- */
export const MARK_PATHS = [
  // cadre extérieur
  "M320,369.1H101.87c-29.1,0-52.77-23.67-52.77-52.77v-161.84c0-29.1,23.67-52.77,52.77-52.77h218.13c29.1,0,52.77,23.67,52.77,52.77v161.84c0,29.1-23.67,52.77-52.77,52.77ZM101.87,115.78c-21.34,0-38.7,17.36-38.7,38.7v161.84c0,21.34,17.36,38.7,38.7,38.7h218.13c21.34,0,38.7-17.36,38.7-38.7v-161.84c0-21.34-17.36-38.7-38.7-38.7H101.87Z",
  // cadre intérieur
  "M309.44,337.43H112.42c-17.46,0-31.66-14.2-31.66-31.66v-140.73c0-17.46,14.21-31.66,31.66-31.66h197.02c17.46,0,31.66,14.2,31.66,31.66v140.73c0,17.46-14.21,31.66-31.66,31.66ZM112.42,140.41c-13.58,0-24.63,11.05-24.63,24.63v140.73c0,13.58,11.05,24.63,24.63,24.63h197.02c13.58,0,24.63-11.05,24.63-24.63v-140.73c0-13.58-11.05-24.63-24.63-24.63H112.42Z",
  // barre verticale gauche
  "M112.42,304.89c-3.4,0-6.16-2.76-6.16-6.16v-126.66c0-3.4,2.76-6.16,6.16-6.16s6.16,2.76,6.16,6.16v126.66c0,3.4-2.76,6.16-6.16,6.16Z",
  // barre verticale droite
  "M309.44,304.89c-3.4,0-6.16-2.76-6.16-6.16v-126.66c0-3.4,2.76-6.16,6.16-6.16s6.16,2.76,6.16,6.16v126.66c0,3.4-2.76,6.16-6.16,6.16Z",
  // onde sinusoïdale
  "M246.12,274.99c-14.97,0-28.74-11.69-42.1-35.74-10.03-18.05-19.8-27.59-28.26-27.59s-18.23,9.54-28.26,27.59c-2.13,3.82-6.94,5.2-10.76,3.08-3.82-2.12-5.2-6.94-3.08-10.76,13.36-24.05,27.13-35.74,42.1-35.74s28.74,11.69,42.1,35.74c10.03,18.05,19.8,27.59,28.26,27.59s18.23-9.54,28.26-27.59c2.12-3.82,6.94-5.2,10.76-3.08,3.82,2.12,5.2,6.94,3.08,10.76-13.36,24.05-27.13,35.74-42.1,35.74Z",
];
export function Mark({ size = 28, color = C.signal }) {
  const h = size, w = size * (324 / 256);
  return (
    <svg width={w} height={h} viewBox="49 113 324 256" fill={color} style={{ display: "block" }} xmlns="http://www.w3.org/2000/svg">
      {MARK_PATHS.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
export function Logo({ size = 26, color = C.signal, word = true, wordColor = C.ink, gap = 10 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap }}>
      <Mark size={size} color={color} />
      {word && <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: size * 0.82, color: wordColor, letterSpacing: "-0.03em", lineHeight: 1 }}>lhctrl.</span>}
    </div>
  );
}

/* ---------- Placeholders wireframe ---------- */
// motif hachuré pour zones "image / contenu à venir"
export const HATCH = `repeating-linear-gradient(135deg, ${C.ph}, ${C.ph} 7px, ${C.phLine} 7px, ${C.phLine} 8px)`;

export function ImgPH({ w = "100%", h = 120, label, r = 10, style = {} }) {
  return (
    <div style={{ width: w, height: h, borderRadius: r, background: HATCH, border: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", justifyContent: "center", color: C.inkMute,
      fontFamily: MONO, fontSize: 11, letterSpacing: "0.02em", textAlign: "center", ...style }}>
      {label}
    </div>
  );
}
export function Avatar({ size = 40, label = "", color = C.ph, ring }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size, background: color,
      border: ring ? `2px solid ${ring}` : `1px solid ${C.border}`, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: MONO, fontWeight: 700, fontSize: size * 0.34, color: C.white }}>
      {label}
    </div>
  );
}
// barre de texte fantôme (lignes de contenu)
export function Lines({ rows = 3, w = ["100%", "92%", "70%"], gap = 7, h = 8, color = C.ph }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: rows }).map((_, i) =>
        <div key={i} style={{ width: w[i] || "80%", height: h, borderRadius: 4, background: color }} />)}
    </div>
  );
}

/* ---------- Boutons ---------- */
export function Btn({ children, kind = "primary", size = "md", icon, full, state, ...rest }) {
  const pad = size === "sm" ? "8px 14px" : size === "lg" ? "15px 26px" : "11px 20px";
  const fs = size === "sm" ? 12.5 : size === "lg" ? 15 : 13.5;
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: pad, fontFamily: SANS, fontWeight: 600, fontSize: fs, borderRadius: 9,
    width: full ? "100%" : "auto", whiteSpace: "nowrap", lineHeight: 1, cursor: "pointer",
    userSelect: "none"
  };
  const skins = {
    primary: { background: C.signal, color: C.white, border: `1px solid ${C.signal}` },
    primaryHover: { background: "#0a16ff", color: C.white, border: `1px solid #0a16ff`, boxShadow: `0 6px 16px ${C.signal}3a`, transform: "translateY(-1px)" },
    ghost: { background: C.white, color: C.ink, border: `1px solid ${C.border}` },
    ghostHover: { background: C.bg, color: C.ink, border: `1px solid ${C.inkMute}` },
    night: { background: C.night, color: C.white, border: `1px solid ${C.night}` },
    soft: { background: C.signalSoft, color: C.signal, border: `1px solid ${C.signalSoft}` },
  };
  const skin = state === "hover" ? skins[kind + "Hover"] || skins[kind] : skins[kind];
  return (
    <span className="btn" style={{ ...base, ...skin }} {...rest}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} />}
      {children}
    </span>
  );
}

/* ---------- Chips / tags ---------- */
export function Chip({ children, tone = "default", icon, sel, ...rest }) {
  const tones = {
    default: { bg: C.white, fg: C.inkSoft, bd: C.border },
    cyan:    { bg: C.cyan, fg: C.night, bd: C.cyan },
    signal:  { bg: C.signalSoft, fg: C.signal, bd: C.signalSoft },
    sel:     { bg: C.signal, fg: C.white, bd: C.signal },
    ghost:   { bg: "transparent", fg: C.inkSoft, bd: C.border },
  };
  const t = sel ? tones.sel : tones[tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px",
      borderRadius: 7, background: t.bg, color: t.fg, border: `1px solid ${t.bd}`,
      fontFamily: SANS, fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }} {...rest}>
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  );
}

/* ---------- Badge niveau de risque ---------- */
export function RiskBadge({ level }) {
  const map = {
    Élevé:  { bg: C.badBg, fg: C.bad, dot: C.bad },
    Modéré: { bg: C.warnBg, fg: C.warn, dot: C.warn },
    Faible: { bg: C.okBg, fg: C.ok, dot: C.ok },
  };
  const t = map[level] || map["Modéré"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px",
      borderRadius: 7, background: t.bg, color: t.fg, fontFamily: MONO, fontWeight: 700,
      fontSize: 11, letterSpacing: "0.02em", textTransform: "uppercase" }}>
      <span style={{ width: 7, height: 7, borderRadius: 7, background: t.dot }} />
      Risque {level}
    </span>
  );
}

/* ---------- Carte ---------- */
export function Card({ children, pad = 18, style = {}, hover, ...rest }) {
  return (
    <div className={hover ? "lift" : ""} style={{ background: C.white, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: pad, ...style }} {...rest}>
      {children}
    </div>
  );
}

/* ---------- Annotation wireframe ---------- */
// Tag d'annotation (composant réutilisable / note) avec petite pastille n°
export function Anno({ n, children, side = "left", style = {} }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 10px 5px 6px",
      background: C.night, color: C.white, borderRadius: 20, fontFamily: MONO, fontSize: 10.5,
      fontWeight: 700, letterSpacing: "0.02em", boxShadow: "0 4px 12px rgba(24,37,115,.22)",
      whiteSpace: "nowrap", ...style }}>
      <span style={{ width: 17, height: 17, borderRadius: 17, background: C.signal,
        display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>{n}</span>
      {children}
    </div>
  );
}
// étiquette "réutilisable" discrète posée sur un composant
export function ReuseTag({ children, style = {} }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px",
      background: C.cyan, color: C.night, borderRadius: 6, fontFamily: MONO, fontSize: 10,
      fontWeight: 700, letterSpacing: "0.01em", ...style }}>
      ↻ {children}
    </span>
  );
}

/* ---------- Barre de progression ---------- */
export function Progress({ value = 0.5, h = 8, color = C.signal, track = C.border }) {
  return (
    <div style={{ width: "100%", height: h, borderRadius: h, background: track, overflow: "hidden" }}>
      <div style={{ width: `${value * 100}%`, height: "100%", background: color, borderRadius: h }} />
    </div>
  );
}

/* ---------- Section / titres wireframe ---------- */
export function Kicker({ children, color = C.inkMute }) {
  return <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase", color }}>{children}</div>;
}
export function H({ children, size = 22, color = C.ink, style = {} }) {
  return <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: size, color, letterSpacing: "-0.02em", lineHeight: 1.15, ...style }}>{children}</div>;
}

/* ---------- Icônes (stroke minimal) ---------- */
export const ICN = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  bulb: "M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z",
  brain:"M9 3a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 1 5 3 3 0 0 0 5 1V3.5A1.5 1.5 0 0 0 9 3zM15 3a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-1 5 3 3 0 0 1-5 1V3.5A1.5 1.5 0 0 1 15 3z",
  users:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  rocket:"M5 13l-2 4 4-2M12 2c3 1 6 4 7 9l-5 5c-5-1-8-4-9-7l5-5zM9 15a3 3 0 0 0-3 3M13 9a2 2 0 1 0 0-.01",
  check: "M20 6L9 17l-5-5",
  plus:  "M12 5v14M5 12h14",
  upload:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  bell:  "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  search:"M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  chevR: "M9 18l6-6-6-6",
  chevL: "M15 18l-6-6 6-6",
  chevD: "M6 9l6 6 6-6",
  bolt:  "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  flame: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z",
  trophy:"M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.7V17c0 .6-.5 1-1 1.2C7.9 18.8 7 20.2 7 22M14 14.7V17c0 .6.5 1 1 1.2 1.1.5 2 2 2 2.8M18 2H6v7a6 6 0 0 0 12 0V2z",
  target:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  shield:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  send:  "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  x:     "M18 6L6 18M6 6l12 12",
  arrowR:"M5 12h14M13 6l6 6-6 6",
  star:  "M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z",
  play:  "M6 4l14 8-14 8V4z",
  lock:  "M5 11h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM8 11V7a4 4 0 0 1 8 0v4",
  doc:   "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6",
  layers:"M12 2l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5",
};
export function Icon({ name, size = 18, color = "currentColor", strokeWidth = 1.9 }) {
  const d = ICN[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

Object.assign(window, {
  C, MONO, SANS, Mark, Logo, ImgPH, Avatar, Lines, Btn, Chip, RiskBadge,
  Card, Anno, ReuseTag, Progress, Kicker, H, Icon, HATCH,
});

