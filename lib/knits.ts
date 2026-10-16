// Photos of Aada's knits for the pattern library's hero gallery (public/img/knits/, 800 px
// wide webp). `focus` is the object-position that keeps the knit in view in the 4 : 5 frame.
import type { Lang } from './i18n'

export type KnitPhoto = { src: string; alt: Record<Lang, string>; focus?: string }

export const KNIT_PHOTOS: KnitPhoto[] = [
  {
    src: '/img/knits/cable-vest.webp',
    alt: {
      en: 'A teal cabled vest with buttons on the shoulder, worn over a black top',
      fi: 'Petroolinvärinen palmikkoliivi, jonka olkapäällä on napit, mustan paidan päällä',
    },
  },
  {
    src: '/img/knits/hood.webp',
    alt: {
      en: 'A pale pink knitted hood and a grey and mustard sweater, against autumn trees',
      fi: 'Vaaleanpunainen neulottu huppu ja harmaa-sinapinkeltainen neulepusero syyspuiden edessä',
    },
    focus: '62% 50%',
  },
]
