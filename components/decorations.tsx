import type { ReactNode } from 'react'

export function Star({ size }: { size: number }) {
  return (
    <svg className="star" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path className="stitch" d="M10 10H38V38H10Z M24 4L44 24L24 44L4 24Z M24 14L34 24L24 34L14 24Z M24 19V29M19 24H29" />
    </svg>
  )
}

// Browser window drawn around app screenshots and mockups. The CSS sizes the screen's
// direct img/svg child, so SVG strings from lib/knit-art.ts go in `svg`, not in a wrapper.
type AppFrameProps = { url: string } & ({ children: ReactNode; svg?: never } | { svg: string; children?: never })

export function AppFrame({ url, children, svg }: AppFrameProps) {
  return (
    <div className="app-frame">
      <div className="app-frame__bar" aria-hidden="true">
        <span className="app-frame__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="app-frame__url">{url}</span>
      </div>
      {svg ? (
        <div className="app-frame__screen" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="app-frame__screen">{children}</div>
      )}
    </div>
  )
}

// Other SVG drawings from lib/knit-art.ts, for places where a wrapper doesn't matter to the CSS
export function Svg({ html }: { html: string }) {
  return <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: html }} />
}
