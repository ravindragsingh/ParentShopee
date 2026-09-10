// Interactive lesson + quiz content for each age-group module under the
// "Negotiation Skills" topic. Same split as leadershipContent.js: the
// backend's learning_modules catalog seeds the metadata, this file holds
// the content.
export const NEGOTIATION_CONTENT = {
  'negotiation-4-6': {
    slides: [
      { emoji: '🙋', title: 'Asking nicely', text: "If you want something, asking for it nicely — instead of grabbing or shouting — is the first step to getting a yes." },
      { emoji: '👂', title: 'Listening back', text: "After you ask, listen to what the other person says too. They might have a good reason, or a different idea." },
      { emoji: '🔄', title: 'Taking turns', text: "If two people both want the same toy, taking turns means everyone gets to play with it." },
      { emoji: '🤝', title: 'Trading fair', text: "Swapping one thing for another — like your red crayon for a friend's blue one — is a trade, and it should feel fair to both people." },
      { emoji: '💡', title: 'Try a different idea', text: "If someone says no, you can say \"how about this instead?\" — offering a new idea can turn a no into a yes." },
      { emoji: '😊', title: 'Both people give a little', text: "A compromise is when both people don't get everything they wanted, but they both get something — and that's okay!" },
      { emoji: '🙏', title: 'Say please and thank you', text: "Asking with \"please\" and answering with \"thank you\" — even if the answer is no — helps people want to work things out with you." },
    ],
    quiz: [
      {
        question: 'What is the first step to getting a yes when you want something?',
        choices: ['Asking nicely', 'Grabbing it'],
        correctIndex: 0,
        explanation: 'Asking nicely, instead of grabbing or shouting, is the first step.',
      },
      {
        question: 'What should you do after you ask for something?',
        choices: ['Listen to what the other person says', 'Cover your ears'],
        correctIndex: 0,
        explanation: 'Listening back helps you understand their reason or idea.',
      },
      {
        question: 'If two people both want the same toy, what can they do?',
        choices: ['Take turns', 'Fight over it'],
        correctIndex: 0,
        explanation: 'Taking turns means everyone gets to play with it.',
      },
      {
        question: 'What should a trade feel like?',
        choices: ['Fair to both people', 'Only good for one person'],
        correctIndex: 0,
        explanation: 'A good trade feels fair to both people involved.',
      },
      {
        question: 'What is a compromise?',
        choices: ['Both people give a little and both get something', 'Only one person gets what they want'],
        correctIndex: 0,
        explanation: 'In a compromise, both people give a little and both get something.',
      },
    ],
  },

  'negotiation-7-9': {
    slides: [
      { emoji: '🤝', title: 'What is negotiation?', text: "Negotiation is talking with someone to find an answer that works for both of you, when you each want something a bit different." },
      { emoji: '👂', title: 'Listen before you ask', text: "Understanding what the other person wants — and why — makes it much easier to find an idea they'll agree to." },
      { emoji: '🔄', title: 'Making a fair trade', text: "A fair trade means both people feel like they gained something, not like they lost." },
      { emoji: '✂️', title: 'Splitting the difference', text: "If you want to stay up 30 minutes late and your guardian says 10, meeting at 20 minutes is called \"splitting the difference.\"" },
      { emoji: '🏆', title: 'Win-win vs. win-lose', text: "A win-win means both sides end up happy. A win-lose means one side gets everything and the other gets nothing — win-win agreements tend to last longer." },
      { emoji: '💡', title: 'Brainstorming options', text: "Instead of only offering one idea, think of two or three — more options make it more likely you'll find one that works for everyone." },
      { emoji: '😤', title: 'Staying calm when you disagree', text: "Getting upset makes it harder to find a good solution. Taking a breath and staying calm helps you think more clearly." },
      { emoji: '🚪', title: 'Walking away nicely', text: "If you really can't agree, it's okay to stop for now and say \"let's think about it and talk again later\" instead of getting angry." },
    ],
    quiz: [
      {
        question: 'What is negotiation?',
        choices: ['Talking to find an answer that works for both people', 'Insisting on getting your own way'],
        correctIndex: 0,
        explanation: 'Negotiation is about finding a solution that works for both sides.',
      },
      {
        question: 'Why is it helpful to listen to the other person first?',
        choices: ["It helps you understand what they want and why", 'It wastes time'],
        correctIndex: 0,
        explanation: 'Understanding their wants and reasons makes it easier to find an idea they\'ll accept.',
      },
      {
        question: 'What does "splitting the difference" mean?',
        choices: ['Meeting in the middle between two offers', 'One side getting everything'],
        correctIndex: 0,
        explanation: 'Splitting the difference means landing between the two starting offers.',
      },
      {
        question: 'What is a "win-win" outcome?',
        choices: ['Both sides end up happy', 'One side gets everything and the other gets nothing'],
        correctIndex: 0,
        explanation: 'Win-win means both sides come away satisfied.',
      },
      {
        question: 'Why brainstorm more than one option?',
        choices: ["It's more likely you'll find one that works for everyone", "One idea is always enough"],
        correctIndex: 0,
        explanation: 'More options make it more likely you\'ll land on something that works for both sides.',
      },
      {
        question: 'What helps most when you start to disagree?',
        choices: ['Staying calm and taking a breath', 'Getting upset right away'],
        correctIndex: 0,
        explanation: 'Staying calm helps you think more clearly and find a solution.',
      },
    ],
  },

  'negotiation-10-13': {
    slides: [
      { emoji: '🎯', title: 'Interests vs. positions', text: "A \"position\" is what someone says they want (\"I want the whole weekend free\"). An \"interest\" is why they want it (\"I want time to relax\"). Knowing the why opens up more solutions." },
      { emoji: '📝', title: 'Preparing before you ask', text: "Thinking through what you want, why you want it, and what the other person might say before a conversation makes you far more persuasive." },
      { emoji: '👂', title: 'Active listening', text: "Repeating back what you heard (\"so you're saying...\") shows the other person you understand them, and often reveals what they actually care about." },
      { emoji: '💡', title: 'Generating multiple options', text: "Before agreeing to anything, list a few different possible solutions — the first idea on the table is rarely the best one available." },
      { emoji: '⚖️', title: 'Fair trade-offs', text: "If you're asking for something big, offering something in return — like more responsibility for more freedom — makes a deal feel balanced to both sides." },
      { emoji: '😤', title: 'Managing your emotions', text: "Frustration or excitement can push you to agree to a bad deal, or reject a good one. Noticing your own emotions helps you negotiate more clearly." },
      { emoji: '🚩', title: 'Knowing your walk-away point', text: "Deciding in advance what you won't accept helps you avoid agreeing to something you'll regret, even under pressure." },
    ],
    quiz: [
      {
        question: 'What is the difference between a "position" and an "interest"?',
        choices: ['A position is what someone says they want; an interest is why', 'They mean exactly the same thing'],
        correctIndex: 0,
        explanation: 'Positions are the stated ask; interests are the underlying reason.',
      },
      {
        question: 'Why prepare before a negotiation?',
        choices: ["It makes you more persuasive and ready for pushback", "Preparing wastes time"],
        correctIndex: 0,
        explanation: 'Thinking it through beforehand makes your case stronger.',
      },
      {
        question: 'What does repeating back what you heard show?',
        choices: ['That you understand the other person', 'That you agree with everything they said'],
        correctIndex: 0,
        explanation: 'Active listening shows understanding, not automatic agreement.',
      },
      {
        question: 'Why generate multiple options before agreeing to anything?',
        choices: ['The first idea is rarely the best one available', 'One option is always enough'],
        correctIndex: 0,
        explanation: 'More options increase the odds of finding a genuinely good solution.',
      },
      {
        question: 'What makes a deal feel balanced to both sides?',
        choices: ['A fair trade-off, not just a one-sided ask', 'Getting everything you asked for'],
        correctIndex: 0,
        explanation: 'Offering something in return makes a deal feel fair.',
      },
      {
        question: 'Why decide your walk-away point in advance?',
        choices: ["It helps you avoid agreeing to something you'll regret under pressure", "It's not useful to think about"],
        correctIndex: 0,
        explanation: 'Knowing your limit beforehand protects you from a bad deal made in the moment.',
      },
    ],
  },

  'negotiation-13-17': {
    slides: [
      { emoji: '🎯', title: 'Positions vs. interests, revisited', text: "Skilled negotiators dig past the stated position to the underlying interest — two people can want different positions but share the same underlying interest, which is where real deals are found." },
      { emoji: '🧭', title: 'Your BATNA', text: "Your \"Best Alternative to a Negotiated Agreement\" — what you'll do if this deal falls through — is your real source of power. A strong BATNA means you never have to accept a bad deal." },
      { emoji: '⚓', title: 'Anchoring', text: "The first number or offer mentioned tends to shape the whole rest of the conversation, even unconsciously — which is why it often pays to make a well-researched first offer rather than waiting." },
      { emoji: '🤝', title: 'Principled negotiation', text: "Separating the people from the problem — staying warm toward the person while being firm about the issue — keeps negotiations from turning into personal conflict." },
      { emoji: '⚖️', title: 'Win-win vs. distributive negotiation', text: "Some negotiations (like splitting a fixed bonus) really are one side's gain being the other's loss. Others (like a job offer with salary, flexibility, and title) have room to expand the pie for both sides — recognizing which kind you're in changes your strategy." },
      { emoji: '🧠', title: 'Reading emotional signals', text: "Noticing hesitation, discomfort, or excitement in the other party — not just their words — often reveals what they actually value most." },
      { emoji: '🧾', title: 'Negotiating ethically', text: "Being honest and not exploiting someone's inexperience or urgency isn't just kinder — it's what makes people willing to negotiate with you again." },
      { emoji: '🌍', title: 'Where this shows up in real life', text: "Negotiation isn't just for salaries — it's splitting rent with a roommate, agreeing on a group project's workload, or deciding on a price for something you're selling." },
    ],
    quiz: [
      {
        question: 'Why do skilled negotiators focus on interests, not just positions?',
        choices: ['Different positions can share the same underlying interest, opening up solutions', 'Positions and interests are always identical'],
        correctIndex: 0,
        explanation: 'Focusing on the underlying interest reveals options a stated position hides.',
      },
      {
        question: 'What is a BATNA?',
        choices: ['Your best alternative if the deal falls through', 'The first offer made in a negotiation'],
        correctIndex: 0,
        explanation: 'BATNA stands for Best Alternative to a Negotiated Agreement.',
      },
      {
        question: 'Why does the first offer in a negotiation matter so much?',
        choices: ['It tends to "anchor" and shape the rest of the conversation', 'It has no effect on what follows'],
        correctIndex: 0,
        explanation: 'Anchoring means the first number shapes expectations for the rest of the talk.',
      },
      {
        question: 'What does "principled negotiation" mean?',
        choices: ['Separating the people from the problem', 'Being aggressive toward the other person'],
        correctIndex: 0,
        explanation: 'It means staying warm to the person while being firm about the issue.',
      },
      {
        question: 'What is a "distributive" negotiation?',
        choices: ["One where one side's gain is essentially the other's loss", 'One where both sides can always expand the pie'],
        correctIndex: 0,
        explanation: 'A distributive negotiation splits a fixed amount, unlike one where the pie can grow.',
      },
      {
        question: 'What can noticing hesitation or discomfort in the other party reveal?',
        choices: ['What they actually value most', 'Nothing useful'],
        correctIndex: 0,
        explanation: 'Emotional signals often reveal priorities that words alone don\'t.',
      },
      {
        question: 'Why negotiate ethically, even when you could exploit someone\'s inexperience?',
        choices: ["It's what makes people willing to negotiate with you again", 'Ethics don\'t matter once a deal is signed'],
        correctIndex: 0,
        explanation: 'Fair dealing builds the trust needed for future negotiations.',
      },
    ],
  },
}
