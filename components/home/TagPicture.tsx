import type { CreatureKey } from '@/lib/home/creatures'

// The little pictures on the home page's hover tags: what each creature leads to

// A Karelian eight-pointed star, cross-stitched
const STAR = ['....##....', '...#..#...', '.#.#..#.#.', '#..####..#', '.####.###.', '.###.####.', '#..####..#', '.#.#..#.#.', '...#..#...', '....##....']
const starCrosses = STAR.flatMap((row, y) =>
  [...row].flatMap((c, x) => (c === '#' ? [`M${5 + x * 5.5} ${5 + y * 5.5}l4.5 4.5M${9.5 + x * 5.5} ${5 + y * 5.5}l-4.5 4.5`] : [])),
).join('')

export function TagPicture({ name }: { name: CreatureKey }) {
  switch (name) {
    case 'embroidery':
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" rx="4" fill="#f6efe2" />
          <path d={starCrosses} stroke="#800000" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'knitting':
      // A round-yoke sweater
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M20 10C24 14 40 14 44 10L58 18 54 30 48 27V58H16V27L10 30 6 18Z" fill="#c18d17" />
          <path d="M20 10C24 14 40 14 44 10L50 14C46 30 18 30 14 14Z" fill="#800000" />
          <g fill="#ffd5fb">
            <circle cx="22" cy="18" r="2" />
            <circle cx="32" cy="21" r="2" />
            <circle cx="42" cy="18" r="2" />
            <path d="M27 15l2 3-2 3-2-3zM37 15l2 3-2 3-2-3z" />
          </g>
          <path d="M16 52H48" stroke="#800000" strokeWidth="2" strokeDasharray="3 2" />
        </svg>
      )
    case 'patterns':
      // A shelf of pattern books
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <rect x="8" y="14" width="10" height="40" fill="#800000" />
          <rect x="20" y="8" width="9" height="46" fill="#c18d17" />
          <rect x="31" y="16" width="11" height="38" fill="#e58fc4" />
          <path d="M44 18L54 15 60 52 50 55Z" fill="#9e1a1a" />
          <path d="M4 56H60" stroke="#2b0b0b" strokeWidth="2.5" />
          <path d="M10 22H16M10 46H16M22 18H27M33 24H40" stroke="#ffd5fb" strokeWidth="1.4" />
        </svg>
      )
    case 'about':
      return <img src="/img/portrait.webp" alt="" width={64} height={64} />
    case 'cv':
      // A sheet with a down arrow
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M14 6H40L52 18V58H14Z" fill="#fffaf3" stroke="#c18d17" strokeWidth="2" />
          <path d="M40 6V18H52" fill="none" stroke="#c18d17" strokeWidth="2" />
          <path d="M20 16H34M20 22H36" stroke="#e58fc4" strokeWidth="2" />
          <path d="M33 28V46M25 39L33 47 41 39" fill="none" stroke="#800000" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 52H44" stroke="#800000" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
  }
}
