import { useMemo, useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { useFeedbackStore } from '../../store/useFeedbackStore'
import type { Role } from '../../store/useAuthStore'

export function AdminPage() {
  const currentUser = useAuthStore((s) => s.user)
  const users = useAuthStore((s) => s.users)
  const addUser = useAuthStore((s) => s.addUser)
  const updateUser = useAuthStore((s) => s.updateUser)
  const removeUser = useAuthStore((s) => s.removeUser)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('user')
  const [notice, setNotice] = useState<string | null>(null)

  const counts = useFeedbackStore((s) => s.counts)
  const resetCounts = useFeedbackStore((s) => s.reset)

  const sortedUsers = useMemo(() => {
    return users
      .slice()
      .sort((a, b) => (a.role === b.role ? a.username.localeCompare(b.username) : a.role === 'admin' ? -1 : 1))
  }, [users])

  return (
    <div className="page">
      <div className="card">
        <div className="card-title">权限管理</div>
        <div className="card-subtitle">账号数据存储在浏览器本地（localStorage），仅用于降低误访问风险。</div>
        {notice ? <div className="notice">{notice}</div> : null}
      </div>

      <div className="card">
        <div className="card-title">反馈统计（本机）</div>
        <div className="card-subtitle">点赞/点踩数据仅记录在当前浏览器本地，不会同步到其他设备。</div>
        <div className="card-actions">
          <div className="meta-muted">👍 {counts.up}</div>
          <div className="meta-muted">👎 {counts.down}</div>
          <button
            className="btn btn-secondary"
            onClick={() => {
              const ok = window.confirm('确定清空本机的点赞/点踩统计吗？')
              if (!ok) return
              resetCounts()
              setNotice('已清空反馈统计')
            }}
          >
            清空统计
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">新增账号</div>
        <div className="filters" style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr' }}>
          <div className="field">
            <div className="label">账号</div>
            <input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setNotice(null)
              }}
              placeholder="例如：alice"
            />
          </div>
          <div className="field">
            <div className="label">密码</div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setNotice(null)
              }}
              placeholder="请输入密码"
            />
          </div>
          <div className="field">
            <div className="label">角色</div>
            <select
              value={role}
              onChange={(e) => {
                const v = e.target.value === 'admin' ? 'admin' : 'user'
                setRole(v)
                setNotice(null)
              }}
            >
              <option value="user">普通</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div className="field">
            <div className="label">&nbsp;</div>
            <button
              className="btn"
              onClick={() => {
                const res = addUser({ username, password, role })
                if (!res.ok) {
                  setNotice(res.error)
                  return
                }
                setUsername('')
                setPassword('')
                setRole('user')
                setNotice('已创建账号')
              }}
            >
              添加
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">账号列表</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>账号</th>
                <th>角色</th>
                <th>创建时间</th>
                <th style={{ width: 280 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((u) => (
                <tr key={u.username}>
                  <td className="mono">{u.username}</td>
                  <td>{u.role === 'admin' ? <span className="tag tag-project">管理员</span> : <span className="tag tag-intent">普通</span>}</td>
                  <td className="td-muted">{new Date(u.createdAt).toLocaleString()}</td>
                  <td>
                    <div className="card-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          const next = window.prompt(`为 ${u.username} 设置新密码：`)
                          if (next == null) return
                          const res = updateUser(u.username, { password: next })
                          setNotice(res.ok ? '已更新密码' : res.error)
                        }}
                      >
                        重置密码
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          const res = updateUser(u.username, { role: u.role === 'admin' ? 'user' : 'admin' })
                          setNotice(res.ok ? '已更新角色' : res.error)
                        }}
                        disabled={currentUser?.username === u.username}
                      >
                        切换角色
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          const ok = window.confirm(`确定删除账号 ${u.username} 吗？`)
                          if (!ok) return
                          const res = removeUser(u.username)
                          setNotice(res.ok ? '已删除账号' : res.error)
                        }}
                        disabled={currentUser?.username === u.username}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="td-muted">
                    暂无账号
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
