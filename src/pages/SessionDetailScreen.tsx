import { useState, useEffect, useRef } from 'react'
import type { HookahSession, SessionMemo } from '../types'
import { addMemoToSession, endSession, loadSessions } from '../utils/storage'

interface Props {
  sessionId: string
  onBack: () => void
  onSessionUpdated: () => void
}

function formatElapsed(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const min = Math.floor((totalSec % 3600) / 60)
  const sec = totalSec % 60
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function formatElapsedLabel(sec: number): string {
  const h = Math.floor(sec / 3600)
  const min = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const parts: string[] = []
  if (h > 0) parts.push(`${h}時間`)
  if (min > 0) parts.push(`${min}分`)
  if (s > 0 || parts.length === 0) parts.push(`${s}秒`)
  return parts.join('')
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${y}/${mo}/${day} ${h}:${m}`
}

export function SessionDetailScreen({ sessionId, onBack, onSessionUpdated }: Props) {
  const [session, setSession] = useState<HookahSession | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [memoText, setMemoText] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const reloadSession = () => {
    const all = loadSessions()
    const s = all.find(x => x.id === sessionId) ?? null
    setSession(s)
    return s
  }

  useEffect(() => {
    const s = reloadSession()
    if (!s) return

    // 経過秒数の初期化
    const startMs = new Date(s.startedAt).getTime()
    const endMs = s.endedAt ? new Date(s.endedAt).getTime() : Date.now()
    setElapsed(Math.floor((endMs - startMs) / 1000))

    if (!s.endedAt) {
      // 実行中：1秒ごとに更新
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startMs) / 1000))
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const handleAddMemo = () => {
    const text = memoText.trim()
    if (!text || !session) return
    const memo: SessionMemo = {
      id: crypto.randomUUID(),
      elapsedSeconds: elapsed,
      text,
    }
    addMemoToSession(session.id, memo)
    setMemoText('')
    reloadSession()
    onSessionUpdated()
  }

  const handleEnd = () => {
    if (!session) return
    if (!window.confirm('セッションを終了しますか？')) return
    const now = new Date().toISOString()
    endSession(session.id, now)
    if (timerRef.current) clearInterval(timerRef.current)
    reloadSession()
    onSessionUpdated()
  }

  if (!session) {
    return (
      <div className="screen-content">
        <p className="empty-hint">セッションが見つかりません。</p>
      </div>
    )
  }

  const isActive = !session.endedAt

  return (
    <>
      {/* サブヘッダー */}
      <div className="session-detail-subheader">
        <button className="btn-back" onClick={onBack}>← 戻る</button>
        {isActive && (
          <button className="btn btn-end-session" onClick={handleEnd}>
            終了
          </button>
        )}
      </div>

      <div className="screen-content">
        {/* タイトル & タイマー */}
        <div className="session-detail-hero">
          <p className="session-detail-recipe">{session.recipeName}</p>
          <p className={`session-detail-timer ${isActive ? 'session-detail-timer--active' : ''}`}>
            {formatElapsed(elapsed)}
          </p>
          <p className="session-detail-meta">
            {formatDate(session.startedAt)} 開始
            {session.endedAt && ` — ${formatDate(session.endedAt)} 終了`}
          </p>
        </div>

        {/* メモ追加フォーム（実行中のみ） */}
        {isActive && (
          <section className="section">
            <label className="form-label">メモを追加</label>
            <div className="session-memo-input-row">
              <textarea
                className="input session-memo-textarea"
                value={memoText}
                onChange={e => setMemoText(e.target.value)}
                placeholder="メモを入力..."
                rows={2}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault()
                    handleAddMemo()
                  }
                }}
              />
              <button
                className="btn btn-add session-memo-add-btn"
                onClick={handleAddMemo}
                disabled={!memoText.trim()}
              >
                追加
              </button>
            </div>
          </section>
        )}

        {/* メモ一覧 */}
        <section className="section">
          <p className="form-label">メモ ({session.memos.length}件)</p>
          {session.memos.length === 0 ? (
            <p className="empty-hint">まだメモがありません。</p>
          ) : (
            <ul className="memo-list">
              {[...session.memos].reverse().map(memo => (
                <li key={memo.id} className="memo-item">
                  <span className="memo-elapsed">{formatElapsedLabel(memo.elapsedSeconds)}</span>
                  <span className="memo-text">{memo.text}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
