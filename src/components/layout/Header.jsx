import './Header.css'

const navItems = [
  { id: 'manga', label: '追漫' },
  { id: 'books', label: '實體書' },
  { id: 'cats', label: '分類' },
  { id: 'settings', label: '設置' },
]

function Header({ activeView, onViewChange, searchQuery, onSearchChange }) {
  function handleSearchChange(event) {
    onSearchChange(event.target.value)
  }

  return (
    <>
      <header className="site-header">
        <div className="brand">柚子的書庫</div>

        <nav className="site-nav" aria-label="主要選單">
          {navItems.map((item) => (
            <button
              className={activeView === item.id ? 'nav-link active' : 'nav-link'}
              type="button"
              key={item.id}
              onClick={() => onViewChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="head-right">
          <input
            className="search"
            type="search"
            aria-label="搜尋"
            placeholder="找漫畫、找書、找作者…"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <div className="avatar" aria-label="使用者：米">
            米
          </div>
        </div>
      </header>

      <label className="mobile-search">
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="search"
          aria-label="搜尋"
          placeholder="找漫畫、找書、找作者…"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </label>
    </>
  )
}

export default Header
