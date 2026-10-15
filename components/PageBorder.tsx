import { borderFromMotif } from '@/lib/embroidery/border'
import { pageBorderMotif } from '@/lib/embroidery/templates'
import { PageDecoration } from './PageDecoration'

// The dithered page background, and the page border down both edges of the window: the
// template chosen in the admin, mirrored on the right. Just the background if none is chosen.
export async function PageBorder() {
  const motif = await pageBorderMotif()
  return <PageDecoration border={motif ? borderFromMotif(motif) : null} />
}
