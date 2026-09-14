// Interactive lesson + quiz content for each age-group module under the
// "Problem Solving" topic. Same split as investingContent.js: the backend's
// learning_modules catalog seeds the metadata, this file holds the content.
export const PROBLEM_SOLVING_CONTENT = {
  'problem-solving-4-6': {
    slides: [
      { emoji: '🧩', title: 'What is a problem?', text: "A problem is something that needs fixing — like a puzzle piece that won't fit, or a tower of blocks that keeps falling down. For example, if your block tower falls over every time you add the fifth block, that's a real problem worth figuring out." },
      { emoji: '🔄', title: 'Try a different way', text: "If one way doesn't work, trying a different way is exactly what problem solvers do — like turning a puzzle piece around to see if it fits better. For example, if your block tower keeps falling, trying a wider block on the bottom instead of a narrow one is exactly the kind of different approach a problem solver would try." },
      { emoji: '😅', title: 'Mistakes are okay', text: "Making a mistake while trying to solve something isn't bad — it's actually a normal part of figuring things out. For example, if your tower falls over three times before you figure out the right way to stack it, those three \"mistakes\" actually taught you something each time about what doesn't work." },
      { emoji: '🙋', title: 'Asking for help is smart', text: "If you've tried and tried and still feel stuck, asking a grown-up or a friend for help is a smart next step, not giving up. For example, if you've tried five different ways to make your tower stand and it still keeps falling, asking a grown-up \"can you help me figure this out?\" is a smart move, not a failure." },
      { emoji: '🪜', title: 'Small steps first', text: "Breaking a big task, like cleaning a messy room, into small steps — like 'pick up the toys first' — makes it feel much less overwhelming. For example, instead of looking at a totally messy room and feeling stuck, doing just one step — \"first, put all the stuffed animals on the bed\" — makes the whole task feel much more doable." },
      { emoji: '🎉', title: 'Celebrate figuring it out', text: "When you solve a problem — even a small one — it's worth feeling proud! You did real thinking to get there. For example, when your block tower finally stands tall after all your tries, giving yourself a little cheer is completely fair — you worked through a real problem to get there." },
      { emoji: '🧦', title: 'Sorting and matching', text: "Matching socks into pairs or sorting blocks by color is a fun way to practice noticing what goes together — a real problem-solving skill. For example, pulling ten mixed-up socks out of a laundry basket and matching them into five pairs uses the exact same noticing skill you'll use for bigger problems later." },
      { emoji: '🎯', title: 'One step at a time', text: "You don't have to solve everything at once — just figure out the very next small step, do it, and then figure out the step after that. For example, if you're trying to build a big block castle, you don't need a plan for the whole thing at once — just figure out the base first, then the walls, then the roof, one step at a time." },
    ],
    quiz: [
      {
        question: 'What is a "problem"?',
        choices: ['Something that needs fixing', 'Something that never needs any attention'],
        correctIndex: 0,
        explanation: 'A problem is simply something that needs to be figured out or fixed.',
      },
      {
        question: 'Your block tower keeps falling with a narrow bottom block. What should you try?',
        choices: ['A different way, like a wider block on the bottom', 'Nothing — just stop trying'],
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
        question: 'You\'ve tried five ways to make your tower stand and it still falls. What\'s a smart next step?',
        choices: ['Ask a grown-up or friend for help', 'Never ask anyone, ever'],
        correctIndex: 0,
        explanation: 'Asking for help when truly stuck is a smart, strong choice.',
      },
      {
        question: 'How can a big, messy room feel less overwhelming to clean?',
        choices: ['Breaking it into small steps, like "stuffed animals first"', 'Trying to do everything all at once'],
        correctIndex: 0,
        explanation: 'Small steps make big tasks feel much more manageable.',
      },
      {
        question: 'What skill do you practice by matching ten mixed socks into five pairs?',
        choices: ['Noticing what goes together', 'Nothing useful at all'],
        correctIndex: 0,
        explanation: 'Sorting and matching build the same noticing skills used in real problem solving.',
      },
      {
        question: 'Building a big block castle feels like too much. What can help?',
        choices: ['Just figuring out the very next small step, like the base first', 'Trying to finish everything in one go'],
        correctIndex: 0,
        explanation: 'Focusing on one step at a time makes a big task feel doable.',
      },
    ],
  },

  'problem-solving-7-9': {
    slides: [
      { emoji: '🔍', title: 'Understanding the real problem', text: "Before jumping to a solution, it helps to really understand what's going wrong — is it the toy that's broken, or a piece that's just missing? For example, if a toy robot won't walk, checking whether it's actually broken, or just missing a battery, changes whether you need a repair or just a trip to grab new batteries." },
      { emoji: '💡', title: 'Brainstorming ideas', text: "Coming up with several possible solutions — even silly ones — before picking one usually leads to a better final choice than grabbing the very first idea. For example, if you're trying to figure out how to reach a snack on a high shelf, brainstorming a few ideas — a step stool, asking a sibling, or using a broom to nudge it closer — gives you better options than just trying the very first idea that pops into your head." },
      { emoji: '🧪', title: 'Trial and error', text: "Trying a solution, seeing if it works, and adjusting if it doesn't is how a lot of real problem solving actually happens. For example, if the step stool doesn't quite reach the shelf, trying a taller stool next, and adjusting again if that's still not enough, is trial and error in action." },
      { emoji: '📝', title: 'Learning from what didn\'t work', text: "If a solution doesn't work, figuring out why helps you avoid making the same mistake again next time. For example, if a paper airplane keeps nose-diving right after launch, figuring out that the nose is too heavy helps you fix the next one instead of just folding the exact same design again." },
      { emoji: '🤝', title: 'Solving problems with others', text: "Sometimes two heads really are better than one — working with someone else can surface ideas you wouldn't have thought of alone. For example, if you and a friend are stuck on how to build a taller block tower, your friend might notice something about balancing weight that you hadn't thought of on your own." },
      { emoji: '⏸️', title: 'Taking a break when stuck', text: "Stepping away from a tricky problem for a few minutes sometimes helps your brain come back to it with a fresh idea. For example, if you've been stuck on a tricky puzzle for 20 minutes, taking a 5-minute break to get a snack often means you'll spot the missing piece almost immediately when you come back." },
      { emoji: '🏆', title: 'Comparing your solutions', text: "When you have more than one possible solution, thinking about which is easiest, fastest, or works best helps you choose wisely. For example, if you have three possible ways to fix a wobbly table leg, comparing which is fastest, which needs fewer tools, and which will actually last helps you pick the smartest one, not just the first one you thought of." },
      { emoji: '🔧', title: 'Using tools to help', text: "A ruler, a calculator, or a checklist can make solving a problem much easier — smart problem solvers use the right tool for the job. For example, using a ruler to measure exactly how much wood you need, instead of guessing, saves you from cutting a piece the wrong size." },
      { emoji: '👀', title: 'Looking from a new angle', text: "If a problem feels stuck, trying to look at it completely differently — like imagining how someone else would approach it — can reveal a solution you missed. For example, if you can't figure out how to fit all your toys back in a box, imagining how your organized friend would approach it — maybe sorting by size first — might reveal a solution you hadn't considered." },
    ],
    quiz: [
      {
        question: 'A toy robot won\'t walk. Why is it important to understand the real problem first?',
        choices: ['So you know if it needs new batteries or an actual repair', 'It\'s better to just guess and skip understanding it'],
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
        question: 'A step stool doesn\'t quite reach the shelf, so you try a taller one. What is this?',
        choices: ['Trial and error — trying, checking, and adjusting', 'Doing the exact same thing forever, even if it fails'],
        correctIndex: 0,
        explanation: 'Trial and error is trying, checking results, and adjusting as needed.',
      },
      {
        question: 'A paper airplane keeps nose-diving, and you figure out the nose is too heavy. What\'s helpful about that?',
        choices: ['Figuring out why helps you avoid the same mistake next time', 'Immediately forget about it and never think about it again'],
        correctIndex: 0,
        explanation: 'Understanding why something failed helps you avoid repeating the mistake.',
      },
      {
        question: 'Can working with a friend help you solve a block-tower balance problem?',
        choices: ['Yes, it can surface ideas you wouldn\'t think of alone', 'No, problems should always be solved completely alone'],
        correctIndex: 0,
        explanation: 'Collaborating often brings in ideas and perspectives you wouldn\'t have on your own.',
      },
      {
        question: 'Why might taking a short break help with a tricky puzzle?',
        choices: ['Your brain can come back with a fresh idea', 'Breaks never help with anything'],
        correctIndex: 0,
        explanation: 'Stepping away briefly can help your mind approach a problem freshly.',
      },
      {
        question: 'How can measuring wood with a ruler, instead of guessing, help with a problem?',
        choices: ['It makes tackling the problem easier and more organized', 'Tools never actually help'],
        correctIndex: 0,
        explanation: 'Using the right tool for the job is a genuinely smart problem-solving move.',
      },
      {
        question: 'What can help when a problem, like fitting toys in a box, feels completely stuck?',
        choices: ['Looking at it from a totally new angle, like sorting by size', 'Repeating the exact same failed approach again'],
        correctIndex: 0,
        explanation: 'A fresh perspective can reveal solutions the original approach missed.',
      },
    ],
  },

  'problem-solving-10-13': {
    slides: [
      { emoji: '🧱', title: 'Breaking big problems into small ones', text: "A big, overwhelming problem becomes much more manageable once it's broken into smaller, clearer pieces you can tackle one at a time. For example, \"plan an entire birthday party\" feels huge, but breaking it into \"pick a date,\" \"make a guest list,\" \"choose food,\" and \"plan activities\" turns it into four manageable tasks instead of one overwhelming one." },
      { emoji: '⚖️', title: 'Weighing pros and cons', text: "When you have more than one possible solution, listing the good and bad points of each helps you choose more wisely than just going with a gut feeling. For example, choosing between joining the soccer team or the debate club might come down to listing what you'd gain and give up with each — time commitment, what you'd learn, who you'd meet — rather than just picking whichever sounds more fun in the moment." },
      { emoji: '🗺️', title: 'Planning the steps', text: "Once you've picked a solution, mapping out the order of steps needed to actually do it makes the plan far more likely to succeed. For example, if you decide to organize a class fundraiser, mapping out the order — get permission first, then plan the activity, then advertise it, then run it — keeps you from accidentally skipping something important like getting permission." },
      { emoji: '💪', title: 'Sticking with it through frustration', text: "Problem solving often gets frustrating before it gets easier. Pushing through that middle, frustrating part is often exactly what separates success from giving up. For example, learning a new skateboard trick often involves falling repeatedly and feeling frustrated right before you finally land it — that frustrating middle stretch is completely normal, not a sign to quit." },
      { emoji: '🔄', title: 'Adjusting the plan', text: "A good plan isn't set in stone — if something isn't working partway through, adjusting the plan is smarter than stubbornly sticking with a failing approach. For example, if your plan to raise money by selling baked goods isn't attracting buyers, switching to selling something else, or changing your location, is smarter than stubbornly sticking with a plan that clearly isn't working." },
      { emoji: '🎯', title: 'Focusing on what you can control', text: "Some parts of a problem are out of your control. Focusing your energy on the parts you can actually influence tends to be far more productive. For example, you can't control whether it rains on the day of your outdoor event, but you can control having a backup indoor plan ready — focusing your energy there is far more useful than worrying about the weather." },
      { emoji: '📊', title: 'Checking if it actually worked', text: "After trying a solution, honestly checking whether it actually solved the problem — not just whether it felt good to try — is an important last step. For example, if your new study method felt productive but your next test score didn't actually improve, honestly noticing that mismatch matters more than how the studying felt in the moment." },
      { emoji: '🧪', title: 'Testing your solution safely', text: "Before rolling out a solution fully, trying it on a small scale first — like testing one part of a plan — helps catch problems before they get big. For example, before committing to selling 100 friendship bracelets at a big school fair, testing the idea by selling just 5 to classmates first can reveal pricing or design problems while the stakes are still small." },
      { emoji: '🗂️', title: 'Organizing your approach', text: "Writing down your plan, or listing the steps in order, helps you stay on track and notice quickly if something's been missed. For example, writing out \"1) buy supplies, 2) make the product, 3) set up the table, 4) advertise\" as an actual checklist makes it obvious if you forgot a step, instead of only realizing it halfway through." },
    ],
    quiz: [
      {
        question: 'Why break "plan an entire birthday party" into smaller pieces like date, guest list, and food?',
        choices: ['It becomes far more manageable to tackle one piece at a time', 'It makes the problem more confusing'],
        correctIndex: 0,
        explanation: 'Smaller pieces are easier to understand and act on than one huge, vague problem.',
      },
      {
        question: 'What does "weighing pros and cons" help you do when choosing between soccer and debate club?',
        choices: ['Choose more wisely between multiple solutions', 'Avoid ever making a decision'],
        correctIndex: 0,
        explanation: 'Comparing the upsides and downsides of options leads to better-informed choices.',
      },
      {
        question: 'Learning a new skateboard trick involves falling repeatedly right before landing it. Why does frustration often show up during problem solving?',
        choices: ["It's a normal part of the process, and pushing through it often leads to success", 'It means you should give up immediately'],
        correctIndex: 0,
        explanation: 'Frustration is a common phase — persisting through it often leads to a breakthrough.',
      },
      {
        question: 'Your bake sale plan isn\'t attracting buyers. What\'s the smart move?',
        choices: ['Adjust the plan', 'Stubbornly keep doing the same failing thing forever'],
        correctIndex: 0,
        explanation: 'Adjusting a plan that isn\'t working is smarter than blind persistence.',
      },
      {
        question: 'You can\'t control the weather for your outdoor event, but you can prepare a backup indoor plan. Why focus there?',
        choices: ['Your energy is more productive there than on things you can\'t influence', 'Nothing is ever within your control'],
        correctIndex: 0,
        explanation: 'Directing effort toward controllable factors tends to be far more effective.',
      },
      {
        question: 'A new study method felt productive, but your test score didn\'t improve. What should you honestly check?',
        choices: ['Whether it actually solved the real problem', 'Only whether it felt fun to try'],
        correctIndex: 0,
        explanation: 'Checking real results, not just effort, tells you whether the problem is truly solved.',
      },
      {
        question: 'Why test selling 5 bracelets to classmates before committing to 100 at a big fair?',
        choices: ['It helps catch problems before they get big', 'Testing small scale never reveals anything useful'],
        correctIndex: 0,
        explanation: 'A small test can surface issues before committing to the full solution.',
      },
      {
        question: 'How does writing "1) buy supplies, 2) make the product, 3) set up, 4) advertise" as a checklist help?',
        choices: ['It helps you stay on track and notice missed steps', 'Writing it down never actually helps'],
        correctIndex: 0,
        explanation: 'A written plan makes it easier to follow through and catch gaps.',
      },
    ],
  },

  'problem-solving-13-17': {
    slides: [
      { emoji: '🧭', title: 'A structured framework: define, plan, execute, review', text: "Many effective problem solvers follow a loose structure: clearly define the problem, plan an approach, execute it, then review what actually happened. For example, tackling a group project might mean first defining exactly what's due, then planning who does what by when, then actually doing the work, then reviewing afterward whether the plan actually worked well for next time." },
      { emoji: '🔬', title: 'Root cause analysis', text: "Instead of treating symptoms, root cause analysis asks 'why' repeatedly until you reach the actual underlying cause of a problem, not just its surface effects. For example, if you keep missing assignment deadlines, asking \"why?\" repeatedly might go: forgetting the due date → not writing it down → not having a consistent planner system — revealing that the real fix is a planning system, not just \"trying harder to remember.\"" },
      { emoji: '🎨', title: 'Creative and lateral thinking', text: "Sometimes the best solution comes from approaching a problem sideways — questioning assumptions or combining unrelated ideas — rather than the most obvious direct approach. For example, if a school club is struggling to attract new members through the usual sign-up sheet, borrowing a completely different idea — like a fun demo event from an unrelated club that worked well — might solve it better than just posting more flyers." },
      { emoji: '📐', title: 'Deciding under real constraints', text: "Real-world problems often come with limits — time, money, resources. Good problem solving works within those constraints instead of ignoring them. For example, planning a class fundraiser with only $20 of seed money and two weeks of prep time means the solution has to realistically fit those limits, not assume unlimited time and budget." },
      { emoji: '📉', title: 'Treating failure as data', text: "A failed attempt isn't just a setback — it's information about what doesn't work, which narrows down what might work next. For example, if your first attempt at a part-time job application gets rejected, treating that as data — maybe your resume needs work, or you should apply to more places — is more useful than treating it as proof you're not employable." },
      { emoji: '🧮', title: 'Prioritizing which problem to solve first', text: "When facing multiple problems at once, deciding which one to tackle first — based on urgency and impact — is itself an important problem-solving skill. For example, if you're behind on a homework assignment due tomorrow and also want to reorganize your room, tackling the urgent, high-impact homework first is the smarter priority, even if reorganizing feels more appealing right now." },
      { emoji: '🤝', title: 'Collaborative problem solving', text: "Complex problems often benefit from multiple perspectives — dividing a big problem among a team can be far more effective than solving it entirely alone. For example, organizing a school event alone means one person handling logistics, marketing, and budget — but splitting those three areas among three people, each focusing on their strength, usually produces a much better result." },
      { emoji: '🔁', title: 'Iterating toward a better solution', text: "Instead of expecting a perfect solution on the first try, iterating — improving a working-but-imperfect solution over several rounds — often produces the strongest result. For example, a first draft of a presentation might be rough, but reviewing and improving it two or three times — tightening the argument, fixing the slides — usually produces something far stronger than expecting perfection on the very first attempt." },
      { emoji: '🎲', title: 'Problems with no perfect answer', text: "Some real problems don't have one clearly best solution — every option involves trade-offs. Choosing the option with the best overall balance is often the most realistic goal. For example, choosing between two part-time job offers might mean one pays more but has worse hours, while the other pays less but fits your schedule better — there's no perfect answer, just the best overall balance for your situation." },
      { emoji: '🧩', title: 'Combining multiple solutions', text: "Sometimes the strongest answer isn't picking just one option, but combining the best parts of several different approaches into one. For example, instead of choosing purely between studying alone or in a group, combining both — reviewing material alone first, then discussing tricky parts in a group — often works better than either approach used entirely on its own." },
    ],
    quiz: [
      {
        question: 'What are the four loose stages of a structured problem-solving framework?',
        choices: ['Define, plan, execute, review', 'Guess, hope, wait, forget'],
        correctIndex: 0,
        explanation: 'This simple structure keeps problem solving organized from start to finish.',
      },
      {
        question: 'You keep missing deadlines. Asking "why" repeatedly reveals the real issue is no planner system, not "forgetfulness." What is this called?',
        choices: ['Root cause analysis — finding the underlying cause, not just the symptom', 'Only ever addressing the most visible symptom'],
        correctIndex: 0,
        explanation: 'Root cause analysis digs past symptoms to the actual source of a problem.',
      },
      {
        question: 'A club borrows an idea from an unrelated club to attract new members, instead of just posting more flyers. What does this show?',
        choices: ['Lateral thinking — approaching a problem sideways', 'Only ever using the most obvious, direct approach'],
        correctIndex: 0,
        explanation: 'Lateral thinking looks for less obvious angles that a direct approach might miss.',
      },
      {
        question: 'Why should real-world constraints (like a $20 budget and two weeks) be part of a fundraiser plan?',
        choices: ['Good solutions have to work within real limits', 'Constraints should always be ignored completely'],
        correctIndex: 0,
        explanation: 'Practical solutions account for the actual constraints they operate within.',
      },
      {
        question: 'A job application gets rejected. How should that be treated?',
        choices: ['As data that narrows down what might work next', 'As proof that you\'re unemployable'],
        correctIndex: 0,
        explanation: 'Failed attempts carry useful information, even though they didn\'t solve the problem outright.',
      },
      {
        question: 'Homework is due tomorrow and your room could also use reorganizing. What helps decide which to tackle first?',
        choices: ['Considering urgency and impact', 'Always picking whichever one is easiest, regardless of importance'],
        correctIndex: 0,
        explanation: 'Prioritizing by urgency and impact focuses effort where it matters most.',
      },
      {
        question: 'A rough presentation draft is improved over two or three rounds instead of expected to be perfect immediately. What is this called?',
        choices: ['Iterating — improving a working-but-imperfect solution over rounds', 'Expecting the very first attempt to be flawless'],
        correctIndex: 0,
        explanation: 'Iteration builds toward a strong solution gradually, rather than all at once.',
      },
      {
        question: 'Two job offers each have trade-offs (better pay vs. better hours). What is realistic here?',
        choices: ['Choosing the option with the best overall balance of trade-offs', 'Refusing to decide until a perfect option appears'],
        correctIndex: 0,
        explanation: 'Many real problems require accepting trade-offs rather than finding a flawless solution.',
      },
      {
        question: 'Studying alone first, then discussing tricky parts in a group, combines two approaches. What can this produce?',
        choices: ['A stronger answer than picking just one option', 'Always rejecting every approach except one'],
        correctIndex: 0,
        explanation: 'Blending strong elements from multiple solutions can outperform any single one.',
      },
    ],
  },
}
