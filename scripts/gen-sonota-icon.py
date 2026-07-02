"""
その他アイコン (default.png) を public/icons/ に生成するスクリプト。
8x8 ピクセルアートを 4px スケール = 32x32 PNG として出力。
"""
import os
from PIL import Image

# 8x8 pixel art: "?" マーク
# Q=メイン色, q=シャドウ色, .=透明
pixels = [
    '..QQQ...',
    '.Q...Q..',
    '.....Q..',
    '....QQ..',
    '...Q....',
    '........',
    '...Q....',
    '........',
]

palette = {
    'Q': (157, 113, 234, 255),   # #9D71EA (アプリテーマのパープル)
    'q': (122,  82, 201, 255),   # #7A52C9 (シャドウ)
}

SCALE = 4  # 8px -> 32px

img = Image.new('RGBA', (8 * SCALE, 8 * SCALE), (0, 0, 0, 0))

for y, row in enumerate(pixels):
    for x, ch in enumerate(row):
        if ch == '.':
            continue
        color = palette.get(ch)
        if not color:
            continue
        for dy in range(SCALE):
            for dx in range(SCALE):
                img.putpixel((x * SCALE + dx, y * SCALE + dy), color)

out_dir = r'c:\Users\takas\source\kouhuroku\public\icons'
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, 'default.png')
img.save(out_path)
print(f'wrote {out_path}')
