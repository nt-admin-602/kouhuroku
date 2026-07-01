import { useState } from 'react'
import type { EquipmentConfig } from '../types'
import { StepIndicator } from '../components/StepIndicator'
import bowlsData from '../data/bowls.json'
import hmsData from '../data/hms.json'
import charcoalPresetsData from '../data/charcoalPresets.json'
import {
  getCustomBowls, addCustomBowl,
  getCustomHmsList, addCustomHms,
} from '../utils/userPrefs'
import { getIconEmoji } from '../utils/icons'

const STEPS = ['フレーバー選択', '機材', 'パッキング', '保存'] as const

type EquipItem = { name: string; iconKey: string }

const CHARCOAL_TYPES = charcoalPresetsData as {
  value: '26mm_cube' | '22mm_cube' | '22mm_flat' | 'custom'
  label: string
  iconKey: string
}[]

function initSelectState(
  value: string | undefined,
  options: readonly EquipItem[],
): { selected: string; custom: string } {
  if (!value) return { selected: '', custom: '' }
  if (options.some(o => o.name === value)) return { selected: value, custom: '' }
  return { selected: '__custom__', custom: value }
}

function parseSteamTime(s: string): { minutes: number; seconds: number } {
  const minMatch = s.match(/(\d+)分/)
  const secMatch = s.match(/(\d+)秒/)
  return {
    minutes: minMatch ? parseInt(minMatch[1], 10) : 0,
    seconds: secMatch ? parseInt(secMatch[1], 10) : 0,
  }
}

interface Props {
  initialEquipment?: EquipmentConfig
  initialRecipeName?: string
  onBack: () => void
  onSaveAndFinish: (equipment: EquipmentConfig, recipeName: string) => void
}

export function EquipmentSelectScreen({
  initialEquipment,
  initialRecipeName,
  onBack,
  onSaveAndFinish,
}: Props) {
  // ボウル・ HMS: JSONプリセット + ユーザー追加分
  const [allBowls, setAllBowls] = useState<EquipItem[]>(
    () => [
      ...(bowlsData as EquipItem[]),
      ...getCustomBowls().map(name => ({ name, iconKey: 'custom' })),
    ],
  )
  const [allHmsList, setAllHmsList] = useState<EquipItem[]>(
    () => [
      ...(hmsData as EquipItem[]),
      ...getCustomHmsList().map(name => ({ name, iconKey: 'custom' })),
    ],
  )

  const initBowl = initSelectState(initialEquipment?.bowl, allBowls)
  const [selectedBowl, setSelectedBowl] = useState(initBowl.selected)
  const [customBowl, setCustomBowl] = useState(initBowl.custom)

  const initHms = initSelectState(initialEquipment?.hms, allHmsList)
  const [selectedHms, setSelectedHms] = useState(initHms.selected)
  const [customHms, setCustomHms] = useState(initHms.custom)

  const [foilEnabled, setFoilEnabled] = useState(
    initialEquipment?.foil != null ? initialEquipment.foil.enabled : true,
  )
  const [foilThickness, setFoilThickness] = useState(
    initialEquipment?.foil?.thickness ?? 22,
  )
  const [foilLayers, setFoilLayers] = useState(
    initialEquipment?.foil?.layers ?? 1,
  )
  const [foilHoleText, setFoilHoleText] = useState(
    initialEquipment?.foil?.holePattern?.mode === 'text'
      ? (initialEquipment.foil.holePattern.text ?? '')
      : '',
  )

  const [charcoalType, setCharcoalType] = useState<
    '26mm_cube' | '22mm_cube' | '22mm_flat' | 'custom'
  >(initialEquipment?.charcoal?.type ?? '26mm_cube')
  const [charcoalCustomName, setCharcoalCustomName] = useState(
    initialEquipment?.charcoal?.customName ?? '',
  )
  const [charcoalCount, setCharcoalCount] = useState(
    initialEquipment?.charcoal?.count ?? 3,
  )
  const [charcoalNote, setCharcoalNote] = useState(
    initialEquipment?.charcoal?.note ?? '',
  )

  const initSteam = parseSteamTime(initialEquipment?.heatupTime ?? '')
  const [steamMinutes, setSteamMinutes] = useState(
    initialEquipment?.heatupTime ? initSteam.minutes : 5,
  )
  const [steamSeconds, setSteamSeconds] = useState(initSteam.seconds)

  const [saveMode, setSaveMode] = useState(false)
  const [recipeName, setRecipeName] = useState(initialRecipeName ?? '')

  const adjustSteam = (deltaSec: number) => {
    const total = Math.max(0, steamMinutes * 60 + steamSeconds + deltaSec)
    setSteamMinutes(Math.floor(total / 60))
    setSteamSeconds(total % 60)
  }

  const effectiveBowl =
    selectedBowl === '__custom__' ? customBowl.trim() : selectedBowl
  const effectiveHms =
    selectedHms === '__custom__' ? customHms.trim() : selectedHms

  const buildEquipment = (): EquipmentConfig => {
    const eq: EquipmentConfig = {}
    if (effectiveBowl) eq.bowl = effectiveBowl
    if (effectiveHms) eq.hms = effectiveHms
    eq.foil = foilEnabled
      ? {
          enabled: true,
          ...(foilThickness > 0 ? { thickness: foilThickness } : {}),
          ...(foilLayers > 0 ? { layers: foilLayers } : {}),
          ...(foilHoleText.trim()
            ? { holePattern: { mode: 'text' as const, text: foilHoleText.trim() } }
            : {}),
        }
      : { enabled: false }
    eq.charcoal = {
      type: charcoalType,
      count: charcoalCount,
      ...(charcoalType === 'custom' && charcoalCustomName.trim()
        ? { customName: charcoalCustomName.trim() }
        : {}),
      ...(charcoalNote.trim() ? { note: charcoalNote.trim() } : {}),
    }
    if (steamMinutes > 0 || steamSeconds > 0) {
      let t = ''
      if (steamMinutes > 0) t += `${steamMinutes}分`
      if (steamSeconds > 0) t += `${steamSeconds}秒`
      eq.heatupTime = t
    }
    return eq
  }

  const handleSave = () => {
    if (!recipeName.trim()) return
    // カスタム値を永続化
    if (selectedBowl === '__custom__' && customBowl.trim()) {
      const v = customBowl.trim()
      addCustomBowl(v)
      setAllBowls(prev => prev.some(b => b.name === v) ? prev : [...prev, { name: v, iconKey: 'custom' }])
    }
    if (selectedHms === '__custom__' && customHms.trim()) {
      const v = customHms.trim()
      addCustomHms(v)
      setAllHmsList(prev => prev.some(h => h.name === v) ? prev : [...prev, { name: v, iconKey: 'custom' }])
    }
    onSaveAndFinish(buildEquipment(), recipeName.trim())
  }

  return (
    <div className="screen">
      <StepIndicator steps={STEPS} currentStep={1} />

      <div className="screen-content">
        {/* ボウル */}
        <section className="section">
          <label className="form-label" htmlFor="bowl-select">
            ボウル
          </label>
          <div className="select-wrapper">
            <select
              id="bowl-select"
              className="select-in-wrapper"
              value={selectedBowl}
              onChange={e => {
                setSelectedBowl(e.target.value)
                setCustomBowl('')
              }}
            >
              <option value="">— 選択してください —</option>
              {allBowls.map(b => (
                <option key={b.name} value={b.name}>{getIconEmoji(b.iconKey)} {b.name}</option>
              ))}
              <option value="__custom__">✏ その他（直接入力）</option>
            </select>
          </div>
          {selectedBowl === '__custom__' && (
            <input
              className="input input-mt"
              value={customBowl}
              onChange={e => setCustomBowl(e.target.value)}
              placeholder="ボウル名を入力..."
              autoComplete="off"
              autoFocus
            />
          )}
        </section>

        {/* ヒートマネジメント */}
        <section className="section">
          <label className="form-label" htmlFor="hms-select">
            ヒートマネジメント
          </label>
          <div className="select-wrapper">
            <select
              id="hms-select"
              className="select-in-wrapper"
              value={selectedHms}
              onChange={e => {
                setSelectedHms(e.target.value)
                setCustomHms('')
              }}
            >
              <option value="">— 選択してください —</option>
              {allHmsList.map(h => (
                <option key={h.name} value={h.name}>{getIconEmoji(h.iconKey)} {h.name}</option>
              ))}
              <option value="__custom__">✏ その他（直接入力）</option>
            </select>
          </div>
          {selectedHms === '__custom__' && (
            <input
              className="input input-mt"
              value={customHms}
              onChange={e => setCustomHms(e.target.value)}
              placeholder="デバイス名を入力..."
              autoComplete="off"
              autoFocus
            />
          )}
        </section>

        {/* アルミホイル */}
        <section className="section">
          <div className="equip-toggle-row">
            <span className="form-label equip-toggle-label">アルミホイル</span>
            <div className="radio-btn-group" role="group" aria-label="アルミホイルあり/なし">
              <button
                className={`btn radio-btn ${!foilEnabled ? 'radio-btn-active' : ''}`}
                onClick={() => setFoilEnabled(false)}
                type="button"
              >
                なし
              </button>
              <button
                className={`btn radio-btn ${foilEnabled ? 'radio-btn-active' : ''}`}
                onClick={() => setFoilEnabled(true)}
                type="button"
              >
                あり
              </button>
            </div>
          </div>
          {foilEnabled && (
            <div className="equip-foil-details">
              <div className="input-row">
                <div className="equip-field">
                  <span className="form-label">厚さ</span>
                  <div className="equip-stepper-with-unit">
                    <div className="equip-count-ctrl">
                      <button
                        className="btn equip-count-btn equip-count-plus"
                        onClick={() => setFoilThickness(v => v + 1)}
                        type="button"
                        aria-label="厚さを1増やす"
                      >＋</button>
                      <span className="equip-count-val">{foilThickness}</span>
                      <button
                        className="btn equip-count-btn equip-count-minus"
                        onClick={() => setFoilThickness(v => Math.max(0, v - 1))}
                        type="button"
                        aria-label="厚さを1減らす"
                      >−</button>
                    </div>
                    <span className="equip-stepper-unit">μm</span>
                  </div>
                </div>
                <div className="equip-field">
                  <span className="form-label">重ね</span>
                  <div className="equip-stepper-with-unit">
                    <div className="equip-count-ctrl">
                      <button
                        className="btn equip-count-btn equip-count-plus"
                        onClick={() => setFoilLayers(v => v + 1)}
                        type="button"
                        aria-label="重ねを1増やす"
                      >＋</button>
                      <span className="equip-count-val">{foilLayers}</span>
                      <button
                        className="btn equip-count-btn equip-count-minus"
                        onClick={() => setFoilLayers(v => Math.max(1, v - 1))}
                        type="button"
                        aria-label="重ねを1減らす"
                      >−</button>
                    </div>
                    <span className="equip-stepper-unit">重</span>
                  </div>
                </div>
              </div>
              <div className="equip-foil-hole">
                <label className="form-label" htmlFor="foil-hole">
                  穴パターン
                </label>
                <input
                  id="foil-hole"
                  className="input"
                  value={foilHoleText}
                  onChange={e => setFoilHoleText(e.target.value)}
                  placeholder="例: 中央9穴, 外周12穴"
                  autoComplete="off"
                />
              </div>
            </div>
          )}
        </section>

        {/* 炭 */}
        <section className="section">
          <span className="form-label">炭の種類</span>
          <div className="select-wrapper">
            <select
              className="select-in-wrapper"
              value={charcoalType}
              onChange={e =>
                setCharcoalType(
                  e.target.value as '26mm_cube' | '22mm_cube' | '22mm_flat' | 'custom',
                )
              }
            >
              {CHARCOAL_TYPES.map(t => (
                <option key={t.value} value={t.value}>
                  {getIconEmoji(t.iconKey)} {t.label}
                </option>
              ))}
            </select>
          </div>
          {charcoalType === 'custom' && (
            <input
              className="input input-mt"
              value={charcoalCustomName}
              onChange={e => setCharcoalCustomName(e.target.value)}
              placeholder="炭の名前を入力..."
              autoComplete="off"
              autoFocus
            />
          )}

          <div className="equip-count-row">
            <span className="equip-count-label">個数</span>
            <div className="equip-count-ctrl">
              <button
                className="btn equip-count-btn equip-count-plus"
                onClick={() => setCharcoalCount(c => c + 1)}
                type="button"
                aria-label="炭を1個増やす"
              >
                ＋
              </button>
              <span className="equip-count-val">{charcoalCount}</span>
              <button
                className="btn equip-count-btn equip-count-minus"
                onClick={() => setCharcoalCount(c => Math.max(1, c - 1))}
                type="button"
                aria-label="炭を1個減らす"
              >
                −
              </button>
            </div>
          </div>

          <input
            className="input input-mt"
            value={charcoalNote}
            onChange={e => setCharcoalNote(e.target.value)}
            placeholder="備考 (例: 3+1配置, 端に寄せる)"
            autoComplete="off"
          />
        </section>

        {/* 蒸らし時間 */}
        <section className="section">
          <span className="form-label">蒸らし時間</span>
          <div className="input-row">
            <div className="equip-field">
              <span className="form-label">分</span>
              <div className="equip-stepper-with-unit">
                <div className="equip-count-ctrl">
                  <button
                    className="btn equip-count-btn equip-count-plus"
                    onClick={() => adjustSteam(+60)}
                    type="button"
                    aria-label="1分増やす"
                  >＋</button>
                  <span className="equip-count-val">{steamMinutes}</span>
                  <button
                    className="btn equip-count-btn equip-count-minus"
                    onClick={() => adjustSteam(-60)}
                    type="button"
                    aria-label="1分減らす"
                  >−</button>
                </div>
                <span className="equip-stepper-unit">分</span>
              </div>
            </div>
            <div className="equip-field">
              <span className="form-label">秒</span>
              <div className="equip-stepper-with-unit">
                <div className="equip-count-ctrl">
                  <button
                    className="btn equip-count-btn equip-count-plus"
                    onClick={() => adjustSteam(+5)}
                    type="button"
                    aria-label="5秒増やす"
                  >+5</button>
                  <button
                    className="btn equip-count-btn equip-count-plus"
                    onClick={() => adjustSteam(+1)}
                    type="button"
                    aria-label="1秒増やす"
                  >+1</button>
                  <span className="equip-count-val">{steamSeconds}</span>
                  <button
                    className="btn equip-count-btn equip-count-minus"
                    onClick={() => adjustSteam(-1)}
                    type="button"
                    aria-label="1秒減らす"
                  >−1</button>
                  <button
                    className="btn equip-count-btn equip-count-minus"
                    onClick={() => adjustSteam(-5)}
                    type="button"
                    aria-label="5秒減らす"
                  >−5</button>
                </div>
                <span className="equip-stepper-unit">秒</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 固定フッターエリア */}
      <div className="bottom-area">
        {saveMode && (
          <div className="save-panel">
            <label className="form-label" htmlFor="eq-recipe-name">
              レシピ名
            </label>
            <input
              id="eq-recipe-name"
              className="input"
              value={recipeName}
              onChange={e => setRecipeName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="例: 耽溺 試作2"
              autoFocus
            />
          </div>
        )}
        <div className="bottom-bar">
          {saveMode ? (
            <>
              <button
                className="btn btn-cancel-sm"
                onClick={() => setSaveMode(false)}
              >
                ← 戻る
              </button>
              <button
                className="btn btn-save-confirm"
                disabled={!recipeName.trim()}
                onClick={handleSave}
              >
                保存してホームへ
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-cancel-sm"
                onClick={onBack}
              >
                ← フレーバー
              </button>
              <button
                className="btn btn-finish"
                onClick={() => setSaveMode(true)}
              >
                レシピを保存
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
