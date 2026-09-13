// Interactive lesson + quiz content for each age-group module under the
// "Critical Thinking" topic. Same split as investingContent.js: the
// backend's learning_modules catalog seeds the metadata, this file holds
// the content.
export const CRITICAL_THINKING_CONTENT = {
  'critical-thinking-4-6': {
    slides: [
      { emoji: '❓', title: 'Why do we ask "why"?', text: "Asking 'why' helps you understand things better — like why the sky looks blue, or why ice melts in the sun." },
      { emoji: '🔎', title: 'Same or different?', text: "Looking closely at two things and noticing how they're the same or different is a great thinking skill — like comparing two toys." },
      { emoji: '🎭', title: 'Real or pretend?', text: "A cartoon dragon breathing fire is pretend. A real dog barking is real. Telling the difference is an important thinking skill." },
      { emoji: '🛑', title: 'Think before you act', text: "Taking a moment to think before doing something — like before grabbing a toy from a friend — often leads to a better choice." },
      { emoji: '🧩', title: 'Looking for clues', text: "If your shoes are wet, you can think about clues to figure out why — did it rain? Did you step in a puddle?" },
      { emoji: '🙋', title: 'It\'s okay to ask questions', text: "If something doesn't make sense, asking a question is smart — not silly. Good thinkers ask lots of questions." },
      { emoji: '🧸', title: 'Sorting things into groups', text: "Putting toys into groups — like all the red ones together, or all the round ones together — is a first step toward organized thinking." },
      { emoji: '🔢', title: 'What comes next?', text: "Looking at a pattern like circle, square, circle, square and figuring out what comes next is a fun way to practice thinking ahead." },
    ],
    quiz: [
      {
        question: 'Why is asking "why" a good habit?',
        choices: ['It helps you understand things better', 'It never helps at all'],
        correctIndex: 0,
        explanation: 'Asking "why" is one of the best ways to understand the world around you.',
      },
      {
        question: 'A cartoon dragon breathing fire — is that real or pretend?',
        choices: ['Pretend', 'Real'],
        correctIndex: 0,
        explanation: 'Cartoons show pretend things, even if they look exciting.',
      },
      {
        question: 'What can help you make a better choice?',
        choices: ['Thinking for a moment before acting', 'Acting right away without thinking at all'],
        correctIndex: 0,
        explanation: 'A moment of thought before acting often leads to a better decision.',
      },
      {
        question: 'If your shoes are wet, what could you do to figure out why?',
        choices: ['Look for clues, like whether it rained', 'There\'s no way to ever know'],
        correctIndex: 0,
        explanation: 'Looking for clues is exactly how good thinkers solve little mysteries.',
      },
      {
        question: 'Is it okay to ask a question when something doesn\'t make sense?',
        choices: ['Yes, asking questions is smart', 'No, you should never ask questions'],
        correctIndex: 0,
        explanation: 'Asking questions is a sign of a curious, careful thinker.',
      },
      {
        question: 'What is a good first step toward organized thinking?',
        choices: ['Sorting things into groups', 'Mixing everything together randomly'],
        correctIndex: 0,
        explanation: 'Grouping similar things together is a simple, useful thinking skill.',
      },
      {
        question: 'In the pattern circle, square, circle, square — what comes next?',
        choices: ['Circle', 'A triangle'],
        correctIndex: 0,
        explanation: 'The pattern repeats circle then square, so a circle comes next.',
      },
    ],
  },

  'critical-thinking-7-9': {
    slides: [
      { emoji: '📰', title: 'Fact vs. opinion', text: "A fact is something that's true and can be checked, like 'the sun is hot.' An opinion is what someone thinks or feels, like 'summer is the best season.'" },
      { emoji: '❔', title: 'Asking good questions', text: "Instead of just accepting an answer, good thinkers ask follow-up questions like 'how do you know that?' or 'is there another way to look at this?'" },
      { emoji: '🔀', title: 'More than one answer', text: "Some questions have more than one reasonable answer. Thinking about different possibilities, not just the first idea, leads to better decisions." },
      { emoji: '🚫', title: 'Don\'t believe everything right away', text: "Just because something is written down, said out loud, or shown online doesn't automatically make it true." },
      { emoji: '🧭', title: 'Checking with a trusted source', text: "If you're not sure whether something is true, checking with a grown-up, a book, or a trusted website is a smart next step." },
      { emoji: '🔗', title: 'Cause and effect', text: "Thinking about why something happened — the cause — and what happened because of it — the effect — helps you understand the world more clearly." },
      { emoji: '🧠', title: 'Changing your mind', text: "If new information shows your first idea was wrong, a good thinker isn't afraid to change their mind." },
      { emoji: '🕵️', title: 'Being a detective', text: "A good detective gathers several clues before deciding what happened, instead of guessing after just one clue. Thinking works the same way." },
      { emoji: '🙋‍♀️', title: 'It\'s okay to disagree', text: "Two people can look at the same thing and see it differently. Disagreeing with a friend — respectfully — doesn't mean the friendship is in trouble." },
    ],
    quiz: [
      {
        question: 'What is a "fact"?',
        choices: ['Something true that can be checked', 'Whatever someone happens to feel'],
        correctIndex: 0,
        explanation: 'Facts are checkable and true, unlike opinions, which are personal views.',
      },
      {
        question: 'What is an "opinion"?',
        choices: ['What someone thinks or feels', 'Something that can be proven true or false'],
        correctIndex: 0,
        explanation: 'Opinions are personal views — they can differ from person to person.',
      },
      {
        question: 'If someone tells you something surprising, what\'s a smart response?',
        choices: ['Ask "how do you know that?"', 'Believe it immediately with no questions'],
        correctIndex: 0,
        explanation: 'Asking follow-up questions is a great way to think critically about new information.',
      },
      {
        question: 'Does everything you read online automatically become true?',
        choices: ['No, it should be checked', 'Yes, if it\'s written down it\'s always true'],
        correctIndex: 0,
        explanation: 'Being written or posted online doesn\'t make something automatically true.',
      },
      {
        question: 'What does "cause and effect" mean?',
        choices: ['Understanding why something happened and what resulted from it', 'A game with no real meaning'],
        correctIndex: 0,
        explanation: 'Cause and effect helps you connect why something happened to what happened next.',
      },
      {
        question: 'Is it okay to change your mind if you learn new information?',
        choices: ['Yes, that\'s what good thinkers do', 'No, you should never change your mind'],
        correctIndex: 0,
        explanation: 'Updating your thinking based on new evidence is a sign of strong critical thinking.',
      },
      {
        question: 'What does a good detective do before deciding what happened?',
        choices: ['Gathers several clues first', 'Guesses after just one clue'],
        correctIndex: 0,
        explanation: 'Good thinking, like good detective work, weighs multiple clues before concluding.',
      },
      {
        question: 'Does disagreeing with a friend mean the friendship is in trouble?',
        choices: ['No, respectful disagreement is normal', 'Yes, friends must always agree on everything'],
        correctIndex: 0,
        explanation: 'People can see things differently and still be good friends.',
      },
    ],
  },

  'critical-thinking-10-13': {
    slides: [
      { emoji: '🔬', title: 'Evaluating evidence', text: "Before believing a claim, it helps to ask: what evidence supports it? Is the evidence strong, weak, or missing entirely?" },
      { emoji: '🧱', title: 'Spotting assumptions', text: "An assumption is something believed without proof. Noticing hidden assumptions in an argument helps you judge whether it actually holds up." },
      { emoji: '🔗➡️', title: 'Correlation isn\'t causation', text: "Just because two things happen around the same time doesn't mean one caused the other. Ice cream sales and sunburns both rise in summer — but ice cream doesn't cause sunburn." },
      { emoji: '👥', title: 'Considering other perspectives', text: "Understanding how a situation looks from someone else's point of view often reveals things your own perspective alone would miss." },
      { emoji: '⚖️', title: 'Weighing both sides', text: "On a genuinely debatable topic, looking fairly at the strongest arguments on both sides — before forming an opinion — leads to more solid conclusions." },
      { emoji: '🎯', title: 'Defining the real problem', text: "Sometimes what looks like the problem is actually just a symptom of a different, deeper problem. Defining the real issue is the first step to solving it well." },
      { emoji: '🧮', title: 'Checking the source', text: "Who is saying this, and why? A source with something to gain from you believing a claim deserves a closer, more careful look." },
      { emoji: '🎯', title: 'Setting a goal and checking progress', text: "Deciding what you're aiming for, then regularly checking whether your approach is actually getting you closer, keeps effort from being wasted." },
      { emoji: '🧮', title: 'Averages can mislead', text: "An average can hide a lot — a class 'average score' of 75% might mean everyone scored near 75%, or it might mean half scored 100% and half scored 50%." },
    ],
    quiz: [
      {
        question: 'What should you check before believing a claim?',
        choices: ['What evidence actually supports it', 'Nothing — just believe confident-sounding claims'],
        correctIndex: 0,
        explanation: 'Strong claims deserve strong evidence — checking for it is a core critical thinking skill.',
      },
      {
        question: 'What is an "assumption"?',
        choices: ['Something believed without proof', 'A fact that has been proven true'],
        correctIndex: 0,
        explanation: 'Assumptions are unproven beliefs that can weaken an argument if left unchecked.',
      },
      {
        question: 'Does one thing happening alongside another always mean it caused it?',
        choices: ['No — correlation isn\'t the same as causation', 'Yes, if two things happen together one always causes the other'],
        correctIndex: 0,
        explanation: 'Two things happening together doesn\'t prove one caused the other.',
      },
      {
        question: 'Why is it useful to consider other people\'s perspectives?',
        choices: ['It can reveal things your own viewpoint alone would miss', 'Other perspectives are never worth considering'],
        correctIndex: 0,
        explanation: 'Different viewpoints often surface details a single perspective would overlook.',
      },
      {
        question: 'Why does it matter who is making a claim, and why?',
        choices: ['A source with something to gain deserves closer scrutiny', 'The source of a claim never matters'],
        correctIndex: 0,
        explanation: 'Considering a source\'s motives is part of evaluating how trustworthy a claim is.',
      },
      {
        question: 'What does "defining the real problem" mean?',
        choices: ['Making sure you\'re solving the actual issue, not just a symptom of it', 'Skipping straight to a solution without thinking'],
        correctIndex: 0,
        explanation: 'Solving the wrong problem — even solving it well — doesn\'t actually help.',
      },
      {
        question: 'Why is checking progress toward a goal useful?',
        choices: ['It keeps effort from being wasted on the wrong approach', 'Checking progress never matters'],
        correctIndex: 0,
        explanation: 'Regularly checking progress lets you adjust before too much effort is wasted.',
      },
      {
        question: 'Can an "average" hide important differences in the numbers behind it?',
        choices: ['Yes, very different sets of numbers can share the same average', 'No, an average always tells the whole story'],
        correctIndex: 0,
        explanation: 'Averages can look identical while hiding very different underlying patterns.',
      },
    ],
  },

  'critical-thinking-13-17': {
    slides: [
      { emoji: '🧠', title: 'What is confirmation bias?', text: "Confirmation bias is the tendency to notice and believe information that agrees with what you already think, while ignoring information that doesn't." },
      { emoji: '📺', title: 'Media literacy', text: "Understanding who created a piece of media, why, and who it's meant to persuade helps you judge how much to trust it." },
      { emoji: '🧩', title: 'Common logical fallacies', text: "A logical fallacy is a flaw in reasoning — like attacking a person instead of their argument, or assuming something is true just because 'everyone believes it.'" },
      { emoji: '⚖️', title: 'Weighing evidence fairly', text: "Strong critical thinkers weigh the quality and quantity of evidence on all sides before forming a conclusion — not just picking whichever side feels more comfortable." },
      { emoji: '🎲', title: 'Deciding under uncertainty', text: "Many real decisions have to be made without knowing everything for certain. Thinking in terms of likely outcomes, not guaranteed ones, leads to better choices." },
      { emoji: '🔄', title: 'Being willing to update', text: "Genuinely strong thinkers treat their own conclusions as open to revision — new, credible evidence should be able to change a well-reasoned mind." },
      { emoji: '🗣️', title: 'Steelmanning an argument', text: "Instead of attacking the weakest version of an opposing view, a strong thinker engages with the strongest, most reasonable version of it — called 'steelmanning.'" },
      { emoji: '🧭', title: 'Separating feelings from facts', text: "Recognizing when a strong emotional reaction — anger, excitement, fear — might be clouding a decision helps you think more clearly under pressure." },
      { emoji: '📢', title: 'Recognizing propaganda', text: "Propaganda uses one-sided, emotionally charged messaging to push a viewpoint rather than inform. Learning to notice it helps you separate persuasion from honest information." },
      { emoji: '🧪', title: 'The scientific method, briefly', text: "Form a question, propose an explanation, test it, and revise based on results — this basic loop underlies careful thinking far beyond just science class." },
    ],
    quiz: [
      {
        question: 'What is confirmation bias?',
        choices: ['Favoring information that agrees with what you already believe', 'Always changing your opinion based on new facts'],
        correctIndex: 0,
        explanation: 'Confirmation bias is a natural tendency to seek out agreeing information and dismiss disagreeing information.',
      },
      {
        question: 'What is a "logical fallacy"?',
        choices: ['A flaw in the structure or reasoning of an argument', 'Any statement that happens to be false'],
        correctIndex: 0,
        explanation: 'Logical fallacies are reasoning errors that can make even a false conclusion sound convincing.',
      },
      {
        question: 'What does "media literacy" involve?',
        choices: ['Understanding who made a piece of media and why', 'Watching as much media as possible without thinking about it'],
        correctIndex: 0,
        explanation: 'Media literacy is about critically evaluating the source and purpose behind media.',
      },
      {
        question: 'What does "steelmanning" an argument mean?',
        choices: ['Engaging with the strongest version of an opposing view', 'Ignoring opposing views entirely'],
        correctIndex: 0,
        explanation: 'Steelmanning means fairly addressing the best version of the other side\'s argument.',
      },
      {
        question: 'Why is deciding "under uncertainty" a real skill?',
        choices: ['Most real decisions don\'t come with guaranteed outcomes', 'Every decision in life comes with a guaranteed correct answer'],
        correctIndex: 0,
        explanation: 'Thinking in terms of likely outcomes, not certainties, reflects how real decisions actually work.',
      },
      {
        question: 'Why might a strong emotional reaction be worth noticing during a decision?',
        choices: ['It might be clouding clear thinking in the moment', 'Emotions never affect decision-making at all'],
        correctIndex: 0,
        explanation: 'Recognizing strong emotions helps you separate how you feel from what the facts actually show.',
      },
      {
        question: 'Should a strong thinker be willing to change a conclusion?',
        choices: ['Yes, if credible new evidence supports it', 'No, changing your mind is always a weakness'],
        correctIndex: 0,
        explanation: 'Updating conclusions in light of solid new evidence is a hallmark of strong thinking, not weakness.',
      },
      {
        question: 'What is "propaganda"?',
        choices: ['One-sided, emotionally charged messaging meant to persuade', 'A neutral, balanced news report'],
        correctIndex: 0,
        explanation: 'Propaganda pushes a viewpoint through emotional persuasion rather than balanced information.',
      },
      {
        question: 'What is the basic loop of the scientific method?',
        choices: ['Question, propose an explanation, test it, revise based on results', 'Guess once and never check again'],
        correctIndex: 0,
        explanation: 'This loop of testing and revising ideas underlies careful thinking generally, not just science.',
      },
    ],
  },
}
