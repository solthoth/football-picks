import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '../testUtils/renderWithRouter'
import { BackLink } from './BackLink'

describe('BackLink', () => {
  it('is a real link to the fallback route, so it can be opened in a new tab or copied', () => {
    renderWithRouter(<BackLink to="/season/2026/week/1" label="Back to standings" />)

    expect(screen.getByRole('link', { name: 'Back to standings' })).toHaveAttribute('href', '/season/2026/week/1')
  })

  it('navigates to the fallback route when there is no screen to return to', async () => {
    const user = userEvent.setup()
    const { visited } = renderWithRouter(<BackLink to="/season/2026/week/1" label="Back" />, { initialEntries: ['/here'] })

    await user.click(screen.getByRole('link', { name: 'Back' }))

    expect(visited).toEqual(['/here', '/season/2026/week/1'])
  })

  it('pops history instead of pushing when the user came from another screen in the app', async () => {
    const user = userEvent.setup()
    const { visited } = renderWithRouter(<BackLink to="/fallback" label="Back to Kiko" pop />, {
      initialEntries: ['/kiko', '/game'],
      initialIndex: 1,
    })

    await user.click(screen.getByRole('link', { name: 'Back to Kiko' }))

    expect(visited).toEqual(['/game', '/kiko'])
    expect(screen.getByTestId('location')).toHaveTextContent('/kiko')
  })

  it('leaves modified clicks (new tab / new window) to the browser', async () => {
    const user = userEvent.setup()
    renderWithRouter(<BackLink to="/fallback" label="Back" pop />, { initialEntries: ['/kiko', '/game'], initialIndex: 1 })

    await user.keyboard('{Control>}')
    await user.click(screen.getByRole('link', { name: 'Back' }))
    await user.keyboard('{/Control}')

    expect(screen.getByTestId('location')).toHaveTextContent('/game')
  })

  it('keeps a long label on one line, truncating with an ellipsis rather than wrapping to a second line', () => {
    renderWithRouter(<BackLink to="/g" label="Back to Packers @ Patriots" />)

    const link = screen.getByRole('link', { name: 'Back to Packers @ Patriots' })
    expect(link).toHaveStyle({ minWidth: '0', maxWidth: '100%' })
    expect(within(link).getByText('Back to Packers @ Patriots')).toHaveStyle({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    })
  })
})
