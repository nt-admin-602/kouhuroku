import type { Recipe, HookahSession, SessionMemo } from '../types'

const RECIPES_KEY = 'kouhuroku_recipes'
const SESSIONS_KEY = 'kouhuroku_sessions'

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

// ===== Session storage =====

export function loadSessions(): HookahSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as HookahSession[]
  } catch {
    return []
  }
}

function saveSessions(sessions: HookahSession[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function addSession(session: HookahSession): void {
  saveSessions([...loadSessions(), session])
}

export function updateSession(updated: HookahSession): void {
  saveSessions(loadSessions().map(s => (s.id === updated.id ? updated : s)))
}

export function deleteSessionById(id: string): void {
  saveSessions(loadSessions().filter(s => s.id !== id))
}

export function addMemoToSession(
  sessionId: string,
  memo: SessionMemo,
): void {
  saveSessions(
    loadSessions().map(s =>
      s.id === sessionId ? { ...s, memos: [...s.memos, memo] } : s,
    ),
  )
}

export function endSession(sessionId: string, endedAt: string): void {
  saveSessions(
    loadSessions().map(s =>
      s.id === sessionId ? { ...s, endedAt } : s,
    ),
  )
}

/** 実行中のセッション一覧（startedAt 降順） */
export function getActiveSessions(): HookahSession[] {
  return loadSessions()
    .filter(s => !s.endedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}

/** 終了済みセッション一覧（startedAt 降順） */
export function getEndedSessions(): HookahSession[] {
  return loadSessions()
    .filter(s => !!s.endedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}
