import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { C, SANS } from '../lhctrl-kit.jsx'

export default function SituationCard({ situation, isAnswered }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: situation.id,
    disabled: isAnswered,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        background: C.white,
        border: `1.5px solid ${C.border}`,
        borderRadius: 14,
        padding: "16px 20px",
        textAlign: "center",
        fontFamily: SANS,
        fontSize: 14.5,
        fontWeight: 500,
        color: C.ink,
        lineHeight: 1.45,
        boxShadow: isDragging
          ? `0 8px 32px rgba(0,0,0,0.15)`
          : `0 2px 8px rgba(0,0,0,0.06)`,
        cursor: isAnswered ? "default" : "grab",
        userSelect: "none",
        opacity: isAnswered ? 0 : 1,
        pointerEvents: isAnswered ? "none" : "auto",
        transform: `${CSS.Translate.toString(transform)} ${isDragging ? "rotate(2deg)" : ""}`,
        transition: isDragging ? "none" : "box-shadow 0.15s ease, opacity 0.2s ease",
        zIndex: isDragging ? 50 : "auto",
        position: "relative",
      }}
      {...listeners}
      {...attributes}
    >
      {situation.texte}
    </div>
  )
}
