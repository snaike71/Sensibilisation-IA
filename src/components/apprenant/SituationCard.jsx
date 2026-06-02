import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

export default function SituationCard({ situation, isAnswered }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: situation.id,
    disabled: isAnswered,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        px-5 py-4 rounded-2xl shadow-md text-center font-medium text-gray-800 text-sm leading-snug
        select-none transition-all duration-150
        ${isAnswered ? 'opacity-0 pointer-events-none' : 'cursor-grab active:cursor-grabbing bg-white hover:shadow-lg hover:-translate-y-0.5'}
        ${isDragging ? 'opacity-50 rotate-2 z-50' : ''}
      `}
    >
      {situation.texte}
    </div>
  )
}
