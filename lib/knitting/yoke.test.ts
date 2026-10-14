import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateYoke, intervals, invalidFields, spacing, type YokeInput } from './yoke'

const sweater: YokeInput = {
  stitchGauge: 22, roundGauge: 30, neck: 50, bust: 90, bodyEase: 5, upperArm: 28, sleeveEase: 3,
  yokeLength: 22, bodyLength: 35, sleeveLength: 45, increasesPerRound: 10, underarm: 2.5, neckRaise: null,
}

test('an example worked out by hand', () => {
  const r = calculateYoke(sweater)
  // 50 cm × 2.2 sts/cm
  assert.equal(r.castOn, 110)
  // (90 + 5) × 2.2 = 209 → the nearest even number, 210; (28 + 3) × 2.2 = 68.2 → 68; 2.5 × 2.2 = 5.5 → 6
  assert.deepEqual(r.body, { stitches: 210, rounds: 105 })
  assert.deepEqual(r.sleeve, { stitches: 68, rounds: 135 })
  assert.deepEqual(r.division, { front: 99, back: 99, sleeve: 62, underarm: 6 })
  // 210 + 2 × 68 − 4 × 6
  assert.equal(r.yokeStitches, 322)
  // 22 cm × 3 rounds/cm; (322 − 110) / 10 → 22 increase rounds, the last one of 2
  assert.equal(r.yokeRounds, 66)
  assert.equal(r.increaseRounds.length, 22)
  assert.deepEqual(r.intervals, [{ every: 3, times: 22 }])
  assert.equal(r.increaseRounds.at(-1)!.increases, 2)
  assert.deepEqual(r.warnings, [])
  assert.deepEqual(r.finished, { neck: 50, body: 95.5, sleeve: 30.9, yokeLength: 22 })
})

test('the numbers add up for many sizes', () => {
  for (const neck of [36, 44, 52])
    for (const bust of [70, 90, 120, 150])
      for (const perRound of [6, 8, 12, 16]) {
        const input = { ...sweater, neck, bust, increasesPerRound: perRound }
        const r = calculateYoke(input)
        const label = JSON.stringify({ neck, bust, perRound })
        // Every increase round starts where the last one ended, and they end at the yoke's bottom edge
        let stitches = r.castOn
        for (const round of r.increaseRounds) {
          assert.equal(round.before, stitches, label)
          assert.equal(round.after, stitches + round.increases, label)
          // The spacing covers the round's stitches with one increase per gap
          assert.equal(round.spacing.reduce((n, g) => n + g.knit * g.times, 0), round.before, label)
          assert.equal(round.spacing.reduce((n, g) => n + g.times, 0), round.increases, label)
          assert.ok(round.increases > 0 && round.increases <= perRound, label)
          stitches = round.after
        }
        assert.equal(stitches, r.yokeStitches, label)
        // The yoke's stitches are exactly what the body and sleeves take from it
        const d = r.division
        assert.equal(d.front + d.back + 2 * d.sleeve, r.yokeStitches, label)
        assert.equal(d.front + d.back + 2 * d.underarm, r.body.stitches, label)
        // The increase rounds fit into the yoke, unless there's a warning saying they don't
        const last = r.increaseRounds.at(-1)?.round ?? 0
        if (!r.warnings.some((w) => w.kind === 'tooFewIncreases')) assert.ok(last <= r.yokeRounds, label)
      }
})

test('intervals spread the increase rounds over the yoke, the longer ones first', () => {
  assert.deepEqual(intervals(66, 14), [{ every: 5, times: 10 }, { every: 4, times: 4 }])
  assert.deepEqual(intervals(60, 12), [{ every: 5, times: 12 }])
  assert.deepEqual(intervals(10, 0), [])
  for (const [rounds, count] of [[66, 14], [50, 7], [31, 30], [8, 8]]) {
    const total = intervals(rounds, count).reduce((n, i) => n + i.every * i.times, 0)
    assert.equal(total, rounds)
  }
})

test('spacing spreads a round’s increases evenly', () => {
  assert.deepEqual(spacing(110, 10), [{ knit: 11, times: 10 }])
  assert.deepEqual(spacing(115, 10), [{ knit: 12, times: 5 }, { knit: 11, times: 5 }])
})

test('too few increases per round is caught, with the smallest number that works', () => {
  const r = calculateYoke({ ...sweater, increasesPerRound: 2 })
  const warning = r.warnings.find((w) => w.kind === 'tooFewIncreases')
  assert.ok(warning && warning.kind === 'tooFewIncreases')
  // 212 stitches to add over 66 rounds
  assert.equal(warning.minimum, 4)
  assert.equal(calculateYoke({ ...sweater, increasesPerRound: warning.minimum }).warnings.length, 1) // every round, but fits
})

test('a neckline as wide as the yoke needs no increases', () => {
  const r = calculateYoke({ ...sweater, neck: 160 })
  assert.deepEqual(r.warnings, [{ kind: 'neckTooBig' }])
  assert.equal(r.increaseRounds.length, 0)
})

test('the back neck raise is worked as pairs of short rows', () => {
  const r = calculateYoke({ ...sweater, neckRaise: 2.5 })
  // 2.5 cm × 3 rows/cm = 7.5 rows → 4 pairs (round(3.75)); turns from 110 / 12 ≈ 9 stitches out to 27
  assert.deepEqual(r.neckRaise, { pairs: 4, firstTurn: 9, step: 6 })
  assert.equal(calculateYoke(sweater).neckRaise, null)
})

test('unusable input is pointed out', () => {
  assert.deepEqual(invalidFields(sweater), [])
  assert.deepEqual(invalidFields({ ...sweater, stitchGauge: 0, increasesPerRound: 2.5, bodyEase: -100 }).sort(), ['bodyEase', 'increasesPerRound', 'stitchGauge'])
  assert.deepEqual(invalidFields({ ...sweater, neckRaise: Number.NaN }), ['neckRaise'])
})
