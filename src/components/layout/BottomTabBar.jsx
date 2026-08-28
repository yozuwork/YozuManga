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
  return (
    <nav className="tabbar" aria-label="手機版主要選單">
      {tabs.map((tab) => (
        <button
          className={activeView === tab.id ? 'tab-btn active' : 'tab-btn'}
          type="button"
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {tab.icon}
          </svg>
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

export default BottomTabBar
