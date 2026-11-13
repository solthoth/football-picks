import config from '../public/staticwebapp.config.json'
import devWorkflow from '../.github/workflows/deploy-app-dev.yaml?raw'
import prodWorkflow from '../.github/workflows/deploy-app-prod.yaml?raw'

/** Parses a CSP header value into { directive -> source list }. */
function parseCsp(csp: string): Map<string, string[]> {
  return new Map(
    csp
      .split(';')
      .map((part) => part.trim().split(/\s+/))
      .filter(([name]) => name)
      .map(([name, ...sources]) => [name, sources]),
  )
}

const csp = parseCsp(config.globalHeaders['Content-Security-Policy'])

describe('staticwebapp.config.json', () => {
  it.each([
    ['dev', devWorkflow],
    ['prod', prodWorkflow],
  ])('CSP connect-src allows the %s live-scores blob container', (_env, workflow) => {
    // Without this the browser blocks the live-scores fetch and the site
    // silently falls back to the (stale) bundled results.
    const baseUrl = /VITE_SCORES_BASE_URL:\s*(\S+)/.exec(workflow)?.[1]
    expect(baseUrl).toBeDefined()
    expect(csp.get('connect-src')).toContain(new URL(baseUrl!).origin)
  })

  it('CSP only allows scripts from our own origin (no inline or eval)', () => {
    expect(csp.get('script-src')).toEqual(["'self'"])
  })

  it('caches content-hashed build assets for a year', () => {
    const assets = config.routes.find((route) => route.route === '/assets/*')
    expect(assets?.headers['cache-control']).toBe('public, max-age=31536000, immutable')
  })
})
