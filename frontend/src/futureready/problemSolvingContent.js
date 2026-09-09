// Interactive lesson + quiz content for each age-group module under the
// "Problem Solving" topic. Same split as investingContent.js: the backend's
// learning_modules catalog seeds the metadata, this file holds the content.
export const PROBLEM_SOLVING_CONTENT = {
  'problem-solving-4-6': {
    slides: [
      { emoji: '🧩', title: 'What is a problem?', text: "A problem is something that needs fixing — like a puzzle piece that won't fit, or a tower of blocks that keeps falling down." },
      { emoji: '🔄', title: 'Try a different way', text: "If one way doesn't work, trying a different way is exactly what problem solvers do — like turning a puzzle piece around to see if it fits better." },
      { emoji: '😅', title: 'Mistakes are okay', text: "Making a mistake while trying to solve something isn't bad — it's actually a normal part of figuring things out." },
      { emoji: '🙋', title: 'Asking for help is smart', text: "If you've tried and tried and still feel stuck, asking a grown-up or a friend for help is a smart next step, not giving up." },
      { emoji: '🪜', title: 'Small steps first', text: "Breaking a big task, like cleaning a messy room, into small steps — like 'pick up the toys first' — makes it feel much less overwhelming." },
      { emoji: '🎉', title: 'Celebrate figuring it out', text: "When you solve a problem — even a small one — it's worth feeling proud! You did real thinking to get there." },
      { emoji: '🧦', title: 'Sorting and matching', text: "Matching socks into pairs or sorting blocks by color is a fun way to practice noticing what goes together — a real problem-solving skill." },
      { emoji: '🎯', title: 'One step at a time', text: "You don't have to solve everything at once — just figure out the very next small step, do it, and then figure out the step after that." },
    ],
    quiz: [
      {
        question: 'What is a "problem"?',
        choices: ['Something that needs fixing', 'Something that never needs any attention'],
        correctIndex: 0,
        explanation: 'A problem is simply something that needs to be figured out or fixed.',
      },
      {
        question: 'If one way to solve something doesn\'t work, what should you try?',
        choices: ['A different way', 'Nothing — just stop trying'],
        correctIndex: 0,
        explanation: 'Trying a different approach is exactly what good problem solvers do.',
      },
      {
        question: 'Is it okay to make mistakes while solving a problem?',
        choices: ['Yes, that\'s a normal part of figuring things out', 'No, mistakes mean you should give up completely'],
        correctIndex: 0,
        explanation: 'Mistakes are a normal, healthy part of learning to solve problems.',
      },
      {
        question: 'If you feel stuck after trying hard, what\'s a smart thing to do?',
        choices: ['Ask a grown-up or friend for help', 'Never ask anyone, ever'],
        correctIndex: 0,
        explanation: 'Asking for help when truly stuck is a smart, strong choice.',
      },
      {
        question: 'How can a big, messy task feel less overwhelming?',
        choices: ['Breaking it into small steps', 'Trying to do everything all at once'],
        correctIndex: 0,
        explanation: 'Small steps make big tasks feel much more manageable.',
      },
      {
        question: 'What skill do you practice by matching socks or sorting blocks by color?',
        choices: ['Noticing what goes together', 'Nothing useful at all'],
        correctIndex: 0,
        explanation: 'Sorting and matching build the same noticing skills used in real problem solving.',
      },
      {
        question: 'When a task feels too big, what can help?',
        choices: ['Just figuring out the very next small step', 'Trying to finish everything in one go'],
        correctIndex: 0,
        explanation: 'Focusing on one step at a time makes a big task feel doable.',
      },
    ],
  },

  'problem-solving-7-9': {
    slides: [
      { emoji: '🔍', title: 'Understanding the real problem', text: "Before jumping to a solution, it helps to really understand what's going wrong — is it the toy that's broken, or a piece that's just missing?" },
      { emoji: '💡', title: 'Brainstorming ideas', text: "Coming up with several possible solutions — even silly ones — before picking one usually leads to a better final choice than grabbing the very first idea." },
      { emoji: '🧪', title: 'Trial and error', text: "Trying a solution, seeing if it works, and adjusting if it doesn't is how a lot of real problem solving actually happens." },
      { emoji: '📝', title: 'Learning from what didn\'t work', text: "If a solution doesn't work, figuring out why helps you avoid making the same mistake again next time." },
      { emoji: '🤝', title: 'Solving problems with others', text: "Sometimes two heads really are better than one — working with someone else can surface ideas you wouldn't have thought of alone." },
      { emoji: '⏸️', title: 'Taking a break when stuck', text: "Stepping away from a tricky problem for a few minutes sometimes helps your brain come back to it with a fresh idea." },
      { emoji: '🏆', title: 'Comparing your solutions', text: "When you have more than one possible solution, thinking about which is easiest, fastest, or works best helps you choose wisely." },
      { emoji: '🔧', title: 'Using tools to help', text: "A ruler, a calculator, or a checklist can make solving a problem much easier — smart problem solvers use the right tool for the job." },
      { emoji: '👀', title: 'Looking from a new angle', text: "If a problem feels stuck, trying to look at it completely differently — like imagining how someone else would approach it — can reveal a solution you missed." },
    ],
    quiz: [
      {
        question: 'Why is it important to understand the real problem first?',
        choices: ['So you\'re actually solving the right thing', 'It\'s better to just guess and skip understanding it'],
        correctIndex: 0,
        explanation: 'Understanding the actual problem prevents wasted effort on the wrong fix.',
      },
      {
        question: 'What is "brainstorming"?',
        choices: ['Coming up with several possible solutions before picking one', 'Picking the very first idea that comes to mind'],
        correctIndex: 0,
        explanation: 'Brainstorming multiple ideas usually leads to a better final choice.',
      },
      {
        question: 'What is "trial and error"?',
        choices: ['Trying a solution, checking if it works, and adjusting', 'Doing the exact same thing forever, even if it fails'],
        correctIndex: 0,
        explanation: 'Trial and error is trying, checking results, and adjusting as needed.',
      },
      {
        question: 'If a solution doesn\'t work, what\'s helpful to do next?',
        choices: ['Figure out why it didn\'t work', 'Immediately forget about it and never think about it again'],
        correctIndex: 0,
        explanation: 'Understanding why something failed helps you avoid repeating the mistake.',
      },
      {
        question: 'Can working with someone else help you solve a problem?',
        choices: ['Yes, it can surface ideas you wouldn\'t think of alone', 'No, problems should always be solved completely alone'],
        correctIndex: 0,
        explanation: 'Collaborating often brings in ideas and perspectives you wouldn\'t have on your own.',
      },
      {
        question: 'Why might taking a short break help with a tricky problem?',
        choices: ['Your brain can come back with a fresh idea', 'Breaks never help with anything'],
        correctIndex: 0,
        explanation: 'Stepping away briefly can help your mind approach a problem freshly.',
      },
      {
        question: 'How can a tool like a checklist help with problem solving?',
        choices: ['It makes tackling the problem easier and more organized', 'Tools never actually help'],
        correctIndex: 0,
        explanation: 'Using the right tool for the job is a genuinely smart problem-solving move.',
      },
      {
        question: 'What can help when a problem feels completely stuck?',
        choices: ['Looking at it from a totally new angle', 'Repeating the exact same failed approach again'],
        correctIndex: 0,
        explanation: 'A fresh perspective can reveal solutions the original approach missed.',
      },
    ],
  },

  'problem-solving-10-13': {
    slides: [
      { emoji: '🧱', title: 'Breaking big problems into small ones', text: "A big, overwhelming problem becomes much more manageable once it's broken into smaller, clearer pieces you can tackle one at a time." },
      { emoji: '⚖️', title: 'Weighing pros and cons', text: "When you have more than one possible solution, listing the good and bad points of each helps you choose more wisely than just going with a gut feeling." },
      { emoji: '🗺️', title: 'Planning the steps', text: "Once you've picked a solution, mapping out the order of steps needed to actually do it makes the plan far more likely to succeed." },
      { emoji: '💪', title: 'Sticking with it through frustration', text: "Problem solving often gets frustrating before it gets easier. Pushing through that middle, frustrating part is often exactly what separates success from giving up." },
      { emoji: '🔄', title: 'Adjusting the plan', text: "A good plan isn't set in stone — if something isn't working partway through, adjusting the plan is smarter than stubbornly sticking with a failing approach." },
      { emoji: '🎯', title: 'Focusing on what you can control', text: "Some parts of a problem are out of your control. Focusing your energy on the parts you can actually influence tends to be far more productive." },
      { emoji: '📊', title: 'Checking if it actually worked', text: "After trying a solution, honestly checking whether it actually solved the problem — not just whether it felt good to try — is an important last step." },
      { emoji: '🧪', title: 'Testing your solution safely', text: "Before rolling out a solution fully, trying it on a small scale first — like testing one part of a plan — helps catch problems before they get big." },
      { emoji: '🗂️', title: 'Organizing your approach', text: "Writing down your plan, or listing the steps in order, helps you stay on track and notice quickly if something's been missed." },
    ],
    quiz: [
      {
        question: 'Why break a big problem into smaller pieces?',
        choices: ['It becomes far more manageable to tackle one piece at a time', 'It makes the problem more confusing'],
        correctIndex: 0,
        explanation: 'Smaller pieces are easier to understand and act on than one huge, vague problem.',
      },
      {
        question: 'What does "weighing pros and cons" help you do?',
        choices: ['Choose more wisely between multiple solutions', 'Avoid ever making a decision'],
        correctIndex: 0,
        explanation: 'Comparing the upsides and downsides of options leads to better-informed choices.',
      },
      {
        question: 'Why does frustration often show up during problem solving?',
        choices: ["It's a normal part of the process, and pushing through it often leads to success", 'It means you should give up immediately'],
        correctIndex: 0,
        explanation: 'Frustration is a common phase — persisting through it often leads to a breakthrough.',
      },
      {
        question: 'If part of a plan isn\'t working, what\'s the smart move?',
        choices: ['Adjust the plan', 'Stubbornly keep doing the same failing thing forever'],
        correctIndex: 0,
        explanation: 'Adjusting a plan that isn\'t working is smarter than blind persistence.',
      },
      {
        question: 'Why focus on what you can control?',
        choices: ['Your energy is more productive there than on things you can\'t influence', 'Nothing is ever within your control'],
        correctIndex: 0,
        explanation: 'Directing effort toward controllable factors tends to be far more effective.',
      },
      {
        question: 'After trying a solution, what should you honestly check?',
        choices: ['Whether it actually solved the real problem', 'Only whether it felt fun to try'],
        correctIndex: 0,
        explanation: 'Checking real results, not just effort, tells you whether the problem is truly solved.',
      },
      {
        question: 'Why test a solution on a small scale first?',
        choices: ['It helps catch problems before they get big', 'Testing small scale never reveals anything useful'],
        correctIndex: 0,
        explanation: 'A small test can surface issues before committing to the full solution.',
      },
      {
        question: 'How does writing down your plan help?',
        choices: ['It helps you stay on track and notice missed steps', 'Writing it down never actually helps'],
        correctIndex: 0,
        explanation: 'A written plan makes it easier to follow through and catch gaps.',
      },
    ],
  },

  'problem-solving-13-17': {
    slides: [
      { emoji: '🧭', title: 'A structured framework: define, plan, execute, review', text: "Many effective problem solvers follow a loose structure: clearly define the problem, plan an approach, execute it, then review what actually happened." },
      { emoji: '🔬', title: 'Root cause analysis', text: "Instead of treating symptoms, root cause analysis asks 'why' repeatedly until you reach the actual underlying cause of a problem, not just its surface effects." },
      { emoji: '🎨', title: 'Creative and lateral thinking', text: "Sometimes the best solution comes from approaching a problem sideways — questioning assumptions or combining unrelated ideas — rather than the most obvious direct approach." },
      { emoji: '📐', title: 'Deciding under real constraints', text: "Real-world problems often come with limits — time, money, resources. Good problem solving works within those constraints instead of ignoring them." },
      { emoji: '📉', title: 'Treating failure as data', text: "A failed attempt isn't just a setback — it's information about what doesn't work, which narrows down what might work next." },
      { emoji: '🧮', title: 'Prioritizing which problem to solve first', text: "When facing multiple problems at once, deciding which one to tackle first — based on urgency and impact — is itself an important problem-solving skill." },
      { emoji: '🤝', title: 'Collaborative problem solving', text: "Complex problems often benefit from multiple perspectives — dividing a big problem among a team can be far more effective than solving it entirely alone." },
      { emoji: '🔁', title: 'Iterating toward a better solution', text: "Instead of expecting a perfect solution on the first try, iterating — improving a working-but-imperfect solution over several rounds — often produces the strongest result." },
      { emoji: '🎲', title: 'Problems with no perfect answer', text: "Some real problems don't have one clearly best solution — every option involves trade-offs. Choosing the option with the best overall balance is often the most realistic goal." },
      { emoji: '🧩', title: 'Combining multiple solutions', text: "Sometimes the strongest answer isn't picking just one option, but combining the best parts of several different approaches into one." },
    ],
    quiz: [
      {
        question: 'What are the four loose stages of a structured problem-solving framework?',
        choices: ['Define, plan, execute, review', 'Guess, hope, wait, forget'],
        correctIndex: 0,
        explanation: 'This simple structure keeps problem solving organized from start to finish.',
      },
      {
        question: 'What is "root cause analysis"?',
        choices: ['Repeatedly asking "why" to find the underlying cause of a problem', 'Only ever addressing the most visible symptom'],
        correctIndex: 0,
        explanation: 'Root cause analysis digs past symptoms to the actual source of a problem.',
      },
      {
        question: 'What does "lateral thinking" involve?',
        choices: ['Approaching a problem sideways, questioning assumptions', 'Only ever using the most obvious, direct approach'],
        correctIndex: 0,
        explanation: 'Lateral thinking looks for less obvious angles that a direct approach might miss.',
      },
      {
        question: 'Why should real-world constraints (like time or money) be part of a solution?',
        choices: ['Good solutions have to work within real limits', 'Constraints should always be ignored completely'],
        correctIndex: 0,
        explanation: 'Practical solutions account for the actual constraints they operate within.',
      },
      {
        question: 'How should a failed attempt be treated?',
        choices: ['As data that narrows down what might work next', 'As proof that the problem is unsolvable'],
        correctIndex: 0,
        explanation: 'Failed attempts carry useful information, even though they didn\'t solve the problem outright.',
      },
      {
        question: 'When facing multiple problems, what helps decide which to tackle first?',
        choices: ['Considering urgency and impact', 'Always picking whichever one is easiest, regardless of importance'],
        correctIndex: 0,
        explanation: 'Prioritizing by urgency and impact focuses effort where it matters most.',
      },
      {
        question: 'What does "iterating" toward a solution mean?',
        choices: ['Improving a working-but-imperfect solution over several rounds', 'Expecting the very first attempt to be flawless'],
        correctIndex: 0,
        explanation: 'Iteration builds toward a strong solution gradually, rather than all at once.',
      },
      {
        question: 'What is realistic when a problem has no single perfect answer?',
        choices: ['Choosing the option with the best overall balance of trade-offs', 'Refusing to decide until a perfect option appears'],
        correctIndex: 0,
        explanation: 'Many real problems require accepting trade-offs rather than finding a flawless solution.',
      },
      {
        question: 'What can produce a stronger answer than picking just one option?',
        choices: ['Combining the best parts of several approaches', 'Always rejecting every approach except one'],
        correctIndex: 0,
        explanation: 'Blending strong elements from multiple solutions can outperform any single one.',
      },
    ],
  },
}
