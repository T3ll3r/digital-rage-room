const STOP_WORDS = new Set(['a', 'an', 'and', 'at', 'for', 'from', 'in', 'is', 'it', 'my', 'of', 'on', 'the', 'this', 'to', 'with'])

const SUBJECT_GROUPS = [
  ['printer toner scanner scan paper print'],
  ['dns network router wifi wireless vpn firewall internet comms cable port'],
  ['deploy deployment deployed build production prod patch release friday hotfix migration'],
  ['password login cac authentication authenticate certificate access account'],
  ['server cloud database drive storage backup cache system'],
  ['code bug debug error failure exception ticket helpdesk software application'],
  ['email inbox meeting brief briefing powerpoint slide formation'],
  ['update restart windows laptop computer keyboard monitor mouse'],
]

function stem(word) {
  if (word.length > 6 && word.endsWith('ing')) return word.slice(0, -3)
  if (word.length > 5 && word.endsWith('ed')) return word.slice(0, -2)
  if (word.length > 4 && word.endsWith('s')) return word.slice(0, -1)
  return word
}

export function tokenizeForMatching(text) {
  return text
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu)?.map(stem).filter((word) => !STOP_WORDS.has(word)) ?? []
}

const GROUP_TOKENS = SUBJECT_GROUPS.map(([words]) => new Set(tokenizeForMatching(words)))

export function relatedSubjectTokens(subject) {
  const subjectTokens = new Set(tokenizeForMatching(subject))
  const relatedTokens = new Set(subjectTokens)
  for (const group of GROUP_TOKENS) {
    if ([...subjectTokens].some((token) => group.has(token))) {
      for (const token of group) relatedTokens.add(token)
    }
  }
  return { subjectTokens, relatedTokens }
}

export function selectRelatedMemeIndex(subject, memes, random = Math.random) {
  if (memes.length === 0) return -1

  const { subjectTokens, relatedTokens } = relatedSubjectTokens(subject)

  let bestScore = 0
  let bestIndexes = []
  memes.forEach((meme, index) => {
    const memeTokens = new Set(tokenizeForMatching(meme))
    let score = 0
    for (const token of memeTokens) {
      if (subjectTokens.has(token)) score += 4
      else if (relatedTokens.has(token)) score += 1
    }

    if (score > bestScore) {
      bestScore = score
      bestIndexes = [index]
    } else if (score === bestScore && score > 0) {
      bestIndexes.push(index)
    }
  })

  const candidates = bestIndexes.length > 0 ? bestIndexes : memes.map((_, index) => index)
  return candidates[Math.floor(random() * candidates.length)] ?? candidates[0]
}
