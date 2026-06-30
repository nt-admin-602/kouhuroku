import { useState, useEffect } from 'react'
import type { Recipe } from '../types'
import { getLatestRecipes, deleteRecipeById } from '../utils/storage'
import { BottomNav } from '../components/BottomNav'

interface Props {
  onCreateNew: () => void
  onSelectRecipe: (recipe: Recipe) => void
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

export function RecipeListScreen({ onCreateNew, onSelectRecipe, refreshKey }: Props) {
  const [recipes, setRecipes] = useState<Recipe[]>([])

  useEffect(() => {
    setRecipes(getLatestRecipes())
  }, [refreshKey])

  const handleDelete = (id: string) => {
    deleteRecipeById(id)
    setRecipes(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="screen">
      {/* ヘッダー */}
      <header className="list-header">
        <div className="list-header-title">
          <h1 className="app-title">香譜録</h1>
        </div>
        <span className="app-icon-badge" aria-hidden="true">🌿</span>
      </header>

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
                const totalGramsX10 = recipe.entries.reduce(
                  (s, e) => s + e.gramsX10,
                  0,
                )
                return (
                  <li
                    key={recipe.id}
                    className="recipe-card"
                    onClick={() => onSelectRecipe(recipe)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && onSelectRecipe(recipe)}
                  >
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

                    <p className="recipe-name">{recipe.name}</p>

                    <div className="recipe-card-stats">
                      <span className="recipe-stat">
                        🌿 {recipe.entries.length}フレーバー
                      </span>
                      <span className="recipe-stat recipe-stat-grams">
                        {(totalGramsX10 / 10).toFixed(1)}g
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <BottomNav active="home" onHome={() => {}} onCreate={onCreateNew} />
    </div>
  )
}
