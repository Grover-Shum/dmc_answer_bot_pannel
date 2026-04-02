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

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="card-title">登录</div>
        <div className="card-subtitle">请输入账号与密码</div>

        <div className="field">
          <div className="label">账号</div>
          <input
            autoFocus
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              const ok = login(username, password)
              if (!ok) {
                setError('账号或密码错误')
                return
              }
              navigate(from, { replace: true })
            }}
            placeholder="请输入账号"
          />
        </div>

        <div className="field">
          <div className="label">密码</div>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              const ok = login(username, password)
              if (!ok) {
                setError('账号或密码错误')
                return
              }
              navigate(from, { replace: true })
            }}
            placeholder="请输入密码"
          />
        </div>

        {error ? <div className="notice notice-error">{error}</div> : null}

        <div className="card-actions">
          <button
            className="btn"
            onClick={() => {
              const ok = login(username, password)
              if (!ok) {
                setError('账号或密码错误')
                return
              }
              navigate(from, { replace: true })
            }}
          >
            登录
          </button>
        </div>

        <div className="help">提示：这是前端本地校验，仅用于降低误访问风险。</div>
      </div>
    </div>
  )
}
