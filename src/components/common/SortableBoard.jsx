import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './SortableBoard.css'

function SortableItem({ id, disabled, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  })

  return (
    <div
      ref={setNodeRef}
      className={isDragging ? 'sortable-card-shell dragging' : 'sortable-card-shell'}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}

function SortableBoard({ items, disabled = false, onReorder, cardSize = 'medium', children }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const ids = items.map((item) => item.id)

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(active.id)
    const newIndex = ids.indexOf(over.id)
    if (oldIndex < 0 || newIndex < 0) return
    onReorder(arrayMove(items, oldIndex, newIndex))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className={`board card-size-${cardSize}`}>
          {items.map((item) => (
            <SortableItem id={item.id} key={item.id} disabled={disabled}>
              {children(item)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export function mergeVisibleOrder(allItems, reorderedVisibleItems) {
  const visibleIds = new Set(reorderedVisibleItems.map((item) => item.id))
  let visibleIndex = 0
  return allItems.map((item) => {
    if (!visibleIds.has(item.id)) return item
    const replacement = reorderedVisibleItems[visibleIndex]
    visibleIndex += 1
    return replacement
  })
}

export default SortableBoard
