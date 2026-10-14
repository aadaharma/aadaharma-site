// A pattern being edited: its grid size, its stitches and the undo/redo history.
// Edits are grouped into steps; one drag or one button press is one step, so undo
// takes back the whole line, not one stitch of it.
import { inGrid, type Key, type Stitches } from './stitches'

// For each stitch a step touched: its colour before and after (undefined = no stitch)
type Step = Map<Key, { before?: string; after?: string }>

export class Pattern {
  stitches: Stitches = new Map()
  private undoStack: Step[] = []
  private redoStack: Step[] = []
  private step: Step | null = null

  constructor(
    public width: number,
    public height: number,
  ) {}

  // Starts a step; edits until end() are undone together
  begin() {
    this.end()
    this.step = new Map()
  }

  end() {
    if (this.step?.size) {
      this.undoStack.push(this.step)
      this.redoStack = []
    }
    this.step = null
  }

  // Sets a stitch's colour, or removes it with undefined. Stitches outside the grid
  // are ignored. Outside a begin()/end() pair, the edit is a step of its own.
  set(k: Key, colour: string | undefined) {
    if (colour !== undefined && !inGrid(k, this.width, this.height)) return
    const before = this.stitches.get(k)
    if (before === colour) return
    const own = !this.step
    if (own) this.begin()
    const entry = this.step!.get(k)
    this.step!.set(k, { before: entry ? entry.before : before, after: colour })
    if (colour === undefined) this.stitches.delete(k)
    else this.stitches.set(k, colour)
    if (own) this.end()
  }

  // Several edits as one step (or as part of the current one)
  edit(fn: () => void) {
    const own = !this.step
    if (own) this.begin()
    fn()
    if (own) this.end()
  }

  get canUndo() {
    return this.undoStack.length > 0
  }

  get canRedo() {
    return this.redoStack.length > 0
  }

  undo() {
    this.end()
    const step = this.undoStack.pop()
    if (!step) return
    for (const [k, { before }] of step) this.write(k, before)
    this.redoStack.push(step)
  }

  redo() {
    this.end()
    const step = this.redoStack.pop()
    if (!step) return
    for (const [k, { after }] of step) this.write(k, after)
    this.undoStack.push(step)
  }

  private write(k: Key, colour: string | undefined) {
    if (colour === undefined) this.stitches.delete(k)
    else this.stitches.set(k, colour)
  }

  // Changing the grid size drops stitches that no longer fit. That can be undone
  // only by making the grid bigger again, so the history is cleared.
  resize(width: number, height: number) {
    this.end()
    this.width = width
    this.height = height
    for (const k of [...this.stitches.keys()]) if (!inGrid(k, width, height)) this.stitches.delete(k)
    this.undoStack = []
    this.redoStack = []
  }
}
