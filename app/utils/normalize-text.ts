const MINOR_WORDS = new Set([
  'a',
  'e',
  'o',
  'as',
  'os',
  'de',
  'do',
  'da',
  'dos',
  'das',
  'em',
  'no',
  'na',
  'nos',
  'nas',
  'por',
  'com',
  'sem',
  'sob',
  'para',
  'pelo',
  'pela',
  'pelos',
  'pelas',
  'ao',
  'aos',
  'um',
  'uma',
  'uns',
  'umas',
])

/**
 * Capitaliza texto em title case (português).
 * Primeira palavra sempre maiúscula; preposições/artigos em minúscula.
 */
export function titleCase(text: string): string {
  if (!text)
    return text
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word, i) => {
      const lower = word.toLowerCase()
      if (i > 0 && MINOR_WORDS.has(lower))
        return lower
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}
