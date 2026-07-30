import { relatedSubjectTokens, tokenizeForMatching } from './memeMatcher.js'

export const MEME_TEMPLATE_API = 'https://api.memegen.link/templates/'

const SAFE_TEMPLATE_TAGS = {
  aag: 'root cause theory mystery explanation',
  ackbar: 'security phishing password trap alert',
  astronaut: 'cloud production server bug always',
  cake: 'office printer work ticket paperwork',
  cmm: 'change requirement meeting debate policy',
  disastergirl: 'fire outage incident production deploy',
  doge: 'network wifi computer software confused',
  drake: 'choice option software tool upgrade',
  fine: 'error failure broken fire outage production deploy',
  gb: 'code debug dns network server database brain',
  grumpycat: 'password email meeting user frustration',
  gru: 'plan project deployment update migration',
  noah: 'unknown error bug failure confusion',
  officespace: 'printer office ticket work email meeting',
  'panik-kalm-panik': 'alert outage incident deploy production error',
  patrick: 'migration move server database cloud',
  pigeon: 'bug error dns network confusion user',
  spiderman: 'merge conflict duplicate code blame',
  stonks: 'budget metric cloud server dashboard management',
  stop: 'bug alert security incident error',
  success: 'fix build deploy patch password success',
  wonka: 'ticket request user helpdesk password',
}

const GENERIC_SUBJECT_TERMS = new Set(['broken', 'error', 'expire', 'failure', 'issue', 'outage', 'problem'])

function normalizeSubject(subject) {
  const printable = Array.from(subject, (character) => {
    const codePoint = character.codePointAt(0)
    return codePoint <= 31 || codePoint === 127 ? ' ' : character
  }).join('')
  return printable.replace(/\s+/g, ' ').trim().slice(0, 80)
}

function templateScore(template, subjectTokens, relatedTokens) {
  const tagTokens = new Set(tokenizeForMatching(`${template.name} ${SAFE_TEMPLATE_TAGS[template.id]}`))
  let score = 0
  for (const token of tagTokens) {
    if (subjectTokens.has(token)) score += GENERIC_SUBJECT_TERMS.has(token) ? 1 : 4
    else if (relatedTokens.has(token)) score += 1
  }
  return score
}

function isReviewedTemplate(template) {
  if (!SAFE_TEMPLATE_TAGS[template.id] || !template.blank) return false
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

  const { subjectTokens, relatedTokens } = relatedSubjectTokens(normalized)
  const scores = templates.map((template) => templateScore(template, subjectTokens, relatedTokens))
  const bestScore = Math.max(...scores)
  const candidates = bestScore > 0
    ? templates.filter((_, index) => scores[index] === bestScore)
    : templates
  const selected = candidates[Math.floor(random() * candidates.length)] ?? candidates[0]

  return {
    src: selected.blank,
    kind: `${normalized} meme`,
    credit: `${selected.name} · Memegen.link`,
    pageUrl: 'https://memegen.link/',
  }
}