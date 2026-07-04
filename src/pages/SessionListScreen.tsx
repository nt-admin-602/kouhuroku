import { useState, useEffect, useCallback } from 'react'
import type { HookahSession, Recipe } from '../types'
import {
  getActiveSessions,
  getEndedSessions,
  deleteSessionById,
  addSession,
  loadRecipes,
} from '../utils/storage'
import { getLatestRecipes } from '../utils/storage'
import { getFlavorDisplayInfo } from '../data/flavors'
import { IconDisplay } from '../components/IconDisplay'

interface Props {
  onOpenSession: (session: HookahSession) => void
  /** セッション追加などでリスト再取得をトリガーするキー */
  refreshKey?: number
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

function formatElapsed(startedAt: string, endedAt?: string): string {
  const start = new Date(startedAt).getTime()
  const end = endedAt ? new Date(endedAt).getTime() : Date.now()
  const totalSec = Math.floor((end - start) / 1000)
  const h = Math.floor(totalSec / 3600)
  const min = Math.floor((totalSec % 3600) / 60)
  const sec = totalSec % 60
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function FlavorIconsBg({ recipeId, allRecipes }: { recipeId: string; allRecipes: Recipe[] }) {
  const recipe = allRecipes.find(r => r.id === recipeId)
  if (!recipe || recipe.entries.length === 0) return null
  const keys = recipe.entries.map(e => getFlavorDisplayInfo(e.flavorId).iconKey).slice(0, 5)
  return (
    <div className="card-flavor-bg" aria-hidden="true">
      {keys.map((key, i) => (
        <IconDisplay key={i} iconKey={key} size={72} className="card-flavor-bg-icon" />
      ))}
    </div>
  )
}

/** セッション開始のためのレシピ選択モーダル */
function RecipePickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (recipeId: string, recipeName: string) => void
  onClose: () => void
}) {
  const recipes = getLatestRecipes()
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">レシピを選択</span>
          <button className="modal-close" onClick={onClose} aria-label="閉じる">✕</button>
        </div>
        {recipes.length === 0 ? (
          <p className="modal-empty">レシピがありません。先にレシピを作成してください。</p>
        ) : (
          <ul className="modal-recipe-list">
            {recipes.map(r => (
              <li
                key={r.id}
                className="modal-recipe-item"
                onClick={() => onSelect(r.id, r.name)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onSelect(r.id, r.name)}
              >
                <span className="modal-recipe-name">{r.name}</span>
                <span className="modal-recipe-meta">v{r.version} · {(r.entries.reduce((s, e) => s + e.gramsX10, 0) / 10).toFixed(1)}g</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/** 実行中セッションのタイマー表示（1秒更新） */
function LiveTimer({ startedAt }: { startedAt: string }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="session-timer-live">{formatElapsed(startedAt)}</span>
}

export function SessionListScreen({ onOpenSession, refreshKey }: Props) {
  const [active, setActive] = useState<HookahSession[]>([])
  const [ended, setEnded] = useState<HookahSession[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [allRecipes, setAllRecipes] = useState<Recipe[]>(() => loadRecipes())

  const reload = useCallback(() => {
    setActive(getActiveSessions())
    setEnded(getEndedSessions())
    setAllRecipes(loadRecipes())
  }, [])

  useEffect(() => { reload() }, [reload, refreshKey])

  const handleStartSession = (recipeId: string, recipeName: string) => {
    const session: HookahSession = {
      id: crypto.randomUUID(),
      recipeId,
      recipeName,
      startedAt: new Date().toISOString(),
      memos: [],
    }
    addSession(session)
    setShowPicker(false)
    reload()
    onOpenSession(session)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteSessionById(id)
    reload()
  }

  return (
    <>
      <div className="list-content">
        <button className="btn btn-create-new" onClick={() => setShowPicker(true)}>
          ▶ セッション開始
        </button>

        {/* 実行中 */}
        {active.length > 0 && (
          <section className="session-section">
            <p className="section-heading">実行中</p>
            <ul className="session-list">
              {active.map(s => (
                <li
                  key={s.id}
                  className="session-card session-card--active"
                  onClick={() => onOpenSession(s)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && onOpenSession(s)}
                >
                  <FlavorIconsBg recipeId={s.recipeId} allRecipes={allRecipes} />
                  <div className="session-card-header">
                    <span className="session-status-dot" aria-hidden="true">●</span>
                    <span className="session-recipe-name">{s.recipeName}</span>
                    <button
                      className="btn-delete"
                      onClick={ev => handleDelete(s.id, ev)}
                      aria-label="削除"
                    >✕</button>
                  </div>
                  <div className="session-card-body">
                    <LiveTimer startedAt={s.startedAt} />
                    <span className="session-memo-count">{s.memos.length} メモ</span>
                  </div>
                  <span className="session-started-at">{formatDate(s.startedAt)} 開始</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 終了済み */}
        {ended.length > 0 && (
          <section className="session-section">
            <p className="section-heading">終了済み</p>
            <ul className="session-list">
              {ended.map(s => (
                <li
                  key={s.id}
                  className="session-card"
                  onClick={() => onOpenSession(s)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && onOpenSession(s)}
                >
                  <FlavorIconsBg recipeId={s.recipeId} allRecipes={allRecipes} />
                  <div className="session-card-header">
                    <span className="session-recipe-name">{s.recipeName}</span>
                    <button
                      className="btn-delete"
                      onClick={ev => handleDelete(s.id, ev)}
                      aria-label="削除"
                    >✕</button>
                  </div>
                  <div className="session-card-body">
                    <span className="session-duration">
                      {formatElapsed(s.startedAt, s.endedAt)}
                    </span>
                    <span className="session-memo-count">{s.memos.length} メモ</span>
                  </div>
                  <span className="session-started-at">{formatDate(s.startedAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {active.length === 0 && ended.length === 0 && (
          <div className="empty-state">
            <p className="empty-state-icon">○</p>
            <p>セッションがありません。</p>
            <p>セッション開始からはじめましょう。</p>
          </div>
        )}
      </div>

      {showPicker && (
        <RecipePickerModal
          onSelect={handleStartSession}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}
