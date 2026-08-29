import { useEffect, useMemo, useRef, useState } from 'react'
import { FiChevronDown, FiSearch, FiX } from 'react-icons/fi'
import './SearchableSelect.css'

function SearchableSelect({ id, value, options, placeholder, onChange }) {
  const rootRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const selectedOption = options.find((option) => option.value === value)
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('zh-Hant')
    if (!normalizedQuery || (selectedOption && query === selectedOption.label)) return options
    return options.filter((option) =>
      `${option.label} ${option.meta ?? ''}`.toLocaleLowerCase('zh-Hant').includes(normalizedQuery),
    )
  }, [options, query, selectedOption])

  useEffect(() => {
    if (!isOpen) setQuery(selectedOption?.label ?? '')
  }, [isOpen, selectedOption])

  useEffect(() => {
    function handleOutsidePointer(event) {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener('pointerdown', handleOutsidePointer)
    return () => document.removeEventListener('pointerdown', handleOutsidePointer)
  }, [])

  function selectOption(option) {
    onChange(option.value)
    setQuery(option.label)
    setIsOpen(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((index) => Math.min(index + 1, filteredOptions.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && isOpen && filteredOptions[activeIndex]) {
      event.preventDefault()
      selectOption(filteredOptions[activeIndex])
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="searchable-select" ref={rootRef}>
      <FiSearch className="searchable-select-search-icon" aria-hidden="true" />
      <input
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        value={query}
        placeholder={placeholder}
        onFocus={() => {
          setIsOpen(true)
          setActiveIndex(0)
        }}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(0)
          setIsOpen(true)
          if (value) onChange('')
        }}
        onKeyDown={handleKeyDown}
      />
      {value ? (
        <button
          className="searchable-select-clear"
          type="button"
          title="清除關聯"
          aria-label="清除關聯"
          onClick={() => {
            onChange('')
            setQuery('')
            setIsOpen(true)
          }}
        >
          <FiX aria-hidden="true" />
        </button>
      ) : (
        <FiChevronDown className="searchable-select-chevron" aria-hidden="true" />
      )}
      {isOpen && (
        <div className="searchable-select-menu" role="listbox">
          {filteredOptions.length ? filteredOptions.map((option, index) => (
            <button
              className={index === activeIndex ? 'active' : ''}
              type="button"
              role="option"
              aria-selected={option.value === value}
              key={option.value}
              onPointerDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectOption(option)}
            >
              <span>{option.label}</span>
              {option.meta && <small>{option.meta}</small>}
            </button>
          )) : (
            <div className="searchable-select-empty">找不到符合的作品</div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchableSelect
