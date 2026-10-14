'use client'

import { useActionState, useEffect, useRef, useState, type ReactNode } from 'react'
import { deletePattern, savePattern, type SaveState } from '@/app/admin/actions'
import type { Suggestions } from '@/app/admin/suggestions'
import type { PatternFields } from '@/lib/admin/patterns'
import { slugify } from '@/lib/admin/slug'
import { FileUpload, PhotoButton } from './FileUpload'

type Props = { id: number | null; initial: PatternFields; suggestions: Suggestions }

export function PatternForm({ id, initial, suggestions }: Props) {
  const [state, action, pending] = useActionState(savePattern, {} as SaveState)
  // After a failed save the form shows what was typed, not what's in the database
  const values = state.values ?? initial
  const errors = state.errors ?? {}

  const slugRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const [slugEdited, setSlugEdited] = useState(!!initial.slug)
  const [language, setLanguage] = useState(values.language)
  const slug = () => slugRef.current?.value || 'untitled'

  // Warns before leaving the page with unsaved changes
  const dirty = useRef(false)
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current) event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])
  // A failed save hasn't saved anything, so the changes still count as unsaved
  useEffect(() => {
    if (state.error) dirty.current = true
  }, [state])

  // Inserts Markdown at the cursor in the pattern text, with the placeholder selected
  const insertIntoBody = (before: string, placeholder: string, after: string) => {
    const box = bodyRef.current
    if (!box) return
    const { selectionStart: start, selectionEnd: end, value } = box
    const block = (start > 0 && !value.slice(0, start).endsWith('\n\n') ? '\n\n' : '') + before
    box.value = value.slice(0, start) + block + placeholder + after + '\n\n' + value.slice(end)
    box.focus()
    box.setSelectionRange(start + block.length, start + block.length + placeholder.length)
    dirty.current = true
  }

  const text = (name: keyof PatternFields, label: string, options: { hint?: ReactNode; list?: string[] } = {}) => (
    <Field name={name} label={label} hint={options.hint} error={errors[name]}>
      <input
        id={name}
        name={name}
        defaultValue={values[name] as string}
        list={options.list ? `${name}-list` : undefined}
        aria-invalid={!!errors[name]}
        aria-describedby={describedBy(name, options.hint, errors[name])}
      />
      {options.list && (
        <datalist id={`${name}-list`}>
          {options.list.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      )}
    </Field>
  )

  return (
    <>
      <form
        action={action}
        className="admin-form"
        onInput={() => (dirty.current = true)}
        onSubmit={() => (dirty.current = false)}
      >
        {id && <input type="hidden" name="id" value={id} />}
        {state.error && (
          <p className="admin-notice admin-notice--error" role="alert">
            {state.error}
          </p>
        )}

        <fieldset>
          <legend>Basics</legend>
          <Field name="title" label="Name" error={errors.title}>
            <input
              id="title"
              name="title"
              defaultValue={values.title}
              required
              aria-invalid={!!errors.title}
              aria-describedby={describedBy('title', undefined, errors.title)}
              onChange={(e) => {
                if (!slugEdited && slugRef.current) slugRef.current.value = slugify(e.target.value)
              }}
            />
          </Field>
          <div className="field-row">
            <Field name="language" label="Language">
              <select id="language" name="language" defaultValue={values.language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="fi">Finnish</option>
              </select>
            </Field>
            <Field name="date" label="Date" hint="Newest patterns are listed first." error={errors.date}>
              <input
                id="date"
                name="date"
                type="date"
                defaultValue={values.date}
                aria-invalid={!!errors.date}
                aria-describedby={describedBy('date', true, errors.date)}
              />
            </Field>
          </div>
          <Field
            name="slug"
            label="Address"
            hint={`aadaharma.com${language === 'fi' ? '/fi' : ''}/patterns/… — made from the name if left empty.`}
            error={errors.slug}
          >
            <input
              id="slug"
              name="slug"
              ref={slugRef}
              defaultValue={values.slug}
              aria-invalid={!!errors.slug}
              aria-describedby={describedBy('slug', true, errors.slug)}
              onChange={() => setSlugEdited(true)}
            />
          </Field>
          <Field name="summary" label="Summary" hint="One or two sentences for the library card and under the name.">
            <textarea id="summary" name="summary" rows={2} defaultValue={values.summary} aria-describedby="summary-hint" />
          </Field>
        </fieldset>

        <fieldset>
          <legend>Library filters</legend>
          <p className="note">Pick an existing value where you can, so the filter buttons stay tidy.</p>
          <div className="field-row field-row--3">
            {text('craft', 'Craft', { list: suggestions.craft })}
            {text('difficulty', 'Difficulty', { list: suggestions.difficulty })}
            {text('yarnWeight', 'Yarn weight', { list: suggestions.yarnWeight })}
          </div>
        </fieldset>

        <fieldset>
          <legend>Details</legend>
          <div className="field-row">
            {text('sizes', 'Sizes')}
            {text('needles', 'Needles')}
          </div>
          {text('yarn', 'Yarn')}
          <div className="field-row">
            {text('gauge', 'Gauge')}
            {text('notions', 'Notions')}
          </div>
        </fieldset>

        <fieldset>
          <legend>Photo and PDF</legend>
          <FileUpload kind="image" name="coverUrl" label="Cover photo" initial={values.coverUrl} slug={slug} error={errors.coverUrl} />
          {text('coverAlt', 'Photo description', { hint: 'What the photo shows, for people who can’t see it.' })}
          <FileUpload kind="pdf" name="pdfUrl" label="PDF" initial={values.pdfUrl} slug={slug} error={errors.pdfUrl} />
        </fieldset>

        <fieldset>
          <legend>Pattern text</legend>
          <Field
            name="bodyMd"
            label="Text"
            hint={
              <>
                Markdown: <code>## Heading</code>, numbered lists (<code>1.</code> <code>2.</code>) for steps. A
                colourwork chart goes between <code>```chart</code> lines, one line per round, <code>X</code> for
                the main colour and <code>.</code> for the contrast colour.
              </>
            }
          >
            <textarea id="bodyMd" name="bodyMd" ref={bodyRef} rows={24} defaultValue={values.bodyMd} aria-describedby="bodyMd-hint" />
          </Field>
          <div className="admin-actions">
            <PhotoButton slug={slug} onUploaded={(url) => insertIntoBody('![', 'Describe the photo', `](${url})`)} />
            <button type="button" className="pill" onClick={() => insertIntoBody('```chart\n', 'X...X...\n.X.X.X.X', '\n```')}>
              Add chart
            </button>
          </div>
        </fieldset>

        <div className="admin-save">
          <label className="check">
            <input type="checkbox" name="published" defaultChecked={values.published} />
            Published (shown on the site)
          </label>
          <button type="submit" className="button" disabled={pending}>
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>

      {id && (
        <form
          action={deletePattern.bind(null, id)}
          className="admin-delete"
          onSubmit={(e) => {
            if (!confirm('Delete this pattern and its photos and PDF? This can’t be undone.')) e.preventDefault()
            else dirty.current = false
          }}
        >
          <button type="submit" className="button button--quiet">
            Delete pattern
          </button>
        </form>
      )}
    </>
  )
}

const describedBy = (name: string, hint: unknown, error: unknown) =>
  [hint && `${name}-hint`, error && `${name}-error`].filter(Boolean).join(' ') || undefined

function Field({ name, label, hint, error, children }: { name: string; label: string; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {children}
      {hint && (
        <p className="field__hint" id={`${name}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}
