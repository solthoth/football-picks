import { NotFoundCard } from '../components/NotFoundCard'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function NotFound() {
  useDocumentTitle('Page not found')

  return <NotFoundCard title="Page not found" message="That page doesn't exist." actionLabel="Go to Football Picks" to="/" />
}
