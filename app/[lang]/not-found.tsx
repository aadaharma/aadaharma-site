import { NotFoundContent } from '@/components/NotFoundContent'

// Unknown patterns (notFound() in patterns/[slug]); unmatched addresses use app/global-not-found.tsx
export default function NotFound() {
  return <NotFoundContent />
}
