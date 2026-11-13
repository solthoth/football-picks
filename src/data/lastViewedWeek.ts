/**
 * The week the visitor most recently had open, kept in memory for this page load so the home page can
 * reopen on it ("Change season/week" should not forget the week you were just looking at). A reload
 * starts fresh on the latest week, which is what a returning visitor wants.
 */
let lastViewed: { season: number; week: number } | undefined

export function rememberViewedWeek(season: number, week: number) {
  lastViewed = { season, week }
}

export function lastViewedWeek() {
  return lastViewed
}

/** Test helper: forgets the remembered week. */
export function resetLastViewedWeek() {
  lastViewed = undefined
}
