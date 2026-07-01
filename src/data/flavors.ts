import type { FlavorMaster } from '../types'
import rawMasters from './flavorMasters.json'
import { getIconEmoji } from '../utils/icons'

export const FLAVOR_MASTERS: FlavorMaster[] = rawMasters as FlavorMaster[]

export const ALL_MAKERS: string[] = [
  ...new Set(FLAVOR_MASTERS.map(f => f.maker)),
]

export function getFlavorDisplayInfo(flavorId: string): {
  displayName: string
  maker: string
  icon: string
  iconKey: string
} {
  const master = FLAVOR_MASTERS.find(f => f.id === flavorId)
  if (master) {
    return {
      displayName: master.displayName,
      maker: master.maker,
      icon: getIconEmoji(master.iconKey),
      iconKey: master.iconKey,
    }
  }
  // カスタムフレーバー: ID から表示名を復元
  const name = flavorId
    .replace(/^custom-/, '')
    .split('-')
    .map(p => (p ? p.charAt(0).toUpperCase() + p.slice(1) : ''))
    .join(' ')
  return { displayName: name || flavorId, maker: '', icon: getIconEmoji('custom'), iconKey: 'custom' }
}