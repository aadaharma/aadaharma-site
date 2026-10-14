'use client'

import { upload } from '@vercel/blob/client'
import { useRef, useState } from 'react'
import { MAX_UPLOAD_MB, UPLOAD_TYPES } from '@/lib/admin/uploads'

type Kind = keyof typeof UPLOAD_TYPES

// Uploads one file to Vercel Blob (through app/api/admin/upload) and returns its address
async function uploadFile(kind: Kind, file: File, slug: string, onProgress: (percent: number) => void) {
  if (!UPLOAD_TYPES[kind].includes(file.type)) {
    throw new Error(kind === 'pdf' ? 'Choose a PDF file.' : 'Choose a JPEG, PNG, WebP or AVIF photo.')
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`The file is over ${MAX_UPLOAD_MB} MB.`)
  const name = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')
  const blob = await upload(`patterns/${slug}/${name}`, file, {
    access: 'public',
    handleUploadUrl: '/api/admin/upload/',
    onUploadProgress: ({ percentage }) => onProgress(Math.round(percentage)),
  })
  return blob.url
}

function useUpload(kind: Kind, slug: () => string, onUploaded: (url: string) => void) {
  const input = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')

  const picker = (
    <input
      ref={input}
      type="file"
      accept={UPLOAD_TYPES[kind].join(',')}
      hidden
      onChange={async (e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        setError('')
        setProgress(0)
        try {
          onUploaded(await uploadFile(kind, file, slug(), setProgress))
          // Lets the form know something changed (see the unsaved-changes warning)
          input.current?.dispatchEvent(new Event('input', { bubbles: true }))
        } catch (err) {
          setError((err as Error).message || 'The upload failed.')
        } finally {
          setProgress(null)
        }
      }}
    />
  )
  return { picker, choose: () => input.current?.click(), progress, error }
}

type Props = { kind: Kind; name: string; label: string; initial: string; slug: () => string; error?: string }

// A photo or PDF field: the uploaded file's address goes in a hidden input
export function FileUpload({ kind, name, label, initial, slug, error }: Props) {
  const [url, setUrl] = useState(initial)
  const { picker, choose, progress, error: uploadError } = useUpload(kind, slug, setUrl)
  const message = uploadError || error

  return (
    <div className="field">
      <span className="field__label" id={`${name}-label`}>
        {label}
      </span>
      <input type="hidden" name={name} value={url} />
      {picker}
      {url &&
        (kind === 'image' ? (
          <img className="file-upload__preview" src={url} alt="" />
        ) : (
          <a href={url} target="_blank" rel="noreferrer">
            {decodeURIComponent(url.split('/').pop() ?? 'PDF')}
          </a>
        ))}
      <div className="admin-actions">
        <button type="button" className="pill" onClick={choose} disabled={progress !== null} aria-describedby={`${name}-label`}>
          {progress !== null ? `Uploading… ${progress}%` : url ? 'Replace' : 'Upload'}
        </button>
        {url && progress === null && (
          <button type="button" className="pill" onClick={() => setUrl('')} aria-describedby={`${name}-label`}>
            Remove
          </button>
        )}
      </div>
      {message && (
        <p className="field__error" role="alert">
          {message}
        </p>
      )}
    </div>
  )
}

// "Add photo" for the pattern text: uploads a photo and hands its address back
export function PhotoButton({ slug, onUploaded }: { slug: () => string; onUploaded: (url: string) => void }) {
  const { picker, choose, progress, error } = useUpload('image', slug, onUploaded)
  return (
    <>
      {picker}
      <button type="button" className="pill" onClick={choose} disabled={progress !== null}>
        {progress !== null ? `Uploading… ${progress}%` : 'Add photo'}
      </button>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </>
  )
}
