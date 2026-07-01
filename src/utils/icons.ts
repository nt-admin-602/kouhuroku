import iconsData from '../data/icons.json'

type IconEntry = { emoji: string; uri: string | null }

const ICON_REGISTRY = iconsData as Record<string, IconEntry>

/** プルダウンのoption等に使う絵文字を返す。未登録キーはdefaultにフォールバック */
export function getIconEmoji(key: string): string {
  return ICON_REGISTRY[key]?.emoji ?? ICON_REGISTRY['default']?.emoji ?? '○'
}

/** 画像URIが登録されていれば返す（未設定はnull） */
export function getIconUri(key: string): string | null {
  return ICON_REGISTRY[key]?.uri ?? null
}
