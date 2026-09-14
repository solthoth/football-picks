import { Link } from 'react-router-dom'

export function NotFoundPool() {
  return (
    <main>
      <p>That season/week isn't available.</p>
      <Link to="/">Start over</Link>
    </main>
  )
}
