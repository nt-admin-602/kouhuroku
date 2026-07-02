import { useState, useRef, useEffect, useCallback } from 'react'
import { IconDisplay } from './IconDisplay'

export interface SelectOption {
  value: string
  label: string
  /** 設定時は IconDisplay (PNG or emoji) を使う */
  iconKey?: string | null
  /** iconKey 未設定時のテキストプレフィックス */
  prefix?: string
}

interface Props {
  id?: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}

export function IconSelect({ id, value, options, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value) ?? null
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, close])

  return (
    <div ref={ref} className="icon-select">
      <button
        type="button"
        id={id}
        className="icon-select-trigger"
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => e.key === 'Escape' && close()}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected
          ? <OptionContent opt={selected} />
          : <span className="icon-select-placeholder">— 選択してください —</span>
        }
      </button>

      {open && (
        <ul className="icon-select-list" role="listbox">
          {options.map(opt => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`icon-select-item${opt.value === value ? ' icon-select-item--selected' : ''}`}
              onMouseDown={e => {
                e.preventDefault()
                onChange(opt.value)
                close()
              }}
            >
              <OptionContent opt={opt} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function OptionContent({ opt }: { opt: SelectOption }) {
  return (
    <span className="icon-select-option-inner">
      {opt.iconKey != null
        ? <IconDisplay iconKey={opt.iconKey} size={14} />
        : opt.prefix != null
        ? <span className="icon-select-prefix">{opt.prefix}</span>
        : null
      }
      <span className="icon-select-label">{opt.label}</span>
    </span>
  )
}
