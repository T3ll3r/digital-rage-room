const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'
const BLOCKED_TERMS = [
  'adult',
  'blood',
  'corpse',
  'explicit',
  'gore',
  'graphic',
  'nude',
  'nudity',
  'porn',
  'sexual',
]

function normalizeSubject(subject) {
  const printable = Array.from(subject, (character) => {
    const codePoint = character.codePointAt(0)
    return codePoint <= 31 || codePoint === 127 ? ' ' : character
  }).join('')
  return printable.replace(/\s+/g, ' ').trim().slice(0, 80)
}

export function buildCommonsSearchUrl(subject, { mode = 'humor' } = {}) {
  const normalized = normalizeSubject(subject)
  if (!normalized) throw new Error('A subject is required for image search.')

  const escapedSubject = normalized.replace(/["\\]/g, ' ')
  const primaryTerm = escapedSubject.split(/\s+/)[0].replace(/[^\p{L}\p{N}_-]/gu, '')
  let subjectQuery = `"${escapedSubject}"`
  if (mode === 'exact') subjectQuery = `intitle:"${escapedSubject}"`
  if (mode === 'primary') subjectQuery = `intitle:${primaryTerm}`
  if (mode === 'broad') subjectQuery = escapedSubject
  const humorTerms = mode === 'humor' ? ' funny wholesome' : ''
  const safeQuery = `${subjectQuery}${humorTerms} filetype:bitmap -nudity -explicit -gore -violence`
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: safeQuery,
    gsrnamespace: '6',
    gsrlimit: '30',
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: '1400',
    format: 'json',
    origin: '*',
  })

  return `${COMMONS_API}?${params}`
}

function isSafeRasterImage(page) {
  const info = page.imageinfo?.[0]
  if (!info?.thumburl || !/^image\/(?:jpeg|png|webp)$/i.test(info.mime ?? '')) return false

  const searchableText = `${page.title} ${info.descriptionurl ?? ''}`.toLowerCase()
  return !BLOCKED_TERMS.some((term) => searchableText.includes(term))
}

export async function searchTopicImage(subject, { fetchImpl = fetch, random = Math.random } = {}) {
  const normalized = normalizeSubject(subject)
  if (!normalized) throw new Error('A subject is required for image search.')

  let candidates = []
  for (const mode of ['humor', 'exact', 'primary', 'broad']) {
    const response = await fetchImpl(buildCommonsSearchUrl(normalized, { mode }), {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) continue

    const payload = await response.json()
    candidates = Object.values(payload.query?.pages ?? {}).filter(isSafeRasterImage)
    if (candidates.length > 0) break
  }
  if (candidates.length === 0) throw new Error('No safe humorous image results were found.')

  const selected = candidates[Math.floor(random() * candidates.length)] ?? candidates[0]
  const info = selected.imageinfo[0]

  return {
    src: info.thumburl,
    kind: normalized,
    credit: 'Wikimedia Commons · safe-humor search',
    pageUrl: info.descriptionurl,
  }
}
