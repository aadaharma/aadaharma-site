// The top-down round yoke sweater calculator. From gauge and measurements (in cm) it works
// out the cast-on, the yoke's increase rounds, the division into body and sleeves, and the
// body and sleeve lengths in rounds. No browser code, so it's easy to test.

export type YokeInput = {
  stitchGauge: number // stitches per 10 cm
  roundGauge: number // rounds per 10 cm
  neck: number
  bust: number // body measurement
  bodyEase: number
  upperArm: number // body measurement
  sleeveEase: number
  yokeLength: number // from the neckline to the underarm
  bodyLength: number // from the armpit
  sleeveLength: number // from the armpit
  increasesPerRound: number
  underarm: number // width cast on under each arm
  neckRaise: number | null // height of the back neck raise, or null for none
}

// How to spread one round's increases: each group is "knit `knit` stitches, make one",
// worked `times` times, e.g. (k12, M1) × 3, (k11, M1) × 7
export type Spacing = { knit: number; times: number }[]

export type IncreaseRound = { round: number; before: number; increases: number; after: number; spacing: Spacing }

// "Every `every`th round, `times` times": `every` − 1 plain rounds, then an increase round
export type Interval = { every: number; times: number }

export type Warning =
  | { kind: 'neckTooBig' } // nothing to increase: the neck is as wide as the yoke's bottom edge
  | { kind: 'tooFewIncreases'; minimum: number } // the increase rounds don't fit into the yoke
  | { kind: 'increasesEveryRound' } // fits, but only by increasing on consecutive rounds
  | { kind: 'shortRowsDontFit' } // the back neck raise is too tall for the neck stitches

export type YokeResult = {
  castOn: number
  yokeRounds: number
  increaseRounds: IncreaseRound[]
  intervals: Interval[]
  plainRoundsAfter: number // plain rounds after the last increase round, before dividing
  yokeStitches: number // at the bottom of the yoke
  division: { front: number; back: number; sleeve: number; underarm: number }
  body: { stitches: number; rounds: number }
  sleeve: { stitches: number; rounds: number }
  neckRaise: { pairs: number; firstTurn: number; step: number } | null
  // What the rounded stitch and round counts come to, in cm
  finished: { neck: number; body: number; sleeve: number; yokeLength: number }
  warnings: Warning[]
}

const even = (n: number) => 2 * Math.round(n / 2)

// Spreads `increases` as evenly as possible over `stitches`: the larger gaps first
export function spacing(stitches: number, increases: number): Spacing {
  if (increases <= 0) return []
  const knit = Math.floor(stitches / increases)
  const extra = stitches % increases
  return [
    { knit: knit + 1, times: extra },
    { knit, times: increases - extra },
  ].filter((g) => g.times > 0)
}

// Splits `rounds` into `count` stretches that each end in an increase round, as evenly as
// possible: the longer stretches first, e.g. every 5th round × 10, then every 4th × 4
export function intervals(rounds: number, count: number): Interval[] {
  if (count <= 0) return []
  const every = Math.floor(rounds / count)
  const longer = rounds % count
  return [
    { every: every + 1, times: longer },
    { every, times: count - longer },
  ].filter((i) => i.times > 0 && i.every > 0)
}

// Checks the input; returns the names of fields that aren't usable numbers
export function invalidFields(input: YokeInput): (keyof YokeInput)[] {
  const positive: (keyof YokeInput)[] = [
    'stitchGauge', 'roundGauge', 'neck', 'bust', 'upperArm', 'yokeLength', 'bodyLength', 'sleeveLength', 'increasesPerRound',
  ]
  const zeroOrMore: (keyof YokeInput)[] = ['underarm']
  const bad = positive.filter((k) => !(Number.isFinite(input[k]) && (input[k] as number) > 0))
  bad.push(...zeroOrMore.filter((k) => !(Number.isFinite(input[k]) && (input[k] as number) >= 0)))
  // Ease can be negative (a close fit), but not so much that nothing is left
  if (!Number.isFinite(input.bodyEase) || input.bust + input.bodyEase <= 0) bad.push('bodyEase')
  if (!Number.isFinite(input.sleeveEase) || input.upperArm + input.sleeveEase <= 0) bad.push('sleeveEase')
  if (!Number.isInteger(input.increasesPerRound)) bad.push('increasesPerRound')
  if (input.neckRaise !== null && !(Number.isFinite(input.neckRaise) && input.neckRaise > 0)) bad.push('neckRaise')
  return [...new Set(bad)]
}

export function calculateYoke(input: YokeInput): YokeResult {
  const perCm = input.stitchGauge / 10
  const roundsPerCm = input.roundGauge / 10
  const warnings: Warning[] = []

  const castOn = Math.round(input.neck * perCm)
  // Front and back get the same number of stitches
  const body = even((input.bust + input.bodyEase) * perCm)
  const sleeve = Math.round((input.upperArm + input.sleeveEase) * perCm)
  // At most what's there to share, so the yoke never needs negative stitches
  const underarm = Math.min(Math.round(input.underarm * perCm), body / 2, sleeve)
  // The underarm stitches are cast on when dividing, so the yoke doesn't need them
  const yokeStitches = body + 2 * sleeve - 4 * underarm
  const yokeRounds = Math.max(1, Math.round(input.yokeLength * roundsPerCm))

  const toAdd = yokeStitches - castOn
  const perRound = input.increasesPerRound
  const count = toAdd > 0 ? Math.ceil(toAdd / perRound) : 0
  if (toAdd <= 0) warnings.push({ kind: 'neckTooBig' })
  else if (count > yokeRounds) warnings.push({ kind: 'tooFewIncreases', minimum: Math.ceil(toAdd / yokeRounds) })
  else if (count > yokeRounds / 2) warnings.push({ kind: 'increasesEveryRound' })

  // Where the increase rounds fall: each stretch of the yoke ends in one. If they don't
  // fit, they're listed one per round so the numbers still add up.
  const steps = count > yokeRounds ? [{ every: 1, times: count }] : intervals(yokeRounds, count)
  const increaseRounds: IncreaseRound[] = []
  let round = 0
  let stitches = castOn
  for (const { every, times } of steps) {
    for (let i = 0; i < times; i++) {
      round += every
      // The last round makes up what's left, so the count comes out exact
      const increases = Math.min(perRound, yokeStitches - stitches)
      increaseRounds.push({ round, before: stitches, increases, after: stitches + increases, spacing: spacing(stitches, increases) })
      stitches += increases
    }
  }

  // Back neck raise: pairs of short rows (each adds two rows at the back), turning first
  // a little way either side of the centre back and then further out each time, up to
  // the sides of the back of the neck (a quarter of the stitches each way)
  let neckRaise: YokeResult['neckRaise'] = null
  if (input.neckRaise !== null && castOn > 0) {
    const pairs = Math.max(1, Math.round((input.neckRaise * roundsPerCm) / 2))
    const firstTurn = Math.max(1, Math.round(castOn / 12))
    const reach = Math.floor(castOn / 4)
    const step = pairs > 1 ? Math.floor((reach - firstTurn) / (pairs - 1)) : 0
    if (pairs > 1 && step < 1) warnings.push({ kind: 'shortRowsDontFit' })
    neckRaise = { pairs, firstTurn, step: Math.max(step, pairs > 1 ? 1 : 0) }
  }

  const cm = (n: number, per: number) => Math.round((n / per) * 10) / 10
  return {
    castOn,
    yokeRounds,
    increaseRounds,
    intervals: steps,
    plainRoundsAfter: Math.max(0, yokeRounds - round),
    yokeStitches: Math.max(yokeStitches, castOn),
    division: { front: body / 2 - underarm, back: body / 2 - underarm, sleeve: sleeve - underarm, underarm },
    body: { stitches: body, rounds: Math.round(input.bodyLength * roundsPerCm) },
    sleeve: { stitches: sleeve, rounds: Math.round(input.sleeveLength * roundsPerCm) },
    neckRaise,
    finished: {
      neck: cm(castOn, perCm),
      body: cm(body, perCm),
      sleeve: cm(sleeve, perCm),
      yokeLength: cm(yokeRounds, roundsPerCm),
    },
    warnings,
  }
}
