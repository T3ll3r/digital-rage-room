import { describe, expect, it, vi } from 'vitest'
import { MEME_TEMPLATE_API, searchTopicImage } from './imageSearch'

describe('safe-humor image search', () => {
  it('queries the public meme-template endpoint', () => {
    expect(MEME_TEMPLATE_API).toBe('https://api.memegen.link/templates/')
  })

  it('selects a safe humorous template related to the subject', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'fine', name: 'This is Fine', blank: 'https://api.memegen.link/images/fine.jpg' },
        { id: 'officespace', name: 'That Would Be Great', blank: 'https://api.memegen.link/images/officespace.jpg' },
        { id: 'unknown-template', name: 'Unreviewed Template', blank: 'https://example.com/unknown.jpg' },
      ],
    })

    const result = await searchTopicImage('printer errors', { fetchImpl, random: () => 0 })

    expect(fetchImpl).toHaveBeenCalledWith(MEME_TEMPLATE_API, expect.any(Object))
    expect(result.src).toBe('https://api.memegen.link/images/officespace.jpg')
    expect(result.kind).toBe('printer errors meme')
    expect(result.credit).toMatch(/That Would Be Great.*Memegen\.link/i)
  })

  it('randomizes among reviewed templates when no subject tag matches', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'doge', name: 'Doge', blank: 'https://api.memegen.link/images/doge.jpg' },
        { id: 'wonka', name: 'Condescending Wonka', blank: 'https://api.memegen.link/images/wonka.jpg' },
      ],
    })

    const result = await searchTopicImage('quantum banana', { fetchImpl, random: () => 0.75 })

    expect(result.src).toContain('/wonka.jpg')
  })

  it('matches plural and related deployment terms to a deployment meme', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'stonks', name: 'Stonks', blank: 'https://api.memegen.link/images/stonks.jpg' },
        { id: 'success', name: 'Success Kid', blank: 'https://api.memegen.link/images/success.jpg' },
      ],
    })

    const result = await searchTopicImage('Friday deploys', { fetchImpl, random: () => 0 })

    expect(result.src).toContain('/success.jpg')
  })

  it('rejects an empty subject without requesting the internet', async () => {
    const fetchImpl = vi.fn()

    await expect(searchTopicImage('   ', { fetchImpl })).rejects.toThrow(/subject/i)
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
