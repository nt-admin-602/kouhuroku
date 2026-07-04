type NavItem = 'home' | 'create' | 'sessions' | 'settings'

interface Props {
  active: NavItem
  onHome: () => void
  onCreate: () => void
  onSessions: () => void
}

export function BottomNav({ active, onHome, onCreate, onSessions }: Props) {
  return (
    <nav className="bottom-nav" aria-label="メインナビゲーション">
      <button
        className={`nav-item ${active === 'home' ? 'active' : ''}`}
        onClick={onHome}
      >
        <span className="nav-icon">⌂</span>
        <span className="nav-label">一覧</span>
      </button>
      <button
        className={`nav-item ${active === 'create' ? 'active' : ''}`}
        onClick={onCreate}
      >
        <span className="nav-icon">＋</span>
        <span className="nav-label">レシピ</span>
      </button>
      <button
        className={`nav-item ${active === 'sessions' ? 'active' : ''}`}
        onClick={onSessions}
      >
        <span className="nav-icon">▶</span>
        <span className="nav-label">セッション</span>
      </button>
      <button className="nav-item" disabled aria-disabled="true">
        <span className="nav-icon">⚙</span>
        <span className="nav-label">設定</span>
      </button>
    </nav>
  )
}
