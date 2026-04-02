import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function FeedbackPage({ type }: { type: 'up' | 'down' }) {
  const navigate = useNavigate()

  useEffect(() => {
    const t = window.setTimeout(() => {
      navigate('/', { replace: true })
    }, 1500)
    return () => window.clearTimeout(t)
  }, [navigate])

  const title = type === 'up' ? '感谢反馈' : '已收到'
  const subtitle = type === 'up' ? '很高兴对你有帮助。' : '我们会持续改进。'

  return (
    <div className="page">
      <div className="card">
        <div className="card-title">{title}</div>
        <div className="card-subtitle">{subtitle}</div>
        <div className="card-actions">
          <button
            className="btn"
            onClick={() => {
              window.close()
              navigate('/', { replace: true })
            }}
          >
            关闭
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              navigate('/', { replace: true })
            }}
          >
            返回看板
          </button>
        </div>
      </div>
    </div>
  )
}
