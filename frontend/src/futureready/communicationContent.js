// Interactive lesson + quiz content for each age-group module under the
// "Communication" topic. Same split as investingContent.js: the backend's
// learning_modules catalog seeds the metadata, this file holds the content.
export const COMMUNICATION_CONTENT = {
  'communication-4-6': {
    slides: [
      { emoji: '🗣️', title: 'Use your words', text: "When you feel happy, sad, or upset, saying it out loud with words helps people understand you better than yelling or crying alone." },
      { emoji: '👂', title: 'Listening matters too', text: "Talking is only half of communicating — really listening when someone else is talking is just as important." },
      { emoji: '🙏', title: '"Please" and "thank you"', text: "Saying please when you ask for something, and thank you when someone helps you, makes people happy to help you again." },
      { emoji: '🙋', title: 'Asking for help', text: "If you're stuck or need something, asking for help with your words is a strong, smart thing to do — not something to feel bad about." },
      { emoji: '😊', title: 'Your face says a lot too', text: "A smile, a frown, or wide eyes all send a message, even before you say a single word." },
      { emoji: '⏳', title: 'Taking turns talking', text: "Waiting for your turn to talk — instead of interrupting — helps everyone feel heard in a conversation." },
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
        question: 'If you\'re stuck and need help, what should you do?',
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
    ],
  },

  'communication-7-9': {
    slides: [
      { emoji: '👂', title: 'What is active listening?', text: "Active listening means really paying attention — looking at the person, not interrupting, and thinking about what they're saying instead of just waiting for your turn to talk." },
      { emoji: '🙆', title: 'Body language basics', text: "Crossed arms, a big smile, or looking away all send messages without any words — noticing body language helps you understand people better." },
      { emoji: '🔄', title: 'Taking turns in conversation', text: "A good conversation feels like a back-and-forth game of catch, not one person talking the whole time." },
      { emoji: '🙅', title: 'Disagreeing politely', text: "You can disagree with someone without being mean — saying 'I see it differently' is a respectful way to share a different opinion." },
      { emoji: '❓', title: 'Asking clarifying questions', text: "If you don't understand something someone said, asking 'can you explain that again?' is smarter than just pretending to understand." },
      { emoji: '💌', title: 'Written vs. spoken words', text: "Writing a message and saying it out loud can feel very different — a text can sometimes sound different than you meant it to." },
      { emoji: '🤗', title: 'Checking in on feelings', text: "Asking a friend 'are you okay?' when they seem upset shows you're paying attention to more than just what they're saying." },
    ],
    quiz: [
      {
        question: 'What is "active listening"?',
        choices: ['Really paying attention instead of just waiting to talk', 'Talking as much as possible'],
        correctIndex: 0,
        explanation: 'Active listening means genuinely focusing on what the other person is saying.',
      },
      {
        question: 'Can body language send a message without words?',
        choices: ['Yes, like crossed arms or a big smile', 'No, only spoken words communicate anything'],
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
        question: 'How can you disagree with someone politely?',
        choices: ['Say something like "I see it differently"', 'Yell that they\'re wrong'],
        correctIndex: 0,
        explanation: 'Polite disagreement keeps the conversation respectful, even with different opinions.',
      },
      {
        question: "If you don't understand what someone said, what's smart to do?",
        choices: ['Ask them to explain again', 'Pretend you understood anyway'],
        correctIndex: 0,
        explanation: 'Asking for clarification helps you actually understand, instead of guessing.',
      },
      {
        question: 'Can a written message sound different than you meant it?',
        choices: ['Yes, tone can be easy to misread in writing', 'No, writing always sounds exactly like talking'],
        correctIndex: 0,
        explanation: 'Written messages can lose tone easily, which is why misunderstandings happen in texts.',
      },
    ],
  },

  'communication-10-13': {
    slides: [
      { emoji: '🎯', title: 'Knowing your audience', text: "How you explain something to a younger sibling is different from how you'd explain it to a teacher — good communicators adjust to who they're talking to." },
      { emoji: '💬', title: 'Persuasive communication', text: "Persuading someone works best with clear reasons and evidence, not just repeating what you want louder." },
      { emoji: '📱', title: 'Reading tone in messages', text: "A short text like 'fine.' can come across as annoyed even if it wasn't meant that way — being aware of this helps avoid mixed-up messages." },
      { emoji: '🔁', title: 'Giving feedback kindly', text: "Good feedback focuses on the specific thing that could improve, said kindly — not a vague or harsh comment about the person." },
      { emoji: '👂', title: 'Receiving feedback well', text: "Hearing feedback about something you did isn't the same as being told you're a bad person — separating the two helps you actually improve." },
      { emoji: '🤝', title: 'Resolving a disagreement', text: "Calmly explaining your side, actually listening to theirs, and looking for a solution both people can accept usually works better than arguing to 'win.'" },
      { emoji: '📝', title: 'Written communication skills', text: "A clear, organized message — like a well-written email or message — gets read and understood much more easily than a rushed, jumbled one." },
    ],
    quiz: [
      {
        question: 'Why does "knowing your audience" matter?',
        choices: ['Good communicators adjust how they explain things to who they\'re talking to', 'You should explain everything exactly the same way to everyone'],
        correctIndex: 0,
        explanation: 'Adjusting your explanation to your audience makes communication more effective.',
      },
      {
        question: 'What makes persuasion actually work well?',
        choices: ['Clear reasons and evidence', 'Repeating the same demand louder'],
        correctIndex: 0,
        explanation: 'Solid reasoning tends to persuade far better than volume alone.',
      },
      {
        question: 'Why can a short text message be easily misunderstood?',
        choices: ['Tone is hard to read without facial expressions or voice', 'Text messages are always crystal clear'],
        correctIndex: 0,
        explanation: 'Without tone of voice or expression, short texts can come across differently than intended.',
      },
      {
        question: 'What makes feedback helpful rather than hurtful?',
        choices: ['Being specific and kind about what could improve', 'Being vague and harsh'],
        correctIndex: 0,
        explanation: 'Specific, kind feedback is more useful and easier to hear than vague criticism.',
      },
      {
        question: 'How can you receive feedback well?',
        choices: ['Separate feedback about an action from your worth as a person', 'Assume any feedback means you\'re a bad person'],
        correctIndex: 0,
        explanation: 'Feedback about what you did isn\'t a judgment of who you are.',
      },
      {
        question: 'What usually resolves a disagreement better than arguing to "win"?',
        choices: ['Listening to the other side and finding a solution both can accept', 'Talking louder until the other person gives up'],
        correctIndex: 0,
        explanation: 'Genuinely listening and finding common ground resolves disagreements more durably.',
      },
    ],
  },

  'communication-13-17': {
    slides: [
      { emoji: '🎤', title: 'Public speaking basics', text: "Speaking to a group feels easier with preparation: knowing your key points, practicing out loud, and remembering that some nerves are completely normal." },
      { emoji: '🧭', title: 'Assertive vs. passive vs. aggressive', text: "Assertive communication states your needs clearly and respectfully. Passive avoids saying what you need. Aggressive disregards the other person's feelings entirely." },
      { emoji: '🤝', title: 'Conflict resolution', text: "Resolving conflict well usually means naming the real issue calmly, listening fully to the other side, and working toward a solution instead of assigning blame." },
      { emoji: '💼', title: 'Professional communication', text: "A clear subject line, a polite tone, and getting to the point efficiently make emails and messages far more effective in school or work settings." },
      { emoji: '📵', title: 'Digital communication etiquette', text: "What you'd never say to someone's face shouldn't be said online either — screenshots and messages tend to stick around far longer than a spoken conversation." },
      { emoji: '🎧', title: 'Listening for understanding, not rebuttal', text: "Truly listening means trying to understand the other person's point, not just waiting for your turn to argue back." },
      { emoji: '🌍', title: 'Communicating across differences', text: "People from different backgrounds may communicate in different styles — being aware of this helps avoid misreading someone's tone or intent." },
      { emoji: '🧩', title: 'Nonverbal cues under pressure', text: "In a tense conversation, tone of voice and body language often carry as much meaning as the actual words being said." },
    ],
    quiz: [
      {
        question: 'What is "assertive" communication?',
        choices: ['Stating your needs clearly and respectfully', 'Ignoring the other person\'s feelings entirely'],
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
        question: 'What makes a professional email effective?',
        choices: ['A clear subject line and getting to the point politely', 'A vague subject and a very long, rambling message'],
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
        question: 'In a tense conversation, what often carries as much meaning as the words themselves?',
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
    ],
  },
}
