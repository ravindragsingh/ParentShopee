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

  // ── Sexual phrases (innocuous words combined into an adult meaning) ───────────
  'sleep with', 'sleeping with', 'slept with',
  'in bed with',
  'spend the night with', 'spending the night with',
  'make out with', 'making out with', 'make out', 'making out',
  'hook up with', 'hooking up with', 'hook up', 'hooking up', 'hooked up with',
  'friends with benefits',
  'one night stand',
  'get naked', 'getting naked',
  'take off your clothes',
  'netflix and chill',

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

  // ── Drug phrases ────────────────────────────────────────────────────────────
  'get high', 'getting high',
  'do drugs', 'doing drugs', 'take drugs',
  'smoke weed',

  // ── Violence / hate ──────────────────────────────────────────────────────────
  'bomb', 'bombing',
  'choke', 'choked', 'choking',
  'execute', 'executed', 'execution',
  'genocide',
  'gore',
  'gun', 'guns',
  'hang', 'hanged', 'hanging',
  'hate', 'hated', 'hates', 'hating',
  'kill', 'killed', 'killer', 'killing',
  'kys',
  'murder', 'murdered', 'murderer',
  'nazi',
  'racist', 'racism',
  'shoot', 'shooting',
  'stab', 'stabbing',
  'suicide',
  'terrorist', 'terrorism',
  'torture', 'torturing',
  'weapon', 'weapons',

  // ── Violence phrases ────────────────────────────────────────────────────────
  'beat up', 'beat him up', 'beat her up', 'beat you up',
  'burn down', 'burn it down',
  'set fire to',
  'blow up', 'blow it up',

  // ── Self-harm / suicide phrases ─────────────────────────────────────────────
  'hurt myself', 'hurting myself',
  'cut myself', 'cutting myself',
  'harm myself',
  'self-harm', 'selfharm', 'self harm',
  'end my life', 'end it all',
  'want to die', 'wanna die', 'should die', 'go die',
  'kill yourself', 'kill urself', 'hang yourself', 'shoot yourself',
  'jump off a bridge', 'jump off a building', 'better off dead',
  'not worth living', 'no reason to live',

  // ── Bullying / harassment ───────────────────────────────────────────────────
  'bully', 'bullying', 'bullied',
  'loser', 'losers',
  'pathetic', 'worthless',
  'idiot', 'idiots',
  'stupid', 'dumb', 'ugly', 'freak', 'weirdo', 'fat',

  // ── Bullying phrases ─────────────────────────────────────────────────────────
  'nobody likes you', 'no one likes you',
  'everybody hates you', 'everyone hates you',
  'no one wants you', 'no one cares about you',
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
