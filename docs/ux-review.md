# UX review: Football Picks

Reviewed 2026-11-12 against `main` (`5bf44a9`), running locally with live scores from the dev environment. Week 10 had one game in progress and Week 9 was final, so both states were covered.

## Progress

| # | Finding | Status |
|---|---|---|
| 1 | Everyone ranked #1 before any game finishes | ✅ Done |
| 2 | Every page has the same title | ✅ Done |
| 3 | Navigation is buttons, not links | ✅ Done |
| 4 | Orange accents fail contrast in light mode | ✅ Done |
| 10 | Mobile tap targets under 44 px | ✅ Done |
| 11 | Winner banner addressed to the wrong person | ✅ Done (confetti unchanged by decision) |
| 18 | Titles wrap awkwardly on phones | ✅ Done |
| 6 | Week picker hides earlier weeks | ✅ Done |
| 8 | Home forgets the week; no week-to-week links | ✅ Done |
| 9 | No persistent navigation on long mobile pages | ✅ Done |
| 13 | Error pages inconsistent and thin | ✅ Done |
| 5 | No season view | ✅ Done |
| 12 | Tiebreaker guess shown without the answer | ✅ Done |
| 22 | Shared links have no preview | ✅ Done (preview not yet seen in a real chat app) |
| 7, 14–17, 19–21, 23 | Everything else | Open |

Findings 1–4 (branch `feat/ux-quick-wins-1-4`) 10, 11 and 18 (branch `feat/ux-quick-wins-10-11-18`), 6, 8, 9 and 13 (branch `feat/ux-navigation-6-8-9-13`), and 5, 12 and 22 (branch `feat/ux-features-5-12-22`) were implemented test-first (red, then green). Each has a **Status** note below saying what changed and anything the work turned up that the original write-up got wrong or missed.

## How it was reviewed

Driven with Playwright (Chromium) across every route, including the error states:

| Mode | Viewport | Also checked |
|---|---|---|
| Desktop | 1440 × 900 | Keyboard-only navigation, browser back, share |
| Mobile | 390 × 844 | Dark mode, reduced motion |
| Narrow phone | 320 × 640 | Horizontal overflow only |
| Tablet | 768 × 1024 | Horizontal overflow only |

Each page was checked for layout overflow, tap-target size, text contrast (WCAG AA), heading structure, focus order and console errors. Screenshots are in [ux-review/](ux-review/).

**Not covered:** real devices, screen readers, Safari and Firefox, and the touch-only pull-to-refresh gesture. The native share sheet could not be observed under automation (see finding 7).

## What already works well

- **No layout breakage.** No horizontal overflow on any page at 320, 390, 768 or 1440 px.
- **Dark mode is solid.** Every text element passed AA contrast in dark mode.
- **The mobile layouts are purpose-built**, not squeezed tables: standings become cards, pick rows become score cards, and the dashboard summary collapses to a compact list.
- **Whole cards are tappable** on the dashboard and participant pages, not just the small link text.
- **Keyboard support exists everywhere**: visible focus rings, arrow keys on the week picker, Enter/Space on table rows.
- **In-app back buttons are contextual** ("Back to Packers @ Patriots") and fall back sensibly on a shared deep link.
- **Live state is clear** where it appears: the highlighted LIVE card and the "Scores as of" timestamp.
- **No console errors or warnings** on any route.

## Findings

Ordered by impact. "Both" means the issue appears on desktop and mobile.

### High

**1. Before any game finishes, everyone is ranked #1 in gold** (both)

In Week 10 all ten players show a gold "1" with `0 / 14`. It reads as a ten-way tie for first when nothing has been decided. See [mobile-list-w10-live.png](ux-review/mobile-list-w10-live.png).

- Show a neutral avatar (or a dash) until at least one game is final.
- Consider sorting alphabetically with a "No games final yet" note in that state.

> **Status: ✅ Done.** `buildLeaderboard` now returns `rank: null` until at least one pick is decided (right or wrong). While unranked, the list shows a neutral "–" avatar, sorts alphabetically and says "Rankings start once the first game is final." Once any game is decided, ranks appear as before, even if everyone got it wrong (that is a genuine tie).
>
> *Worth knowing:* the app paints bundled data first and live scores replace it a moment later, so on a cold load of a finished week the unranked state can show for a second before the real standings arrive. That is an existing property of the data flow; the neutral state is a far better first paint than the old gold "1" for everyone.

**2. Every page has the same title, "Football Picks"** (both)

Browser tabs, history entries and bookmarks are indistinguishable, and screen-reader users get no announcement on navigation.

- Set `document.title` per route, for example "Week 9 standings · Football Picks" and "Jose · Week 9 · Football Picks".

> **Status: ✅ Done.** A `useDocumentTitle` hook sets a title on every screen, including the not-found states:
>
> | Screen | Title |
> |---|---|
> | Home | Football Picks |
> | Standings | Week 9 standings (2026) · Football Picks |
> | Dashboard | Week 9 pick split (2026) · Football Picks |
> | Game | Packers @ Patriots · Week 9 (2026) · Football Picks |
> | Participant | Jose · Week 9 (2026) · Football Picks |
> | Missing week / game / player / page | Week not found, Game not found, Player not found, Page not found |
>
> The season is included so a 2027 season will not make titles ambiguous. *Not covered:* moving keyboard focus to the new page heading on navigation, which is the other half of announcing a route change to screen readers.

**3. Navigation is built from buttons and clickable rows, not links** (both)

The standings page contains zero `<a>` elements. That means no Cmd/Ctrl-click or middle-click to open a player in a new tab, no long-press "copy link" on mobile, and no URL preview on hover. Desktop table rows are focusable `<tr>` elements with no role or label, so a screen reader announces the whole row's text with no hint that it is actionable.

- Render participant names, game cards and back buttons as router `<Link>`s. The whole-row click can stay as a convenience.

> **Status: ✅ Done.** Participant names (table and mobile cards), game cards, the who-picked lists, the dashboard button and every back button are now real `<a>` links, so Cmd/Ctrl-click, middle-click and copy-link work. This was verified in a real browser, including that Ctrl-click on a back button opens a new tab.
>
> - Components now build their own destinations from the pool and render router links, replacing the `onSelect` / `onBack` / `onSelectGame` callback props. The pages shrank to data wiring.
> - A new `BackLink` is a real link to the fallback route, but a plain click still pops history when the user arrived from another screen, so "back" behaves exactly as before.
> - Desktop table rows keep click-anywhere as a convenience (and navigate once, not twice, when the link itself is clicked), but rows are no longer focusable. The name or matchup link is the keyboard stop, which also fixes the unlabelled-row announcement.
>
> *Left as is:* the week tiles on the home page are a listbox rather than links (they select, not navigate to a URL the user would share), and the error pages still use their own controls (finding 13).

**4. Orange accents fail contrast in light mode** (both)

White or orange text on the `warning` orange measures about 3.1:1; AA needs 4.5:1 at these sizes. Dark mode passes.

| Element | Measured | Size |
|---|---|---|
| "Week Winner" badge | 3.11:1 | 13 px |
| Rank 1 avatar number | 3.11:1 | 18 px |
| "LIVE" label on score cards | 3.11:1 | 12 px |
| "See who picked each team" | 4.03:1 | 12 px |
| "Tiebreaker guess" tile label | 4.20:1 | 12 px |
| "WEEK" label on the week tiles | 3.93:1 | 10.4 px |

- Use a darker orange (`warning.dark`) behind white text, or dark text on the current orange.
- Raise the 10.4 px tile label to at least 12 px.

> **Status: ✅ Done.**
>
> **Correction to the suggestion above:** `warning.dark` behind white text does *not* pass; it measures 3.8:1. The fix that works is dark text on the existing orange for filled surfaces, and a darker shade for small orange *text*.
>
> - New `src/theme.ts`, shared by the app and the tests. `createAppTheme` sets `contrastThreshold: 4.5`, so every filled warning / error / info surface (chips, avatars, buttons) takes dark text where white would fail.
> - `accentTextColor(theme, colour)` gives accent text a shade that clears 4.5:1 on paper and on every tinted surface the app uses. It is applied to the "See who picked each team" hint, the summary tile labels, the live score row and label, the dashboard summary labels and the week tile caption (now 12 px).
> - Light mode and dark mode are both covered by tests that measure the real computed colours against the production theme.
>
> **Also found while verifying** (not in the original audit):
>
> | Extra failure | Was | How it was missed |
> |---|---|---|
> | Rank 3 bronze avatar | 3.14:1 | No screenshot had a third place |
> | Filled `error` in dark mode | 3.68:1 | No filled error surface is rendered today (only icons and text); a latent theme default that would bite the first error chip or button |
> | Desktop dashboard summary labels ("Participants", "Most divided game") | 4.20:1 and 3.54:1 | The first contrast pass only ran at mobile width, where these render as plain text |
>
> A final browser audit of 12 routes × 3 viewports (390, 768, 1440 px) × light/dark finds no text below WCAG AA.

**5. There is no season view** (both)

The app only answers "who is winning this week". There is no cumulative leaderboard, win count or winnings total across weeks, even though ten weeks of data are bundled. This is the largest product gap rather than a defect.

- Add a season standings page (total correct, weeks won, winnings) linked from the home card.

> **Status: ✅ Done.** A new page at `/season/:season`, linked from the home card ("Season 2026 standings"). See [mobile-season-standings.png](ux-review/mobile-season-standings.png) and [desktop-home-season-link.png](ux-review/desktop-home-season-link.png).
>
> - **Leaderboard:** weeks won, winnings and correct picks per person (a table on larger screens, cards on phones), with the same gold, silver and bronze ranks and neutral unranked state as the weekly page.
> - **Ranking:** the pool is winner-take-all each week, so it leads with money won, then weeks won, then correct picks, then name. A week's pot goes to its winner and is split equally between co-winners (each still counts the win), reusing the existing tiebreak rules.
> - **Week by week** (not in the original finding): a list of every week's winners and payout that links into that week, so the page is also a way to browse the season.
> - **Honest loading:** only Weeks 1 and 2 are mostly final in the bundled data; later weeks only have real results as live scores. The page loads every week's live scores, says "Loading the latest scores…" while it does, and warns which weeks failed to load instead of showing wrong totals. Finished weeks are not fetched again, and only weeks still in progress are polled.
>
> **Verified on live data:** the money matches the weekly pots (9 decided weeks, $1,575 paid out), and each person's correct picks match the sum of their weekly standings pages.
>
> *Worth knowing:* "correct / decided" excludes a **tied** game, since a tie decides nobody's pick. The weekly page's denominator counts it (Week 5 has a 27-27 tie, so a weekly total reads "x / 15" where the season sums 14). Both are right; they just count different things.
>
> *Not included:* a per-person season page, and a pager between seasons.

### Medium

**6. The week picker hides earlier weeks with little affordance** (both, worse on desktop)

On desktop only Weeks 6–10 are visible and 470 px of the rail is scrolled off to the left. The scrollbar is hidden, there are no arrows, and click-drag does not scroll; only a mouse wheel or arrow keys reach Weeks 1–5. The fade on the left edge is the only hint. See [desktop-home.png](ux-review/desktop-home.png) and [mobile-home.png](ux-review/mobile-home.png).

- On desktop, wrap the tiles into a grid (ten weeks fit in two rows), or add previous/next arrow buttons.
- On mobile, the swipe rail is fine; a partially visible tile on the left already signals more.

> **Status: ✅ Done.** From the `sm` breakpoint up, the week tiles wrap into a centred grid, so ten weeks show as two rows of five and nothing is hidden (the card is a little wider there to fit five per row). Phones keep the compact swipeable rail. The layout switches with `useMediaQuery`, like the participant list, so both modes are covered by tests. Checked in a browser at 1440, 768, 390 and 320 px. See [desktop-home-week-grid.png](ux-review/desktop-home-week-grid.png).

**7. Share gives no confirmation on desktop** (desktop)

Clicking Share produced no snackbar and did not change the clipboard. The code calls `navigator.share` whenever it exists, and current desktop Chrome, Edge and Safari all expose it, so desktop users get the OS share sheet instead of a copied link. The sheet itself cannot be seen under automation, so confirm this by hand.

- On desktop-sized viewports, copy the link and show "Link copied". Keep the native sheet for touch devices.

**8. Returning to the home page forgets which week you were viewing** (both)

After opening Week 9 and pressing back, the picker has Week 10 selected again. The players and pot chips also only ever describe the default week, because tapping a tile navigates away immediately.

- Preselect the week the user just came from.
- Add previous/next week controls on the standings page so comparing weeks does not require a trip home.

> **Status: ✅ Done.**
>
> - **Home remembers the week.** The app notes which week is open on any of its screens, and the home page reopens on it, with that week's player count and pot. It is kept in memory for the page load, so a reload starts fresh on the latest week. An unknown week or season falls back to the latest.
> - **Week-to-week links.** A new `WeekPager` on the standings page links to the previous and next weeks that exist (gaps are skipped, and each end is hidden at the first and last week). They are real links with 44 px targets and labels like "Week 4 (previous week)", with contrast of 4.6:1 in light mode and 10.7:1 in dark.
>
> *Left as is:* the pager is on the standings page only, as the finding asked; the dashboard does not have one yet. Verified on live data in a browser.

**9. Long pages have no persistent navigation on mobile** (mobile)

The Week 10 dashboard is 4.7 screens tall and a participant page is 3.5. The back button and Share exist only at the very top. See [mobile-dash-w10.png](ux-review/mobile-dash-w10.png).

- Make the header row (back and share) sticky, or add a "back to top" control.

> **Status: ✅ Done (sticky header; no "back to top" control).** A new `PageHeader` holds the back link and Share and sticks to the top of the screen. It replaces four copies of the same row. It spans the card padding, has an opaque background in both colour schemes and a hairline divider, and its z-index keeps it above content but below dialogs and the winner banner. It applies at every width, since long pages exist on desktop too. Checked in a browser: on every screen at 390 and 1440 px it stays at the top after scrolling to the bottom (the dashboard is 4.8 phone screens tall), and the back link still works while stuck.

**10. Several mobile tap targets are under 44 px** (mobile)

| Control | Size |
|---|---|
| Share | 87 × 31 |
| Back buttons | 37 tall |
| Schedule / Most divided toggle | 40 tall |
| "See how the pool picked" | 42 tall |
| "Start over" and "Go to Football Picks" links | 19 tall |

- Set a 44 px minimum height on these. Share is the furthest off.

> **Status: ✅ Done.** The app theme now gives every `Button` and `ToggleButton` a 44 px minimum height, so existing and future buttons get it without per-call styling (Share, the back buttons, the sort toggle and "See how the pool picked" are all covered). The season chips (40 px) and the two not-found links get 44 px explicitly. The sort toggle's own inline 40 px, which would have overridden the theme, was removed.
>
> A browser audit of 122 controls across 12 routes at 390 px finds none under 44 × 44. *Not covered:* the transient winner banner's close "×", which auto-dismisses after 2.5 seconds. The rule applies at every width rather than only on touch screens, so desktop buttons are slightly taller too.
>
> *Found later, not fixed:* at tablet and desktop widths (the table layout, 600 px and up) the participant-name and matchup *links* inside table rows are 26–29 px tall. The whole row is clickable and about 77 px tall, so the practical tap target is large, but the link element itself is under 44 px. The 390 px audit above did not see this because phones use cards.

**11. The winner celebration is addressed to the wrong person and repeats** (both)

The banner says "Congratulations, Jose! You're a Week Winner!" to whoever opens Jose's page, and the confetti fires on every load. See [desktop-winner-w9.png](ux-review/desktop-winner-w9.png).

- Reword to third person: "Jose won Week 9!".
- Fire confetti once per week per browser (remember it in `localStorage`).

> **Status: ✅ Done for the wording; the confetti suggestion was deliberately not taken.** The banner now reads "Jose won Week 9!" (it needed the week, so `WinnerCelebration` takes a new `week` prop). Confetti still fires on every load of a winner's page, by the owner's decision, and a test now pins that existing behaviour so it cannot change by accident.
>
> *Follow-up:* the second burst is scheduled 150 ms after the first and was never cancelled, so leaving the page in that window still fired confetti on the next screen. That also caused an intermittent test failure. The burst is now cancelled when the page is left (covered by tests), and the behaviour is otherwise unchanged.

**12. The tiebreaker guess is shown without the answer** (both)

"Tiebreaker guess: 48 combined score" never shows the actual combined score or how close the guess was, even when the week is final and the tiebreaker decided the winner.

- Once the tiebreaker game is final, show the actual total and the difference.

> **Status: ✅ Done.** The tile's caption now reads "Actual 29 · off by 25" (or "Actual 44 · exact guess") once the tiebreaker game is final with both scores recorded, and still says "combined score" before then. A new `getTiebreakerOutcome` in the domain does the arithmetic. Checked on live data: Week 9's Monday game (Bills 23, Vikings 6) gives "Actual 29" against a guess of 54.

**13. Error pages are inconsistent and thin** (both)

The four error states use different controls (a text link on two, a button on the other two), three have no heading at all, and none offers a useful next step. See [mobile-bad-week.png](ux-review/mobile-bad-week.png).

- Give each an `h1`, one consistent primary button, and a helpful target: the latest week for a bad week, the week's standings for an unknown player or game.

> **Status: ✅ Done.** A shared `NotFoundCard` gives every "can't find that" screen an `h1`, one sentence and a single primary button that is a real link:
>
> | Error | Heading | Button goes to |
> |---|---|---|
> | Unknown page | Page not found | Home |
> | Unknown week | Week not found | The latest week (home if there is no data) |
> | Unknown game | Game not found | That week's games |
> | Unknown player | Player not found | That week's standings |
>
> The headings match the document titles added for finding 2. See [mobile-week-not-found.png](ux-review/mobile-week-not-found.png). A browser pass over all four states confirmed one heading and one primary action each.

### Low

**14. Team names truncate when there is room** (both)
"Commanders" is cut to "Commande…" on the desktop dashboard and "Comma…" on mobile; at 320 px both team names are cut. See [desktop-dash-w9.png](ux-review/desktop-dash-w9.png) and [mobile-320-dash.png](ux-review/mobile-320-dash.png). Allow the name to wrap to two lines, or shrink the font for long names.

**15. The "Pending" column and tile are noise once a week is final** (both)
Final weeks show "0 pending" on every desktop row and a "Pending 0 of 15" tile. Hide them when nothing is pending. On mobile the pending count is dropped entirely, so in-progress weeks lose that information there; a small "3 left" caption would restore it.

**16. The pick-split bar colours are unexplained** (both)
Blue is always the away team and purple the home team, and the losing side is faded, but nothing says so and the colours have no tie to the teams. Add a one-line legend, or label the bar ends.

**17. The "Most divided" sort resets on reload and is not shareable** (both)
The toggle is local state. Put it in the URL (`?sort=divided`) so it survives refresh and sharing.

**18. Titles wrap awkwardly on phones** (mobile)
"Season 2026 · Week 10" breaks as "Week / 10", leaving the number alone on a line. Keep "Week 10" together with a non-breaking space. At 320 px the uppercase back button also wraps to two lines.

> **Status: ✅ Done.** A new `SeasonWeekLabel` keeps "Season 2026" and "Week 10" each on one line, so a narrow screen now breaks as "Season 2026 ·" / "Week 10". It uses `white-space: nowrap` rather than non-breaking spaces, so the text still copies, searches and reads as plain "Season 2026 · Week 10". It is used by the standings, dashboard and participant headings and the game subtitle.
>
> The back button now stays on one line and truncates with an ellipsis when space is short, so long labels such as "Back to Packers @ Patriots" no longer push the header taller. At 320 px a label that needs more room than is left beside Share is shortened ("CHANGE SEASO…"); that is a deliberate trade for a steady header, and the full label is still what assistive technology reads. Verified in a browser at 320, 360 and 390 px.

**19. The game page subtitle runs two ideas together** (both)
"Season 2026 · Week 10 · Select a participant to see their picks." mixes context with an instruction. Split the instruction onto its own line or drop it; the chevrons already signal that rows are tappable. See [desktop-game-w9-final.png](ux-review/desktop-game-w9-final.png).

**20. No manual refresh on desktop** (desktop)
Scores poll every 60 seconds and pull-to-refresh is touch-only. A small refresh button beside "Scores as of" would help during live games.

**21. Kickoff times carry no timezone** (both)
"Sun 10:00 AM" is the viewer's local time, which is the right choice, but a pool spread across timezones may misread it. Append the short zone ("10:00 AM PT").

**22. Shared links have no preview** (both)
There are no Open Graph tags, so a link pasted into a group chat shows a bare URL. Sharing is a primary action here; a static `og:title`, `og:description` and `og:image` would cover every route.

> **Status: ✅ Done, but not yet seen in a real chat app.** `index.html` now carries Open Graph and X/Twitter card tags (title, the same description as the page's own, and a 1200 × 630 image with an alt text), and `public/og-image.png` is a flat, 62 KB branded image (no NFL marks) so it stays under the roughly 300 KB some chat apps allow.
>
> - **No `og:url` or canonical link, on purpose.** The site is one static page behind client-side routing, so one fixed URL would make every shared deep link point at a single page. Crawlers use the URL that was actually shared.
> - **The same preview for every route.** Crawlers do not run JavaScript, so a shared standings link shows the generic site preview, not that week's numbers. Per-page previews would need server-side rendering or pre-built pages, which is a larger change.
> - **Hosting:** the image is served with `Cross-Origin-Resource-Policy: cross-origin` (the global `same-origin` policy would tell browsers not to embed it elsewhere), a day-long cache, and is kept out of the SPA fallback.
>
> **Still to check after the next deploy:** paste a link into a real chat app, or use the Facebook Sharing Debugger or a similar validator, to confirm the preview renders. The tags, the image size and the hosting overrides are covered by tests, but I could not see the result in a real crawler from here.

**23. Pick names are cut to a letter or two at 320 px** (mobile)
On the participant page at 320 px the pick name gets only 47 px of room beside the 56 px team logo and the 72 px outcome column, but needs 89-100 px, so names show as "Ja…", "Be…" and "Br…". See [mobile-320-participant.png](ux-review/mobile-320-participant.png). Found while verifying finding 18. Let the name wrap or shrink, or give the logo and outcome column less room on very narrow screens.

## Suggested order of work

1. **Quick wins (small, low risk):** ~~1, 2, 4, 10, 11, 18~~ (all done).
2. **Navigation and structure:** ~~3, 6, 8, 9, 13~~ (all done).
3. **Feature work:** ~~5, 12, 22~~ (all done).
4. **Polish:** the remaining low-severity items.
