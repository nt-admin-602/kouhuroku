import { readFileSync, writeFileSync } from 'fs'

const raw = readFileSync('src/data/flavorMasters.json', 'utf8').replace(/^\uFEFF/, '')
const data = JSON.parse(raw)

// 重複除去 (id で判定)
const seen = new Set()
const deduped = data.filter(o => {
  if (seen.has(o.id)) return false
  seen.add(o.id)
  return true
})
const removed = data.length - deduped.length

// maker → displayName でソート
deduped.sort((a, b) => {
  const mc = a.maker.localeCompare(b.maker)
  return mc !== 0 ? mc : a.displayName.localeCompare(b.displayName)
})

// メーカーごとに空行を挟んで1フレーバー1行
const lines = []
let currentMaker = null
for (let i = 0; i < deduped.length; i++) {
  const o = deduped[i]
  const isLast = i === deduped.length - 1
  if (currentMaker !== null && o.maker !== currentMaker) lines.push('')
  lines.push('  ' + JSON.stringify(o) + (isLast ? '' : ','))
  currentMaker = o.maker
}

writeFileSync('src/data/flavorMasters.json', '[\n' + lines.join('\n') + '\n]\n', 'utf8')
console.log(`done: ${deduped.length} items (removed ${removed} duplicates)`)
