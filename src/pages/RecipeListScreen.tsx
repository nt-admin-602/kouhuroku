import { useState, useEffect } from 'react'
import type { FlavorEntry, Recipe } from '../types'
import { getLatestRecipes, deleteRecipeById } from '../utils/storage'
import { getFlavorDisplayInfo } from '../data/flavors'
import { IconDisplay } from '../components/IconDisplay'

function FlavorIconsBg({ entries }: { entries: FlavorEntry[] }) {
  const keys = entries.map(e => getFlavorDisplayInfo(e.flavorId).iconKey).slice(0, 5)
  if (keys.length === 0) return null
  return (
    <div className="card-flavor-bg" aria-hidden="true">
      {keys.map((key, i) => (
        <IconDisplay key={i} iconKey={key} size={72} className="card-flavor-bg-icon" />
      ))}
    </div>
  )
}

interface Props {
  onCreateNew: () => void
  onSelectRecipe: (recipe: Recipe) => void
  onStartSession: (recipeId: string, recipeName: string) => void
  /** リスト再取得トリガー（保存後に変わる） */
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

export function RecipeListScreen({ onCreateNew, onSelectRecipe, onStartSession, refreshKey }: Props) {
  const [recipes, setRecipes] = useState<Recipe[]>([])

  useEffect(() => {
    setRecipes(getLatestRecipes())
  }, [refreshKey])

  const handleDelete = (id: string) => {
    deleteRecipeById(id)
    setRecipes(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="list-content">
        {/* 新規作成ボタン */}
        <button className="btn btn-create-new" onClick={onCreateNew}>
          ＋ 新規作成
        </button>

        {/* レシピ一覧 */}
        <section className="recipes-section">

          {recipes.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-icon">○</p>
              <p>まだレシピがありません。</p>
              <p>新規作成からはじめましょう。</p>
            </div>
          ) : (
            <ul className="recipe-list">
              {recipes.map(recipe => {
                return (
                  <li
                    key={recipe.id}
                    className="recipe-card"
                    onClick={() => onSelectRecipe(recipe)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && onSelectRecipe(recipe)}
                  >
                    <FlavorIconsBg entries={recipe.entries} />
                    <div className="recipe-card-header">
                      <div className="recipe-card-meta">
                        <span className="recipe-version">v{recipe.version}</span>
                        <span className="recipe-date">{formatDate(recipe.updatedAt)}</span>
                      </div>
                      <button
                        className="btn-delete"
                        onClick={e => { e.stopPropagation(); handleDelete(recipe.id) }}
                        aria-label="削除"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="recipe-name-row">
                      <p className="recipe-name">{recipe.name}</p>
                      <button
                        className="btn btn-start-session"
                        onClick={e => { e.stopPropagation(); onStartSession(recipe.id, recipe.name) }}
                        aria-label="セッション開始"
                      >
                        ▶ 開始
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
    </div>
  )
}
