import type { CSSProperties } from 'react'
import { borderMask } from '@/lib/embroidery/border'
import { pageBorderMotif } from '@/lib/embroidery/templates'

// The page border down both edges of the window: the template chosen in the admin,
// mirrored on the right. Styled in src/styles/base.css; nothing if none is chosen.
export async function PageBorder() {
  const motif = await pageBorderMotif()
  if (!motif) return null
  const style = { '--border': borderMask(motif) } as CSSProperties
  return (
    <>
      <div className="page-border page-border--left" style={style} aria-hidden="true" />
      <div className="page-border page-border--right" style={style} aria-hidden="true" />
    </>
  )
}
