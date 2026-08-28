import './Header.css'

function Header() {
  return (
    <>
      <header className="site-header">
        <div className="brand">柚子的書庫</div>

        <nav className="site-nav" aria-label="主要選單">
          <button className="nav-link active" type="button">
            追漫
          </button>
          <button className="nav-link" type="button">
            實體書
          </button>
          <button className="nav-link" type="button">
            分類
          </button>
          <button className="nav-link" type="button">
            設置
          </button>
        </nav>

        <div className="head-right">
          <input
            className="search"
            type="search"
            aria-label="搜尋"
            placeholder="找漫畫、找書、找作者…"
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
        <input type="search" placeholder="找漫畫、找書、找作者…" />
      </label>
    </>
  )
}

export default Header
