import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function FeedbackPage({ type }: { type: 'up' | 'down' }) {
  const navigate = useNavigate()
  const [note, setNote] = useState('')
  const [copyHint, setCopyHint] = useState<string | null>(null)

  const title = type === 'up' ? '感谢反馈' : '已收到'
  const subtitle = type === 'up' ? '很高兴对你有帮助。' : '我们会持续改进。你也可以补充一句原因。'

  const tag = type === 'up' ? '👍 有帮助' : '👎 待改进'
  const payload = useMemo(() => {
    const t = new Date()
    const ts = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(
      t.getDate(),
    ).padStart(2, '0')} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(
      2,
      '0',
    )}`
    const lines = [
      `反馈类型: ${type === 'up' ? '有帮助' : '待改进'}`,
      `时间: ${ts}`,
      note.trim() ? `补充: ${note.trim()}` : null,
    ].filter((v): v is string => v != null)
    return lines.join('\n')
  }, [note, type])

  return (
    <div className="page">
      <div className="card">
        <div className="card-title">
          {title} <span className="tag tag-intent">{tag}</span>
        </div>
        <div className="card-subtitle">{subtitle}</div>
        {type === 'down' ? (
          <div className="field">
            <div className="label">补充说明（可选）</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="比如：回答不准确/没覆盖到关键点/需要给出具体步骤或链接…"
            />
            <div className="help">当前页面无法直接关联到具体问答，可先把补充说明复制给维护同学。</div>
          </div>
        ) : (
          <div className="hint-body">你可以继续提问，或把本次正向反馈同步给团队。</div>
        )}
        {copyHint ? <div className="help">{copyHint}</div> : null}
        <div className="divider" />
        <div className="card-actions">
          <button
            className="btn"
            onClick={() => {
              window.close()
            }}
          >
            关闭
          </button>
          <button
            className="btn"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(payload)
                setCopyHint('已复制反馈内容，可粘贴到群里或工单中。')
              } catch {
                setCopyHint('复制失败，请手动选中内容复制。')
              }
            }}
          >
            复制反馈
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              navigate('/dashboard')
            }}
          >
            返回看板
          </button>
        </div>
        <div className="divider" />
        <div className="hint-title">快速操作</div>
        <div className="chips">
          <button
            className="chip"
            onClick={() => {
              navigate('/')
            }}
          >
            回到上传
          </button>
          <button
            className="chip"
            onClick={() => {
              navigate('/dashboard')
            }}
          >
            打开看板
          </button>
        </div>
      </div>
    </div>
  )
}
