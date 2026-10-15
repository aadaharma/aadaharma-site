// Used by the dotted page border (components/PageDecoration.tsx). Browser only.

// A palette colour as [r, g, b]. color-mix() colours come back as color(srgb 0–1 values).
export function rgb(name: string): number[] {
  const probe = document.createElement('i')
  probe.style.color = `var(${name})`
  document.body.append(probe)
  const c = getComputedStyle(probe).color
  probe.remove()
  const m = (c.match(/[\d.]+/g) ?? ['0', '0', '0']).map(Number)
  return (c.startsWith('color(') ? m.map((v) => Math.round(v * 255)) : m).slice(0, 3)
}

// Calls `draw` again when the theme changes (the header toggle or the system); returns a cleanup
export function onThemeChange(draw: () => void) {
  const themes = new MutationObserver(draw)
  themes.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  const scheme = matchMedia('(prefers-color-scheme: dark)')
  scheme.addEventListener('change', draw)
  return () => {
    themes.disconnect()
    scheme.removeEventListener('change', draw)
  }
}
