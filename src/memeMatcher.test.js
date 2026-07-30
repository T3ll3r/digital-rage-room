import { describe, expect, it } from 'vitest'
import { MEMES } from './data'
import { selectRelatedMemeIndex } from './memeMatcher'

describe('field meme matching', () => {
  it.each([
    ['printer errors', /printer|toner|scanner/i],
    ['DNS outage', /dns|network|router|wifi|vpn/i],
    ['Friday deploys', /deploy|build|prod|patch|friday/i],
    ['password expired', /password|login|cac|authentication/i],
  ])('matches %s to a related field meme', (subject, expectedWords) => {
    const index = selectRelatedMemeIndex(subject, MEMES, () => 0)

    expect(MEMES[index]).toMatch(expectedWords)
  })

  it('falls back to a valid randomized meme for an unknown subject', () => {
    const index = selectRelatedMemeIndex('quantum banana', MEMES, () => 0.999999)

    expect(index).toBe(MEMES.length - 1)
  })
})
