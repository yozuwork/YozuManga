import { useEffect, useMemo, useRef, useState } from 'react'
import { FiCheck, FiChevronDown, FiSearch, FiX } from 'react-icons/fi'
import './MultiSelectTags.css'

function normalizeOption(option) {
  return typeof option === 'string'
    ? { value: option, label: option }
    : option
}

export default function MultiSelectTags({ id, values = [], options = [], placeholder, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)
  const normalizedOptions = useMemo(() => options.map(normalizeOption), [options])
  const selectedOptions = values.map(
    (value) => normalizedOptions.find((option) => option.value === value) ?? { value, label: value },
  )
  const filteredOptions = normalizedOptions.filter((option) =>
    `${option.label} ${option.meta ?? ''}`.toLocaleLowerCase('zh-Hant')
      .includes(query.trim().toLocaleLowerCase('zh-Hant')),
  )

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [])

  function toggleValue(value) {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }

  return (
    <div className="multi-select-tags" ref={rootRef}>
      <div
        className={isOpen ? 'multi-select-input open' : 'multi-select-input'}
        onClick={() => setIsOpen(true)}
      >
        {selectedOptions.map((option) => (
          <span className={`multi-value-tag ${option.color ?? ''}`} key={option.value}>
            {option.label}
            <button
              type="button"
              aria-label={`移除${option.label}`}
              onClick={(event) => {
                event.stopPropagation()
                toggleValue(option.value)
              }}
            >
              <FiX aria-hidden="true" />
            </button>
          </span>
        ))}
        <FiSearch className="multi-search-icon" aria-hidden="true" />
        <input
          id={id}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${id}-options`}
          value={query}
          placeholder={values.length ? '' : placeholder}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setIsOpen(false)
          }}
        />
        <FiChevronDown className="multi-chevron" aria-hidden="true" />
      </div>

      {isOpen && (
        <div className="multi-options" id={`${id}-options`} role="listbox" aria-multiselectable="true">
          {filteredOptions.length ? filteredOptions.map((option) => {
            const selected = values.includes(option.value)
            return (
              <button
                className={selected ? 'multi-option selected' : 'multi-option'}
                type="button"
                role="option"
                aria-selected={selected}
                key={option.value}
                onClick={() => toggleValue(option.value)}
              >
                <span className={`multi-option-dot ${option.color ?? ''}`} />
                <span>{option.label}</span>
                {option.meta && <small>{option.meta}</small>}
                {selected && <FiCheck aria-hidden="true" />}
              </button>
            )
          }) : <div className="multi-options-empty">找不到符合的項目</div>}
        </div>
      )}
    </div>
  )
}
