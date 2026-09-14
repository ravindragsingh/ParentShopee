// Interactive lesson + quiz content for each age-group module under the
// "Communication" topic. Same split as investingContent.js: the backend's
// learning_modules catalog seeds the metadata, this file holds the content.
export const COMMUNICATION_CONTENT = {
  'communication-4-6': {
    slides: [
      { emoji: '🗣️', title: 'Use your words', text: "When you feel happy, sad, or upset, saying it out loud with words helps people understand you better than yelling or crying alone. For example, saying \"I'm sad because my tower fell down\" helps a grown-up understand exactly what happened and how to help, much more than just crying without explaining why." },
      { emoji: '👂', title: 'Listening matters too', text: "Talking is only half of communicating — really listening when someone else is talking is just as important. For example, if your friend is telling you an exciting story about their weekend, looking at them and really paying attention shows them you care about what they're saying." },
      { emoji: '🙏', title: '"Please" and "thank you"', text: "Saying please when you ask for something, and thank you when someone helps you, makes people happy to help you again. For example, saying \"can I have a snack, please?\" instead of just demanding one, and saying \"thank you\" afterward, makes a grown-up much more willing to help you again next time." },
      { emoji: '🙋', title: 'Asking for help', text: "If you're stuck or need something, asking for help with your words is a strong, smart thing to do — not something to feel bad about. For example, if you can't reach a toy on a high shelf, saying \"can you help me reach this, please?\" is much smarter than just standing there upset or trying to climb something dangerous." },
      { emoji: '😊', title: 'Your face says a lot too', text: "A smile, a frown, or wide eyes all send a message, even before you say a single word. For example, if you walk into a room smiling, people might guess you're happy about something even before you tell them what happened." },
      { emoji: '⏳', title: 'Taking turns talking', text: "Waiting for your turn to talk — instead of interrupting — helps everyone feel heard in a conversation. For example, if two friends are talking and you want to share something, waiting until they finish their sentence before speaking helps everyone feel like they got a fair turn." },
      { emoji: '😢', title: 'Naming your feelings', text: "Words like happy, sad, mad, and scared help you tell someone exactly what's going on inside you, instead of just crying or shouting. For example, instead of just crying when a friend takes your toy, saying \"I feel mad because you took my toy without asking\" tells them exactly what's wrong and why." },
      { emoji: '🎨', title: 'Showing what you mean', text: "If you can't find the words, pointing, drawing, or acting something out can help someone understand you too. For example, if you don't know the word for \"the thing that spins on the ceiling,\" pointing up at the fan and moving your finger in a circle can help someone figure out exactly what you mean." },
    ],
    quiz: [
      {
        question: 'What helps people understand how you feel?',
        choices: ['Using your words to say it', 'Never saying anything at all'],
        correctIndex: 0,
        explanation: 'Putting feelings into words helps others understand and help you.',
      },
      {
        question: 'Is listening an important part of communicating?',
        choices: ['Yes, just as important as talking', 'No, only talking matters'],
        correctIndex: 0,
        explanation: 'Good communication is a two-way street — listening matters as much as talking.',
      },
      {
        question: 'When should you say "please"?',
        choices: ['When you\'re asking for something', 'Only on your birthday'],
        correctIndex: 0,
        explanation: '"Please" is a polite way to ask for something.',
      },
      {
        question: 'You can\'t reach a toy on a high shelf. What should you do?',
        choices: ['Ask for help with your words', 'Never tell anyone'],
        correctIndex: 0,
        explanation: 'Asking for help is a smart, strong choice, not something to be embarrassed about.',
      },
      {
        question: 'Can your face send a message, even without talking?',
        choices: ['Yes, like a smile or a frown', 'No, only words send messages'],
        correctIndex: 0,
        explanation: 'Facial expressions communicate feelings even before you say a word.',
      },
      {
        question: 'What are words like "happy" or "sad" used for?',
        choices: ['Naming your feelings so others understand', 'They have no real use'],
        correctIndex: 0,
        explanation: 'Feeling words help you tell someone exactly what\'s going on inside you.',
      },
      {
        question: 'You don\'t know the word for the spinning thing on the ceiling. What else can help you communicate?',
        choices: ['Pointing, drawing, or acting it out', 'Nothing else can ever help'],
        correctIndex: 0,
        explanation: 'Showing what you mean is a great backup when words are hard to find.',
      },
    ],
  },

  'communication-7-9': {
    slides: [
      { emoji: '👂', title: 'What is active listening?', text: "Active listening means really paying attention — looking at the person, not interrupting, and thinking about what they're saying instead of just waiting for your turn to talk. For example, if a friend is explaining a new game's rules, nodding along and asking a question about a part you didn't understand shows you're really listening, not just waiting to talk about your own idea." },
      { emoji: '🙆', title: 'Body language basics', text: "Crossed arms, a big smile, or looking away all send messages without any words — noticing body language helps you understand people better. For example, if a friend says \"I'm fine\" but has crossed arms and won't look at you, their body language might be telling you something their words aren't." },
      { emoji: '🔄', title: 'Taking turns in conversation', text: "A good conversation feels like a back-and-forth game of catch, not one person talking the whole time. For example, if you talk about your weekend for a full five minutes without asking your friend anything about theirs, the conversation stops feeling like catch and starts feeling one-sided." },
      { emoji: '🙅', title: 'Disagreeing politely', text: "You can disagree with someone without being mean — saying 'I see it differently' is a respectful way to share a different opinion. For example, if a friend says a movie was the best ever and you didn't love it, saying \"I see it differently — I thought the ending was a bit slow\" keeps the conversation friendly instead of turning it into an argument." },
      { emoji: '❓', title: 'Asking clarifying questions', text: "If you don't understand something someone said, asking 'can you explain that again?' is smarter than just pretending to understand. For example, if a teacher explains a math step quickly and you're lost, asking \"can you show that step again?\" gets you the help you actually need instead of staying confused." },
      { emoji: '💌', title: 'Written vs. spoken words', text: "Writing a message and saying it out loud can feel very different — a text can sometimes sound different than you meant it to. For example, texting \"fine\" after a friend asks how you're doing can sound annoyed even if you just meant \"okay\" — saying the same word out loud with a smile would sound completely different." },
      { emoji: '🤗', title: 'Checking in on feelings', text: "Asking a friend 'are you okay?' when they seem upset shows you're paying attention to more than just what they're saying. For example, if a friend seems quiet and isn't smiling at lunch, asking \"hey, are you okay?\" shows you noticed something was off, even before they said a word about it." },
      { emoji: '📞', title: 'Talking on the phone', text: "Without seeing someone's face, a phone call relies entirely on your voice and words — speaking clearly and listening closely both matter even more. For example, on a phone call you can't see a confused look on someone's face, so checking \"does that make sense?\" out loud matters more than it would in person." },
      { emoji: '🤗', title: 'Comforting a sad friend', text: "Sometimes a friend doesn't need advice right away — just having someone sit with them and say 'that sounds really hard' can mean a lot. For example, if a friend's pet is sick and they're upset, simply sitting with them and saying \"that sounds really hard, I'm sorry\" often helps more than immediately jumping in with advice on what to do." },
    ],
    quiz: [
      {
        question: 'What is "active listening"?',
        choices: ['Really paying attention instead of just waiting to talk', 'Talking as much as possible'],
        correctIndex: 0,
        explanation: 'Active listening means genuinely focusing on what the other person is saying.',
      },
      {
        question: 'A friend says "I\'m fine" with crossed arms and won\'t look at you. What might their body language suggest?',
        choices: ['They might not actually be fine', 'Body language never means anything'],
        correctIndex: 0,
        explanation: 'Body language often communicates feelings just as clearly as words do.',
      },
      {
        question: 'What does a good conversation feel like?',
        choices: ['A back-and-forth, like a game of catch', 'One person talking the whole time'],
        correctIndex: 0,
        explanation: 'Good conversations involve both people talking and listening in turn.',
      },
      {
        question: 'A friend loved a movie you didn\'t. How can you disagree politely?',
        choices: ['Say something like "I see it differently"', 'Yell that they\'re wrong'],
        correctIndex: 0,
        explanation: 'Polite disagreement keeps the conversation respectful, even with different opinions.',
      },
      {
        question: "A teacher explains a math step quickly and you're lost. What's smart to do?",
        choices: ['Ask them to explain again', 'Pretend you understood anyway'],
        correctIndex: 0,
        explanation: 'Asking for clarification helps you actually understand, instead of guessing.',
      },
      {
        question: 'Why can texting "fine" sound more annoyed than saying it out loud with a smile?',
        choices: ['Tone can be easy to misread in writing', 'Writing always sounds exactly like talking'],
        correctIndex: 0,
        explanation: 'Written messages can lose tone easily, which is why misunderstandings happen in texts.',
      },
      {
        question: 'Why does speaking clearly matter more on a phone call?',
        choices: ['You can\'t see the other person\'s face for extra clues', 'It matters less than in person'],
        correctIndex: 0,
        explanation: 'Without facial expressions, your voice has to carry the whole message.',
      },
      {
        question: 'A friend\'s pet is sick and they\'re upset. What often helps most, right away?',
        choices: ['Sitting with them and saying "that sounds hard"', 'A long list of advice immediately'],
        correctIndex: 0,
        explanation: 'Being heard and understood often matters more at first than getting advice.',
      },
    ],
  },

  'communication-10-13': {
    slides: [
      { emoji: '🎯', title: 'Knowing your audience', text: "How you explain something to a younger sibling is different from how you'd explain it to a teacher — good communicators adjust to who they're talking to. For example, explaining a video game's rules to a 5-year-old sibling might use simple words and lots of patience, while explaining the same rules to a teacher for a project might use more precise, detailed language." },
      { emoji: '💬', title: 'Persuasive communication', text: "Persuading someone works best with clear reasons and evidence, not just repeating what you want louder. For example, asking a parent for a later bedtime by saying \"can I stay up later, please, please, please\" is much weaker than explaining \"I finish my homework by 8, and an extra 30 minutes would let me read before bed\" with a real reason behind it." },
      { emoji: '📱', title: 'Reading tone in messages', text: "A short text like 'fine.' can come across as annoyed even if it wasn't meant that way — being aware of this helps avoid mixed-up messages. For example, texting just \"k\" in response to a friend's exciting news might come across as dismissive, even if you were just typing quickly and meant nothing by it." },
      { emoji: '🔁', title: 'Giving feedback kindly', text: "Good feedback focuses on the specific thing that could improve, said kindly — not a vague or harsh comment about the person. For example, saying \"the intro was a little confusing, maybe start with your main point first\" helps a group project partner improve, while \"this is bad\" just makes them feel criticized without knowing what to fix." },
      { emoji: '👂', title: 'Receiving feedback well', text: "Hearing feedback about something you did isn't the same as being told you're a bad person — separating the two helps you actually improve. For example, if a teacher says your essay's conclusion needs work, that's feedback about one part of your writing, not a judgment about your intelligence or worth as a person." },
      { emoji: '🤝', title: 'Resolving a disagreement', text: "Calmly explaining your side, actually listening to theirs, and looking for a solution both people can accept usually works better than arguing to 'win.' For example, if you and a sibling disagree about which show to watch, calmly explaining why you want your choice, listening to their reason, and maybe agreeing to alternate shows usually ends better than a shouting match over the remote." },
      { emoji: '📝', title: 'Written communication skills', text: "A clear, organized message — like a well-written email or message — gets read and understood much more easily than a rushed, jumbled one. For example, a message that says \"Hi Coach, I'll miss practice Tuesday for a dentist appointment. See you Thursday!\" gets a much faster, clearer response than a rambling message that buries that same information in the middle." },
      { emoji: '🎤', title: 'Speaking up in a group', text: "Sharing your idea in front of a group takes practice. Preparing what you want to say ahead of time makes it feel much less intimidating. For example, jotting down two or three key points before a group discussion means you won't freeze up trying to remember what you wanted to say when it's your turn." },
      { emoji: '📧', title: 'Writing a clear message', text: "A short, well-organized message — saying exactly what you need and by when — gets a faster, better response than a vague, rambling one. For example, \"Can you send me the group project notes by Thursday? I want to start my part this weekend\" gets a much clearer response than just \"hey, can you send me stuff sometime?\"" },
    ],
    quiz: [
      {
        question: 'Why does "knowing your audience" matter?',
        choices: ['Good communicators adjust how they explain things to who they\'re talking to', 'You should explain everything exactly the same way to everyone'],
        correctIndex: 0,
        explanation: 'Adjusting your explanation to your audience makes communication more effective.',
      },
      {
        question: 'Asking for a later bedtime, which works better: repeating "please, please, please" or explaining a specific reason?',
        choices: ['Explaining a specific reason, like homework finishing early', 'Repeating the same demand louder'],
        correctIndex: 0,
        explanation: 'Solid reasoning tends to persuade far better than volume alone.',
      },
      {
        question: 'Why can texting just "k" in response to exciting news come across as dismissive?',
        choices: ['Tone is hard to read without facial expressions or voice', 'Text messages are always crystal clear'],
        correctIndex: 0,
        explanation: 'Without tone of voice or expression, short texts can come across differently than intended.',
      },
      {
        question: 'Which is more helpful feedback on a group project intro: "this is bad" or "the intro was confusing, try leading with your main point"?',
        choices: ['The specific, kind version about the main point', 'The vague, harsh version'],
        correctIndex: 0,
        explanation: 'Specific, kind feedback is more useful and easier to hear than vague criticism.',
      },
      {
        question: 'A teacher says your essay\'s conclusion needs work. How can you receive that well?',
        choices: ['Separate feedback about the essay from your worth as a person', 'Assume any feedback means you\'re a bad person'],
        correctIndex: 0,
        explanation: 'Feedback about what you did isn\'t a judgment of who you are.',
      },
      {
        question: 'You and a sibling disagree about which show to watch. What usually resolves this better than arguing to "win"?',
        choices: ['Listening to the other side and finding a solution both can accept', 'Talking louder until the other person gives up'],
        correctIndex: 0,
        explanation: 'Genuinely listening and finding common ground resolves disagreements more durably.',
      },
      {
        question: 'What makes speaking up in a group feel less intimidating?',
        choices: ['Preparing what you want to say ahead of time', 'Never thinking about it beforehand'],
        correctIndex: 0,
        explanation: 'Preparation builds confidence before speaking in front of others.',
      },
      {
        question: 'Which message gets a faster, better response: "hey, can you send me stuff sometime?" or a specific ask with a deadline?',
        choices: ['The specific one with a clear deadline', 'The vague one'],
        correctIndex: 0,
        explanation: 'Clarity makes it easy for the reader to know exactly what to do.',
      },
    ],
  },

  'communication-13-17': {
    slides: [
      { emoji: '🎤', title: 'Public speaking basics', text: "Speaking to a group feels easier with preparation: knowing your key points, practicing out loud, and remembering that some nerves are completely normal. For example, practicing a class presentation out loud three times beforehand — even alone in your room — makes an enormous difference in how confident you sound on the actual day." },
      { emoji: '🧭', title: 'Assertive vs. passive vs. aggressive', text: "Assertive communication states your needs clearly and respectfully. Passive avoids saying what you need. Aggressive disregards the other person's feelings entirely. For example, if a group project partner isn't doing their share, saying \"I need you to finish your part by Friday so we're not scrambling\" is assertive — staying silent and hoping it fixes itself is passive, and yelling \"you never do anything\" is aggressive." },
      { emoji: '🤝', title: 'Conflict resolution', text: "Resolving conflict well usually means naming the real issue calmly, listening fully to the other side, and working toward a solution instead of assigning blame. For example, instead of saying \"you always ignore me,\" naming the specific issue — \"I felt left out when the group made plans without me\" — opens the door to an actual conversation instead of a defensive reaction." },
      { emoji: '💼', title: 'Professional communication', text: "A clear subject line, a polite tone, and getting to the point efficiently make emails and messages far more effective in school or work settings. For example, an email titled \"Question about Friday's assignment deadline\" with two clear sentences gets answered far faster than one titled \"hi\" with a long, unfocused paragraph." },
      { emoji: '📵', title: 'Digital communication etiquette', text: "What you'd never say to someone's face shouldn't be said online either — screenshots and messages tend to stick around far longer than a spoken conversation. For example, a harsh comment typed in frustration can be screenshotted and shared long after you've cooled down and moved past the moment — something a spoken argument doesn't leave behind." },
      { emoji: '🎧', title: 'Listening for understanding, not rebuttal', text: "Truly listening means trying to understand the other person's point, not just waiting for your turn to argue back. For example, in a disagreement about curfew, really listening to why a parent is worried (not just waiting to counter-argue) might reveal a specific concern you could actually address directly." },
      { emoji: '🌍', title: 'Communicating across differences', text: "People from different backgrounds may communicate in different styles — being aware of this helps avoid misreading someone's tone or intent. For example, someone raised in a culture that values indirect communication might phrase a disagreement much more softly than someone used to being very direct — neither is wrong, but misreading the difference can cause unnecessary friction." },
      { emoji: '🧩', title: 'Nonverbal cues under pressure', text: "In a tense conversation, tone of voice and body language often carry as much meaning as the actual words being said. For example, saying \"I'm not mad\" through gritted teeth and crossed arms sends a very different message than the actual words — the tone and body language often reveal more truth than the sentence itself." },
      { emoji: '🌐', title: 'Communicating across cultures online', text: "Humor, directness, and formality norms vary a lot between cultures — a message that reads as friendly in one context can read as blunt or confusing in another. For example, a very short, direct message that feels efficient and normal in one culture's messaging style might come across as cold or rude to someone from a culture where messages are typically warmer and more elaborate." },
      { emoji: '🧑‍💼', title: 'Introducing yourself professionally', text: "A short, confident self-introduction — your name, what you're interested in, and why you're reaching out — makes a strong first impression in interviews or networking. For example, \"Hi, I'm Jordan, a junior interested in environmental science, and I'm reaching out because I'd love to learn more about your research\" makes a far stronger first impression than a vague, rambling introduction." },
    ],
    quiz: [
      {
        question: 'A group partner isn\'t doing their share. Which response is assertive?',
        choices: ['"I need you to finish your part by Friday"', 'Staying silent and hoping it fixes itself'],
        correctIndex: 0,
        explanation: 'Assertive communication is respectful and clear — different from passive or aggressive styles.',
      },
      {
        question: 'What usually helps resolve a conflict well?',
        choices: ['Naming the real issue calmly and listening to the other side', 'Assigning blame as fast as possible'],
        correctIndex: 0,
        explanation: 'Calm, issue-focused conversation resolves conflict more effectively than blame.',
      },
      {
        question: 'Which email subject line is more effective: "hi" or "Question about Friday\'s assignment deadline"?',
        choices: ['"Question about Friday\'s assignment deadline"', '"hi"'],
        correctIndex: 0,
        explanation: 'Clarity and politeness make professional messages easier to act on.',
      },
      {
        question: 'Why does digital communication etiquette matter?',
        choices: ['Online messages can stick around and spread much longer than spoken words', 'Nothing online is ever remembered'],
        correctIndex: 0,
        explanation: 'Digital messages can be screenshotted and shared long after they were sent.',
      },
      {
        question: '"Listening for understanding, not rebuttal" means what?',
        choices: ['Trying to understand the other person, not just planning your comeback', 'Waiting silently only so you can argue back harder'],
        correctIndex: 0,
        explanation: 'Real listening means genuinely trying to understand, not just preparing a rebuttal.',
      },
      {
        question: 'Someone says "I\'m not mad" through gritted teeth with crossed arms. What carries more meaning here?',
        choices: ['Tone of voice and body language', 'Nothing besides the literal words used'],
        correctIndex: 0,
        explanation: 'Nonverbal cues frequently communicate as much as, or more than, the words alone.',
      },
      {
        question: 'Why might people from different backgrounds communicate differently?',
        choices: ['Communication styles can vary by culture and background', 'Everyone communicates in exactly the same way everywhere'],
        correctIndex: 0,
        explanation: 'Being aware that communication styles vary helps avoid misreading someone\'s intent.',
      },
      {
        question: 'Why can a short, direct message read as blunt to someone from a different culture?',
        choices: ['Norms around tone and directness vary across cultures', 'Every culture communicates in exactly the same way'],
        correctIndex: 0,
        explanation: 'Being mindful of cultural differences in tone helps avoid unintended misunderstandings.',
      },
      {
        question: 'What makes a strong professional self-introduction?',
        choices: ['Your name, your interest, and why you\'re reaching out, kept short', 'A long, unfocused life story'],
        correctIndex: 0,
        explanation: 'A brief, confident introduction makes a stronger first impression than a rambling one.',
      },
    ],
  },
}
