import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

type LocationState = {
  from?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const login = useAuthStore((s) => s.login)

  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const from = useMemo(() => {
    const state = (location.state ?? {}) as LocationState
    return typeof state.from === 'string' && state.from ? state.from : '/dashboard'
  }, [location.state])

  if (isAuthed) return <Navigate to={from} replace />

  const doLogin = () => {
    const ok = login(username.trim(), password)
    if (!ok) {
      setError('账号或密码错误')
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-aside" aria-hidden="true">
          <div className="login-aside-top">
            <div className="login-brand">
              <span className="login-mark" />答疑Agent
            </div>
            <div className="login-aside-title">问答数据看板</div>
            <div className="login-aside-subtitle">轻量访问控制 · 本地运行 · 快速洞察</div>
          </div>

          <div className="login-aside-points">
            <div className="login-point">
              <div className="login-point-title">更少干扰</div>
              <div className="login-point-body">通过登录页降低误访问，让团队更专注。</div>
            </div>
            <div className="login-point">
              <div className="login-point-title">本地校验</div>
              <div className="login-point-body">账号信息存储在浏览器本地，仅用于内部使用。</div>
            </div>
            <div className="login-point">
              <div className="login-point-title">管理员可配置</div>
              <div className="login-point-body">支持在管理页创建账号、重置密码与分配角色。</div>
            </div>
          </div>
        </div>

        <div className="login-card">
          <div className="login-card-title">登录</div>
          <div className="login-card-subtitle">请输入账号与密码继续</div>

          <form
            className="login-form"
            onSubmit={(e) => {
              e.preventDefault()
              doLogin()
            }}
          >
            <label className="login-field">
              <span className="login-label">账号</span>
              <input
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setError(null)
                }}
                placeholder="例如：admin"
                autoComplete="username"
              />
            </label>

            <label className="login-field">
              <span className="login-label">密码</span>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                placeholder="请输入密码"
                autoComplete="current-password"
              />
            </label>

            {error ? <div className="notice notice-error">{error}</div> : null}

            <div className="login-actions">
              <button className="btn" type="submit">
                登录
              </button>
            </div>
          </form>

          <div className="login-footnote">提示：这是前端本地校验，仅用于降低误访问风险。</div>
        </div>
      </div>
    </div>
  )
}
