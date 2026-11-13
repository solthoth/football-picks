import { useEffect } from 'react'

export const APP_NAME = 'Football Picks'

/**
 * Sets the browser tab / history title to "<title> · Football Picks".
 * Pass undefined to leave the title alone (e.g. while a child fallback page owns it).
 */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (title === undefined) return
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
  }, [title])
}
