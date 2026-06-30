import type { Recipe } from '../types'

const RECIPES_KEY = 'kouhuroku_recipes'

export function loadRecipes(): Recipe[] {
  try {
    const raw = localStorage.getItem(RECIPES_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Recipe[]
  } catch {
    return []
  }
}

function saveRecipes(recipes: Recipe[]): void {
  localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes))
}

export function addRecipe(recipe: Recipe): void {
  saveRecipes([...loadRecipes(), recipe])
}

/** そのバージョンのみ物理削除 */
export function deleteRecipeById(id: string): void {
  saveRecipes(loadRecipes().filter(r => r.id !== id))
}

/** 編集前のレシピを isLatest = false にする */
export function setRecipeAsOlderVersion(id: string): void {
  saveRecipes(
    loadRecipes().map(r => (r.id === id ? { ...r, isLatest: false } : r)),
  )
}

/** isLatest === true のレシピのみ返す（更新日時降順） */
export function getLatestRecipes(): Recipe[] {
  return loadRecipes()
    .filter(r => r.isLatest)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
