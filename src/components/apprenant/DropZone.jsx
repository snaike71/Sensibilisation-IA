import { useDroppable } from '@dnd-kit/core'

export default function DropZone({ id, label, emoji, colorClass, children }) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 min-h-48 rounded-2xl border-2 border-dashed p-4 flex flex-col gap-3
        transition-colors duration-200
        ${colorClass}
        ${isOver ? 'scale-[1.02] brightness-95' : ''}
      `}
    >
      <div className="text-center text-xl font-bold mb-1">
        {emoji} {label}
      </div>
      <div className="flex flex-col gap-2 min-h-8">
        {children}
      </div>
    </div>
  )
}
