import { FiCheck } from 'react-icons/fi'
import './CardSelectionControl.css'

function CardSelectionControl({ selected, label, onToggle }) {
  return (
    <button
      className={selected ? 'card-selection-control selected' : 'card-selection-control'}
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {selected && <FiCheck aria-hidden="true" />}
    </button>
  )
}

export default CardSelectionControl
