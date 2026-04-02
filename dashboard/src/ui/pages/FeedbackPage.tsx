import { useEffect, useState } from 'react'

export function FeedbackPage() {
  const [secondsLeft, setSecondsLeft] = useState(3)

  useEffect(() => {
    const t = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    if (secondsLeft !== 0) return
    window.close()
  }, [secondsLeft])

  return (
    <div className="feedback-page">
      <div className="feedback-card">
        <div className="feedback-hero" aria-hidden="true">
          <div className="feedback-orb feedback-orb-a" />
          <div className="feedback-orb feedback-orb-b" />
          <div className="feedback-check">
            <div className="feedback-check-inner">✓</div>
          </div>
        </div>
        <div className="feedback-title">感谢你的反馈！</div>
        <div className="feedback-subtitle">我们已收到你的反馈，会持续优化体验。</div>
        <div className="feedback-meta">
          {secondsLeft > 0 ? `${secondsLeft}s 后自动关闭…` : '正在尝试自动关闭…'}
        </div>
        {secondsLeft === 0 ? (
          <div className="feedback-meta">如未自动关闭，请手动关闭此页面。</div>
        ) : null}
        <div className="feedback-actions">
          <button
            className="btn"
            onClick={() => {
              window.close()
            }}
          >
            立即关闭
          </button>
        </div>
      </div>
    </div>
  )
}
