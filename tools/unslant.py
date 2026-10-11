"""Make upright cuts of Tomato Grotesk's Slanted styles by reversing the 11.8° shear."""
import math, statistics, sys
from fontTools.ttLib import TTFont
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.boundsPen import BoundsPen

FONTS = sys.argv[1]; OUT = sys.argv[2]   # e.g. python3 tools/unslant.py assets/fonts/ assets/fonts/

def flat(gset, name):
    p = DecomposingRecordingPen(gset); gset[name].draw(p)
    return [pt for _, args in p.value for pt in args]

# Shear centre, measured on straight-stemmed glyphs: the only style supplied both ways is ExtraBold
up = TTFont(FONTS + 'TomatoGrotesk-ExtraBold.otf').getGlyphSet()
sl = TTFont(FONTS + 'TomatoGrotesk-ExtraBoldSlanted.otf').getGlyphSet()
t = math.tan(math.radians(11.8))
cs = []
for g in 'H I E F L T l i'.split():
    for (xu, y), (xs, _) in zip(flat(up, g), flat(sl, g)):
        if abs(y) > 1: cs.append(y - (xs - xu) / t)
C = statistics.median(cs)
print('shear centre', round(C, 1))

for weight in ['SemiBold', 'ExtraLight', 'Thin']:   # ExtraBold already comes upright
    f = TTFont(FONTS + f'TomatoGrotesk-{weight}Slanted.otf')
    t = math.tan(math.radians(-f['post'].italicAngle))
    gs = f.getGlyphSet()
    cff = f['CFF '].cff; top = cff.topDictIndex[0]; chars = top.CharStrings; priv = top.Private
    hmtx = f['hmtx']
    new = {}
    for name in f.getGlyphOrder():
        pen = T2CharStringPen(None, gs)
        gs[name].draw(TransformPen(pen, (1, 0, -t, 1, t * C, 0)))
        cs_ = pen.getCharString(private=priv, globalSubrs=cff.GlobalSubrs)
        w = hmtx[name][0]
        if w != priv.defaultWidthX: cs_.program.insert(0, w - priv.nominalWidthX)
        new[name] = cs_
    for name, cs_ in new.items(): chars[name] = cs_
    gs = f.getGlyphSet()
    for name in f.getGlyphOrder():
        bp = BoundsPen(gs); gs[name].draw(bp)
        hmtx[name] = (hmtx[name][0], round(bp.bounds[0]) if bp.bounds else 0)
    f['post'].italicAngle = 0
    top.ItalicAngle = 0
    f['hhea'].caretSlopeRise, f['hhea'].caretSlopeRun, f['hhea'].caretOffset = 1, 0, 0
    f['OS/2'].fsSelection &= ~1
    f['head'].macStyle &= ~2
    if 'DSIG' in f: del f['DSIG']   # the signature no longer matches
    style = f'{weight} Upright'
    for rec in f['name'].names:
        s = rec.toUnicode()
        if rec.nameID in (2, 17): rec.string = style
        elif rec.nameID in (3, 4, 6): rec.string = s.replace(f'{weight} Slanted', style).replace(f'{weight}Slanted', f'{weight}Upright')
    out = OUT + f'TomatoGrotesk-{weight}Upright.otf'
    f.save(out); print('wrote', out)
