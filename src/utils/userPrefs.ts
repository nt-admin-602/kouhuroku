import type { FlavorMaster } from '../types'

const KEYS = {
  makers:  'kouhuroku_custom_makers',
  flavors: 'kouhuroku_custom_flavors',
  bowls:   'kouhuroku_custom_bowls',
  hms:     'kouhuroku_custom_hms',
} as const

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function save<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items))
}

// ── Makers ──────────────────────────────────────────────
export function getCustomMakers(): string[] {
  return load<string>(KEYS.makers)
}

export function addCustomMaker(name: string): void {
  const existing = getCustomMakers()
  if (name && !existing.includes(name)) {
    save(KEYS.makers, [...existing, name])
  }
}

// ── Flavors ──────────────────────────────────────────────
export function getCustomFlavorMasters(): FlavorMaster[] {
  return load<FlavorMaster>(KEYS.flavors)
}

export function addCustomFlavorMaster(master: FlavorMaster): void {
  const existing = getCustomFlavorMasters()
  if (!existing.find(f => f.id === master.id)) {
    save(KEYS.flavors, [...existing, master])
  }
}

// ── Bowls ────────────────────────────────────────────────
export function getCustomBowls(): string[] {
  return load<string>(KEYS.bowls)
}

export function addCustomBowl(name: string): void {
  const existing = getCustomBowls()
  if (name && !existing.includes(name)) {
    save(KEYS.bowls, [...existing, name])
  }
}

// ── HMS ──────────────────────────────────────────────────
export function getCustomHmsList(): string[] {
  return load<string>(KEYS.hms)
}

export function addCustomHms(name: string): void {
  const existing = getCustomHmsList()
  if (name && !existing.includes(name)) {
    save(KEYS.hms, [...existing, name])
  }
}
