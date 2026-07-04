import { useState, useMemo } from 'react'
import type { FlavorEntry, FlavorMaster } from '../types'
import { FLAVOR_MASTERS, ALL_MAKERS, getFlavorDisplayInfo } from '../data/flavors'
import { IconDisplay } from '../components/IconDisplay'
import { IconSelect, type SelectOption } from '../components/IconSelect'
import {
  getCustomMakers, addCustomMaker,
  getCustomFlavorMasters, addCustomFlavorMaster,
} from '../utils/userPrefs'
import { StepIndicator } from '../components/StepIndicator'

const STEPS = ['フレーバー選択', '機材', 'パッキング'] as const

// 画面内部で表示に必要な情報を付加した拡張型
type EntryDisplay = FlavorEntry & {
  maker: string
  displayName: string
}

const STEP_DELTAS = [-10, -5, -1, 1, 5, 10] as const

const UNSELECTED_ICON = '○'

function getFlavorIconKey(flavorId: string): string | null {
  if (!flavorId || flavorId === '__custom__') return null
  const master = FLAVOR_MASTERS.find(f => f.id === flavorId)
  return master?.iconKey ?? 'custom'
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

  const flavorOptions = useMemo((): SelectOption[] => [
    { value: '', label: '— フレーバーを選択 —', prefix: '○' },
    ...filteredFlavors.map(f => ({ value: f.id, label: f.displayName, iconKey: f.iconKey })),
    { value: '__custom__', label: 'その他（直接入力）', iconKey: 'default' },
  ], [filteredFlavors])

  const makerOptions = useMemo((): SelectOption[] => [
    { value: '', label: '— メーカーを選択 —', prefix: '○' },
    ...allMakers.map(m => ({ value: m, label: m, prefix: '◆' })),
    { value: '__custom__', label: 'その他（直接入力）', iconKey: 'default' },
  ], [allMakers])

  const canAdd =
    selectedFlavorId !== '' &&
    (selectedFlavorId !== '__custom__' || customFlavorName.trim().length > 0)

  const totalGramsX10 = entries.reduce((sum, e) => sum + e.gramsX10, 0)
  const hasEntries = entries.length > 0

  const handleMakerChange = (value: string) => {
    setSelectedMaker(value)
    if (value === '__custom__') {
      // メーカーがその他の場合、フレーバーも自動でその他に設定
      setSelectedFlavorId('__custom__')
    } else {
      setSelectedFlavorId('')
      setCustomFlavorName('')
    }
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
    <>
      <StepIndicator
        steps={STEPS}
        currentStep={0}
        onStepClick={step => {
          if (step === 1 && hasEntries) onNext(toFlavorEntries())
        }}
      />

      <div className="screen-content">
        {/* メーカー選択 */}
        <section className="section">
          <label className="form-label" htmlFor="maker-select">メーカー</label>
          <IconSelect
              id="maker-select"
              value={selectedMaker}
              options={makerOptions}
              onChange={handleMakerChange}
            />
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
            {selectedMaker !== '__custom__' && (
              <IconSelect
                id="flavor-select"
                value={selectedFlavorId}
                options={flavorOptions}
                onChange={v => { setSelectedFlavorId(v); setCustomFlavorName('') }}
              />
            )}
            <button className="btn btn-add" onClick={handleAdd} disabled={!canAdd}>
              追加
            </button>
          </div>
          {(selectedFlavorId === '__custom__' || selectedMaker === '__custom__') && (
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
                    {(() => {
                      const key = getFlavorIconKey(entry.flavorId)
                      return key
                        ? <IconDisplay iconKey={key} size={22} className="entry-flavor-icon" />
                        : <span className="entry-flavor-icon" aria-hidden="true">{UNSELECTED_ICON}</span>
                    })()}
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
    </>
  )
}
