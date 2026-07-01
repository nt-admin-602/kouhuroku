import { useState } from 'react'
import type {
  FlavorEntry,
  Layer,
  LayerContent,
  Mix,
  PackingConfig,
} from '../types'
import { StepIndicator } from '../components/StepIndicator'
import { getFlavorDisplayInfo } from '../data/flavors'

const STEPS = ['フレーバー選択', '機材', 'パッキング', '保存'] as const
const STEP_DELTAS = [-10, -5, -1, 1, 5, 10] as const

// ---- ローカル型 ----
interface MixDraft {
  id: string
  name: string
  layerIndex: number
  grams: Record<string, number> // entryId -> gramsX10 (存在しない or 0 = このミックスに含まない)
}

interface Props {
  entries: FlavorEntry[]
  initialPacking?: PackingConfig
  initialLayers?: Layer[]
  initialMixes?: Mix[]
  initialRecipeName?: string
  onBack: (packing: PackingConfig, layers: Layer[], mixes: Mix[]) => void
  onSaveAndFinish: (
    packing: PackingConfig,
    layers: Layer[],
    mixes: Mix[],
    recipeName: string,
  ) => void
}

// ---- ヘルパー ----
function getLayerLabel(idx: number, total: number): string {
  if (total === 1) return '全体'
  if (total === 2) return idx === 0 ? '底' : '上'
  if (total === 3) return ['底', '中', '上'][idx] ?? `L${idx + 1}`
  return `L${idx + 1}`
}

/** directPlacement: entryId -> layerIdx | null (null = 直置きなし) */
function initDirectPlacements(
  entries: FlavorEntry[],
  initialLayers?: Layer[],
  initialMixes?: Mix[],
): Record<string, number | null> {
  const map: Record<string, number | null> = {}
  // デフォルト: 新規は全てレイヤー0
  entries.forEach(e => { map[e.id] = 0 })
  if (!initialLayers) return map

  entries.forEach(e => { map[e.id] = null })
  initialLayers.forEach(layer => {
    layer.contents.forEach(c => {
      if (c.type === 'flavor') map[c.entryId] = layer.order - 1
    })
  })
  return map
}

function initMixDrafts(
  entries: FlavorEntry[],
  initialMixes?: Mix[],
  initialLayers?: Layer[],
): MixDraft[] {
  if (!initialMixes || initialMixes.length === 0) return []
  return initialMixes.map(m => {
    let layerIndex = 0
    initialLayers?.forEach(layer => {
      layer.contents.forEach(c => {
        if (c.type === 'mix' && c.mixId === m.id) layerIndex = layer.order - 1
      })
    })
    const grams: Record<string, number> = {}
    m.entries.forEach(me => {
      const re = entries.find(e => e.flavorId === me.flavorId)
      if (re) grams[re.id] = me.gramsX10
    })
    return { id: m.id, name: m.name ?? 'ミックス', layerIndex, grams }
  })
}

function buildResult(
  entries: FlavorEntry[],
  directPlacement: Record<string, number | null>,
  mixDrafts: MixDraft[],
  layerCount: number,
): { layers: Layer[]; mixes: Mix[] } {
  const mixes: Mix[] = mixDrafts
    .map(draft => {
      const mixEntries = entries.filter(e => (draft.grams[e.id] ?? 0) > 0)
      if (mixEntries.length === 0) return null
      return {
        id: draft.id,
        name: draft.name,
        entries: mixEntries.map(e => ({
          id: crypto.randomUUID(),
          flavorId: e.flavorId,
          gramsX10: draft.grams[e.id],
        })),
      } satisfies Mix
    })
    .filter((m): m is Mix => m !== null)

  const layersMap = new Map<number, LayerContent[]>()

  // 直置き
  entries.forEach(e => {
    const idx = directPlacement[e.id]
    if (idx === null || idx === undefined) return
    if (!layersMap.has(idx)) layersMap.set(idx, [])
    layersMap.get(idx)!.push({ id: crypto.randomUUID(), type: 'flavor', entryId: e.id })
  })

  // ミックス
  mixDrafts.forEach(draft => {
    const hasEntries = entries.some(e => (draft.grams[e.id] ?? 0) > 0)
    if (!hasEntries) return
    const idx = draft.layerIndex
    if (!layersMap.has(idx)) layersMap.set(idx, [])
    layersMap.get(idx)!.push({ id: crypto.randomUUID(), type: 'mix', mixId: draft.id })
  })

  const layers: Layer[] = Array.from({ length: layerCount }, (_, i) => i)
    .filter(i => layersMap.has(i))
    .map(i => ({ id: crypto.randomUUID(), order: i + 1, contents: layersMap.get(i)! }))

  if (layers.length === 0) layers.push({ id: crypto.randomUUID(), order: 1, contents: [] })
  return { layers, mixes }
}

// ---- コンポーネント ----
export function PackingScreen({
  entries,
  initialPacking,
  initialLayers,
  initialMixes,
  initialRecipeName,
  onBack,
  onSaveAndFinish,
}: Props) {
  const initLayerCount = initialLayers?.length
    ? Math.max(...initialLayers.map(l => l.order))
    : 1

  const [layerCount, setLayerCount] = useState(initLayerCount)
  const [directPlacement, setDirectPlacement] = useState<Record<string, number | null>>(() =>
    initDirectPlacements(entries, initialLayers, initialMixes),
  )
  const [mixDrafts, setMixDrafts] = useState<MixDraft[]>(() =>
    initMixDrafts(entries, initialMixes, initialLayers),
  )
  const [note, setNote] = useState(initialPacking?.note ?? '')
  const [saveMode, setSaveMode] = useState(false)
  const [recipeName, setRecipeName] = useState(initialRecipeName ?? '')

  // ---- レイヤー操作 ----
  const addLayer = () => setLayerCount(n => n + 1)
  const removeLayer = () => {
    if (layerCount <= 1) return
    const newCount = layerCount - 1
    setDirectPlacement(prev => {
      const updated = { ...prev }
      Object.entries(updated).forEach(([id, idx]) => {
        if (idx !== null && idx >= newCount) updated[id] = newCount - 1
      })
      return updated
    })
    setMixDrafts(prev =>
      prev.map(m => ({
        ...m,
        layerIndex: m.layerIndex >= newCount ? newCount - 1 : m.layerIndex,
      })),
    )
    setLayerCount(newCount)
  }

  // ---- 直置き操作 ----
  // 同じレイヤーをクリック → 解除 (null)、別レイヤー → 移動
  const toggleDirectLayer = (entryId: string, layerIdx: number) => {
    setDirectPlacement(prev => ({
      ...prev,
      [entryId]: prev[entryId] === layerIdx ? null : layerIdx,
    }))
  }

  // ---- ミックス操作 ----
  const toggleEntryInMix = (entryId: string, mixId: string) => {
    const maxGramsX10 = entries.find(e => e.id === entryId)!.gramsX10
    setMixDrafts(prev => {
      const updated = prev.map(m => {
        if (m.id !== mixId) return m
        const isIn = (m.grams[entryId] ?? 0) > 0
        if (isIn) {
          const { [entryId]: _, ...rest } = m.grams
          return { ...m, grams: rest }
        }
        return { ...m, grams: { ...m.grams, [entryId]: maxGramsX10 } }
      })
      const totalUsed = updated.reduce((sum, m) => sum + (m.grams[entryId] ?? 0), 0)
      if (totalUsed >= maxGramsX10) {
        setDirectPlacement(prev => ({ ...prev, [entryId]: null }))
      }
      return updated
    })
  }

  const addMixAndAssign = (entryId: string) => {
    const mixId = crypto.randomUUID()
    const entry = entries.find(e => e.id === entryId)!
    setMixDrafts(prev => [
      ...prev,
      {
        id: mixId,
        name: `ミックス${prev.length + 1}`,
        layerIndex: 0,
        grams: { [entryId]: entry.gramsX10 },
      },
    ])
  }

  const deleteMix = (mixId: string) => {
    setMixDrafts(prev => prev.filter(m => m.id !== mixId))
  }

  const updateMixGrams = (mixId: string, entryId: string, delta: number) => {
    const maxGramsX10 = entries.find(e => e.id === entryId)!.gramsX10
    setMixDrafts(prev => {
      const updated = prev.map(m => {
        if (m.id !== mixId) return m
        const cur = m.grams[entryId] ?? maxGramsX10
        const next = Math.min(maxGramsX10, Math.max(1, cur + delta))
        return { ...m, grams: { ...m.grams, [entryId]: next } }
      })
      const totalUsed = updated.reduce((sum, m) => sum + (m.grams[entryId] ?? 0), 0)
      if (totalUsed >= maxGramsX10) {
        setDirectPlacement(prev => ({ ...prev, [entryId]: null }))
      }
      return updated
    })
  }

  const updateMixName = (mixId: string, name: string) =>
    setMixDrafts(prev => prev.map(m => (m.id === mixId ? { ...m, name } : m)))

  const setMixLayer = (mixId: string, layerIdx: number) =>
    setMixDrafts(prev => prev.map(m => (m.id === mixId ? { ...m, layerIndex: layerIdx } : m)))

  // ---- 戻る ----
  const handleBack = () => {
    const packing: PackingConfig = note.trim() ? { note: note.trim() } : {}
    const { layers, mixes } = buildResult(entries, directPlacement, mixDrafts, layerCount)
    onBack(packing, layers, mixes)
  }

  // ---- 保存 ----
  const handleSave = () => {
    if (!recipeName.trim()) return
    const packing: PackingConfig = note.trim() ? { note: note.trim() } : {}
    const { layers, mixes } = buildResult(entries, directPlacement, mixDrafts, layerCount)
    onSaveAndFinish(packing, layers, mixes, recipeName.trim())
  }

  const layerLabels = Array.from({ length: layerCount }, (_, i) =>
    getLayerLabel(i, layerCount),
  )

  return (
    <div className="screen">
      <StepIndicator steps={STEPS} currentStep={2} />

      <div className="screen-content">
        {/* レイヤー構成 + フレーバー配置 */}
        <section className="section">
          <div className="equip-toggle-row">
            <span className="form-label equip-toggle-label">レイヤー構成</span>
            <div className="equip-count-ctrl">
              <button
                className="btn equip-count-btn equip-count-plus"
                onClick={addLayer}
                type="button"
                aria-label="レイヤーを追加"
              >＋</button>
              <span className="equip-count-val">{layerCount}</span>
              <button
                className="btn equip-count-btn equip-count-minus"
                onClick={removeLayer}
                disabled={layerCount <= 1}
                type="button"
                aria-label="レイヤーを削除"
              >−</button>
            </div>
          </div>

          {entries.length > 0 && (
            <ul className="packing-entry-list">
              {entries.map(entry => {
                const { displayName, maker, icon } = getFlavorDisplayInfo(entry.flavorId)
                const currentDirectLayer = directPlacement[entry.id] ?? null
                const mixUsedX10 = mixDrafts.reduce((sum, m) => sum + (m.grams[entry.id] ?? 0), 0)
                const isFullyUsed = mixUsedX10 >= entry.gramsX10
                const remainingX10 = entry.gramsX10 - mixUsedX10

                return (
                  <li key={entry.id} className="entry-card packing-entry-card">
                    {/* Row1: アイコン + 名前 + グラム数 */}
                    <div className="entry-row1">
                      <span className="packing-entry-icon" aria-hidden="true">{icon}</span>
                      <div className="entry-info">
                        {maker && <span className="entry-maker">{maker}</span>}
                        <span className="entry-name">{displayName}</span>
                      </div>
                      <div className="packing-gram-block">
                        <span className={`entry-grams${isFullyUsed ? ' packing-gram-used-all' : ''}`}>
                          {mixUsedX10 > 0 && !isFullyUsed
                            ? `${(remainingX10 / 10).toFixed(1)} / ${(entry.gramsX10 / 10).toFixed(1)}g`
                            : `${(entry.gramsX10 / 10).toFixed(1)}g`
                          }
                        </span>
                        {isFullyUsed && (
                          <span className="packing-gram-sub packing-gram-exhausted">
                            使い切り
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Row2: 配置コントロール */}
                    <div className="packing-placement-ctrl">
                      <div className="packing-ctrl-group">
                        {layerLabels.map((label, i) => (
                          <button
                            key={i}
                            className={`btn packing-layer-btn ${
                              !isFullyUsed && currentDirectLayer === i
                                ? 'packing-layer-btn-active'
                                : ''
                            }`}
                            onClick={() => !isFullyUsed && toggleDirectLayer(entry.id, i)}
                            type="button"
                            disabled={isFullyUsed}
                            title={isFullyUsed ? 'ミックスで使い切り済み' : undefined}
                          >{label}</button>
                        ))}
                      </div>

                      {mixDrafts.length > 0 && (
                        <div className="packing-ctrl-group">
                          {mixDrafts.map(m => {
                            const isInMix = (m.grams[entry.id] ?? 0) > 0
                            return (
                              <button
                                key={m.id}
                                className={`btn packing-layer-btn packing-mix-btn ${isInMix ? 'packing-mix-btn-active' : ''}`}
                                onClick={() => toggleEntryInMix(entry.id, m.id)}
                                type="button"
                                title={m.name}
                              >{m.name}</button>
                            )
                          })}
                        </div>
                      )}

                      <button
                        className="btn packing-mix-btn packing-mix-new-btn"
                        onClick={() => addMixAndAssign(entry.id)}
                        type="button"
                        disabled={isFullyUsed}
                        title={isFullyUsed ? 'ミックスでグラムを使い切っています' : '新しいミックスを作ってこのフレーバーを追加'}
                      >＋新ミックス</button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* ミックスカード */}
        {mixDrafts.map(mix => {
          const mixEntries = entries.filter(e => (mix.grams[e.id] ?? 0) > 0)
          return (
            <section key={mix.id} className="section mix-card">
              <div className="mix-card-header">
                <input
                  className="mix-card-name-input"
                  value={mix.name}
                  onChange={e => updateMixName(mix.id, e.target.value)}
                  placeholder="例: フルーツミックス"
                  aria-label="ミックス名"
                />
                {layerCount > 1 && (
                  <div className="packing-ctrl-group">
                    {layerLabels.map((label, i) => (
                      <button
                        key={i}
                        className={`btn packing-layer-btn ${mix.layerIndex === i ? 'packing-layer-btn-active' : ''}`}
                        onClick={() => setMixLayer(mix.id, i)}
                        type="button"
                      >{label}</button>
                    ))}
                  </div>
                )}
                <button
                  className="btn mix-delete-btn"
                  onClick={() => deleteMix(mix.id)}
                  type="button"
                  aria-label="このミックスを削除"
                >×</button>
              </div>

              {mixEntries.length === 0 ? (
                <p className="mix-empty-note">
                  フレーバー行の「{mix.name}」ボタンで追加
                </p>
              ) : (
                <ul className="mix-entry-list">
                  {mixEntries.map(entry => {
                    const { icon, displayName, maker } = getFlavorDisplayInfo(entry.flavorId)
                    const gramsX10 = mix.grams[entry.id] ?? entry.gramsX10
                    const maxGramsX10 = entry.gramsX10
                    return (
                      <li key={entry.id} className="entry-card mix-entry-card">
                        <div className="entry-row1">
                          <span className="packing-entry-icon" aria-hidden="true">{icon}</span>
                          <div className="entry-info">
                            {maker && <span className="entry-maker">{maker}</span>}
                            <span className="entry-name">{displayName}</span>
                          </div>
                          <span className="entry-grams">
                            {(gramsX10 / 10).toFixed(1)}g
                          </span>
                        </div>
                        <div className="stepper-row">
                          {STEP_DELTAS.map(delta => (
                            <button
                              key={delta}
                              className={`btn btn-step ${delta < 0 ? 'btn-step-minus' : 'btn-step-plus'}`}
                              onClick={() => updateMixGrams(mix.id, entry.id, delta)}
                              disabled={
                                (delta < 0 && gramsX10 <= 1) ||
                                (delta > 0 && gramsX10 >= maxGramsX10)
                              }
                              aria-label={`${delta > 0 ? '+' : ''}${(delta / 10).toFixed(1)}g`}
                            >
                              {delta > 0 ? '+' : ''}{(delta / 10).toFixed(1)}
                            </button>
                          ))}
                        </div>
                        <div className="mix-gram-max-hint">
                          max {(maxGramsX10 / 10).toFixed(1)}g
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}

        {/* 断面ビジュアル (レイヤー2以上) */}
        {layerCount > 1 && (
          <section className="section">
            <span className="form-label">断面イメージ</span>
            <div className="layer-visual">
              {Array.from({ length: layerCount }, (_, i) => layerCount - 1 - i).map(idx => {
                const directFlavors = entries.filter(
                  e => directPlacement[e.id] === idx,
                )
                const mixesHere = mixDrafts.filter(m => {
                  if (m.layerIndex !== idx) return false
                  return entries.some(e => (m.grams[e.id] ?? 0) > 0)
                })
                return (
                  <div key={idx} className="layer-visual-row">
                    <span className="layer-visual-label">{getLayerLabel(idx, layerCount)}</span>
                    <div className="layer-visual-contents">
                      {directFlavors.map(e => {
                        const { icon, displayName } = getFlavorDisplayInfo(e.flavorId)
                        const usedInMix = mixDrafts.reduce((sum, m) => sum + (m.grams[e.id] ?? 0), 0)
                        const remaining = e.gramsX10 - usedInMix
                        return (
                          <span key={e.id} className="layer-flavor-chip">
                            {icon} {displayName}
                            <span className="layer-chip-grams">{(remaining / 10).toFixed(1)}g</span>
                          </span>
                        )
                      })}
                      {mixesHere.map(m => {
                        const mixEntries = entries.filter(e => (m.grams[e.id] ?? 0) > 0)
                        const mixTotalX10 = mixEntries.reduce((sum, e) => sum + m.grams[e.id], 0)
                        const names = mixEntries.map(e => getFlavorDisplayInfo(e.flavorId).displayName)
                        return (
                          <span key={m.id} className="layer-mix-chip">
                            {m.name}: {names.join(' + ')}
                            <span className="layer-chip-grams">{(mixTotalX10 / 10).toFixed(1)}g</span>
                          </span>
                        )
                      })}
                      {directFlavors.length === 0 && mixesHere.length === 0 && (
                        <span className="layer-empty">空</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* メモ */}
        <section className="section">
          <label className="form-label" htmlFor="packing-note">メモ</label>
          <input
            id="packing-note"
            className="input"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="例: 底に向けてパック、全体に広げた"
            autoComplete="off"
          />
        </section>
      </div>

      {/* フッター */}
      <div className="bottom-area">
        {saveMode && (
          <div className="save-panel">
            <label className="form-label" htmlFor="packing-recipe-name">レシピ名</label>
            <input
              id="packing-recipe-name"
              className="input"
              value={recipeName}
              onChange={e => setRecipeName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="ミックスに名前をつけてください"
              autoFocus
            />
          </div>
        )}
        <div className="bottom-bar">
          {saveMode ? (
            <>
              <button className="btn btn-cancel-sm" onClick={() => setSaveMode(false)}>← 戻る</button>
              <button
                className="btn btn-save-confirm"
                disabled={!recipeName.trim()}
                onClick={handleSave}
              >保存してホームへ</button>
            </>
          ) : (
            <>
              <button className="btn btn-cancel-sm" onClick={handleBack}>← 機材</button>
              <button className="btn btn-finish" onClick={() => setSaveMode(true)}>レシピを保存</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}