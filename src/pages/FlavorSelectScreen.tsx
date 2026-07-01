import { useState, useMemo } from 'react'
import type { FlavorEntry, FlavorMaster } from '../types'
import { FLAVOR_MASTERS, ALL_MAKERS, getFlavorDisplayInfo } from '../data/flavors'
import { getIconEmoji } from '../utils/icons'
import {
  getCustomMakers, addCustomMaker,
  getCustomFlavorMasters, addCustomFlavorMaster,
} from '../utils/userPrefs'
import { StepIndicator } from '../components/StepIndicator'

const STEPS = ['フレーバー選択', '機材', 'パッキング', '保存'] as const

// 画面内部で表示に必要な情報を付加した拡張型
type EntryDisplay = FlavorEntry & {
  maker: string
  displayName: string
}

const STEP_DELTAS = [-10, -5, -1, 1, 5, 10] as const

const UNSELECTED_ICON = '○'

function iconFromKey(key: string): string {
  return getIconEmoji(key)
}

function getFlavorIcon(flavorId: string): string {
  if (!flavorId || flavorId === '__custom__') return UNSELECTED_ICON
  const master = FLAVOR_MASTERS.find(f => f.id === flavorId)
  if (!master) return getIconEmoji('custom')
  return getIconEmoji(master.iconKey)
}

interface Props {
  onNext: (entries: FlavorEntry[]) => void
  onSaveAndFinish: (entries: FlavorEntry[], recipeName: string) => void
  /** 編集時の初期エントリー */
  initialEntries?: FlavorEntry[]
  /** 編集時の初期レシピ名 */
  initialRecipeName?: string
}

function toEntryDisplay(entry: FlavorEntry): EntryDisplay {
  const { displayName, maker } = getFlavorDisplayInfo(entry.flavorId)
  return { ...entry, displayName, maker }
}

export function FlavorSelectScreen({
  onNext,
  onSaveAndFinish,
  initialEntries,
  initialRecipeName,
}: Props) {
  // メーカー選択: '' | メーカー名 | '__custom__'
  const [selectedMaker, setSelectedMaker] = useState('')
  const [customMaker, setCustomMaker] = useState('')
  // フレーバー選択: '' | master.id | '__custom__'
  const [selectedFlavorId, setSelectedFlavorId] = useState('')
  const [customFlavorName, setCustomFlavorName] = useState('')

  const [entries, setEntries] = useState<EntryDisplay[]>(
    () => (initialEntries ?? []).map(toEntryDisplay),
  )

  // ユーザー追加済みのカスタムデータ
  const [extraMakers, setExtraMakers] = useState<string[]>(
    () => getCustomMakers(),
  )
  const [extraFlavorMasters, setExtraFlavorMasters] = useState<FlavorMaster[]>(
    () => getCustomFlavorMasters(),
  )

  // 保存モード
  const [saveMode, setSaveMode] = useState(false)
  const [recipeName, setRecipeName] = useState(initialRecipeName ?? '')

  const effectiveMaker =
    selectedMaker === '__custom__' ? customMaker.trim() : selectedMaker

  // プリセット + ユーザー追加分を合成
  const allFlavorMasters = useMemo(
    () => [...FLAVOR_MASTERS, ...extraFlavorMasters],
    [extraFlavorMasters],
  )
  const allMakers = useMemo(
    () => [
      ...ALL_MAKERS,
      ...extraFlavorMasters.map(f => f.maker).filter(Boolean),
      ...extraMakers,
    ].filter((m, i, arr) => arr.indexOf(m) === i),
    [extraMakers, extraFlavorMasters],
  )

  const filteredFlavors = useMemo(() => {
    if (!selectedMaker || selectedMaker === '__custom__') return allFlavorMasters
    return allFlavorMasters.filter(f => f.maker === selectedMaker)
  }, [selectedMaker, allFlavorMasters])

  const canAdd =
    selectedFlavorId !== '' &&
    (selectedFlavorId !== '__custom__' || customFlavorName.trim().length > 0)

  const totalGramsX10 = entries.reduce((sum, e) => sum + e.gramsX10, 0)
  const hasEntries = entries.length > 0

  const handleMakerChange = (value: string) => {
    setSelectedMaker(value)
    setSelectedFlavorId('')
    setCustomFlavorName('')
  }

  const handleAdd = () => {
    if (!canAdd) return

    let flavorId: string
    let displayName: string
    let maker: string

    if (selectedFlavorId === '__custom__') {
      const name = customFlavorName.trim()
      const mak = effectiveMaker
      flavorId = `custom-${(mak + '-' + name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}`
      displayName = name
      maker = mak
      // カスタムフレーバーを永続化
      const newMaster: FlavorMaster = { id: flavorId, maker: mak, displayName: name, iconKey: 'default' }
      if (!extraFlavorMasters.find(f => f.id === flavorId)) {
        addCustomFlavorMaster(newMaster)
        setExtraFlavorMasters(prev => [...prev, newMaster])
      }
      // カスタムメーカーを永続化
      if (selectedMaker === '__custom__' && mak && !extraMakers.includes(mak) && !ALL_MAKERS.includes(mak)) {
        addCustomMaker(mak)
        setExtraMakers(prev => [...prev, mak])
      }
    } else {
      const master = allFlavorMasters.find(f => f.id === selectedFlavorId)!
      flavorId = master.id
      displayName = master.displayName
      maker = master.maker
    }

    setEntries(prev => {
      const existing = prev.find(e => e.flavorId === flavorId)
      if (existing) {
        // 同一フレーバーは加算
        return prev.map(e =>
          e.flavorId === flavorId ? { ...e, gramsX10: e.gramsX10 + 10 } : e,
        )
      }
      return [
        ...prev,
        { id: crypto.randomUUID(), flavorId, gramsX10: 10, maker, displayName },
      ]
    })
    setSelectedFlavorId('')
    setCustomFlavorName('')
  }

  const handleAdjust = (entryId: string, delta: number) => {
    setEntries(prev =>
      prev.map(e =>
        e.id === entryId
          ? { ...e, gramsX10: Math.max(0, e.gramsX10 + delta) }
          : e,
      )
    )
  }

  const handleRemove = (entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId))
  }

  const toFlavorEntries = (): FlavorEntry[] =>
    entries.map(({ id, flavorId, gramsX10 }) => ({ id, flavorId, gramsX10 }))

  const handleSaveAndFinish = () => {
    if (!recipeName.trim()) return
    onSaveAndFinish(toFlavorEntries(), recipeName.trim())
  }

  return (
    <div className="screen">
      <StepIndicator steps={STEPS} currentStep={0} />

      <div className="screen-content">
        {/* メーカー選択 */}
        <section className="section">
          <label className="form-label" htmlFor="maker-select">メーカー</label>
          <div className="select-wrapper">
            <select
              id="maker-select"
              className="select-in-wrapper"
              value={selectedMaker}
              onChange={e => handleMakerChange(e.target.value)}
            >
              <option value="">○ — メーカーを選択 —</option>
              {allMakers.map(m => (
                <option key={m} value={m}>◆ {m}</option>
              ))}
              <option value="__custom__">✏ その他（直接入力）</option>
            </select>
          </div>
          {selectedMaker === '__custom__' && (
            <input
              className="input input-mt"
              value={customMaker}
              onChange={e => setCustomMaker(e.target.value)}
              placeholder="メーカー名を入力..."
              autoComplete="off"
              autoFocus
            />
          )}
        </section>

        {/* フレーバー選択 */}
        <section className="section">
          <label className="form-label" htmlFor="flavor-select">フレーバー</label>
          <div className="input-row">
            <div className="select-wrapper">
              <select
                id="flavor-select"
                className="select-in-wrapper"
                value={selectedFlavorId}
                onChange={e => {
                  setSelectedFlavorId(e.target.value)
                  setCustomFlavorName('')
                }}
              >
                <option value="">○ — フレーバーを選択 —</option>
                {filteredFlavors.map(f => (
                  <option key={f.id} value={f.id}>{iconFromKey(f.iconKey)} {f.displayName}</option>
                ))}
                <option value="__custom__">✏ その他（直接入力）</option>
              </select>
            </div>
            <button className="btn btn-add" onClick={handleAdd} disabled={!canAdd}>
              追加
            </button>
          </div>
          {selectedFlavorId === '__custom__' && (
            <input
              className="input input-mt"
              value={customFlavorName}
              onChange={e => setCustomFlavorName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canAdd && handleAdd()}
              placeholder="フレーバー名を入力..."
              autoComplete="off"
              autoFocus
            />
          )}
        </section>

        {/* 選択中フレーバー一覧 */}
        {hasEntries ? (
          <section className="section">
            {/* 合計（リストの上部） */}
            <div className="total-bar">
              <span className="total-label">合計</span>
              <span className="total-value">{(totalGramsX10 / 10).toFixed(1)}g</span>
            </div>
            <ul className="entry-list">
              {entries.map(entry => (
                <li key={entry.id} className="entry-card">
                  {/* 行1: 削除ボタン ／ アイコン ／ 名前 ／ グラム数 */}
                  <div className="entry-row1">
                    <button
                      className="btn-delete"
                      onClick={() => handleRemove(entry.id)}
                      aria-label="削除"
                    >
                      ✕
                    </button>
                    <span className="entry-flavor-icon" aria-hidden="true">
                      {getFlavorIcon(entry.flavorId)}
                    </span>
                    <div className="entry-info">
                      {entry.maker && (
                        <span className="entry-maker">{entry.maker}</span>
                      )}
                      <span className="entry-name">{entry.displayName}</span>
                    </div>
                    <span className="entry-grams">
                      {(entry.gramsX10 / 10).toFixed(1)}g
                    </span>
                  </div>
                  {/* 行2: 増減ボタン（グラム数と同ライン扱い） */}
                  <div className="stepper-row">
                    {STEP_DELTAS.map(delta => (
                      <button
                        key={delta}
                        className={`btn btn-step ${delta < 0 ? 'btn-step-minus' : 'btn-step-plus'}`}
                        onClick={() => handleAdjust(entry.id, delta)}
                        aria-label={`${delta > 0 ? '+' : ''}${(delta / 10).toFixed(1)}g`}
                      >
                        {delta > 0 ? '+' : ''}{(delta / 10).toFixed(1)}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>

          </section>
        ) : (
          <p className="empty-hint">フレーバーを追加してください</p>
        )}
      </div>

      {/* 固定フッターエリア */}
      <div className="bottom-area">
        {/* レシピ名入力（記録終了モード時） */}
        {saveMode && (
          <div className="save-panel">
            <label className="form-label" htmlFor="recipe-name-input">レシピ名</label>
            <input
              id="recipe-name-input"
              className="input"
              value={recipeName}
              onChange={e => setRecipeName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveAndFinish()}
              placeholder="ミックスに名前をつけてください"
              autoFocus
            />
          </div>
        )}

        <div className="bottom-bar">
          {saveMode ? (
            <>
              <button
                className="btn btn-cancel-sm"
                onClick={() => { setSaveMode(false); setRecipeName('') }}
              >
                ← 戻る
              </button>
              <button
                className="btn btn-save-confirm"
                disabled={!recipeName.trim()}
                onClick={handleSaveAndFinish}
              >
                保存してホームへ
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-finish"
                disabled={!hasEntries}
                onClick={() => setSaveMode(true)}
              >
                レシピを保存
              </button>
              <button
                className="btn btn-next"
                disabled={!hasEntries}
                onClick={() => onNext(toFlavorEntries())}
              >
                機材を選択
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
