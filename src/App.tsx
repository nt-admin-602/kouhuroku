import { useState } from 'react'
import type { EquipmentConfig, FlavorEntry, Layer, Mix, PackingConfig, Recipe } from './types'
import { FlavorSelectScreen } from './pages/FlavorSelectScreen'
import { EquipmentSelectScreen } from './pages/EquipmentSelectScreen'
import { PackingScreen } from './pages/PackingScreen'
import { RecipeListScreen } from './pages/RecipeListScreen'
import { addRecipe, setRecipeAsOlderVersion } from './utils/storage'

type Screen = 'list' | 'create-flavor' | 'create-equipment' | 'create-packing'

export default function App() {
  const [screen, setScreen] = useState<Screen>('list')
  const [refreshKey, setRefreshKey] = useState(0)
  /** 編集元レシピ（新規作成時はnull） */
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  /** フレーバー選択画面から機材画面へ引き継ぐデータ */
  const [pendingEntries, setPendingEntries] = useState<FlavorEntry[]>([])
  const [pendingName, setPendingName] = useState('')
  const [pendingEquipment, setPendingEquipment] = useState<EquipmentConfig>({})
  const [pendingPackingConfig, setPendingPackingConfig] = useState<PackingConfig>({})
  const [pendingPackingLayers, setPendingPackingLayers] = useState<Layer[]>([])
  const [pendingPackingMixes, setPendingPackingMixes] = useState<Mix[]>([])

  const buildRecipe = (
    entries: FlavorEntry[],
    name: string,
    equipment?: EquipmentConfig,
    packing?: PackingConfig,
    layers?: Layer[],
    mixes?: Mix[],
  ): void => {
    const now = new Date().toISOString()
    if (editingRecipe) {
      const newId = crypto.randomUUID()
      const newVersion: Recipe = {
        id: newId,
        rootRecipeId: editingRecipe.rootRecipeId,
        version: editingRecipe.version + 1,
        name,
        entries,
        mixes: mixes ?? [],
        layers: layers ?? [],
        equipment,
        packing,
        isLatest: true,
        parentVersionId: editingRecipe.id,
        createdAt: now,
        updatedAt: now,
      }
      setRecipeAsOlderVersion(editingRecipe.id)
      addRecipe(newVersion)
      setEditingRecipe(null)
    } else {
      const id = crypto.randomUUID()
      addRecipe({
        id,
        rootRecipeId: id,
        version: 1,
        name,
        entries,
        mixes: mixes ?? [],
        layers: layers ?? [],
        equipment,
        packing,
        isLatest: true,
        createdAt: now,
        updatedAt: now,
      })
    }
    setRefreshKey(k => k + 1)
    setScreen('list')
  }

  const handleSaveAndFinish = (entries: FlavorEntry[], name: string) => {
    buildRecipe(entries, name)
  }

  const handleNext = (entries: FlavorEntry[]) => {
    setPendingEntries(entries)
    setPendingName(editingRecipe?.name ?? '')
    setPendingEquipment(editingRecipe?.equipment ?? {})
    setPendingPackingLayers(editingRecipe?.layers ?? [])
    setPendingPackingMixes(editingRecipe?.mixes ?? [])
    setPendingPackingConfig(editingRecipe?.packing ?? {})
    setScreen('create-equipment')
  }

  const handleEquipmentSave = (equipment: EquipmentConfig, name: string) => {
    buildRecipe(pendingEntries, name, equipment)
  }

  const handleEquipmentBack = (equipment: EquipmentConfig) => {
    setPendingEquipment(equipment)
    setScreen('create-flavor')
  }

  const handleEquipmentNext = (equipment: EquipmentConfig) => {
    setPendingEquipment(equipment)
    setScreen('create-packing')
  }

  const handlePackingSave = (
    packing: PackingConfig,
    layers: Layer[],
    mixes: Mix[],
    name: string,
  ) => {
    buildRecipe(pendingEntries, name, pendingEquipment, packing, layers, mixes)
  }

  const handlePackingBack = (
    packing: PackingConfig,
    layers: Layer[],
    mixes: Mix[],
  ) => {
    setPendingPackingConfig(packing)
    setPendingPackingLayers(layers)
    setPendingPackingMixes(mixes)
    setScreen('create-equipment')
  }

  const handleSelectRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setPendingEntries(recipe.entries)
    setPendingName(recipe.name)
    setPendingEquipment(recipe.equipment ?? {})
    setPendingPackingLayers(recipe.layers ?? [])
    setPendingPackingMixes(recipe.mixes ?? [])
    setPendingPackingConfig(recipe.packing ?? {})
    setScreen('create-flavor')
  }

  if (screen === 'create-packing') {
    return (
      <PackingScreen
        entries={pendingEntries}
        initialPacking={pendingPackingConfig}
        initialLayers={pendingPackingLayers}
        initialMixes={pendingPackingMixes}
        initialRecipeName={pendingName}
        onBack={handlePackingBack}
        onSaveAndFinish={handlePackingSave}
      />
    )
  }

  if (screen === 'create-equipment') {
    return (
      <EquipmentSelectScreen
        initialEquipment={pendingEquipment}
        initialRecipeName={pendingName}
        onBack={handleEquipmentBack}
        onNext={handleEquipmentNext}
        onSaveAndFinish={handleEquipmentSave}
      />
    )
  }

  if (screen === 'create-flavor') {
    return (
      <FlavorSelectScreen
        onNext={handleNext}
        onSaveAndFinish={handleSaveAndFinish}
        initialEntries={pendingEntries}
        initialRecipeName={pendingName}
      />
    )
  }

  return (
    <RecipeListScreen
      onCreateNew={() => {
        setEditingRecipe(null)
        setPendingEntries([])
        setPendingName('')
        setPendingEquipment({})
        setPendingPackingLayers([])
        setPendingPackingMixes([])
        setPendingPackingConfig({})
        setScreen('create-flavor')
      }}
      onSelectRecipe={handleSelectRecipe}
      refreshKey={refreshKey}
    />
  )
}


