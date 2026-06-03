import { useDroppable } from '@dnd-kit/core'
import { C, MONO, SANS } from '../lhctrl-kit.jsx'

const ZONE_STYLES = {
  ia: {
    bg: C.signalSoft,
    border: C.signal,
    labelColor: C.signal,
  },
  humain: {
    bg: C.bg,
    border: C.border,
    labelColor: C.inkSoft,
  },
}

export default function DropZone({ id, label, emoji, children }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  const style = ZONE_STYLES[id] || ZONE_STYLES.humain

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minHeight: 160,
        borderRadius: 14,
        border: `2px dashed ${isOver ? style.labelColor : style.border}`,
        background: isOver ? `${style.bg}cc` : style.bg,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        transition: "all 0.2s ease",
        transform: isOver ? "scale(1.02)" : "scale(1)",
      }}
    >
      <div style={{
        textAlign: "center",
        fontFamily: MONO,
        fontWeight: 700,
        fontSize: 13,
        color: style.labelColor,
        marginBottom: 4,
      }}>
        {emoji} {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 32 }}>
        {children}
      </div>
    </div>
  )
}
