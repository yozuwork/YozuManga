import { useEffect, useRef, useState } from 'react'
import './BottomTabBar.css'

const tabs = [
  {
    id: 'manga',
    label: '追漫',
    icon: <path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14l-8-4-8 4z" />,
  },
  {
    id: 'books',
    label: '實體書',
    icon: (
      <>
        <path d="M4 4h9a3 3 0 013 3v13H7a3 3 0 01-3-3V4z" />
        <path d="M16 4h4v16h-4" />
      </>
    ),
  },
  {
    id: 'cart',
    label: '購物車',
    icon: (
      <>
        <circle cx="9" cy="20" r="1" />
        <circle cx="19" cy="20" r="1" />
        <path d="M3 4h2l2.4 11.2a2 2 0 002 1.6h8.7a2 2 0 002-1.6L22 8H7" />
      </>
    ),
  },
  {
    id: 'links',
    label: '外部連結',
    icon: (
      <>
        <path d="M10 13a5 5 0 007.1 0l2-2a5 5 0 00-7.1-7.1l-1.1 1.1" />
        <path d="M14 11a5 5 0 00-7.1 0l-2 2A5 5 0 0012 20.1l1.1-1.1" />
      </>
    ),
  },
]

const moreTabs = [
  {
    id: 'secondhand',
    label: '二手書',
    icon: <><path d="M4 5h7l2 2h7v13h-7l-2-2H4z" /><path d="M8 10h8M8 14h6" /></>,
  },
  {
    id: 'cats',
    label: '分類',
    icon: (
      <>
        <path d="M20.6 12.6L12 21.2 2.8 12 12 2.8l8.6 8.6a1 1 0 010 1.4z" />
        <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    id: 'settings',
    label: '設置',
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 005 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09A1.65 1.65 0 0019.4 15z" />
      </>
    ),
  },
]

function BottomTabBar({ activeView, onViewChange }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const moreRef = useRef(null)
  const isMoreActive = moreTabs.some((tab) => tab.id === activeView)

  useEffect(() => {
    function handlePointerDown(event) {
      if (!moreRef.current?.contains(event.target)) setIsMoreOpen(false)
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsMoreOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function selectView(view) {
    setIsMoreOpen(false)
    onViewChange(view)
  }

  return (
    <nav className="tabbar" aria-label="手機版主要選單">
      {tabs.map((tab) => (
        <button
          className={activeView === tab.id ? 'tab-btn active' : 'tab-btn'}
          type="button"
          key={tab.id}
          onClick={() => selectView(tab.id)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {tab.icon}
          </svg>
          {tab.label}
        </button>
      ))}
      <div className="tab-more" ref={moreRef}>
        {isMoreOpen && (
          <div className="tab-more-menu" role="menu">
            {moreTabs.map((tab) => (
              <button
                className={activeView === tab.id ? 'tab-more-item active' : 'tab-more-item'}
                type="button"
                role="menuitem"
                key={tab.id}
                onClick={() => selectView(tab.id)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  {tab.icon}
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        )}
        <button
          className={isMoreActive || isMoreOpen ? 'tab-btn active' : 'tab-btn'}
          type="button"
          aria-expanded={isMoreOpen}
          aria-haspopup="menu"
          onClick={() => setIsMoreOpen((value) => !value)}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
          More
        </button>
      </div>
    </nav>
  )
}

export default BottomTabBar
