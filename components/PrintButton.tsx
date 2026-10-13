'use client'

import { useEffect, useState } from 'react'

// Hidden in the server HTML, shown once JavaScript can use it
export function PrintButton({ label }: { label: string }) {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  return (
    <button type="button" className="button" hidden={!ready} onClick={() => window.print()}>
      {label}
    </button>
  )
}
