import os

arts = {
  'butter':     {'pixels':['........','.YYYYYY.','.YyyYYY.','.WWWWWW.','.YYYYYY.','.YyyYYY.','........','........'],'palette':{'Y':'#E8C94C','y':'#C9A830','W':'#FFFDE7'}},
  'cinnamon':   {'pixels':['.B..B...','.B..B...','.B..B...','.BB.B...','.B..BB..','.B..B...','.B..B...','........'],'palette':{'B':'#8B5E3C'}},
  'caramel':    {'pixels':['........','.CCCCCC.','.CwwwCC.','.CwCCCC.','.CCCCCC.','.cccccc.','........','........'],'palette':{'C':'#C67C3B','w':'#E8A850','c':'#A05A1C'}},
  'vanilla':    {'pixels':['...V....','.V.V.V..','..VVV...','VVVVVVVV','..VVV...','.V.V.V..','...V....','........'],'palette':{'V':'#F8E590'}},
  'royaltea':   {'pixels':['.TTTTTT.','TRRRRRRT','TRllllRT','TRRRRRRT','TRRRRRRT','TRRRRRrT','.TTTTTT.','........'],'palette':{'T':'#6D4C41','R':'#A1887F','l':'#D7CCC8','r':'#5D4037'}},
  'grapefruit': {'pixels':['..GGG...','.GGGGG..','GGGSGGGG','GGSGSGGG','GGGSGGGG','.GGGGG..','..GGG...','........'],'palette':{'G':'#FF7043','S':'#E64A19'}},
  'berry':      {'pixels':['.B.B....','BBBBB...','BBBBB...','.BBB....','..B.....','..B.....','........','........'],'palette':{'B':'#C62828'}},
  'mint':       {'pixels':['........','.M..M...','MMM.MM..','MMMMM...','.MMMM...','..MMM...','...MM...','....M...'],'palette':{'M':'#43A047'}},
  'lemon':      {'pixels':['..LLL...','.LLLLL..','LLLlLLLL','LLlLlLLL','LLLlLLLL','.LLLLL..','..LLL...','........'],'palette':{'L':'#F9E44F','l':'#F0C419'}},
  'peach':      {'pixels':['..PPP...','.PPPPP..','PPPpPPP.','PPpPPPPP','PPPpPPPP','.PPPPPP.','..PPPP..','...PP...'],'palette':{'P':'#FFAB91','p':'#E57373'}},
  'watermelon': {'pixels':['.GGGGGG.','GWWWWWWG','GWsWsWsG','GWWWWWWG','GWsWsWsG','GWWWWWWG','.GGGGGG.','........'],'palette':{'G':'#388E3C','W':'#FF5252','s':'#1B5E20'}},
  'cola':       {'pixels':['..DDD...','.DDDDD..','.DbbbD..','.DDDDD..','.DDDDD..','.DdddD..','..DDD...','........'],'palette':{'D':'#795548','b':'#A1887F','d':'#4E342E'}},
  'grape':      {'pixels':['.PP.PP..','PPPPPPP.','.PPPPP..','.PPPPP..','..PPP...','..vvv...','...v....','........'],'palette':{'P':'#9C27B0','v':'#6D4C41'}},
  'apple':      {'pixels':['...s....','..RRR...','.RRRRR..','RRRRRRR.','RRRRRRR.','.RRRRR..','..RRR...','........'],'palette':{'R':'#E53935','s':'#43A047'}},
  'spicedchai': {'pixels':['........','.CCCCC..','.CttCC..','.CtCCC..','.CCCCC..','.ccccc..','........','........'],'palette':{'C':'#8D6E63','t':'#FF8F00','c':'#5D4037'}},
  'ambrosia':   {'pixels':['...A....','.A.A.A..','..AAA...','AAAAAAAA','..AAA...','.A.A.A..','...A....','........'],'palette':{'A':'#F48FB1'}},
  'default':    {'pixels':['........','.PPPPPP.','.PPPPPP.','.PPPPPP.','.PPPPPP.','.PPPPPP.','........','........'],'palette':{'P':'#9D71EA'}},
}

out = r'c:\Users\takas\source\kouhuroku\src\assets\icons'
os.makedirs(out, exist_ok=True)

px = 4  # 8x8 grid -> 32x32 SVG

for key, art in arts.items():
    rects = []
    for y, row in enumerate(art['pixels']):
        for x, ch in enumerate(row):
            if ch == '.':
                continue
            color = art['palette'].get(ch)
            if not color:
                continue
            rects.append(f'<rect x="{x*px}" y="{y*px}" width="{px}" height="{px}" fill="{color}"/>')
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" '
        'shape-rendering="crispEdges">\n'
        + '\n'.join(rects)
        + '\n</svg>'
    )
    path = os.path.join(out, f'{key}.svg')
    open(path, 'w', encoding='utf-8').write(svg)
    print(f'wrote {key}.svg')

print('done')
