// Simple `key: value` frontmatter between --- lines, as used by content/patterns/*.md.
// Only strings and booleans; lines starting with # are comments.
export type Frontmatter = Record<string, string | boolean>

export function parseFrontmatter(source: string): { data: Frontmatter; body: string } {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { data: {}, body: source }
  const data: Frontmatter = {}
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z][\w-]*)\s*:\s*(.*?)\s*$/)
    if (!m) continue
    const value = m[2].replace(/^(['"])(.*)\1$/, '$2')
    data[m[1]] = value === 'true' ? true : value === 'false' ? false : value
  }
  return { data, body: source.slice(match[0].length) }
}
