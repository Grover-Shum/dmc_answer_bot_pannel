import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useFeedbackStore } from '../../store/useFeedbackStore'

export function FeedbackPage() {
  const location = useLocation()
  const inc = useFeedbackStore((s) => s.inc)
  const [secondsLeft, setSecondsLeft] = useState(3)

  const feedbackType = useMemo(() => {
    if (location.pathname.endsWith('/down')) return 'down'
    if (location.pathname.endsWith('/up')) return 'up'
    return null
  }, [location.pathname])

  function attemptClose() {
    try {
      window.close()
      window.open('', '_self')
      window.close()
    } finally {
      window.setTimeout(() => {
        window.location.replace('about:blank')
      }, 120)
    }
  }

  useEffect(() => {
    if (!feedbackType) return
    inc(feedbackType)
  }, [feedbackType, inc])

  useEffect(() => {
    const t = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    if (secondsLeft !== 0) return
    attemptClose()
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
              attemptClose()
            }}
          >
            立即关闭
          </button>
        </div>
      </div>
    </div>
  )
}
