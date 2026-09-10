// Interactive lesson + quiz content for each age-group module under the
// "Leadership" topic. Same split as investingContent.js: the backend's
// learning_modules catalog seeds the metadata, this file holds the content.
export const LEADERSHIP_CONTENT = {
  'leadership-4-6': {
    slides: [
      { emoji: '👑', title: 'What is a leader?', text: "A leader is someone who helps a group work together and get things done — like leading a game, or showing a friend how to do something." },
      { emoji: '🤝', title: 'Taking turns', text: "Everyone gets a turn to lead sometimes — like picking the game, or going first — and everyone gets a turn to follow too." },
      { emoji: '🧩', title: 'Working together', text: "A big job, like building a huge block tower, goes faster and is more fun when everyone helps with a part of it." },
      { emoji: '🙋', title: 'Helping without being asked', text: "Noticing something that needs doing — like picking up a dropped toy — and just doing it is a small way of leading." },
      { emoji: '😊', title: 'Being a good sport', text: "Whether you win or lose a game, being kind and saying \"good game\" is something a good leader does." },
      { emoji: '🗣️', title: 'Saying sorry', text: "A good leader admits when they made a mistake and says sorry, instead of blaming someone else." },
      { emoji: '⭐', title: 'Cheering others on', text: "Clapping and cheering for a friend who's trying something hard helps them feel brave and supported." },
    ],
    quiz: [
      {
        question: 'What is a leader?',
        choices: ['Someone who helps a group work together', 'Someone who always plays alone'],
        correctIndex: 0,
        explanation: 'A leader helps a group get things done together.',
      },
      {
        question: 'Should everyone get a turn to lead?',
        choices: ['Yes, everyone gets a turn', 'No, only one person ever leads'],
        correctIndex: 0,
        explanation: 'Taking turns leading and following is fair for everyone in the group.',
      },
      {
        question: 'What makes a big job, like building a huge tower, go faster?',
        choices: ['Everyone helping with a part of it', 'Only one person doing all of it'],
        correctIndex: 0,
        explanation: 'Working together on a big job makes it faster and more fun.',
      },
      {
        question: 'If you make a mistake, what should a good leader do?',
        choices: ['Say sorry', 'Blame someone else'],
        correctIndex: 0,
        explanation: 'Admitting a mistake and saying sorry is part of being a good leader.',
      },
      {
        question: "What can you do when a friend tries something hard?",
        choices: ['Cheer them on', 'Ignore them'],
        correctIndex: 0,
        explanation: 'Cheering for a friend helps them feel brave and supported.',
      },
    ],
  },

  'leadership-7-9': {
    slides: [
      { emoji: '👂', title: "Listening to everyone's ideas", text: "A good leader asks what others think, not just shares their own idea." },
      { emoji: '📋', title: 'Giving out jobs', text: "Splitting a group project into smaller jobs, and letting each person pick or be given one, is called delegation." },
      { emoji: '✅', title: 'Taking responsibility', text: "If you agreed to do a job, following through on it — even when it's not fun — is a big part of being trusted." },
      { emoji: '🤝', title: 'Solving a disagreement', text: "When two people in a group disagree, a good leader helps both sides say what they think and find something everyone can accept." },
      { emoji: '🌟', title: 'Leading by example', text: "Doing the right thing yourself — like helping clean up — often gets others to help too, more than just telling them to." },
      { emoji: '🙋', title: 'Speaking up for someone', text: "If someone in the group is being left out or unheard, a good leader helps make sure they get a chance to speak." },
      { emoji: '🎯', title: 'Setting a group goal', text: "Deciding together what the group is trying to achieve makes it much easier to know if everyone's efforts are working." },
      { emoji: '💪', title: 'Encouraging a teammate', text: "Noticing when someone on your team is struggling and offering to help, or just cheering them on, is real leadership." },
    ],
    quiz: [
      {
        question: "What does a good leader do with other people's ideas?",
        choices: ['Listens to them', 'Ignores them and shares only their own'],
        correctIndex: 0,
        explanation: 'Listening to everyone\'s ideas is a core part of good leadership.',
      },
      {
        question: 'What is "delegation"?',
        choices: ['Splitting a job into smaller parts for different people', 'Doing every part of a job yourself'],
        correctIndex: 0,
        explanation: 'Delegation means sharing out the work among the group.',
      },
      {
        question: 'Why does following through on a job you agreed to matter?',
        choices: ['It builds trust', 'It doesn\'t matter at all'],
        correctIndex: 0,
        explanation: 'Following through, even when it\'s not fun, is how trust gets built.',
      },
      {
        question: 'What helps solve a disagreement in a group?',
        choices: ['Letting both sides say what they think', 'Only listening to one side'],
        correctIndex: 0,
        explanation: 'Hearing both sides out helps find something everyone can accept.',
      },
      {
        question: 'What is "leading by example"?',
        choices: ['Doing the right thing yourself so others follow', 'Only telling others what to do'],
        correctIndex: 0,
        explanation: 'Leading by example often works better than just giving instructions.',
      },
      {
        question: 'What should you do if a teammate seems left out?',
        choices: ['Help make sure they get to speak', 'Ignore it and move on'],
        correctIndex: 0,
        explanation: 'A good leader notices when someone is unheard and helps include them.',
      },
    ],
  },

  'leadership-10-13': {
    slides: [
      { emoji: '🧩', title: 'Matching jobs to strengths', text: "A good leader notices what each person is good at and hands out jobs that fit, instead of assigning randomly." },
      { emoji: '📣', title: 'Giving feedback kindly', text: "Telling a teammate what could improve, specifically and kindly, helps them grow instead of just feeling criticized." },
      { emoji: '✅', title: 'Being accountable', text: "When something goes wrong on a team, a good leader looks at what they could have done differently, not just who else to blame." },
      { emoji: '⚖️', title: 'Fair conflict resolution', text: "Listening to both sides of a disagreement fully, before deciding anything, is what makes a resolution feel fair to everyone." },
      { emoji: '🤲', title: 'Sharing credit', text: "A good leader makes sure the whole team gets recognized for a success, not just themselves." },
      { emoji: '🙏', title: 'Staying humble', text: "Being willing to admit you don't have all the answers, and asking for help, actually builds more respect than pretending to know everything." },
      { emoji: '🔑', title: 'Earning trust over time', text: "Trust is built slowly, through many small kept promises, and can be lost quickly by breaking just one." },
    ],
    quiz: [
      {
        question: "Why match jobs to people's strengths?",
        choices: ['It sets each person up to succeed', 'Strengths don\'t matter for team jobs'],
        correctIndex: 0,
        explanation: 'Matching tasks to strengths helps both the person and the team succeed.',
      },
      {
        question: 'What makes feedback actually helpful?',
        choices: ['Being specific and kind', 'Being vague and harsh'],
        correctIndex: 0,
        explanation: 'Specific, kind feedback helps a teammate grow rather than just feel criticized.',
      },
      {
        question: 'What does "being accountable" mean?',
        choices: ['Looking at your own part in what went wrong', 'Immediately blaming someone else'],
        correctIndex: 0,
        explanation: 'Accountability means examining your own role, not just assigning blame.',
      },
      {
        question: 'What makes a conflict resolution feel fair to everyone?',
        choices: ['Both sides being fully heard first', 'Deciding quickly without hearing anyone out'],
        correctIndex: 0,
        explanation: 'Fully hearing both sides before deciding is what makes a resolution feel fair.',
      },
      {
        question: 'Why share credit with the whole team?',
        choices: ['Everyone contributed and deserves recognition', 'The leader should always get the credit'],
        correctIndex: 0,
        explanation: 'Sharing credit fairly recognizes everyone\'s contribution to a success.',
      },
      {
        question: 'How is trust usually built?',
        choices: ['Slowly, through many small kept promises', 'Instantly, the moment someone becomes a leader'],
        correctIndex: 0,
        explanation: 'Trust accumulates gradually through consistent, kept promises.',
      },
    ],
  },

  'leadership-13-17': {
    slides: [
      { emoji: '🎭', title: 'Different leadership styles', text: "Some leaders direct closely, others coach, others mostly get out of the way — the best style often depends on the team and the situation, not one fixed approach." },
      { emoji: '🤝', title: 'Servant leadership', text: 'This style puts the team\'s needs first, asking "how can I help you succeed?" rather than "how can you help me look good?"' },
      { emoji: '🧵', title: 'Delegation vs. micromanaging', text: "Genuine delegation means trusting someone with real ownership of a task, not just assigning it and then controlling every detail anyway." },
      { emoji: '🧭', title: 'Leading through team conflict', text: "A strong leader acts as a fair facilitator during conflict, not a judge picking sides, helping the team find its own resolution." },
      { emoji: '🧠', title: 'Emotional intelligence in leadership', text: "Noticing how team members are feeling, not just what they're doing, often prevents problems before they even start." },
      { emoji: '⚖️', title: 'Leading with integrity', text: "Making the same ethical choice whether or not anyone's watching is what actually earns long-term respect from a team." },
      { emoji: '📉', title: 'Leading through failure', text: "How a leader responds when something goes wrong — calmly, constructively — often matters more to a team than the failure itself." },
      { emoji: '🌱', title: 'Growing future leaders', text: "A strong leader doesn't just lead — they deliberately help other team members develop leadership skills of their own." },
    ],
    quiz: [
      {
        question: 'Is there one single "correct" leadership style for every situation?',
        choices: ['No, it depends on the team and situation', 'Yes, one style always works best'],
        correctIndex: 0,
        explanation: 'Effective leaders adapt their style to fit the team and the moment.',
      },
      {
        question: 'What does "servant leadership" prioritize?',
        choices: ["The team's needs and success", 'Making the leader look good'],
        correctIndex: 0,
        explanation: 'Servant leadership puts the team\'s success ahead of the leader\'s own image.',
      },
      {
        question: "What's the difference between delegation and micromanaging?",
        choices: ['Delegation gives real ownership; micromanaging still controls every detail', 'They mean exactly the same thing'],
        correctIndex: 0,
        explanation: 'True delegation trusts someone with genuine ownership, unlike micromanaging.',
      },
      {
        question: 'In team conflict, what role should a strong leader play?',
        choices: ['A fair facilitator, not a judge', 'A judge who picks a winning side'],
        correctIndex: 0,
        explanation: 'Facilitating helps the team find its own resolution rather than having one imposed.',
      },
      {
        question: 'Why does emotional intelligence matter in leadership?',
        choices: ['It helps notice and prevent problems early', 'Feelings are irrelevant to leading a team'],
        correctIndex: 0,
        explanation: 'Noticing how people feel, not just what they do, helps catch problems early.',
      },
      {
        question: 'What does "leading with integrity" mean?',
        choices: ["Making the same ethical choice whether or not anyone's watching", 'Only acting ethically when being observed'],
        correctIndex: 0,
        explanation: 'Consistent ethical behavior, watched or not, is what earns lasting respect.',
      },
      {
        question: 'What should a strong leader do beyond just leading day to day?',
        choices: ["Help develop other people's leadership skills", 'Keep all leadership responsibility to themselves'],
        correctIndex: 0,
        explanation: 'Growing future leaders is itself a mark of strong, generous leadership.',
      },
    ],
  },
}
