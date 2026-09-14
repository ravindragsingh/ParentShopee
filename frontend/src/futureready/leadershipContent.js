// Interactive lesson + quiz content for each age-group module under the
// "Leadership" topic. Same split as investingContent.js: the backend's
// learning_modules catalog seeds the metadata, this file holds the content.
export const LEADERSHIP_CONTENT = {
  'leadership-4-6': {
    slides: [
      { emoji: '👑', title: 'What is a leader?', text: "A leader is someone who helps a group work together and get things done — like leading a game, or showing a friend how to do something. For example, if you're playing tag and you're the one explaining the rules so everyone knows how to play, you're being a leader in that moment." },
      { emoji: '🤝', title: 'Taking turns', text: "Everyone gets a turn to lead sometimes — like picking the game, or going first — and everyone gets a turn to follow too. For example, if you pick the game today, letting a friend pick tomorrow means everyone gets a fair turn at being the leader." },
      { emoji: '🧩', title: 'Working together', text: "A big job, like building a huge block tower, goes faster and is more fun when everyone helps with a part of it. For example, if one friend collects the blocks, another stacks them, and you decide where to put each piece, the tower gets built much faster than if just one person tried to do it all alone." },
      { emoji: '🙋', title: 'Helping without being asked', text: "Noticing something that needs doing — like picking up a dropped toy — and just doing it is a small way of leading. For example, if you notice a friend's crayons scattered on the floor and pick them up without being asked, that's real leadership, even though nobody told you to do it." },
      { emoji: '😊', title: 'Being a good sport', text: "Whether you win or lose a game, being kind and saying \"good game\" is something a good leader does. For example, if you lose a board game, saying \"good game, that was fun!\" instead of getting upset shows the kind of good sportsmanship a leader models for others." },
      { emoji: '🗣️', title: 'Saying sorry', text: "A good leader admits when they made a mistake and says sorry, instead of blaming someone else. For example, if you accidentally knock over your friend's tower while playing, saying \"sorry, I didn't mean to, let's rebuild it together\" instead of blaming them for standing there is what a good leader does." },
      { emoji: '⭐', title: 'Cheering others on', text: "Clapping and cheering for a friend who's trying something hard helps them feel brave and supported. For example, if a friend is nervously trying to ride a bike without training wheels for the first time, cheering \"you can do it!\" helps them feel braver about trying." },
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
        question: 'One friend collects blocks, another stacks them, you decide placement. What makes the tower go faster?',
        choices: ['Everyone helping with a part of it', 'Only one person doing all of it'],
        correctIndex: 0,
        explanation: 'Working together on a big job makes it faster and more fun.',
      },
      {
        question: 'You accidentally knock over a friend\'s tower. What should a good leader do?',
        choices: ['Say sorry', 'Blame someone else'],
        correctIndex: 0,
        explanation: 'Admitting a mistake and saying sorry is part of being a good leader.',
      },
      {
        question: "A friend is nervously trying to ride a bike without training wheels. What can you do?",
        choices: ['Cheer them on', 'Ignore them'],
        correctIndex: 0,
        explanation: 'Cheering for a friend helps them feel brave and supported.',
      },
    ],
  },

  'leadership-7-9': {
    slides: [
      { emoji: '👂', title: "Listening to everyone's ideas", text: "A good leader asks what others think, not just shares their own idea. For example, if your group is deciding what game to play at recess, asking \"what does everyone else want to play?\" instead of just announcing your own choice is what a good leader does." },
      { emoji: '📋', title: 'Giving out jobs', text: "Splitting a group project into smaller jobs, and letting each person pick or be given one, is called delegation. For example, on a group poster project, one person could draw the pictures, another could write the words, and a third could color it in — splitting up the work is delegation." },
      { emoji: '✅', title: 'Taking responsibility', text: "If you agreed to do a job, following through on it — even when it's not fun — is a big part of being trusted. For example, if you agreed to bring the markers for a group art project, actually remembering to bring them — even on a day you'd rather sleep in late — is what builds your teammates' trust in you." },
      { emoji: '🤝', title: 'Solving a disagreement', text: "When two people in a group disagree, a good leader helps both sides say what they think and find something everyone can accept. For example, if two teammates disagree about which color to paint the group project, a good leader might ask each to explain their reason, then suggest a compromise like using both colors." },
      { emoji: '🌟', title: 'Leading by example', text: "Doing the right thing yourself — like helping clean up — often gets others to help too, more than just telling them to. For example, if you start cleaning up the classroom without being asked, other kids often start pitching in too, way more than if you just told them \"you should clean up.\"" },
      { emoji: '🙋', title: 'Speaking up for someone', text: "If someone in the group is being left out or unheard, a good leader helps make sure they get a chance to speak. For example, if a quiet group member hasn't gotten a chance to share their idea during a project discussion, saying \"let's hear what they think too\" is a real act of leadership." },
      { emoji: '🎯', title: 'Setting a group goal', text: "Deciding together what the group is trying to achieve makes it much easier to know if everyone's efforts are working. For example, if your group agrees the goal is \"finish the poster by Friday with at least three facts on it,\" everyone knows exactly what they're working toward, instead of guessing." },
      { emoji: '💪', title: 'Encouraging a teammate', text: "Noticing when someone on your team is struggling and offering to help, or just cheering them on, is real leadership. For example, if a teammate is struggling to finish their part of a project, offering \"do you want help with that part?\" instead of ignoring their struggle is exactly the kind of support a good leader gives." },
    ],
    quiz: [
      {
        question: "Deciding what to play at recess, what does a good leader do with other people's ideas?",
        choices: ['Listens to them', 'Ignores them and shares only their own'],
        correctIndex: 0,
        explanation: 'Listening to everyone\'s ideas is a core part of good leadership.',
      },
      {
        question: 'On a group poster, one person draws, one writes, one colors. What is this splitting of jobs called?',
        choices: ['Delegation', 'Doing every part of a job yourself'],
        correctIndex: 0,
        explanation: 'Delegation means sharing out the work among the group.',
      },
      {
        question: 'You agreed to bring markers for a project. Why does following through matter?',
        choices: ['It builds trust', 'It doesn\'t matter at all'],
        correctIndex: 0,
        explanation: 'Following through, even when it\'s not fun, is how trust gets built.',
      },
      {
        question: 'Two teammates disagree about a paint color. What helps solve it?',
        choices: ['Letting both sides say what they think', 'Only listening to one side'],
        correctIndex: 0,
        explanation: 'Hearing both sides out helps find something everyone can accept.',
      },
      {
        question: 'You start cleaning the classroom without being asked, and others join in. What is this?',
        choices: ['Leading by example', 'Only telling others what to do'],
        correctIndex: 0,
        explanation: 'Leading by example often works better than just giving instructions.',
      },
      {
        question: 'A quiet group member hasn\'t shared their idea yet. What should you do?',
        choices: ['Help make sure they get to speak', 'Ignore it and move on'],
        correctIndex: 0,
        explanation: 'A good leader notices when someone is unheard and helps include them.',
      },
    ],
  },

  'leadership-10-13': {
    slides: [
      { emoji: '🧩', title: 'Matching jobs to strengths', text: "A good leader notices what each person is good at and hands out jobs that fit, instead of assigning randomly. For example, on a group science project, giving the research job to someone who loves reading, the presentation to someone who enjoys public speaking, and the data charts to someone good at math sets everyone up to actually succeed." },
      { emoji: '📣', title: 'Giving feedback kindly', text: "Telling a teammate what could improve, specifically and kindly, helps them grow instead of just feeling criticized. For example, saying \"your section is great, maybe just add one more example to make it clearer\" helps a teammate improve, while just saying \"this part is weak\" leaves them with nothing useful to act on." },
      { emoji: '✅', title: 'Being accountable', text: "When something goes wrong on a team, a good leader looks at what they could have done differently, not just who else to blame. For example, if your group misses a deadline, a good leader asks \"what could I have communicated better?\" instead of immediately pointing fingers at whoever finished last." },
      { emoji: '⚖️', title: 'Fair conflict resolution', text: "Listening to both sides of a disagreement fully, before deciding anything, is what makes a resolution feel fair to everyone. For example, if two teammates disagree about how to split credit for a project, hearing both people's full explanation before suggesting a solution makes the eventual decision feel much fairer to both." },
      { emoji: '🤲', title: 'Sharing credit', text: "A good leader makes sure the whole team gets recognized for a success, not just themselves. For example, if your group project gets praised by a teacher, saying \"we all worked hard on this together\" instead of taking all the credit yourself is what earns real respect from your teammates." },
      { emoji: '🙏', title: 'Staying humble', text: "Being willing to admit you don't have all the answers, and asking for help, actually builds more respect than pretending to know everything. For example, if you're leading a project and genuinely don't know how to solve a technical problem, admitting \"I'm not sure, does anyone have an idea?\" earns more respect than bluffing your way through and getting it wrong." },
      { emoji: '🔑', title: 'Earning trust over time', text: "Trust is built slowly, through many small kept promises, and can be lost quickly by breaking just one. For example, consistently showing up on time and finishing your part of group work, week after week, slowly builds real trust — but missing one important deadline right before a big presentation can undo a lot of that trust quickly." },
    ],
    quiz: [
      {
        question: "On a science project, why give research to a reader and presenting to a good public speaker?",
        choices: ['It sets each person up to succeed', 'Strengths don\'t matter for team jobs'],
        correctIndex: 0,
        explanation: 'Matching tasks to strengths helps both the person and the team succeed.',
      },
      {
        question: 'Which is more helpful: "this part is weak" or "great section, maybe add one more example"?',
        choices: ['"great section, maybe add one more example" — specific and kind', 'Being vague and harsh'],
        correctIndex: 0,
        explanation: 'Specific, kind feedback helps a teammate grow rather than just feel criticized.',
      },
      {
        question: 'Your group misses a deadline. What does "being accountable" look like?',
        choices: ['Looking at your own part in what went wrong', 'Immediately blaming someone else'],
        correctIndex: 0,
        explanation: 'Accountability means examining your own role, not just assigning blame.',
      },
      {
        question: 'Two teammates disagree about splitting credit. What makes the resolution feel fair?',
        choices: ['Both sides being fully heard first', 'Deciding quickly without hearing anyone out'],
        correctIndex: 0,
        explanation: 'Fully hearing both sides before deciding is what makes a resolution feel fair.',
      },
      {
        question: 'Your group project gets praised. Why say "we all worked hard" instead of taking credit alone?',
        choices: ['Everyone contributed and deserves recognition', 'The leader should always get the credit'],
        correctIndex: 0,
        explanation: 'Sharing credit fairly recognizes everyone\'s contribution to a success.',
      },
      {
        question: 'How is trust usually built, based on showing up consistently over weeks?',
        choices: ['Slowly, through many small kept promises', 'Instantly, the moment someone becomes a leader'],
        correctIndex: 0,
        explanation: 'Trust accumulates gradually through consistent, kept promises.',
      },
    ],
  },

  'leadership-13-17': {
    slides: [
      { emoji: '🎭', title: 'Different leadership styles', text: "Some leaders direct closely, others coach, others mostly get out of the way — the best style often depends on the team and the situation, not one fixed approach. For example, a brand-new team member might need close, direct guidance at first, while an experienced teammate often does better with a leader who mostly steps back and trusts their judgment." },
      { emoji: '🤝', title: 'Servant leadership', text: 'This style puts the team\'s needs first, asking "how can I help you succeed?" rather than "how can you help me look good?" For example, a club president practicing servant leadership might spend their time helping members get resources they need for their own projects, rather than mainly focusing on projects that make the president look good.' },
      { emoji: '🧵', title: 'Delegation vs. micromanaging', text: "Genuine delegation means trusting someone with real ownership of a task, not just assigning it and then controlling every detail anyway. For example, delegating the social media for a club event means letting that person actually make creative decisions, rather than assigning it to them and then rewriting every post yourself anyway." },
      { emoji: '🧭', title: 'Leading through team conflict', text: "A strong leader acts as a fair facilitator during conflict, not a judge picking sides, helping the team find its own resolution. For example, if two club members clash over how to run an event, a strong leader might guide a conversation where both explain their view and propose their own compromise, rather than the leader simply declaring a winner." },
      { emoji: '🧠', title: 'Emotional intelligence in leadership', text: "Noticing how team members are feeling, not just what they're doing, often prevents problems before they even start. For example, noticing a normally engaged teammate has become unusually quiet in meetings, and checking in privately, can catch a brewing problem — burnout, a personal issue, a disagreement — before it affects the whole team's work." },
      { emoji: '⚖️', title: 'Leading with integrity', text: "Making the same ethical choice whether or not anyone's watching is what actually earns long-term respect from a team. For example, giving honest credit for an idea even when nobody would have noticed if you'd taken it for yourself is exactly the kind of consistent integrity that earns lasting trust." },
      { emoji: '📉', title: 'Leading through failure', text: "How a leader responds when something goes wrong — calmly, constructively — often matters more to a team than the failure itself. For example, if a club event flops due to poor turnout, a leader who calmly says \"let's figure out what we can learn from this for next time\" builds far more team confidence than one who panics or assigns blame." },
      { emoji: '🌱', title: 'Growing future leaders', text: "A strong leader doesn't just lead — they deliberately help other team members develop leadership skills of their own. For example, a graduating club president who spends their last few months specifically mentoring a younger member to take over — teaching them how to run meetings and handle conflicts — leaves the club stronger than one who never prepared anyone to follow them." },
    ],
    quiz: [
      {
        question: 'A brand-new team member needs close guidance, while an experienced one does better with more independence. What does this show?',
        choices: ['No single leadership style is correct for every situation', 'Yes, one style always works best'],
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
        question: "Delegating social media but then rewriting every post yourself — what's actually happening?",
        choices: ['Micromanaging, not genuine delegation', 'True delegation with real ownership'],
        correctIndex: 0,
        explanation: 'True delegation trusts someone with genuine ownership, unlike micromanaging.',
      },
      {
        question: 'Two club members clash over an event. What role should a strong leader play?',
        choices: ['A fair facilitator, not a judge', 'A judge who picks a winning side'],
        correctIndex: 0,
        explanation: 'Facilitating helps the team find its own resolution rather than having one imposed.',
      },
      {
        question: 'Noticing a normally engaged teammate has gone quiet, and checking in early. Why does this matter?',
        choices: ['It helps notice and prevent problems early', 'Feelings are irrelevant to leading a team'],
        correctIndex: 0,
        explanation: 'Noticing how people feel, not just what they do, helps catch problems early.',
      },
      {
        question: 'Giving honest credit for an idea even when nobody would have noticed otherwise. What does this show?',
        choices: ["Leading with integrity — the same choice whether or not anyone's watching", 'Only acting ethically when being observed'],
        correctIndex: 0,
        explanation: 'Consistent ethical behavior, watched or not, is what earns lasting respect.',
      },
      {
        question: 'A club event flops, and the leader calmly says "let\'s learn from this." What should a strong leader do beyond day-to-day leading?',
        choices: ["Help develop other people's leadership skills too", 'Keep all leadership responsibility to themselves'],
        correctIndex: 0,
        explanation: 'Growing future leaders is itself a mark of strong, generous leadership.',
      },
    ],
  },
}
