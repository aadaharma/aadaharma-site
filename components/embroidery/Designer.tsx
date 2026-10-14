'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { isOneColour, motifFromJson, motifToJson, type Motif } from '@/lib/embroidery/motif'
import { CATEGORIES, type TemplateJson } from '@/lib/embroidery/motifs'
import { Pattern } from '@/lib/embroidery/pattern'
import { designerUrl, otherLang, type Lang, type Strings } from '@/lib/i18n'
import { drawPreview, patternPng } from './draw'
import { Colours, fill, GridSize, IconButton, Section, ToolOptions, ToolRail, useEditor, type T } from './parts'

type Props = { lang: Lang; t: T; theme: Strings['theme']; switchLabel: Strings['langSwitch']; templates: TemplateJson[] }


// The drawing is kept in the browser, so reloading the page doesn't lose it
const STORAGE_KEY = 'karelian-embroidery-pattern'

function loadPattern() {
  try {
    const saved = motifFromJson(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'))
    if (saved) {
      const pattern = new Pattern(saved.width, saved.height)
      pattern.stitches = saved.stitches
      return pattern
    }
  } catch {}
  return new Pattern(60, 40)
}

type Toast = { message: string; action?: { label: string; run: () => void } }

export function Designer({ lang, t, theme, switchLabel, templates }: Props) {
  const [toast, setToast] = useState<Toast | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const { hostRef, editor, state } = useEditor(loadPattern, () => setToast({ message: t.toast.copied }))
  const library = useMemo(
    () => templates.flatMap((tpl) => {
      const motif = motifFromJson(tpl.motif)
      return motif ? [{ ...tpl, motif }] : []
    }),
    [templates],
  )

  // Keeps the drawing in the browser, a moment after each change
  useEffect(() => {
    if (!editor) return
    const { pattern } = editor
    let timer = 0
    const stop = pattern.subscribe(() => {
      clearTimeout(timer)
      timer = window.setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(motifToJson(pattern)))
        } catch {}
      }, 400)
    })
    return () => {
      clearTimeout(timer)
      stop()
    }
  }, [editor])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), toast.action ? 5000 : 2500)
    return () => clearTimeout(timer)
  }, [toast])

  const clear = () => {
    if (!editor) return
    if (state.isEmpty) return setToast({ message: t.toast.empty })
    editor.clear()
    setToast({ message: t.toast.cleared, action: { label: t.toast.undo, run: () => editor.undo() } })
  }

  const download = async () => {
    if (!editor) return
    const { pattern } = editor
    const url = URL.createObjectURL(await patternPng(pattern.width, pattern.height, pattern.stitches))
    const link = document.createElement('a')
    link.href = url
    link.download = 'karelian-embroidery.png'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const onCopied = () => setToast({ message: t.toast.copied })

  return (
    <div className="designer">
      <header className="designer-top">
        <a className="designer-brand" href={lang === 'en' ? '/' : `/${lang}/`} title={t.home}>
          <span className="visually-hidden">{t.home}: </span>
          <span className="designer-brand__name">{t.title}</span>
        </a>
        <div className="designer-top__actions">
          <IconButton icon="undo" label={t.undo} onClick={() => editor?.undo()} disabled={!state.canUndo} />
          <IconButton icon="redo" label={t.redo} onClick={() => editor?.redo()} disabled={!state.canRedo} />
          <span className="designer-sep hide-small" />
          <IconButton icon="clear" label={t.clear} onClick={clear} />
          <IconButton icon="download" label={t.download} onClick={download} />
          <a className="pill" href={designerUrl(otherLang(lang))} hrefLang={switchLabel.lang} lang={switchLabel.lang}>
            <span className="visually-hidden">{switchLabel.label}</span>
            <span aria-hidden="true">{switchLabel.short}</span>
          </a>
          <span className="hide-small">
            <ThemeToggle t={theme} />
          </span>
          <IconButton icon="menu" label={t.openPanel} onClick={() => setPanelOpen(true)} className="panel-toggle" />
        </div>
      </header>

      <div className="designer-body">
        <ToolRail editor={editor} state={state} t={t} />

        <main className="designer-stage" id="main">
          <div className="designer-host" ref={hostRef} role="application" aria-label={t.canvas} />
        </main>

        {/* On phones, a strip above the tools for the tool's buttons */}
        <div className="designer-options-mobile">
          {editor && <ToolOptions editor={editor} state={state} t={t} onCopied={onCopied} compact />}
        </div>

        {panelOpen && <div className="designer-scrim" onClick={() => setPanelOpen(false)} />}
        <aside className={`designer-side${panelOpen ? ' is-open' : ''}`}>
          <div className="designer-side__close">
            <IconButton icon="close" label={t.closePanel} onClick={() => setPanelOpen(false)} />
          </div>
          <div className="designer-options-desktop">
            {editor && <ToolOptions editor={editor} state={state} t={t} onCopied={onCopied} />}
          </div>
          <Section title={t.colour.title} note={t.colour.names[state.colour as keyof T['colour']['names']] ?? state.colour.toUpperCase()}>
            <Colours colour={state.colour} t={t} onChange={(c) => editor?.setColour(c)} />
          </Section>
          <Section title={t.templates.title}>
            <p className="designer-hint">{t.templates.hint}</p>
            <Templates
              lang={lang}
              t={t}
              templates={library}
              colour={state.colour}
              onPick={(template) => {
                editor?.startPlacing(template.motif, template.name[lang])
                setPanelOpen(false)
              }}
            />
          </Section>
          {/* The theme switch is in the top bar on wider screens */}
          <div className="designer-side__theme">
            <ThemeToggle t={theme} />
          </div>
          <Section title={t.grid.title}>
            <GridSize
              key={`${state.width}x${state.height}`}
              t={t}
              width={state.width}
              height={state.height}
              onApply={(w, h) => {
                editor?.resize(w, h)
                const s = editor?.getState()
                if (s) setToast({ message: fill(t.toast.resized, { w: s.width, h: s.height }) })
              }}
            />
          </Section>
        </aside>
      </div>

      <div className={`designer-toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">
        {toast && (
          <>
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action!.run()
                  setToast(null)
                }}
              >
                {toast.action.label}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

type Template = Omit<TemplateJson, 'motif'> & { motif: Motif }

function Templates({
  lang, t, templates, colour, onPick,
}: { lang: Lang; t: T; templates: Template[]; colour: string; onPick: (template: Template) => void }) {
  return (
    <>
      {CATEGORIES.map((category) => {
        const list = templates.filter((tpl) => tpl.category === category.id)
        if (!list.length) return null
        return (
          <div key={category.id} className="designer-templates">
            <h3>{category[lang]}</h3>
            <div className="designer-templates__cards">
              {list.map((template) => (
                <TemplateCard key={template.id} template={template} lang={lang} t={t} colour={colour} onPick={onPick} />
              ))}
            </div>
          </div>
        )
      })}
    </>
  )
}

function TemplateCard({ template, lang, t, colour, onPick }: { template: Template; lang: Lang; t: T; colour: string; onPick: (template: Template) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (canvas.current) drawPreview(canvas.current, template.motif, isOneColour(template.motif) ? colour : undefined)
  }, [template, colour])
  return (
    <button type="button" className="template-card" onClick={() => onPick(template)}>
      <canvas ref={canvas} aria-hidden="true" />
      <span className="template-card__name" lang={lang}>
        {template.name[lang]}
      </span>
      <span className="template-card__size">{fill(t.templates.size, { w: template.motif.width, h: template.motif.height })}</span>
    </button>
  )
}

