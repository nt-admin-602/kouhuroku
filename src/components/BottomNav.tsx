type NavItem = 'home' | 'create' | 'history' | 'settings'

interface Props {
  active: NavItem
  onHome: () => void
  onCreate: () => void
}

export function BottomNav({ active, onHome, onCreate }: Props) {
  return (
    <nav className="bottom-nav" aria-label="メインナビゲーション">
      <button
        className={`nav-item ${active === 'home' ? 'active' : ''}`}
        onClick={onHome}
      >
        <span className="nav-icon">⌂</span>
        <span className="nav-label">ホーム</span>
      </button>
      <button
        className={`nav-item ${active === 'create' ? 'active' : ''}`}
        onClick={onCreate}
      >
        <span className="nav-icon">＋</span>
        <span className="nav-label">作成</span>
      </button>
      <button className="nav-item" disabled aria-disabled="true">
        <span className="nav-icon">≡</span>
        <span className="nav-label">履歴</span>
      </button>
      <button className="nav-item" disabled aria-disabled="true">
        <span className="nav-icon">⚙</span>
        <span className="nav-label">設定</span>
      </button>
    </nav>
  )
}
