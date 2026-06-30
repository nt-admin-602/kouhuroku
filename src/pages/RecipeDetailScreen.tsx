import type { Recipe } from '../types'
import { deleteRecipeById } from '../utils/storage'
import { getFlavorDisplayInfo } from '../data/flavors'

interface Props {
  recipe: Recipe
  onBack: () => void
  onDeleted: () => void
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

export function RecipeDetailScreen({ recipe, onBack, onDeleted }: Props) {
  const totalGramsX10 = recipe.entries.reduce((s, e) => s + e.gramsX10, 0)

  const handleDelete = () => {
    if (window.confirm(`「${recipe.name}」を削除しますか？`)) {
      deleteRecipeById(recipe.id)
      onDeleted()
    }
  }

  return (
    <div className="screen">
      {/* ヘッダー */}
      <header className="detail-header">
        <button className="btn-back" onClick={onBack}>← 戻る</button>
        <span className="recipe-version">v{recipe.version}</span>
      </header>

      <div className="screen-content">
        {/* レシピ名 */}
        <h1 className="detail-name">{recipe.name}</h1>
        <p className="detail-date">更新: {formatDate(recipe.updatedAt)}</p>

        {/* 合計 */}
        <div className="total-bar" style={{ marginBottom: 20 }}>
          <span className="total-label">合計</span>
          <span className="total-value">{(totalGramsX10 / 10).toFixed(1)}g</span>
        </div>

        {/* フレーバー一覧（読み取り専用） */}
        <ul className="entry-list">
          {recipe.entries.map(entry => {
            const { displayName, maker, icon } = getFlavorDisplayInfo(entry.flavorId)
            return (
              <li key={entry.id} className="entry-card">
                <div className="entry-row1">
                  <span className="entry-flavor-icon" aria-hidden="true">{icon}</span>
                  <div className="entry-info">
                    {maker && <span className="entry-maker">{maker}</span>}
                    <span className="entry-name">{displayName}</span>
                  </div>
                  <span className="entry-grams">
                    {(entry.gramsX10 / 10).toFixed(1)}g
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* フッター */}
      <div className="bottom-area">
        <div className="bottom-bar">
          <button className="btn btn-finish" onClick={onBack} disabled>
            編集（近日対応）
          </button>
          <button className="btn btn-delete-action" onClick={handleDelete}>
            削除
          </button>
        </div>
      </div>
    </div>
  )
}
