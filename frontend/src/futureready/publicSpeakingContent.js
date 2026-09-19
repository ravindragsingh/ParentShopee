// Interactive lesson + quiz content for each age-group module under the
// "Public Speaking" topic. Same split as leadershipContent.js: the backend's
// learning_modules catalog seeds the metadata, this file holds the content.
export const PUBLIC_SPEAKING_CONTENT = {
  'public-speaking-4-6': {
    slides: [
      { emoji: '🎤', title: 'What is public speaking?', text: "Public speaking is talking to a group of people so everyone can hear and understand you — like sharing news at circle time." },
      { emoji: '🔊', title: 'A loud, clear voice', text: "Speaking loud enough for the last person in the room to hear you, and saying your words clearly, helps everyone follow along." },
      { emoji: '👀', title: 'Looking at people', text: "Looking at the people listening to you, instead of the floor, helps them feel like you're really talking to them." },
      { emoji: '🧍', title: 'Standing tall', text: "Standing up straight instead of slouching or fidgeting helps people pay attention to what you're saying." },
      { emoji: '📖', title: 'Telling a story', text: "A good story has a beginning (what happened first), a middle (what happened next), and an end (how it finished)." },
      { emoji: '🌬️', title: 'Taking a deep breath', text: "If you feel nervous before talking, taking one slow, deep breath can help you feel calmer." },
      { emoji: '🔁', title: 'Practice helps', text: "Saying what you want to share out loud a few times, even just to a stuffed animal, makes it easier when it's time for real." },
    ],
    quiz: [
      {
        question: 'What is public speaking?',
        choices: ['Talking to a group so everyone can hear you', 'Whispering to one friend'],
        correctIndex: 0,
        explanation: 'Public speaking means sharing with a group, loud and clear enough for everyone to hear.',
      },
      {
        question: 'Where should you look while you talk to a group?',
        choices: ['At the people listening', 'Down at the floor'],
        correctIndex: 0,
        explanation: 'Looking at your listeners helps them feel like you\'re really talking to them.',
      },
      {
        question: 'What are the three parts of a story?',
        choices: ['A beginning, a middle, and an end', 'Just a beginning'],
        correctIndex: 0,
        explanation: 'A good story has a beginning, a middle, and an end.',
      },
      {
        question: 'What can help if you feel nervous before talking?',
        choices: ['Taking a slow, deep breath', 'Running away'],
        correctIndex: 0,
        explanation: 'A slow, deep breath can help you feel calmer before you speak.',
      },
      {
        question: 'Why is practicing what you want to say helpful?',
        choices: ['It makes it easier when it\'s time for real', 'It makes no difference at all'],
        correctIndex: 0,
        explanation: 'Practicing out loud, even to a stuffed animal, makes the real thing easier.',
      },
    ],
  },

  'public-speaking-7-9': {
    slides: [
      { emoji: '📖', title: 'What makes a good story', text: "A good story has a clear beginning, middle, and end — and something interesting happens in the middle that makes people want to know what happens next." },
      { emoji: '🗣️', title: 'Practicing out loud', text: "Reading your words silently in your head feels different from saying them out loud — practicing out loud, even alone, catches tricky parts before the real thing." },
      { emoji: '🐢', title: 'Slow down', text: "When people get nervous, they often talk too fast. Speaking a little slower than feels natural usually sounds just right to listeners." },
      { emoji: '👀', title: 'Eye contact with the audience', text: "Looking around at a few different people while you talk, instead of just one spot, helps everyone feel included." },
      { emoji: '👋', title: 'Using your hands', text: "Simple hand gestures — like showing a size, or pointing at something — can help explain your idea without extra words." },
      { emoji: '😅', title: "It's normal to feel nervous", text: "Almost everyone feels a little nervous before speaking to a group — even people who do it all the time. That feeling doesn't mean something is wrong." },
      { emoji: '🤔', title: 'Checking they understand', text: "Asking \"does that make sense?\" partway through gives your listeners a chance to ask a question if they're confused." },
      { emoji: '💡', title: 'What is a "pitch"?', text: "A pitch is explaining an idea quickly and saying why it's a good one — like convincing a friend which game to play and why it'll be fun." },
    ],
    quiz: [
      {
        question: 'What makes a story interesting to listen to?',
        choices: ['Something happens in the middle that makes people curious', 'Nothing happens at all'],
        correctIndex: 0,
        explanation: 'An interesting middle part makes listeners want to know what happens next.',
      },
      {
        question: 'Why practice your words out loud instead of just in your head?',
        choices: ['It catches tricky parts before the real thing', 'It doesn\'t help at all'],
        correctIndex: 0,
        explanation: 'Saying words out loud feels different and reveals parts that need more practice.',
      },
      {
        question: 'What do nervous speakers often do without noticing?',
        choices: ['Talk too fast', 'Talk too slowly'],
        correctIndex: 0,
        explanation: 'Nervousness often speeds people up without them realizing it.',
      },
      {
        question: 'Why look at a few different people while speaking, not just one spot?',
        choices: ['It helps everyone feel included', 'It\'s required by law'],
        correctIndex: 0,
        explanation: 'Spreading eye contact around the room helps the whole audience feel included.',
      },
      {
        question: 'Is it normal to feel nervous before speaking to a group?',
        choices: ['Yes, almost everyone does', 'No, only beginners do'],
        correctIndex: 0,
        explanation: 'Even experienced speakers often feel nervous beforehand.',
      },
      {
        question: 'What is a "pitch"?',
        choices: ['Explaining an idea quickly and why it\'s good', 'A type of story with no ending'],
        correctIndex: 0,
        explanation: 'A pitch is a quick, convincing explanation of an idea.',
      },
    ],
  },

  'public-speaking-10-13': {
    slides: [
      { emoji: '🎯', title: 'Knowing your audience', text: "Thinking about who you're talking to — what they already know, and what they care about — helps you decide what to say and how to say it." },
      { emoji: '🏗️', title: 'Structuring a presentation', text: "A clear structure — an opening that grabs attention, a few main points, and a short conclusion — is much easier for an audience to follow than jumping around." },
      { emoji: '📝', title: 'Notes vs. memorizing', text: "Using a few key-word notes to jog your memory usually sounds more natural than memorizing every word, which can make you freeze if you forget a line." },
      { emoji: '😰', title: 'Managing nervousness', text: "Deep breathing, practicing enough times that it feels familiar, and reminding yourself \"it's okay to be a little nervous\" all genuinely help calm nerves." },
      { emoji: '💡', title: 'Pitching persuasively', text: "A persuasive pitch doesn't just explain what an idea is — it explains why the listener should care, in terms that matter to them specifically." },
      { emoji: '🖼️', title: 'Keeping visual aids simple', text: "A slide or poster with too many words competes with you for attention — a few key words or a picture support what you're saying instead of repeating it." },
      { emoji: '❓', title: 'Handling questions', text: "It's okay to pause and think before answering a question, or to say \"that's a great question, let me think\" instead of rushing an answer." },
    ],
    quiz: [
      {
        question: 'Why think about your audience before speaking?',
        choices: ['It helps you decide what to say and how to say it', 'The audience never matters'],
        correctIndex: 0,
        explanation: 'Knowing what your audience cares about shapes an effective presentation.',
      },
      {
        question: 'What makes a presentation easy to follow?',
        choices: ['A clear opening, main points, and conclusion', 'Jumping between random ideas'],
        correctIndex: 0,
        explanation: 'A clear structure helps the audience follow along.',
      },
      {
        question: 'Why might key-word notes work better than memorizing every word?',
        choices: ['Forgetting a memorized line can make you freeze', 'Notes are always required'],
        correctIndex: 0,
        explanation: 'Notes let you speak naturally without the risk of freezing over a forgotten exact word.',
      },
      {
        question: 'What makes a pitch persuasive?',
        choices: ['Explaining why the listener should care, in terms that matter to them', 'Using as many words as possible'],
        correctIndex: 0,
        explanation: 'A persuasive pitch connects the idea to what the specific listener cares about.',
      },
      {
        question: 'What\'s a risk of a slide with too many words on it?',
        choices: ['It competes with you for the audience\'s attention', 'It has no effect either way'],
        correctIndex: 0,
        explanation: 'A busy slide can pull attention away from the speaker instead of supporting them.',
      },
      {
        question: 'What\'s okay to do when asked a tough question?',
        choices: ['Pause and think before answering', 'Panic and refuse to answer'],
        correctIndex: 0,
        explanation: 'Taking a moment to think leads to a better answer than rushing.',
      },
    ],
  },

  'public-speaking-13-17': {
    slides: [
      { emoji: '👂', title: 'Reading the room', text: "Noticing an audience's reactions — confusion, boredom, engagement — while you're speaking lets you adjust in real time, like slowing down or adding an example." },
      { emoji: '🛗', title: 'The elevator pitch', text: "An elevator pitch explains an idea clearly in the time it takes for a short elevator ride — it forces you to identify what actually matters most about it." },
      { emoji: '⚖️', title: 'Ethos, pathos, logos', text: "Persuasive speaking often blends credibility (why should they trust you), emotion (why should they care), and logic (why does this make sense) — relying on only one usually falls flat." },
      { emoji: '📖', title: 'Storytelling for impact', text: "A story with real setup, a genuine conflict or challenge, and a resolution sticks with an audience far longer than a list of facts does." },
      { emoji: '🛡️', title: 'Handling pushback gracefully', text: "Responding to a tough or even hostile question calmly, without getting defensive, usually earns more respect than winning the argument would." },
      { emoji: '🎭', title: 'Body language and vocal variety', text: "Varying your pace, volume, and pauses — instead of speaking in one flat tone — keeps an audience's attention and emphasizes your most important points." },
      { emoji: '💪', title: 'Overcoming stage fright', text: "Thorough preparation is the most reliable cure for stage fright — confidence usually comes from knowing your material cold, not from a personality trait some people just have." },
      { emoji: '💻', title: 'Presenting virtually vs. in person', text: "Virtual presentations lose most body language cues, so speaking with more vocal energy and checking in verbally (\"does everyone see the screen okay?\") matters even more." },
    ],
    quiz: [
      {
        question: 'What does "reading the room" let a speaker do?',
        choices: ['Adjust in real time based on audience reactions', 'Ignore the audience completely'],
        correctIndex: 0,
        explanation: 'Noticing audience reactions lets a speaker adapt, like slowing down or adding an example.',
      },
        {
        question: 'What is an "elevator pitch"?',
        choices: ['A clear explanation of an idea in a very short time', 'A speech given inside an actual elevator only'],
        correctIndex: 0,
        explanation: 'An elevator pitch forces you to identify what matters most about an idea, briefly.',
      },
      {
        question: 'Why do persuasive speeches often combine credibility, emotion, and logic?',
        choices: ['Relying on just one usually falls flat', 'Only logic ever matters'],
        correctIndex: 0,
        explanation: 'Blending trust, emotion, and logic is more persuasive than any one alone.',
      },
      {
        question: 'Why does storytelling stick with an audience better than a list of facts?',
        choices: ['A real setup, conflict, and resolution is more memorable', 'Facts are always more memorable'],
        correctIndex: 0,
        explanation: 'A structured story tends to be far more memorable than a plain list of facts.',
      },
      {
        question: 'What usually earns more respect when facing a tough question?',
        choices: ['Responding calmly without getting defensive', 'Getting defensive and arguing back'],
        correctIndex: 0,
        explanation: 'A calm, non-defensive response tends to earn more respect than winning an argument.',
      },
      {
        question: 'What does varying your pace, volume, and pauses do for a speech?',
        choices: ['Keeps attention and emphasizes key points', 'Confuses the audience for no reason'],
        correctIndex: 0,
        explanation: 'Vocal variety keeps an audience engaged and highlights what matters most.',
      },
      {
        question: 'What is the most reliable cure for stage fright?',
        choices: ['Thorough preparation', 'Just being naturally confident'],
        correctIndex: 0,
        explanation: 'Confidence usually comes from knowing your material well, not an innate trait.',
      },
    ],
  },
}
