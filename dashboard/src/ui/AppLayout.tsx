import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDataStore } from '../store/useDataStore'
import { useUiStore } from '../store/useUiStore'

function cls(active: boolean): string {
  return active ? 'nav-link nav-link-active' : 'nav-link'
}

export function AppLayout() {
  const navigate = useNavigate()
  const { fileName, rows, loadedAt, clear } = useDataStore()
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-title">
            <span className="app-mark" aria-hidden="true" />Agent 问答看板
          </div>
          <nav className="app-nav">
            <NavLink to="/" className={({ isActive }) => cls(isActive)}>
              上传数据
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => cls(isActive)}>
              看板
            </NavLink>
          </nav>
        </div>
        <div className="app-header-right">
          {fileName ? (
            <div className="app-meta">
              <div className="meta-line">
                <span className="meta-strong">{fileName}</span>
                <span className="meta-muted"> · {rows.length} 条</span>
              </div>
              <div className="meta-line meta-muted">
                {loadedAt ? loadedAt.toLocaleString() : ''}
              </div>
            </div>
          ) : (
            <div className="meta-muted">未加载数据</div>
          )}
          <button
            className="btn btn-secondary"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? '切换浅色主题' : '切换深色主题'}
          >
            {theme === 'dark' ? '浅色' : '深色'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              clear()
              navigate('/')
            }}
            disabled={!fileName}
          >
            清空
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
