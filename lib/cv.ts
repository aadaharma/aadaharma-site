// Whether Aada's CV is on the site yet (public/cv/aada-harma-cv.pdf). Until it is, the home
// page's CV bird is just a bird and the About page has no download button.
import 'server-only'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { CV_PATH } from './i18n'

export const hasCv = () => existsSync(join(process.cwd(), 'public', CV_PATH))
