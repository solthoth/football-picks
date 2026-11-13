/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import indexHtml from '../index.html?raw'

const doc = new DOMParser().parseFromString(indexHtml, 'text/html')
const content = (selector: string) => doc.querySelector(selector)?.getAttribute('content') ?? undefined
const og = (property: string) => content(`meta[property="og:${property}"]`)

describe('share preview metadata (index.html)', () => {
  it('describes the site as a website with a title and description for link previews', () => {
    expect(og('type')).toBe('website')
    expect(og('site_name')).toBe('Football Picks')
    expect(og('title')).toBe('Football Picks')
    expect(og('description')).toBeTruthy()
  })

  it('uses the same description as the page itself, so the two never drift apart', () => {
    expect(og('description')).toBe(content('meta[name="description"]'))
  })

  it('points og:image at an absolute https URL, which crawlers require', () => {
    const image = og('image')
    expect(image).toBeDefined()
    const url = new URL(image as string)
    expect(url.protocol).toBe('https:')
    expect(url.pathname).toBe('/og-image.png')
  })

  it('declares the image size and a text alternative', () => {
    expect(og('image:width')).toBe('1200')
    expect(og('image:height')).toBe('630')
    expect(og('image:alt')).toBeTruthy()
  })

  it('asks for the large-image card on X / Twitter', () => {
    expect(content('meta[name="twitter:card"]')).toBe('summary_large_image')
  })

  it('does not set a static og:url, which would make every shared deep link canonicalise to one page', () => {
    // The app is a single static page behind client-side routing, so one fixed og:url would be wrong for every
    // route but one. Without it, crawlers use the URL that was actually shared.
    expect(og('url')).toBeUndefined()
    expect(doc.querySelector('link[rel="canonical"]')).toBeNull()
  })
})

describe('share preview image (public/og-image.png)', () => {
  // Vitest runs from the repository root.
  const file = resolve(process.cwd(), 'public/og-image.png')

  it('exists and is a PNG', () => {
    const bytes = readFileSync(file)
    expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  })

  it('is exactly the size the metadata declares (1200 x 630)', () => {
    const header = readFileSync(file)
    expect({ width: header.readUInt32BE(16), height: header.readUInt32BE(20) }).toEqual({ width: 1200, height: 630 })
  })

  it('is small enough for every crawler (under 300 KB)', () => {
    expect(readFileSync(file).length).toBeLessThan(300 * 1024)
  })
})
