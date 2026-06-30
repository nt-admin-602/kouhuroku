// CSV → src/data/flavors.ts 生成スクリプト
// 実行: node scripts/gen-flavors.mjs

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, '../src/data/shisha_flavors_expanded.csv');
const outPath = join(__dirname, '../src/data/flavors.ts');

const csv = readFileSync(csvPath, 'utf-8');
const lines = csv.trim().split(/\r?\n/).slice(1); // ヘッダースキップ

function getIconKey(name, tag) {
  const n = name.toLowerCase();
  if (n.includes('grapefruit'))                                         return 'grapefruit';
  if (n.includes('watermelon'))                                         return 'watermelon';
  if (n.includes('grape'))                                              return 'grape';
  if (n.includes('apple'))                                              return 'apple';
  if (['strawberry','raspberry','blueberry','blackberry','cherry','berry','huckleberry']
        .some(k => n.includes(k)))                                      return 'berry';
  if (n.includes('mint') || n.includes('menthol'))                      return 'mint';
  if (n.includes('lemon') || n.includes('lime') || n.includes('citrus')) return 'lemon';
  if (n.includes('peach') || n.includes('apricot') || n.includes('nectarine')) return 'peach';
  if (n.includes('mango') || n.includes('passion') || n.includes('banana')
      || n.includes('pineapple') || n.includes('guava') || n.includes('kiwi')
      || n.includes('papaya') || n.includes('plum') || n.includes('fig')
      || n.includes('melon') || n.includes('coconut') || n.includes('lychee')
      || n.includes('pear') || n.includes('pomegranate') || n.includes('raspberry')) return 'peach';
  if (n.includes('cola'))                                               return 'cola';
  if (n.includes('coffee') || n.includes('cappuccino') || n.includes('chai')
      || n.includes('tea') || n.includes('latte') || n.includes('mocha')
      || n.includes('sahlep') || n.includes('tiramisu'))               return 'royaltea';
  if (n.includes('caramel'))                                            return 'caramel';
  if (n.includes('butter'))                                             return 'butter';
  if (n.includes('cinnamon'))                                           return 'cinnamon';
  if (n.includes('vanilla'))                                            return 'vanilla';
  if (n.includes('gum'))                                                return 'vanilla';
  if (tag === 'ドリンク')                                               return 'royaltea';
  if (tag === 'スパイス')                                               return 'cinnamon';
  return 'default';
}

const seen = new Set();
const flavors = [];

lines.forEach((line) => {
  if (!line.trim()) return;
  // カンマ分割（フィールドにカンマが入らない前提）
  const idx1 = line.indexOf(',');
  const idx2 = line.indexOf(',', idx1 + 1);
  if (idx1 < 0 || idx2 < 0) return;

  const maker = line.slice(0, idx1).trim();
  const name  = line.slice(idx1 + 1, idx2).trim();
  const tag   = line.slice(idx2 + 1).trim();

  // id: maker + name を安全な ASCII に変換
  const safeId = `${maker}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // 重複スキップ
  if (seen.has(safeId)) return;
  seen.add(safeId);

  flavors.push({ id: safeId, displayName: name, maker, iconKey: getIconKey(name, tag) });
});

// 出現順でユニークメーカー一覧
const allMakers = [...new Set(flavors.map(f => f.maker))];

let ts = `// このファイルは scripts/gen-flavors.mjs で自動生成されます
import type { FlavorMaster } from '../types';

export const FLAVOR_MASTERS: FlavorMaster[] = [\n`;

for (const f of flavors) {
  ts += `  { id: ${JSON.stringify(f.id)}, displayName: ${JSON.stringify(f.displayName)}, maker: ${JSON.stringify(f.maker)}, iconKey: ${JSON.stringify(f.iconKey)} },\n`;
}

ts += `];\n\n/** CSV に含まれるすべてのメーカー（出現順） */\nexport const ALL_MAKERS: string[] = ${JSON.stringify(allMakers, null, 2)};\n`;

writeFileSync(outPath, ts, 'utf-8');
console.log(`✓ ${flavors.length} フレーバー、${allMakers.length} メーカーを生成しました`);
console.log('メーカー一覧:', allMakers.join(', '));
