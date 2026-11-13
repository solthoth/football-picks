// Latin-only subsets: the app is English-only, and the all-subsets entry points
// (e.g. roboto/400.css) ship @font-face rules for cyrillic/greek/vietnamese/etc.
// that bloat the render-blocking stylesheet.
import '@fontsource/roboto/latin-300.css'
import '@fontsource/roboto/latin-400.css'
import '@fontsource/roboto/latin-500.css'
import '@fontsource/roboto/latin-700.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Root } from './Root.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
