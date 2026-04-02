import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseXlsxFile } from '../../features/xlsx/parseXlsx'
import { useDataStore } from '../../store/useDataStore'

export function UploadPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const setData = useDataStore((s) => s.setData)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  async function handleFile(file: File) {
    setBusy(true)
    setError(null)
    try {
      const parsed = await parseXlsxFile(file)
      setData({
        fileName: file.name,
        sheetNames: parsed.sheetNames,
        activeSheet: parsed.activeSheet,
        rows: parsed.rows,
        columns: parsed.columns,
      })
      navigate('/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div
        className={dragOver ? 'card dropzone dropzone-active' : 'card dropzone'}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files?.[0]
          if (file) void handleFile(file)
        }}
      >
        <div className="card-title">导入 Excel（.xlsx）</div>
        <div className="card-subtitle">拖拽文件到此处，或使用按钮选择 / 加载示例。</div>

        <div className="uploader">
          <input
            ref={inputRef}
            className="file-input"
            type="file"
            accept=".xlsx"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
            }}
            disabled={busy}
          />
          <button className="btn" onClick={() => inputRef.current?.click()} disabled={busy}>
            选择文件
          </button>
          <button
            className="btn btn-secondary"
            onClick={async () => {
              setBusy(true)
              setError(null)
              try {
                const res = await fetch('/mockData.xlsx')
                if (!res.ok) throw new Error('示例数据未找到（public/mockData.xlsx）')
                const blob = await res.blob()
                const file = new File([blob], 'mockData.xlsx', {
                  type:
                    blob.type ||
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                })
                await handleFile(file)
              } catch (e) {
                setError(e instanceof Error ? e.message : '加载示例失败')
              } finally {
                setBusy(false)
              }
            }}
            disabled={busy}
          >
            加载示例
          </button>
        </div>

        {busy ? (
          <div className="notice notice-loading">
            <div className="spinner"></div>
            <span>正在解析数据，请稍候…</span>
          </div>
        ) : null}
        {error ? <div className="notice notice-error">{error}</div> : null}

        <div className="divider" />
        <div className="hint">
          <div className="hint-title">字段与隐私</div>
          <div className="hint-body">
            支持字段：session_id / question / answer / question_time / answer_time / intent /
            project_name。文件只在浏览器本地解析，不会上传到服务器。
          </div>
        </div>
      </div>
    </div>
  )
}
