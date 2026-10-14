'use client'

import { useEffect, useState, type ReactNode } from 'react'
import type { Strings } from '@/lib/i18n'
import { calculateYoke, invalidFields, type Spacing, type Warning, type YokeInput, type YokeResult } from '@/lib/knitting/yoke'

type T = Strings['yoke']
type Field = Exclude<keyof YokeInput, 'neckRaise'> | 'neckRaiseHeight'
type Values = Record<Field, string> & { neckRaise: boolean }

// A sweater to start from, so there are numbers to look at straight away
const EXAMPLE: Values = {
  stitchGauge: '22', roundGauge: '30', neck: '50', bust: '90', upperArm: '28', yokeLength: '22', bodyLength: '35',
  sleeveLength: '45', bodyEase: '5', sleeveEase: '3', underarm: '2,5', increasesPerRound: '10', neckRaise: false,
  neckRaiseHeight: '2,5',
}

// What was entered is kept in the browser
const STORAGE_KEY = 'round-yoke-calculator'

// Finnish uses a decimal comma
const number = (text: string) => (text.trim() === '' ? Number.NaN : Number(text.trim().replace(',', '.')))

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ''))

function toInput(v: Values): YokeInput {
  return {
    stitchGauge: number(v.stitchGauge), roundGauge: number(v.roundGauge), neck: number(v.neck), bust: number(v.bust),
    bodyEase: number(v.bodyEase), upperArm: number(v.upperArm), sleeveEase: number(v.sleeveEase), yokeLength: number(v.yokeLength),
    bodyLength: number(v.bodyLength), sleeveLength: number(v.sleeveLength), increasesPerRound: number(v.increasesPerRound),
    underarm: number(v.underarm), neckRaise: v.neckRaise ? number(v.neckRaiseHeight) : null,
  }
}

export function YokeCalculator({ t, lang }: { t: T; lang: string }) {
  const [values, setValues] = useState<Values>(EXAMPLE)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
      if (saved && typeof saved === 'object') setValues((v) => ({ ...v, ...saved }))
    } catch {}
  }, [])

  const set = (field: keyof Values, value: string | boolean) => {
    setValues((v) => {
      const next = { ...v, [field]: value }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const input = toInput(values)
  const invalid = new Set<string>(invalidFields(input).map((f) => (f === 'neckRaise' ? 'neckRaiseHeight' : f)))
  const result = invalid.size ? null : calculateYoke(input)

  const field = (name: Field, label: string, hint?: string) => (
    <div className="calc-field">
      <label htmlFor={name}>{label}</label>
      <span className="calc-input">
        <input
          id={name}
          type="text"
          inputMode={name === 'increasesPerRound' || name.endsWith('Gauge') ? 'numeric' : 'decimal'}
          value={values[name]}
          onChange={(e) => set(name, e.target.value)}
          aria-invalid={invalid.has(name)}
          aria-describedby={[hint && `${name}-hint`, invalid.has(name) && `${name}-error`].filter(Boolean).join(' ') || undefined}
        />
        {!name.endsWith('Gauge') && name !== 'increasesPerRound' && <span aria-hidden="true">{t.form.cm}</span>}
      </span>
      {hint && (
        <span className="calc-hint" id={`${name}-hint`}>
          {hint}
        </span>
      )}
      {invalid.has(name) && (
        <span className="calc-error" id={`${name}-error`}>
          {t.form.invalid}
        </span>
      )}
    </div>
  )

  return (
    <div className="calc">
      <form className="calc-form" onSubmit={(e) => e.preventDefault()}>
        <p className="note">{t.example}</p>
        <fieldset>
          <legend>{t.form.gauge}</legend>
          <p className="calc-hint">{t.form.gaugeHint}</p>
          <div className="calc-row">
            {field('stitchGauge', t.form.stitchGauge)}
            {field('roundGauge', t.form.roundGauge)}
          </div>
        </fieldset>
        <fieldset>
          <legend>{t.form.measurements}</legend>
          <p className="calc-hint">{t.form.measurementsHint}</p>
          <div className="calc-row">
            {field('neck', t.form.neck)}
            {field('bust', t.form.bust)}
            {field('upperArm', t.form.upperArm)}
            {field('yokeLength', t.form.yokeLength, t.form.yokeLengthHint)}
            {field('bodyLength', t.form.bodyLength)}
            {field('sleeveLength', t.form.sleeveLength)}
          </div>
        </fieldset>
        <fieldset>
          <legend>{t.form.fit}</legend>
          <p className="calc-hint">{t.form.easeHint}</p>
          <div className="calc-row">
            {field('bodyEase', t.form.bodyEase)}
            {field('sleeveEase', t.form.sleeveEase)}
            {field('underarm', t.form.underarm, t.form.underarmHint)}
          </div>
        </fieldset>
        <fieldset>
          <legend>{t.form.yoke}</legend>
          <div className="calc-row">{field('increasesPerRound', t.form.increasesPerRound, t.form.increasesHint)}</div>
          <label className="calc-check">
            <input type="checkbox" checked={values.neckRaise} onChange={(e) => set('neckRaise', e.target.checked)} />
            {t.form.neckRaise}
          </label>
          {values.neckRaise && <div className="calc-row">{field('neckRaiseHeight', t.form.neckRaiseHeight)}</div>}
        </fieldset>
      </form>

      <section className="calc-results" aria-labelledby="results-title" aria-live="polite">
        <h2 id="results-title">{t.results.title}</h2>
        {result ? <Results r={result} t={t.results} perRound={input.increasesPerRound} lang={lang} /> : <p>{t.results.incomplete}</p>}
      </section>
    </div>
  )
}

function Results({ r, t, perRound, lang }: { r: YokeResult; t: T['results']; perRound: number; lang: string }) {
  const sts = (n: number) => fill(t.stitches, { n })
  const rounds = (n: number) => fill(t.rounds, { n })
  const last = r.increaseRounds.at(-1)
  const count = r.increaseRounds.length
  const cm = (n: number) => n.toLocaleString(lang === 'fi' ? 'fi-FI' : 'en-GB')

  return (
    <>
      {r.warnings.map((w) => (
        <p key={w.kind} className="calc-warning" role="alert">
          {warningText(w, t, perRound)}
        </p>
      ))}

      <List>
        <Item label={t.castOn} value={sts(r.castOn)} strong />
      </List>

      {r.neckRaise && (
        <Group title={t.neckRaise}>
          <List>
            <Item label="" value={fill(t.pairs, { n: r.neckRaise.pairs })} />
          </List>
          <p className="calc-hint">
            {r.neckRaise.pairs > 1
              ? fill(t.turns, { first: r.neckRaise.firstTurn, step: r.neckRaise.step })
              : fill(t.turnsOne, { first: r.neckRaise.firstTurn })}
            . {t.neckRaiseNote}
          </p>
        </Group>
      )}

      <Group title={t.yoke}>
        <List>
          <Item label={t.yokeRounds} value={rounds(r.yokeRounds)} />
          {count > 0 && (
            <Item
              label={t.increaseRounds}
              value={
                last && last.increases !== perRound
                  ? fill(t.increaseCountLast, { count, n: perRound, last: last.increases })
                  : fill(t.increaseCount, { count, n: perRound })
              }
            />
          )}
          {r.intervals.map((i) => (
            <Item
              key={i.every}
              label={t.spread}
              value={i.every === 1 ? fill(t.everyRound, { times: i.times }) : fill(t.every, { n: i.every, times: i.times })}
            />
          ))}
          {r.plainRoundsAfter > 0 && <Item label="" value={fill(t.plainAfter, { n: r.plainRoundsAfter })} />}
          <Item label={t.yokeEnd} value={sts(r.yokeStitches)} strong />
        </List>
      </Group>

      <Group title={t.division}>
        <List>
          <Item label={t.front} value={sts(r.division.front)} />
          <Item label={t.back} value={sts(r.division.back)} />
          <Item label={t.sleeveSts} value={sts(r.division.sleeve)} />
          <Item label={t.underarmSts} value={sts(r.division.underarm)} />
        </List>
      </Group>

      <div className="calc-pair">
        <Group title={t.body}>
          <List>
            <Item label="" value={sts(r.body.stitches)} />
            <Item label="" value={rounds(r.body.rounds)} />
          </List>
        </Group>
        <Group title={t.sleeves}>
          <List>
            <Item label="" value={sts(r.sleeve.stitches)} />
            <Item label="" value={rounds(r.sleeve.rounds)} />
          </List>
        </Group>
      </div>

      <Group title={t.finished}>
        <List>
          <Item label={t.neck} value={cm(r.finished.neck)} />
          <Item label={t.bust} value={cm(r.finished.body)} />
          <Item label={t.upperArm} value={cm(r.finished.sleeve)} />
          <Item label={t.yokeLength} value={cm(r.finished.yokeLength)} />
        </List>
        <p className="calc-hint">{t.finishedNote}</p>
      </Group>

      {count > 0 && (
        <Group title={t.table}>
          <div className="calc-table-wrap">
            <table className="calc-table">
              <thead>
                <tr>
                  <th scope="col">{t.tableRound}</th>
                  <th scope="col">{t.tableBefore}</th>
                  <th scope="col">{t.tableIncreases}</th>
                  <th scope="col">{t.tableSpacing}</th>
                  <th scope="col">{t.tableAfter}</th>
                </tr>
              </thead>
              <tbody>
                {r.increaseRounds.map((round) => (
                  <tr key={round.round}>
                    <td>{round.round}</td>
                    <td>{round.before}</td>
                    <td>{round.increases}</td>
                    <td>{spacingText(round.spacing, t)}</td>
                    <td>{round.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Group>
      )}
    </>
  )
}

const spacingText = (spacing: Spacing, t: T['results']) => spacing.map((g) => fill(t.spacing, g)).join(', ')

function warningText(w: Warning, t: T['results'], perRound: number) {
  switch (w.kind) {
    case 'tooFewIncreases':
      return fill(t.warnings.tooFewIncreases, { n: perRound, minimum: w.minimum })
    default:
      return t.warnings[w.kind]
  }
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="calc-group">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

const List = ({ children }: { children: ReactNode }) => <dl className="calc-list">{children}</dl>

function Item({ label, value, strong }: { label: string; value?: string; strong?: boolean }) {
  return (
    <div className={strong ? 'is-strong' : undefined}>
      {label && <dt>{label}</dt>}
      {value && <dd>{value}</dd>}
    </div>
  )
}
