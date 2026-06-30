import { useState } from 'react'
import type { FlavorEntry, Recipe } from './types'
import { FlavorSelectScreen } from './pages/FlavorSelectScreen'
import { RecipeListScreen } from './pages/RecipeListScreen'
import { addRecipe, setRecipeAsOlderVersion } from './utils/storage'

type Screen = 'list' | 'create-flavor'

export default function App() {
  const [screen, setScreen] = useState<Screen>('list')
  const [refreshKey, setRefreshKey] = useState(0)
  /** 編集元レシピ（新規作成時はnull） */
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)

  const handleSaveAndFinish = (entries: FlavorEntry[], name: string) => {
    const now = new Date().toISOString()

    if (editingRecipe) {
      // 編集モード: 新バージョンを作成
      const newId = crypto.randomUUID()
      const newVersion: Recipe = {
        id: newId,
        rootRecipeId: editingRecipe.rootRecipeId,
        version: editingRecipe.version + 1,
        name,
        entries,
        mixes: [],
        layers: [],
        isLatest: true,
        parentVersionId: editingRecipe.id,
        createdAt: now,
        updatedAt: now,
      }
      setRecipeAsOlderVersion(editingRecipe.id)
      addRecipe(newVersion)
      setEditingRecipe(null)
    } else {
      // 新規作成
      const id = crypto.randomUUID()
      addRecipe({
        id,
        rootRecipeId: id,
        version: 1,
        name,
        entries,
        mixes: [],
        layers: [],
        isLatest: true,
        createdAt: now,
        updatedAt: now,
      })
    }

    setRefreshKey(k => k + 1)
    setScreen('list')
  }

  const handleNext = (_entries: FlavorEntry[]) => {
    // TODO: 機材選択画面へ遷移
  }

  const handleSelectRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setScreen('create-flavor')
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


