// Interactive lesson + quiz content for each age-group module under the
// "Negotiation Skills" topic. Same split as leadershipContent.js: the
// backend's learning_modules catalog seeds the metadata, this file holds
// the content.
export const NEGOTIATION_CONTENT = {
  'negotiation-4-6': {
    slides: [
      { emoji: '🙋', title: 'Asking nicely', text: "If you want something, asking for it nicely — instead of grabbing or shouting — is the first step to getting a yes. For example, saying \"can I please have a turn with the ball?\" instead of just grabbing it away makes the other kid much more likely to say yes." },
      { emoji: '👂', title: 'Listening back', text: "After you ask, listen to what the other person says too. They might have a good reason, or a different idea. For example, if you ask for the ball and your friend says \"in two minutes, I'm almost done,\" listening to that means you'll know just to wait a little bit instead of getting upset." },
      { emoji: '🔄', title: 'Taking turns', text: "If two people both want the same toy, taking turns means everyone gets to play with it. For example, if you and a friend both want the one red truck, agreeing that you'll play with it for five minutes and then swap means you both get a turn." },
      { emoji: '🤝', title: 'Trading fair', text: "Swapping one thing for another — like your red crayon for a friend's blue one — is a trade, and it should feel fair to both people. For example, if you really want the blue crayon and your friend really wants your red one, trading them means you both end up happier than before." },
      { emoji: '💡', title: 'Try a different idea', text: "If someone says no, you can say \"how about this instead?\" — offering a new idea can turn a no into a yes. For example, if a friend says no to sharing their favorite toy, asking \"how about we play with this other toy together instead?\" might turn that no into a fun yes." },
      { emoji: '😊', title: 'Both people give a little', text: "A compromise is when both people don't get everything they wanted, but they both get something — and that's okay! For example, if you want to play tag and your friend wants to play hide and seek, agreeing to play tag first and hide and seek second means you both get part of what you wanted." },
      { emoji: '🙏', title: 'Say please and thank you', text: "Asking with \"please\" and answering with \"thank you\" — even if the answer is no — helps people want to work things out with you. For example, even if a friend says no to sharing right now, saying \"okay, thank you for thinking about it\" keeps things friendly for next time you ask." },
    ],
    quiz: [
      {
        question: 'What is the first step to getting a yes when you want something?',
        choices: ['Asking nicely', 'Grabbing it'],
        correctIndex: 0,
        explanation: 'Asking nicely, instead of grabbing or shouting, is the first step.',
      },
      {
        question: 'You ask for the ball and your friend says "in two minutes." What should you do?',
        choices: ['Listen to what the other person says', 'Cover your ears'],
        correctIndex: 0,
        explanation: 'Listening back helps you understand their reason or idea.',
      },
      {
        question: 'You and a friend both want the same red truck. What can you do?',
        choices: ['Take turns', 'Fight over it'],
        correctIndex: 0,
        explanation: 'Taking turns means everyone gets to play with it.',
      },
      {
        question: 'You trade your red crayon for a friend\'s blue one because you both want the other color. What should a trade feel like?',
        choices: ['Fair to both people', 'Only good for one person'],
        correctIndex: 0,
        explanation: 'A good trade feels fair to both people involved.',
      },
      {
        question: 'You want tag, your friend wants hide and seek, so you agree to play both, one after another. What is this called?',
        choices: ['A compromise — both people give a little and both get something', 'Only one person gets what they want'],
        correctIndex: 0,
        explanation: 'In a compromise, both people give a little and both get something.',
      },
    ],
  },

  'negotiation-7-9': {
    slides: [
      { emoji: '🤝', title: 'What is negotiation?', text: "Negotiation is talking with someone to find an answer that works for both of you, when you each want something a bit different. For example, if you want to watch a movie and your sibling wants to play a video game, negotiating means talking it out until you find something you both agree to, like movie first, game second." },
      { emoji: '👂', title: 'Listen before you ask', text: "Understanding what the other person wants — and why — makes it much easier to find an idea they'll agree to. For example, if you learn your sibling wants the video game specifically because a friend is joining them online at a certain time, that reason helps you find a solution — maybe you watch your movie during that exact window." },
      { emoji: '🔄', title: 'Making a fair trade', text: "A fair trade means both people feel like they gained something, not like they lost. For example, offering to do your sibling's dish duty tonight in exchange for picking the movie tonight feels like a fair trade — you each give something and get something." },
      { emoji: '✂️', title: 'Splitting the difference', text: "If you want to stay up 30 minutes late and your guardian says 10, meeting at 20 minutes is called \"splitting the difference.\" For example, if you ask for 30 extra minutes and your guardian offers 10, agreeing on 20 minutes — right in the middle — is a classic way negotiations often land." },
      { emoji: '🏆', title: 'Win-win vs. win-lose', text: "A win-win means both sides end up happy. A win-lose means one side gets everything and the other gets nothing — win-win agreements tend to last longer. For example, agreeing that you get to pick the movie tonight and your sibling picks tomorrow is a win-win, while one person always getting their way and the other never getting a turn is a win-lose that builds resentment over time." },
      { emoji: '💡', title: 'Brainstorming options', text: "Instead of only offering one idea, think of two or three — more options make it more likely you'll find one that works for everyone. For example, instead of only suggesting \"watch my movie,\" also suggesting \"or we could watch half now and finish tomorrow\" or \"or you could join the game after the movie\" gives you all better odds of finding something everyone likes." },
      { emoji: '😤', title: 'Staying calm when you disagree', text: "Getting upset makes it harder to find a good solution. Taking a breath and staying calm helps you think more clearly. For example, if a negotiation over TV time starts to get heated, taking a breath and saying \"let's figure this out calmly\" usually leads to a much better outcome than both people getting frustrated and shouting." },
      { emoji: '🚪', title: 'Walking away nicely', text: "If you really can't agree, it's okay to stop for now and say \"let's think about it and talk again later\" instead of getting angry. For example, if you and a sibling truly can't agree on the TV tonight, saying \"let's just each do something else tonight and figure this out tomorrow\" is a mature way to pause without a fight." },
    ],
    quiz: [
      {
        question: 'You want a movie, your sibling wants a game. What is negotiation?',
        choices: ['Talking to find an answer that works for both people', 'Insisting on getting your own way'],
        correctIndex: 0,
        explanation: 'Negotiation is about finding a solution that works for both sides.',
      },
      {
        question: 'You learn your sibling wants the game because a friend is joining online at a specific time. Why is that helpful to know?',
        choices: ["It helps you understand what they want and why", 'It wastes time'],
        correctIndex: 0,
        explanation: 'Understanding their wants and reasons makes it easier to find an idea they\'ll accept.',
      },
      {
        question: 'You ask for 30 extra minutes, your guardian offers 10, and you agree on 20. What does "splitting the difference" mean?',
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
        question: 'Instead of only suggesting one idea for tonight\'s TV time, you also suggest two backups. Why brainstorm more than one option?',
        choices: ["It's more likely you'll find one that works for everyone", "One idea is always enough"],
        correctIndex: 0,
        explanation: 'More options make it more likely you\'ll land on something that works for both sides.',
      },
      {
        question: 'A negotiation over TV time starts to get heated. What helps most?',
        choices: ['Staying calm and taking a breath', 'Getting upset right away'],
        correctIndex: 0,
        explanation: 'Staying calm helps you think more clearly and find a solution.',
      },
    ],
  },

  'negotiation-10-13': {
    slides: [
      { emoji: '🎯', title: 'Interests vs. positions', text: "A \"position\" is what someone says they want (\"I want the whole weekend free\"). An \"interest\" is why they want it (\"I want time to relax\"). Knowing the why opens up more solutions. For example, if a friend's position is \"I want to pick the movie every time,\" but their real interest is \"I never get a say in group decisions,\" understanding that interest could lead to a totally different, better solution — like rotating who picks other group activities too." },
      { emoji: '📝', title: 'Preparing before you ask', text: "Thinking through what you want, why you want it, and what the other person might say before a conversation makes you far more persuasive. For example, before asking a guardian for a later curfew, thinking through your reason (a friend's event runs late), anticipating their concern (safety getting home), and having an answer ready (a ride arranged) makes your case far stronger than just asking on the spot." },
      { emoji: '👂', title: 'Active listening', text: "Repeating back what you heard (\"so you're saying...\") shows the other person you understand them, and often reveals what they actually care about. For example, saying \"so you're saying you're worried about how I'll get home safely, not really about the time itself\" shows you understood, and might reveal that arranging a safe ride solves their actual concern." },
      { emoji: '💡', title: 'Generating multiple options', text: "Before agreeing to anything, list a few different possible solutions — the first idea on the table is rarely the best one available. For example, if you're negotiating chore responsibilities with a sibling, rather than accepting the first split suggested, considering two or three different ways to divide the chores often reveals a fairer arrangement than the very first one mentioned." },
      { emoji: '⚖️', title: 'Fair trade-offs', text: "If you're asking for something big, offering something in return — like more responsibility for more freedom — makes a deal feel balanced to both sides. For example, asking for a later curfew while also offering to text a check-in halfway through the night makes the request feel like a fair trade instead of a one-sided ask." },
      { emoji: '😤', title: 'Managing your emotions', text: "Frustration or excitement can push you to agree to a bad deal, or reject a good one. Noticing your own emotions helps you negotiate more clearly. For example, if you're so excited about a trade that you'd agree to almost anything, noticing that excitement and slowing down before agreeing helps you avoid a deal you might regret later." },
      { emoji: '🚩', title: 'Knowing your walk-away point', text: "Deciding in advance what you won't accept helps you avoid agreeing to something you'll regret, even under pressure. For example, deciding beforehand \"I won't agree to less than a 10-minute later curfew\" helps you stay firm and clear-headed if the conversation gets pushed toward accepting far less." },
    ],
    quiz: [
      {
        question: 'A friend\'s position is "I want to pick the movie every time," but their interest is "I never get a say." What does this reveal?',
        choices: ['A position is what someone says they want; an interest is why', 'They mean exactly the same thing'],
        correctIndex: 0,
        explanation: 'Positions are the stated ask; interests are the underlying reason.',
      },
      {
        question: 'Before asking for a later curfew, why think through your reason and anticipate concerns first?',
        choices: ["It makes you more persuasive and ready for pushback", "Preparing wastes time"],
        correctIndex: 0,
        explanation: 'Thinking it through beforehand makes your case stronger.',
      },
      {
        question: 'You say "so you\'re saying you\'re worried about how I\'ll get home." What does repeating back what you heard show?',
        choices: ['That you understand the other person', 'That you agree with everything they said'],
        correctIndex: 0,
        explanation: 'Active listening shows understanding, not automatic agreement.',
      },
      {
        question: 'Why generate multiple ways to split chores instead of accepting the first suggestion?',
        choices: ['The first idea is rarely the best one available', 'One option is always enough'],
        correctIndex: 0,
        explanation: 'More options increase the odds of finding a genuinely good solution.',
      },
      {
        question: 'Asking for a later curfew while offering to text a check-in halfway through — what does this make the deal feel like?',
        choices: ['A fair trade-off, not just a one-sided ask', 'Getting everything you asked for'],
        correctIndex: 0,
        explanation: 'Offering something in return makes a deal feel fair.',
      },
      {
        question: 'Why decide "I won\'t accept less than 10 extra minutes" before the conversation even starts?',
        choices: ["It helps you avoid agreeing to something you'll regret under pressure", "It's not useful to think about"],
        correctIndex: 0,
        explanation: 'Knowing your limit beforehand protects you from a bad deal made in the moment.',
      },
    ],
  },

  'negotiation-13-17': {
    slides: [
      { emoji: '🎯', title: 'Positions vs. interests, revisited', text: "Skilled negotiators dig past the stated position to the underlying interest — two people can want different positions but share the same underlying interest, which is where real deals are found. For example, in a group project disagreement, one person's position might be \"I want to write the whole report myself\" while another's is \"I want more say in the final product\" — both actually share the interest of wanting the project to turn out well, which opens the door to a shared-editing solution neither had proposed." },
      { emoji: '🧭', title: 'Your BATNA', text: "Your \"Best Alternative to a Negotiated Agreement\" — what you'll do if this deal falls through — is your real source of power. A strong BATNA means you never have to accept a bad deal. For example, if you're negotiating pay for a summer job and you already have a backup offer from another employer, that backup (your BATNA) gives you real power to walk away from a lowball offer instead of feeling forced to accept it." },
      { emoji: '⚓', title: 'Anchoring', text: "The first number or offer mentioned tends to shape the whole rest of the conversation, even unconsciously — which is why it often pays to make a well-researched first offer rather than waiting. For example, if you're negotiating an allowance increase and open with a well-researched \"$15 a week feels fair based on my responsibilities,\" that number tends to anchor the whole conversation, compared to waiting and reacting to whatever number is offered to you first." },
      { emoji: '🤝', title: 'Principled negotiation', text: "Separating the people from the problem — staying warm toward the person while being firm about the issue — keeps negotiations from turning into personal conflict. For example, telling a group project partner \"I really value working with you, and I also think we need to be firmer about deadlines\" separates your respect for them as a person from your firmness about the actual issue." },
      { emoji: '⚖️', title: 'Win-win vs. distributive negotiation', text: "Some negotiations (like splitting a fixed bonus) really are one side's gain being the other's loss. Others (like a job offer with salary, flexibility, and title) have room to expand the pie for both sides — recognizing which kind you're in changes your strategy. For example, splitting a single $100 prize between two people is distributive (every extra dollar for one is a dollar less for the other), but negotiating a job offer with salary, remote days, and vacation time has room to trade across categories so both sides can end up better off." },
      { emoji: '🧠', title: 'Reading emotional signals', text: "Noticing hesitation, discomfort, or excitement in the other party — not just their words — often reveals what they actually value most. For example, if someone hesitates specifically when a certain topic comes up during a negotiation, that hesitation itself is a signal worth paying attention to, even if their words don't directly say why." },
      { emoji: '🧾', title: 'Negotiating ethically', text: "Being honest and not exploiting someone's inexperience or urgency isn't just kinder — it's what makes people willing to negotiate with you again. For example, if you're selling something to someone who clearly doesn't know its real value, pointing that out honestly rather than taking advantage builds a reputation that makes people want to deal with you again in the future." },
      { emoji: '🌍', title: 'Where this shows up in real life', text: "Negotiation isn't just for salaries — it's splitting rent with a roommate, agreeing on a group project's workload, or deciding on a price for something you're selling. For example, negotiating who takes the smaller bedroom for lower rent with a future roommate uses the exact same interests-and-trade-offs thinking as negotiating a job offer." },
    ],
    quiz: [
      {
        question: 'Two group project partners want different things but share the interest of wanting a great final product. Why focus on interests?',
        choices: ['Different positions can share the same underlying interest, opening up solutions', 'Positions and interests are always identical'],
        correctIndex: 0,
        explanation: 'Focusing on the underlying interest reveals options a stated position hides.',
      },
      {
        question: 'You have a backup job offer while negotiating pay for another job. What is that backup called?',
        choices: ['Your BATNA — best alternative if the deal falls through', 'The first offer made in a negotiation'],
        correctIndex: 0,
        explanation: 'BATNA stands for Best Alternative to a Negotiated Agreement.',
      },
      {
        question: 'Opening an allowance negotiation with a well-researched "$15 a week" tends to shape the rest of the talk. What is this called?',
        choices: ['Anchoring — the first offer shapes the rest of the conversation', 'It has no effect on what follows'],
        correctIndex: 0,
        explanation: 'Anchoring means the first number shapes expectations for the rest of the talk.',
      },
      {
        question: 'Telling a partner "I value working with you, and I also think we need firmer deadlines." What does this show?',
        choices: ['Principled negotiation — separating the people from the problem', 'Being aggressive toward the other person'],
        correctIndex: 0,
        explanation: 'It means staying warm to the person while being firm about the issue.',
      },
      {
        question: 'Splitting a fixed $100 prize between two people, where one\'s gain is the other\'s loss, is what kind of negotiation?',
        choices: ["A distributive negotiation", 'One where both sides can always expand the pie'],
        correctIndex: 0,
        explanation: 'A distributive negotiation splits a fixed amount, unlike one where the pie can grow.',
      },
      {
        question: 'Someone hesitates specifically when a certain topic comes up in a negotiation. What can that reveal?',
        choices: ['What they actually value most', 'Nothing useful'],
        correctIndex: 0,
        explanation: 'Emotional signals often reveal priorities that words alone don\'t.',
      },
      {
        question: 'You point out honestly that a buyer doesn\'t realize an item\'s real value, instead of exploiting that. Why negotiate this way?',
        choices: ["It's what makes people willing to negotiate with you again", 'Ethics don\'t matter once a deal is signed'],
        correctIndex: 0,
        explanation: 'Fair dealing builds the trust needed for future negotiations.',
      },
    ],
  },
}
