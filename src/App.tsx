import { useState } from 'react'
import type { EquipmentConfig, FlavorEntry, Recipe } from './types'
import { FlavorSelectScreen } from './pages/FlavorSelectScreen'
import { EquipmentSelectScreen } from './pages/EquipmentSelectScreen'
import { RecipeListScreen } from './pages/RecipeListScreen'
import { addRecipe, setRecipeAsOlderVersion } from './utils/storage'

type Screen = 'list' | 'create-flavor' | 'create-equipment'

export default function App() {
  const [screen, setScreen] = useState<Screen>('list')
  const [refreshKey, setRefreshKey] = useState(0)
  /** 編集元レシピ（新規作成時はnull） */
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  /** フレーバー選択画面から機材画面へ引き継ぐデータ */
  const [pendingEntries, setPendingEntries] = useState<FlavorEntry[]>([])
  const [pendingName, setPendingName] = useState('')

  const buildRecipe = (
    entries: FlavorEntry[],
    name: string,
    equipment?: EquipmentConfig,
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
        mixes: [],
        layers: [],
        equipment,
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
        mixes: [],
        layers: [],
        equipment,
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
    setScreen('create-equipment')
  }

  const handleEquipmentSave = (equipment: EquipmentConfig, name: string) => {
    buildRecipe(pendingEntries, name, equipment)
  }

  const handleSelectRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setScreen('create-flavor')
  }

  if (screen === 'create-equipment') {
    return (
      <EquipmentSelectScreen
        initialEquipment={editingRecipe?.equipment}
        initialRecipeName={pendingName}
        onBack={() => setScreen('create-flavor')}
        onSaveAndFinish={handleEquipmentSave}
      />
    )
  }

  if (screen === 'create-flavor') {
    return (
      <FlavorSelectScreen
        onNext={handleNext}
        onSaveAndFinish={handleSaveAndFinish}
        initialEntries={editingRecipe?.entries}
        initialRecipeName={editingRecipe?.name}
      />
    )
  }

  return (
    <RecipeListScreen
      onCreateNew={() => { setEditingRecipe(null); setScreen('create-flavor') }}
      onSelectRecipe={handleSelectRecipe}
      refreshKey={refreshKey}
    />
  )
}


