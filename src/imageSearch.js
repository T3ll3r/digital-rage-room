export const MEME_TEMPLATE_API = 'https://api.memegen.link/templates/'

const BLOCKED_TEMPLATE_TERMS = ['adult', 'blood', 'corpse', 'explicit', 'gore', 'nude', 'nudity', 'porn', 'sexual']

function normalizeSubject(subject) {
  const printable = Array.from(subject, (character) => {
    const codePoint = character.codePointAt(0)
    return codePoint <= 31 || codePoint === 127 ? ' ' : character
  }).join('')
  return printable.replace(/\s+/g, ' ').trim().slice(0, 80)
}

function isReviewedTemplate(template) {
  if (!template.id || !template.name || !template.blank) return false
  const searchableText = `${template.id} ${template.name}`.toLowerCase()
  if (BLOCKED_TEMPLATE_TERMS.some((term) => searchableText.includes(term))) return false
  try {
    return new URL(template.blank).hostname === 'api.memegen.link'
  } catch {
    return false
  }
}

export async function searchTopicImage(subject, { fetchImpl = fetch, random = Math.random } = {}) {
  const normalized = normalizeSubject(subject)
  if (!normalized) throw new Error('A subject is required for image search.')

  const response = await fetchImpl(MEME_TEMPLATE_API, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`Meme search failed (${response.status}).`)

  const templates = (await response.json()).filter(isReviewedTemplate)
  if (templates.length === 0) throw new Error('No reviewed meme templates were available.')

  const selected = templates[Math.floor(random() * templates.length)] ?? templates[0]

  return {
    src: `https://api.memegen.link/images/${encodeURIComponent(selected.id)}/${encodeURIComponent(normalized)}.jpg`,
    kind: `${normalized} meme`,
    credit: `${selected.name} · Memegen.link`,
    pageUrl: 'https://memegen.link/',
  }
}