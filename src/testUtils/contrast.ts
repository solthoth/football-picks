export interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

/** Parses #rgb, #rrggbb, rgb()/rgba() in comma or space-slash syntax. Throws on anything else (e.g. "inherit"). */
export function parseColor(input: string): Rgba {
  const value = input.trim().toLowerCase()

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(value)
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1]
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16))
    return { r, g, b, a: 1 }
  }

  const fn = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(value)
  if (fn) {
    const alpha = fn[4] === undefined ? 1 : fn[4].endsWith('%') ? parseFloat(fn[4]) / 100 : parseFloat(fn[4])
    return { r: Number(fn[1]), g: Number(fn[2]), b: Number(fn[3]), a: alpha }
  }

  throw new Error(`Can't parse colour "${input}"`)
}

/** Composites `top` over `bottom` (standard "over" operator). */
export function compositeOver(top: Rgba, bottom: Rgba): Rgba {
  const a = top.a + bottom.a * (1 - top.a)
  const mix = (t: number, b: number) => (t * top.a + b * bottom.a * (1 - top.a)) / a
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a }
}

function relativeLuminance({ r, g, b }: Rgba): number {
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG 2.x contrast ratio. A translucent `fg` is composited over `bg`; `bg` should be opaque. */
export function contrastRatio(fg: string | Rgba, bg: string | Rgba): number {
  const back = typeof bg === 'string' ? parseColor(bg) : bg
  const parsedFg = typeof fg === 'string' ? parseColor(fg) : fg
  const front = parsedFg.a < 1 ? compositeOver(parsedFg, back) : parsedFg
  const [lighter, darker] = [relativeLuminance(front), relativeLuminance(back)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Resolves an element's visible background by compositing its ancestors' translucent backgrounds down to `surface`. */
export function effectiveBackground(element: Element, surface: string): Rgba {
  const layers: Rgba[] = []
  for (let el: Element | null = element; el; el = el.parentElement) {
    const bg = getComputedStyle(el).backgroundColor
    if (!bg || bg === 'transparent') continue
    const parsed = parseColor(bg)
    if (parsed.a === 0) continue
    layers.push(parsed)
    if (parsed.a === 1) break
  }
  return layers.reduceRight((below, layer) => compositeOver(layer, below), parseColor(surface))
}

/** Contrast of an element's own text colour against its effective background. */
export function textContrast(element: Element, surface = '#ffffff'): number {
  return contrastRatio(getComputedStyle(element).color, effectiveBackground(element, surface))
}

/** Rendered font size in px, for the px/rem values jsdom echoes back from emotion's CSS. */
export function fontSizePx(element: Element): number {
  const size = getComputedStyle(element).fontSize
  if (size.endsWith('rem')) return parseFloat(size) * 16
  return parseFloat(size)
}
