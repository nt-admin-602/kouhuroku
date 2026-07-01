// READMEの「6. 型定義」に準拠

export type FlavorMaster = {
  id: string
  maker: string
  displayName: string
  iconKey: string
  tags?: string[]
}

export type Flavor = {
  id: string
  manufacturer: string
  name: string
  displayName: string
  tags?: string[]
  isOwned?: boolean
  createdAt: string
  updatedAt: string
}

export type FlavorEntry = {
  id: string
  flavorId: string
  gramsX10: number
}

export type Mix = {
  id: string
  name?: string
  entries: FlavorEntry[]
}

export type LayerContent =
  | { id: string; type: 'flavor'; entryId: string }
  | { id: string; type: 'mix'; mixId: string }

export type Layer = {
  id: string
  order: number
  contents: LayerContent[]
}

export type Point = {
  x: number
  y: number
}

export type HolePattern = {
  mode: 'text' | 'points'
  text?: string
  points?: Point[]
}

export type EquipmentConfig = {
  bowl?: string
  hms?: string
  foil?: {
    enabled: boolean
    thickness?: number
    layers?: number
    holePattern?: HolePattern
  }
  charcoal?: {
    type: '26mm_cube' | '22mm_cube' | '22mm_flat' | 'custom'
    customName?: string
    count: number
    note?: string
  }
  heatupTime?: string
}

export type PackingConfig = {
  note?: string
}

export type Recipe = {
  id: string
  rootRecipeId: string
  version: number
  name: string
  entries: FlavorEntry[]
  mixes: Mix[]
  layers: Layer[]
  equipment?: EquipmentConfig
  packing?: PackingConfig
  isLatest: boolean
  parentVersionId?: string
  createdAt: string
  updatedAt: string
}

export type RecipeDraft = {
  sourceRecipeId?: string
  name: string
  entries: FlavorEntry[]
  mixes: Mix[]
  layers: Layer[]
  equipment?: EquipmentConfig
  packing?: PackingConfig
  updatedAt: string
}
