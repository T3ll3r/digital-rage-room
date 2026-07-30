import { describe, expect, it, vi } from 'vitest'
import { MEME_TEMPLATE_API, searchTopicImage } from './imageSearch'

describe('safe-humor image search', () => {
  it('queries the public meme-template endpoint', () => {
    expect(MEME_TEMPLATE_API).toBe('https://api.memegen.link/templates/')
  })

  it('renders the subject into a randomized safe meme template', async () => {
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
    expect(result.src).toBe('https://api.memegen.link/images/fine/printer%20errors.jpg')
    expect(result.kind).toBe('printer errors meme')
    expect(result.credit).toMatch(/This is Fine.*Memegen\.link/i)
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

    expect(result.src).toContain('/wonka/quantum%20banana.jpg')
  })

  it('expands the pool to safe internet templates without admitting blocked templates', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'doge', name: 'Doge', blank: 'https://api.memegen.link/images/doge.jpg' },
        { id: 'explicit-adult', name: 'Explicit Adult', blank: 'https://api.memegen.link/images/explicit-adult.jpg' },
        { id: 'wholesome-chaos', name: 'Wholesome Chaos', blank: 'https://api.memegen.link/images/wholesome-chaos.jpg' },
      ],
    })

    const result = await searchTopicImage('quantum banana', { fetchImpl, random: () => 0.999999 })

    expect(result.src).toContain('/wholesome-chaos/quantum%20banana.jpg')
    expect(result.src).not.toContain('explicit-adult')
  })

  it('varies known hostile subjects across the broader safe template pool', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'officespace', name: 'That Would Be Great', blank: 'https://api.memegen.link/images/officespace.jpg' },
        { id: 'wholesome-chaos', name: 'Wholesome Chaos', blank: 'https://api.memegen.link/images/wholesome-chaos.jpg' },
      ],
    })

    const result = await searchTopicImage('printer errors', { fetchImpl, random: () => 0.999999 })

    expect(result.src).toContain('/wholesome-chaos/printer%20errors.jpg')
  })

  it('renders deployment subjects into randomized meme templates', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'stonks', name: 'Stonks', blank: 'https://api.memegen.link/images/stonks.jpg' },
        { id: 'success', name: 'Success Kid', blank: 'https://api.memegen.link/images/success.jpg' },
      ],
    })

    const result = await searchTopicImage('Friday deploys', { fetchImpl, random: () => 0 })

    expect(result.src).toContain('/stonks/Friday%20deploys.jpg')
  })

  it('rejects an empty subject without requesting the internet', async () => {
    const fetchImpl = vi.fn()

    await expect(searchTopicImage('   ', { fetchImpl })).rejects.toThrow(/subject/i)
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
