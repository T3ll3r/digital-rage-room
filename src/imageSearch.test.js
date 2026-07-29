import { describe, expect, it, vi } from 'vitest'
import { buildCommonsSearchUrl, searchTopicImage } from './imageSearch'

describe('safe-humor image search', () => {
  it('builds a subject-aware Commons query with safe-humor bias and exclusions', () => {
    const url = new URL(buildCommonsSearchUrl('Friday deploys'))
    const query = url.searchParams.get('gsrsearch')

    expect(url.hostname).toBe('commons.wikimedia.org')
    expect(query).toContain('Friday deploys')
    expect(query).toMatch(/funny|humor|wholesome/i)
    expect(query).toContain('-nudity')
    expect(url.searchParams.get('origin')).toBe('*')
  })

  it('randomly selects a safe raster image from internet results', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        query: {
          pages: {
            1: { title: 'File:Wholesome printer joke.jpg', imageinfo: [{ thumburl: 'https://upload.wikimedia.org/safe-printer.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:Safe', mime: 'image/jpeg' }] },
            2: { title: 'File:Office cartoon.png', imageinfo: [{ thumburl: 'https://upload.wikimedia.org/office-cartoon.png', descriptionurl: 'https://commons.wikimedia.org/wiki/File:Cartoon', mime: 'image/png' }] },
            3: { title: 'File:Explicit nudity.jpg', imageinfo: [{ thumburl: 'https://upload.wikimedia.org/blocked.jpg', mime: 'image/jpeg' }] },
          },
        },
      }),
    })

    const result = await searchTopicImage('printer errors', { fetchImpl, random: () => 0.75 })

    expect(fetchImpl).toHaveBeenCalledOnce()
    expect(result.src).toBe('https://upload.wikimedia.org/office-cartoon.png')
    expect(result.kind).toBe('printer errors')
    expect(result.credit).toMatch(/Wikimedia Commons/i)
  })

  it('rejects an empty subject without requesting the internet', async () => {
    const fetchImpl = vi.fn()

    await expect(searchTopicImage('   ', { fetchImpl })).rejects.toThrow(/subject/i)
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
