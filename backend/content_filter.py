import re
from typing import Optional

from responses import fail

# ── Age-appropriate content filter ─────────────────────────────────────────────
_RESTRICTED = [
    # Profanity
    "ass","arse","asshole","arsehole","bastard","bitch","bitches","bollocks",
    "bugger","bullshit","cock","cocks","crap","cum","cums","cumshot","cunt","cunts",
    "damn","dammit","dick","dicks","dickhead","douche","douchebag","dyke","faggot",
    "fag","fags","fart","farts","fuck","fucked","fucker","fucking","fucks","fuckin",
    "goddamn","goddammit","hell","horseshit","jackass","jerk","motherfucker","mofo",
    "nigga","nigger","piss","pissed","pissing","prick","pricks","pussy","pussies",
    "retard","retarded","shit","shite","shitty","shitting","slut","sluts",
    "sonofabitch","turd","twat","twats","wank","wanker","wankers","whore","whores",
    # Sexual
    "anal","blowjob","boner","boob","boobs","boobies","clitoris","clit","dildo",
    "erection","gangbang","handjob","hardcore","horny","intercourse","masturbate",
    "masturbation","masturbating","milf","naked","nude","nudes","orgasm","penis",
    "penises","porn","porno","pornography","prostitute","prostitution","rape",
    "raped","raping","sex","sexy","sperm","stripper","testicle","testicles",
    "vagina","vibrator","virgin","xxx",
    # Sexual phrases (innocuous words combined into an adult meaning)
    "blow job","hand job","oral sex","son of a bitch",
    "sleep with","sleeping with","slept with","in bed with","spend the night with",
    "spending the night with","make out with","making out with","make out",
    "making out","hook up with","hooking up with","hook up","hooking up",
    "hooked up with","friends with benefits","one night stand","get naked",
    "getting naked","take off your clothes","netflix and chill",
    # Drugs / alcohol
    "alcohol","beer","booze","cannabis","cocaine","coke","crack","drug","drugs",
    "ecstasy","mdma","heroin","high","marijuana","weed","pot","methamphetamine",
    "meth","opioid","opium","overdose","pills","stoned","vodka","whiskey","whisky",
    "tequila","gin","rum","wine",
    # Drug phrases
    "get high","getting high","do drugs","doing drugs","take drugs","smoke weed",
    # Violence / hate
    "bomb","bombing","choke","choked","choking","execute","executed","execution",
    "genocide","gore","gun","guns","hang","hanged","hanging","hate","hated",
    "hates","hating","kill","killed","killer","killing","kys",
    "murder","murdered","murderer","nazi","racist","racism","shoot","shooting",
    "stab","stabbing","suicide","terrorist","terrorism","torture","torturing",
    "weapon","weapons",
    # Violence phrases
    "beat up","beat him up","beat her up","beat you up","burn down","burn it down",
    "set fire to","blow up","blow it up",
    # Self-harm / suicide phrases
    "hurt myself","hurting myself","cut myself","cutting myself","harm myself",
    "self-harm","selfharm","self harm",
    "end my life","end it all","want to die","wanna die","should die","go die",
    "kill yourself","kill urself","hang yourself","shoot yourself",
    "jump off a bridge","jump off a building","better off dead",
    "not worth living","no reason to live",
    # Bullying / harassment
    "bully","bullying","bullied","loser","losers","pathetic","worthless",
    "idiot","idiots","stupid","dumb","ugly","freak","weirdo","fat",
    # Bullying phrases
    "nobody likes you","no one likes you","everybody hates you",
    "everyone hates you","no one wants you","no one cares about you",
]
_WORD_RE = re.compile(
    r'\b(' + '|'.join(re.escape(w) for w in _RESTRICTED if ' ' not in w) + r')\b',
    re.IGNORECASE,
)
_PHRASES = [w for w in _RESTRICTED if ' ' in w]

def _contains_restricted(text: str) -> Optional[str]:
    if not text:
        return None
    m = _WORD_RE.search(text)
    if m:
        return m.group(0)
    low = text.lower()
    for phrase in _PHRASES:
        if phrase in low:
            return phrase
    return None

def check_content(*fields: str) -> None:
    """Raises 400 if any field contains a restricted word."""
    for field in fields:
        word = _contains_restricted(field or "")
        if word:
            fail(f'Please use age-appropriate language. The word "{word}" is not allowed.')
