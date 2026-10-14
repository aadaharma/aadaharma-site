'use client'

import { useEffect, useRef } from 'react'
import { motifFromJson, type MotifJson } from '@/lib/embroidery/motif'
import { drawPreview } from './draw'

// A template's small picture in its own colours, for the admin's list
export function TemplateThumb({ motif }: { motif: MotifJson }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const m = motifFromJson(motif)
    if (canvas.current && m) drawPreview(canvas.current, m)
  }, [motif])
  return <canvas ref={canvas} className="template-thumb" aria-hidden="true" />
}
