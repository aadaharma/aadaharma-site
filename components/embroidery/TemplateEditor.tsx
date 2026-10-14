'use client'

import { useActionState, useEffect, useRef } from 'react'
import { deleteTemplate, saveTemplate, type TemplateFields, type TemplateSaveState } from '@/app/admin/templates/actions'
import { motifFrom, motifFromJson, motifToJson, TEMPLATE_MAX, type MotifJson } from '@/lib/embroidery/motif'
import { CATEGORIES } from '@/lib/embroidery/motifs'
import { Pattern } from '@/lib/embroidery/pattern'
import { translate } from '@/lib/embroidery/regions'
import { Colours, GridSize, Section, ToolOptions, ToolRail, useEditor, type T } from './parts'

type Props = { id: number | null; initial: TemplateFields; motif: MotifJson | null; t: T }

// Space around an existing motif when it's opened for editing
const MARGIN = 2

function patternFor(json: MotifJson | null) {
  const motif = json && motifFromJson(json, TEMPLATE_MAX)
  if (!motif) return new Pattern(24, 24)
  // No margin when the motif already fills the largest grid
  const mx = motif.width + 2 * MARGIN <= TEMPLATE_MAX.width ? MARGIN : 0
  const my = motif.height + 2 * MARGIN <= TEMPLATE_MAX.height ? MARGIN : 0
  const pattern = new Pattern(motif.width + 2 * mx, motif.height + 2 * my)
  pattern.stitches = translate(motif.stitches, mx, my)
  return pattern
}

// The admin's template editor: the designer's drawing tools, and the template's details.
// What's drawn on the grid is the template, trimmed to its stitches when saved.
export function TemplateEditor({ id, initial, motif, t }: Props) {
  const { hostRef, editor, state } = useEditor(() => patternFor(motif), () => {}, TEMPLATE_MAX)
  const [saveState, action, pending] = useActionState(saveTemplate, {} as TemplateSaveState)
  const values = saveState.values ?? initial
  const errors = saveState.errors ?? {}
  // The drawing goes with the form; `state` changes with every edit, so this stays current
  const drawn = editor ? motifFrom(editor.pattern.stitches) : null
  const motifValue = drawn ? JSON.stringify(motifToJson(drawn)) : ''

  // Warns before leaving with unsaved changes
  const dirty = useRef(false)
  useEffect(() => {
    if (state.canUndo) dirty.current = true
  }, [state.canUndo])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current) event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  return (
    <div className="template-editor">
      <div className="template-editor__bench">
        <ToolRail editor={editor} state={state} t={t} />
        <div className="designer-stage">
          <div className="designer-host" ref={hostRef} role="application" aria-label={t.canvas} />
        </div>
        <div className="template-editor__side">
          {editor && <ToolOptions editor={editor} state={state} t={t} onCopied={() => {}} />}
          <Section title={t.colour.title}>
            <Colours colour={state.colour} t={t} onChange={(c) => editor?.setColour(c)} />
            <p className="designer-hint">
              A template in one colour is stitched in the colour the user picks. With more colours, it keeps its own.
            </p>
          </Section>
          <Section title={t.grid.title}>
            <GridSize
              key={`${state.width}x${state.height}`}
              t={t}
              width={state.width}
              height={state.height}
              max={TEMPLATE_MAX}
              hint={`4 to ${TEMPLATE_MAX.width} cells wide and 4 to ${TEMPLATE_MAX.height} high. Stitches outside a smaller grid are removed, and undo starts over.`}
              onApply={(w, h) => editor?.resize(w, h)}
            />
          </Section>
        </div>
      </div>

      <form
        action={action}
        className="admin-form template-editor__form"
        onInput={() => (dirty.current = true)}
        onSubmit={() => (dirty.current = false)}
      >
        {id && <input type="hidden" name="id" value={id} />}
        <input type="hidden" name="motif" value={motifValue} />
        {saveState.error && (
          <p className="admin-notice admin-notice--error" role="alert">
            {saveState.error}
          </p>
        )}
        {errors.motif && <p className="field__error">{errors.motif}</p>}
        <p className="note">
          {drawn ? `The template is ${drawn.width} × ${drawn.height} cells, ${drawn.stitches.size} stitches.` : 'Nothing drawn yet.'}{' '}
          Empty space around it is left out when it&rsquo;s saved.
        </p>
        <div className="field-row field-row--3">
          <Field name="nameEn" label="Name in English" value={values.nameEn} error={errors.nameEn} />
          <Field name="nameFi" label="Name in Finnish" value={values.nameFi} error={errors.nameFi} />
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" defaultValue={values.category} aria-invalid={!!errors.category}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.en} / {c.fi}
                </option>
              ))}
            </select>
            {errors.category && <p className="field__error">{errors.category}</p>}
          </div>
        </div>
        <div className="admin-save">
          <label className="check">
            <input type="checkbox" name="published" defaultChecked={values.published} />
            Published (in the designer)
          </label>
          <button type="submit" className="button" disabled={pending}>
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>

      {id && (
        <form
          action={deleteTemplate}
          className="admin-delete"
          onSubmit={(e) => {
            if (!confirm('Delete this template? This can’t be undone.')) e.preventDefault()
            else dirty.current = false
          }}
        >
          <input type="hidden" name="id" value={id} />
          <button type="submit" className="button button--quiet">
            Delete template
          </button>
        </form>
      )}
    </div>
  )
}

function Field({ name, label, value, error }: { name: string; label: string; value: string; error?: string }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        defaultValue={value}
        required
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p className="field__error" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}
