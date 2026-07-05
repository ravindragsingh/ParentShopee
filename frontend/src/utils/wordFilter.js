/**
 * Age-appropriate content filter for Reward Ur Kids.
 * Checks whole words only (word boundary match) — case-insensitive.
 * "classic" won't flag, "ass" alone will.
 */

const RESTRICTED_WORDS = [
  // ── Profanity ────────────────────────────────────────────────────────────────
  'ass', 'arse', 'asshole', 'arsehole',
  'bastard',
  'bitch', 'bitches',
  'bollocks',
  'bugger',
  'bullshit',
  'cock', 'cocks',
  'crap',
  'cum', 'cums', 'cumshot',
  'cunt', 'cunts',
  'damn', 'dammit',
  'dick', 'dicks', 'dickhead',
  'douche', 'douchebag',
  'dyke',
  'faggot', 'fag', 'fags',
  'fart', 'farts',
  'fuck', 'fucked', 'fucker', 'fucking', 'fucks', 'fuckin',
  'goddamn', 'goddammit',
  'hell',          // context-dependent but better safe for kids
  'horseshit',
  'jackass',
  'jerk',
  'motherfucker', 'mofo',
  'nigga', 'nigger',
  'piss', 'pissed', 'pissing',
  'prick', 'pricks',
  'pussy', 'pussies',
  'retard', 'retarded',
  'shit', 'shite', 'shitty', 'shitting',
  'slut', 'sluts',
  'son of a bitch', 'sonofabitch',
  'turd',
  'twat', 'twats',
  'wank', 'wanker', 'wankers',
  'whore', 'whores',

  // ── Sexual terms ─────────────────────────────────────────────────────────────
  'anal',
  'blowjob', 'blow job',
  'boob', 'boobs', 'boobies',
  'boner',
  'clitoris', 'clit',
  'dildo',
  'erection',
  'gangbang',
  'handjob', 'hand job',
  'hardcore',
  'horny',
  'intercourse',
  'masturbate', 'masturbation', 'masturbating',
  'milf',
  'naked',
  'nude', 'nudes',
  'oral sex',
  'orgasm',
  'penis', 'penises',
  'porn', 'porno', 'pornography',
  'prostitute', 'prostitution',
  'rape', 'raped', 'raping',
  'sex', 'sexy',
  'sperm',
  'stripper',
  'testicle', 'testicles',
  'vagina',
  'vibrator',
  'virgin',
  'xxx',

  // ── Drugs / alcohol ──────────────────────────────────────────────────────────
  'alcohol',
  'beer',
  'booze',
  'cannabis',
  'cocaine', 'coke',
  'crack',
  'drug', 'drugs',
  'ecstasy', 'mdma',
  'heroin',
  'high',           // context-dependent
  'marijuana', 'weed', 'pot',
  'methamphetamine', 'meth',
  'opioid', 'opium',
  'overdose',
  'pills',
  'stoned',
  'vodka', 'whiskey', 'whisky', 'tequila', 'gin', 'rum',
  'wine',           // context-dependent but safe to flag

  // ── Violence / hate ──────────────────────────────────────────────────────────
  'bomb', 'bombing',
  'choke', 'choking',
  'execute', 'execution',
  'genocide',
  'gore',
  'gun', 'guns',
  'hang', 'hanging',
  'hate',
  'kill', 'killed', 'killer', 'killing',
  'murder', 'murdered', 'murderer',
  'nazi',
  'racist', 'racism',
  'shoot', 'shooting',
  'stab', 'stabbing',
  'suicide',
  'terrorist', 'terrorism',
  'torture', 'torturing',
  'weapon', 'weapons',
]

// Pre-build a regex that matches whole words only, case-insensitive.
// Multi-word phrases (e.g. "blow job") are checked with a simple string search.
const singleWords = RESTRICTED_WORDS.filter(w => !w.includes(' '))
const multiPhrases = RESTRICTED_WORDS.filter(w => w.includes(' '))

const wordRegex = new RegExp(
  `\\b(${singleWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'i'
)

/**
 * Returns the first found restricted word/phrase, or null if clean.
 * @param {string} text
 * @returns {string|null}
 */
export function findRestrictedWord(text) {
  if (!text) return null
  const lower = text.toLowerCase()

  // Check single-word matches (whole-word boundary)
  const m = wordRegex.exec(text)
  if (m) return m[0]

  // Check multi-word phrases (substring match is fine since they're phrases)
  for (const phrase of multiPhrases) {
    if (lower.includes(phrase)) return phrase
  }

  return null
}

/**
 * Returns true if the text passes the filter (no restricted content).
 * @param {string} text
 * @returns {boolean}
 */
export function isClean(text) {
  return findRestrictedWord(text) === null
}

/**
 * Checks multiple fields at once.
 * @param {...string} fields
 * @returns {{ ok: boolean, word: string|null, message: string|null }}
 */
export function checkFields(...fields) {
  for (const field of fields) {
    const word = findRestrictedWord(field)
    if (word) {
      return {
        ok: false,
        word,
        message: `Please use age-appropriate language. The word "${word}" is not allowed.`,
      }
    }
  }
  return { ok: true, word: null, message: null }
}
