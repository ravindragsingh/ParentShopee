import { useNavigate, useParams } from 'react-router-dom'

// ── Blog data ─────────────────────────────────────────────────────────────────

const POSTS = [
  {
    id: 1,
    slug: 'why-every-family-needs-reward-ur-kids',
    title: 'Why Every Family Needs Reward Ur Kids: The Smart Way to Raise Responsible Children',
    subtitle: 'How a simple chore-and-reward app can transform daily family life, build real-world skills, and end the nagging for good.',
    date: 'July 2026',
    readTime: '7 min read',
    emoji: '🏆',
    tags: ['Parenting', 'Family Organisation', 'Kids', 'Chores'],
    content: [
      {
        type: 'intro',
        text: 'Parenting has always been about balance — nurturing independence while instilling responsibility, encouraging good behaviour while keeping the household running. For generations, parents have turned to pocket money, star charts, and chore rosters to teach children the value of effort and reward. But managing all of this manually is exhausting, inconsistent, and easy to forget.',
      },
      {
        type: 'intro',
        text: 'Reward Ur Kids is a free family app that brings the chore-and-reward system into the 21st century — organised, transparent, and genuinely fun for kids and parents alike.',
      },
      {
        type: 'h2',
        text: 'What Is Reward Ur Kids?',
      },
      {
        type: 'p',
        text: "Reward Ur Kids is a family management app where parents create chores, children complete them to earn points, and those points can be redeemed in a family reward shop for things that matter to them — extra screen time, choosing dinner, a day off from another chore, or anything else a parent sets up.",
      },
      {
        type: 'p',
        text: "It works across the whole family. Parents manage everything from a dedicated dashboard. Kids log in and see exactly what's available to them, what they've earned, and what they can spend. There is even a co-parent feature so both mum and dad can share equal access without stepping on each other's toes.",
      },
      {
        type: 'h2',
        text: 'How It Works: A Day in the Family',
      },
      {
        type: 'scenario',
        items: [
          { time: 'Morning', text: 'Dad logs in and checks the chores dashboard. He sees that "Tidy your room" and "Unload the dishwasher" are open. He adds a new one — "Put the bins out" — worth 15 points, due by 6 PM.' },
          { time: 'After school', text: 'Eight-year-old Priya opens the app and sees three chores waiting. She claims "Unload the dishwasher" and gets it done, then taps the complete button. The chore moves to Pending — waiting for a parent to approve it.' },
          { time: 'Evening', text: "Mum reviews it, sees it's done properly, and approves it. Priya's wallet instantly jumps by 20 points. She opens the Shop tab, sees she's now got enough for \"Movie night pick\" — 50 points — and feels genuinely proud." },
        ],
      },
      {
        type: 'p',
        text: "That's the whole loop. Simple, transparent, and motivating.",
      },
      {
        type: 'h2',
        text: 'Key Features',
      },
      {
        type: 'feature',
        icon: '✅',
        title: 'Chores That Actually Get Done',
        text: 'Parents create chores with a title, description, point value, emoji, and optional due date. Chores can be assigned to a specific child or left open for any child to claim. Kids see them in real time, pick what they want to do, and mark them complete. Parents review and approve — nothing gets credited without their say-so.',
      },
      {
        type: 'feature',
        icon: '🔁',
        title: 'Recurring Chores — Set It Once, Run Forever',
        text: 'Some chores happen every day, every week, or every month — making the bed, taking out the bins, cleaning the bathroom. Reward Ur Kids handles these automatically. Set a chore as recurring and it reappears on schedule without parents needing to recreate it every time.',
      },
      {
        type: 'feature',
        icon: '🛍️',
        title: 'The Family Reward Shop',
        text: 'Parents stock the shop with personalised rewards — things that actually motivate their children. Unlike generic star-chart stickers, the shop can contain anything: extra screen time, choosing dinner, a trip to the cinema, staying up later on a Friday, or a new book.',
      },
      {
        type: 'feature',
        icon: '🌟',
        title: 'Good Behaviour Points',
        text: 'Not everything in family life comes down to chores. Sometimes a child helps a sibling without being asked, shows exceptional kindness, or puts in extra effort at school. The Good Behaviour feature lets parents award bonus points on the spot for moments like these.',
      },
      {
        type: 'feature',
        icon: '👥',
        title: 'Co-Parent Access',
        text: 'Both parents get equal, full access to the family account. Create chores, approve completions, manage the shop, view wallet histories — either parent can do it all, from their own device, without sharing a single login.',
      },
      {
        type: 'feature',
        icon: '💬',
        title: 'In-App Messaging',
        text: 'Parents and children can message each other directly inside the app. A quick "Great job on the dishes tonight! 🎉" from mum or dad means a lot to a child — and it keeps the positive reinforcement loop going beyond just points.',
      },
      {
        type: 'h2',
        text: 'Why Parents Should Use It',
      },
      {
        type: 'benefit',
        number: 1,
        title: 'It Ends the Nagging',
        text: "The number one complaint from parents is that they spend more time asking children to do chores than it would take to just do them themselves. Reward Ur Kids changes the dynamic entirely. When children have a personal points balance they are actively growing — and a shop full of things they actually want — the motivation to complete chores becomes intrinsic rather than forced.",
      },
      {
        type: 'benefit',
        number: 2,
        title: 'It Teaches Real-Life Financial Skills',
        text: "Earning, saving, and spending points mirrors how money works in the real world. Children learn that effort creates reward, that some rewards require patience and saving, and that spending decisions have consequences. These lessons — learned early through play — become lifelong financial habits.",
      },
      {
        type: 'benefit',
        number: 3,
        title: 'It Creates Fairness in Multi-Child Families',
        text: "When you have more than one child, managing who did what and who deserves what becomes genuinely difficult. Reward Ur Kids tracks everything per child, transparently and automatically. Older kids can have bigger-point chores; younger kids have simpler ones. Every child's wallet is their own. No more arguments about who did more.",
      },
      {
        type: 'benefit',
        number: 4,
        title: 'It Builds Self-Esteem Through Achievement',
        text: "There is real psychological benefit to children seeing a history of completed tasks and a growing balance. It is visible proof that their effort counts. The motivational messages in the app add an extra layer of encouragement that makes children feel genuinely celebrated.",
      },
      {
        type: 'benefit',
        number: 5,
        title: 'It Brings Consistency That Star Charts Never Could',
        text: "Paper star charts get lost. Whiteboards get wiped. Spreadsheets are for accountants, not children. Reward Ur Kids is always there — on any phone, tablet, or computer — and always up to date. Parents travelling for work can approve chores remotely. The system runs itself.",
      },
      {
        type: 'benefit',
        number: 6,
        title: "It Adapts to Your Family's Values",
        text: "Every family is different. Some value academics, some outdoor activity, some helping with cooking. The app imposes nothing — parents choose every chore, every reward, and every point value. The system reflects your family's priorities, not a generic template.",
      },
      {
        type: 'benefit',
        number: 7,
        title: 'It Keeps Both Parents Equally Involved',
        text: "The co-parent feature is a game changer for two-parent households. Both parents see the same dashboard, can create and approve chores, and can message the kids. No more \"I didn't know she already did that\" — everyone is on the same page.",
      },
      {
        type: 'h2',
        text: 'Getting Started in Under 5 Minutes',
      },
      {
        type: 'steps',
        items: [
          'Register as a parent — takes 60 seconds',
          'Add your children in the Kids tab — give each one a name and a fun avatar',
          'Create your first chores — start with 3 or 4 things you already ask them to do',
          'Set up the shop — add 2 or 3 rewards you know they will work toward',
          'Share the login with your kids and watch the magic begin',
        ],
      },
      {
        type: 'quote',
        text: "The goal of Reward Ur Kids is not to turn parenting into a transaction. It is to give families a shared language around effort and reward — one that is clear, consistent, and fair. When children feel that their contributions to the household are seen and valued, something shifts. They take more pride in their work. They become more proactive. And the household becomes a little bit happier.",
      },
    ],
  },
  {
    id: 2,
    slug: 'teaching-kids-money-skills-with-reward-ur-kids',
    title: 'Earn, Save, Spend: How Reward Ur Kids Teaches Children Real Financial Skills',
    subtitle: 'Chores earn points. The shop costs points. Along the way, kids learn the exact money lessons that used to take adults years to figure out.',
    date: 'July 2026',
    readTime: '6 min read',
    emoji: '💰',
    tags: ['Financial Literacy', 'Parenting', 'Money Skills', 'Kids'],
    content: [
      {
        type: 'intro',
        text: "Most of us learned about money the hard way — through overspending, forgotten savings goals, and a few regretted purchases. Financial literacy is rarely taught in schools, and it's hard to teach at the dinner table with abstract lectures about budgeting. Kids don't learn money by being told about it. They learn it by using it.",
      },
      {
        type: 'intro',
        text: "That's the quiet power behind Reward Ur Kids. It isn't a finance app — it's a chores app. But underneath the points and the shop and the gold star moments, it is running a real economy: kids earn, they choose what to save for, and they decide when spending is worth it. It is financial literacy, disguised as fun.",
      },
      {
        type: 'h2',
        text: 'A Real Economy, Sized for Kids',
      },
      {
        type: 'p',
        text: "Every functioning economy runs on the same loop: effort creates income, income can be saved or spent, and spending decisions have trade-offs. Reward Ur Kids builds that exact loop for children, just scaled down to chores and a family shop instead of jobs and a bank account.",
      },
      {
        type: 'p',
        text: "A child who unloads the dishwasher earns points, the same way an adult earns a paycheck for doing their job. Those points sit in a wallet, visible at any time, the same way a bank balance does. And when the child wants something from the shop, they have to decide: spend now, or wait and save for something bigger. There is no lecture involved — the mechanics teach the lesson on their own.",
      },
      {
        type: 'h2',
        text: 'The Money Lessons Hiding Inside the App',
      },
      {
        type: 'scenario',
        items: [
          { time: 'Earning', text: 'Ten-year-old Sam wants new headphones from the shop — 200 points. He checks his balance: 40 points. He realises that wanting something doesn\'t make it appear; it has to be earned first.' },
          { time: 'Choosing', text: 'Sam sees two chores available: "Feed the dog" (10 points, five minutes) and "Wash the car" (60 points, an hour). He weighs effort against reward and picks the one that gets him to his goal fastest — his first real cost-benefit decision.' },
          { time: 'Saving', text: 'Each week Sam could spend his points on small treats from the shop, but he holds off. His balance climbs — 90, then 140, then 180 — and he can watch, in real time, what delayed gratification actually looks like.' },
          { time: 'Spending', text: 'At 200 points, Sam finally buys the headphones. Because he earned every point himself, the purchase means more than if it had simply been bought for him. He also has zero points left — and feels that trade-off immediately.' },
        ],
      },
      {
        type: 'p',
        text: "That single loop — earn, choose, save, spend — is the entire foundation of personal finance. Reward Ur Kids just lets kids live it dozens of times a month, at an age when the lessons stick fastest.",
      },
      {
        type: 'h2',
        text: 'Five Financial Skills the App Builds Naturally',
      },
      {
        type: 'benefit',
        number: 1,
        title: 'Earning Before Spending',
        text: "Because every point in a child's wallet came from a completed, approved chore, there is no such thing as free money in the app. Kids internalise the connection between effort and income early — the opposite of simply being handed pocket money on a schedule regardless of what they did.",
      },
      {
        type: 'benefit',
        number: 2,
        title: 'Budgeting Against a Real Balance',
        text: "The wallet only shows what's actually there. If a child wants a 150-point reward and only has 80, the app doesn't pretend otherwise. Kids learn to check their balance before deciding what they can afford — the exact habit that keeps adults out of debt.",
      },
      {
        type: 'benefit',
        number: 3,
        title: 'Delayed Gratification and Saving Goals',
        text: "The shop is full of items at different price points, from small treats to big-ticket rewards. Choosing to skip a cheap reward today in order to afford a better one next week is a child's first experience of saving toward a goal — a skill that, once learned young, tends to last a lifetime.",
      },
      {
        type: 'benefit',
        number: 4,
        title: 'Understanding Value and Trade-Offs',
        text: 'Every purchase in the shop costs something — quite literally, points earned through effort. That makes children think twice before "buying" something on impulse, because they can feel exactly how many chores it took to afford it. It is the app version of asking, "how many hours of work is this worth?"',
      },
      {
        type: 'benefit',
        number: 5,
        title: 'Consequences Without Real-World Risk',
        text: "If a child spends everything on small rewards and has nothing left for something bigger, the consequence is real but low-stakes — a lesson learned with points, not with an overdrawn bank account twenty years later. Mistakes made early, in a safe environment, are the cheapest financial education there is.",
      },
      {
        type: 'h2',
        text: 'Why This Beats Traditional Pocket Money',
      },
      {
        type: 'p',
        text: "Handing a child a fixed allowance each week teaches them very little beyond how to receive money. It doesn't connect effort to reward, and it rarely involves any real choice about saving versus spending, because the amount is small and arrives on autopilot regardless of behaviour.",
      },
      {
        type: 'p',
        text: "Reward Ur Kids flips that model. Income is earned, not given. The amount a child has depends entirely on what they choose to do. And because the shop is visible at all times, every child is constantly making small, low-pressure financial decisions — which is exactly how real financial instinct gets built, one choice at a time.",
      },
      {
        type: 'h2',
        text: 'What Parents Notice Over Time',
      },
      {
        type: 'steps',
        items: [
          'Kids start asking "how many points is that worth?" before requesting something — a first sign of value-based thinking',
          'They begin comparing chores by effort versus reward, not just doing whatever is easiest',
          'Saving up for a bigger reward instead of spending immediately becomes normal, not a struggle',
          'Conversations about money at home get easier, because the family already has a shared, hands-on example to point to',
          'Children carry the habit of checking their balance before deciding to spend — a habit many adults still don\'t have',
        ],
      },
      {
        type: 'quote',
        text: "Financial literacy isn't taught with a single conversation — it's built through hundreds of small decisions made over time. Reward Ur Kids simply gives children a safe, low-stakes place to make those decisions early, so that by the time real money enters the picture, the instincts are already there.",
      },
    ],
  },
  {
    id: 3,
    slug: 'real-benefits-of-reward-ur-kids',
    title: 'The Real Benefits of Reward Ur Kids: What Actually Changes at Home',
    subtitle: 'Less nagging, calmer evenings, and kids who feel seen for their effort — here is what families notice in the first few weeks.',
    date: 'July 2026',
    readTime: '6 min read',
    emoji: '💛',
    tags: ['Family Life', 'Parenting', 'Positive Reinforcement', 'Kids'],
    content: [
      {
        type: 'intro',
        text: "Most parenting apps promise to make family life easier. Few actually change the day-to-day feel of a household. Reward Ur Kids was built around a simple bet: if you make effort visible, reward it consistently, and give kids a real say in what they're working toward, the nagging stops on its own — because kids start choosing to help.",
      },
      {
        type: 'intro',
        text: "This isn't a theory. It's what happens when chores stop being a source of daily conflict and start being a shared, transparent system everyone in the family understands. Here is what actually changes once a family starts using it.",
      },
      {
        type: 'h2',
        text: 'A Typical Week, Before and After',
      },
      {
        type: 'scenario',
        items: [
          { time: 'Before', text: 'Monday morning is a negotiation. "Did you make your bed?" "Can you please take the bins out — I\'ve asked three times." Chores happen, eventually, but only after repeated reminders and a bit of tension.' },
          { time: 'Week 1', text: 'Chores move onto the app. Kids see exactly what\'s available and what it\'s worth. There\'s no reminder needed — the list is just there, waiting, whenever they check.' },
          { time: 'Week 3', text: 'A child starts claiming chores before being asked, aiming for a reward in the shop. A sibling notices and does the same. Parents start using Award Bonus for things they\'d normally just say "well done" for — helping a sibling, trying hard at school — and it visibly means more to the kids than words alone.' },
          { time: 'Week 6', text: 'The household has a rhythm. Recurring chores run themselves. Both parents can see and approve from their own phone. Evenings feel calmer, because the daily back-and-forth over chores has quietly disappeared.' },
        ],
      },
      {
        type: 'h2',
        text: 'Six Benefits Families Notice Most',
      },
      {
        type: 'benefit',
        number: 1,
        title: 'Positive Reinforcement Replaces Constant Correction',
        text: "It's far easier, and far more effective, to reward the behaviour you want than to repeatedly correct the behaviour you don't. Every completed chore and every Award Bonus is a small, immediate signal to a child that their effort was noticed. Over time, that shifts the entire tone of parenting from correction to encouragement.",
      },
      {
        type: 'benefit',
        number: 2,
        title: 'Consistency Parents Can Actually Keep Up',
        text: "Good intentions fade by Wednesday. A points system doesn't. Because the app tracks everything automatically — who did what, what they earned, what's still open — parents stay consistent without having to hold it all in their head. Recurring chores mean the routine keeps running even on the days parents are too busy to think about it.",
      },
      {
        type: 'benefit',
        number: 3,
        title: 'Stronger, More Positive Communication',
        text: "The built-in messaging means a parent can send a quick \"Proud of you today 🎉\" the moment they see a chore completed, not hours later when they remember. Small, well-timed encouragement adds up. Many parents say it's changed the tone of daily conversation with their kids — more noticing, less nagging.",
      },
      {
        type: 'benefit',
        number: 4,
        title: 'Visible Fairness Between Siblings',
        text: "\"That's not fair, I did more!\" gets a lot harder to say when every chore, every point, and every purchase is logged and visible to everyone. Each child has their own wallet and history. Parents can set age-appropriate chores and points per child, and nobody has to take anyone's word for who did what.",
      },
      {
        type: 'benefit',
        number: 5,
        title: 'A Real, Visible Record of Effort',
        text: "Children rarely get to see their own progress laid out clearly. A growing points balance and a transaction history full of completed chores is proof, in black and white, that their effort adds up to something. That visible record does more for a child's confidence than a verbal \"good job\" ever fully captures.",
      },
      {
        type: 'benefit',
        number: 6,
        title: 'Less Mental Load for Parents',
        text: "Co-parent access means both parents see the same chores, the same balances, and the same history — no more re-explaining who agreed to what. Combined with recurring chores and automatic tracking, the app quietly takes over the bookkeeping side of parenting, leaving more energy for the parts that actually need a parent.",
      },
      {
        type: 'h2',
        text: 'Why Positive Reinforcement Works',
      },
      {
        type: 'p',
        text: "None of this is new psychology — rewarding a behaviour makes it more likely to happen again, and rewarding it consistently is what makes it stick. What's changed is how easy it now is to do consistently. A paper chart gets forgotten. A points balance on a phone doesn't. The mechanism is simple; the app just removes every excuse to fall out of the habit.",
      },
      {
        type: 'h2',
        text: 'Getting the Most Out of It',
      },
      {
        type: 'steps',
        items: [
          'Reward effort as soon as you notice it — same-day points matter more to kids than delayed ones',
          'Use Award Bonus for things outside the chore list too, like kindness or trying hard, not just tasks',
          'Set up two or three recurring chores first, so the routine runs itself before you add more',
          'Stock the shop with a mix of small, quick rewards and one bigger one worth saving up for',
          'Check in through messages, not just approvals — a quick note of encouragement goes a long way',
        ],
      },
      {
        type: 'quote',
        text: "The families who get the most out of Reward Ur Kids aren't the ones with the most chores listed — they're the ones who use it to notice their kids more often. The app just makes that easier to do, every single day.",
      },
    ],
  },
  {
    id: 4,
    slug: 'talk-dont-pressure-raising-kids-through-conversation',
    title: "Talk, Don't Pressure: How Real Conversation Raises Happier, More Cooperative Kids",
    subtitle: 'Pushing harder gets short-term obedience. Talking more gets a child who actually wants to cooperate — here is why conversation beats pressure every time.',
    date: 'July 2026',
    readTime: '6 min read',
    emoji: '🗣️',
    tags: ['Parenting', 'Communication', 'Emotional Wellbeing', 'Kids'],
    content: [
      {
        type: 'intro',
        text: "Every parent has felt the pull toward pressure — the raised voice, the repeated demand, the \"because I said so\" when patience runs thin. It works, sometimes, in the moment. A child complies. But pressure is a short-term tool with a long-term cost: it teaches children to avoid getting caught, not to understand why something mattered in the first place.",
      },
      {
        type: 'intro',
        text: "The alternative isn't permissiveness — it's conversation. Talking to a child, explaining the why behind a request, and actually listening to their side changes the entire relationship between a parent's expectation and a child's response. It takes longer in the moment. It works far better over time.",
      },
      {
        type: 'h2',
        text: 'Why Pressure Backfires',
      },
      {
        type: 'p',
        text: "Pressure produces compliance, not understanding. A child who is pushed, threatened, or nagged into doing something learns one thing clearly: avoid the consequence. They rarely learn why the task mattered, and the moment the pressure disappears — a parent leaves the room, stops watching — so does the motivation. Worse, repeated pressure teaches kids to associate a parent's voice with stress rather than guidance, which makes them less likely to come to that parent when something is actually wrong.",
      },
      {
        type: 'h2',
        text: 'What Happens When You Talk Instead',
      },
      {
        type: 'scenario',
        items: [
          { time: 'Pressure', text: "Priya still hasn't tidied her room. Mum's third reminder turns into a raised voice: \"I have told you three times — do it now!\" Priya slams the door and does a rushed, resentful job just to make the nagging stop." },
          { time: 'Conversation', text: "The next week, instead of repeating herself, Mum sits down and asks, \"What's making it hard to get your room tidied?\" Priya admits she doesn't know where half her things belong. They spend ten minutes sorting a shelf together." },
          { time: 'Result', text: "The room stays tidier afterwards — not because Priya was threatened, but because she finally understood what \"tidy\" actually meant. Two very different outcomes from the same request. Only one of them changes anything long-term." },
        ],
      },
      {
        type: 'h2',
        text: "Five Ways Talking Solves What Pressure Can't",
      },
      {
        type: 'benefit',
        number: 1,
        title: 'It Uncovers the Real Reason Behind Resistance',
        text: "Kids rarely resist a chore or a rule out of pure defiance. Usually there's a reason underneath — they feel overwhelmed, they don't understand what's being asked, or something else is bothering them. Pressure skips straight past that reason and demands compliance anyway. A simple \"what's going on?\" often solves the actual problem instead of just suppressing the symptom.",
      },
      {
        type: 'benefit',
        number: 2,
        title: 'It Builds Trust Instead of Fear',
        text: "A child who is talked to, not talked at, learns that their parent is someone who listens — which makes them far more likely to come forward next time something is genuinely wrong, whether that's a problem at school, a falling-out with a friend, or a mistake they're afraid to admit.",
      },
      {
        type: 'benefit',
        number: 3,
        title: 'It Teaches Kids to Reason, Not Just Obey',
        text: "When parents explain the why behind a request — \"we tidy up so nobody trips in the dark\" — instead of simply issuing it, children start to internalise the reasoning, not just the rule. Over time they begin applying that same reasoning on their own, without being asked.",
      },
      {
        type: 'benefit',
        number: 4,
        title: 'It Turns Conflict Into Problem-Solving',
        text: "Pressure treats a disagreement as something to be won. Conversation treats it as something to be solved together. Asking \"how do you think we should handle this?\" turns a standoff into a collaboration — and kids who help solve a problem are far more invested in actually following through on it.",
      },
      {
        type: 'benefit',
        number: 5,
        title: 'It Reduces the Need for Pressure Over Time',
        text: "The more a child feels heard, the less resistance they bring to the next request. Pressure has to keep escalating to keep working — louder, stricter, more consequences. Conversation compounds in the opposite direction: the more a family talks things through, the calmer future conversations tend to become.",
      },
      {
        type: 'h2',
        text: 'How Reward Ur Kids Is Built Around Conversation, Not Coercion',
      },
      {
        type: 'p',
        text: "The app is deliberately designed so pressure is never the mechanism. Chores aren't forced onto a child with a countdown — they're offered, and kids choose what to claim. Nothing gets rewarded automatically; a parent reviews and approves each one, which naturally opens a small moment to talk — \"nice work on this, how did it go?\" — instead of a silent tick box.",
      },
      {
        type: 'feature',
        icon: '💬',
        title: 'In-App Messaging Turns Approvals Into Conversations',
        text: "The messaging feature exists for exactly this reason — a quick note of encouragement, a question about how a chore went, or a check-in that has nothing to do with points at all. It keeps the relationship the priority, with the app simply making it easier to remember to have that conversation.",
      },
      {
        type: 'h2',
        text: 'Simple Ways to Talk More, Pressure Less',
      },
      {
        type: 'steps',
        items: [
          "Trade one instruction for one question — try \"what's making this hard?\" before repeating a request",
          'Explain the why behind a rule once, clearly, instead of repeating the rule itself five times',
          "When a chore isn't done, ask before assuming — tiredness, confusion, and overwhelm all look like defiance from the outside",
          'Use small, specific praise ("you rinsed every plate today") instead of generic pressure to "do better"',
          'Save serious conversations for calm moments, not the middle of a conflict, so both sides can actually hear each other',
        ],
      },
      {
        type: 'quote',
        text: "Pressure can make a child do something once. Conversation can make them understand why it's worth doing again. The families who talk more, not louder, usually find they have to ask for less — because their kids already understand why it matters.",
      },
    ],
  },
  {
    id: 3,
    slug: 'parenting-guidance-ages-5-to-11',
    title: 'The Primary Years: A Parent\'s Guide to Raising Children Aged 5 to 11',
    subtitle: 'What to expect at each stage, how to build responsibility early, and why these six years are the most important window for shaping lifelong habits.',
    date: 'July 2026',
    readTime: '9 min read',
    emoji: '🌱',
    tags: ['Parenting', 'Child Development', 'Ages 5–11', 'Responsibility'],
    content: [
      {
        type: 'intro',
        text: 'The years between five and eleven are a window unlike any other in a child\'s life. They are curious enough to absorb everything, old enough to reason, and young enough that the habits you build now will travel with them well into adulthood. This is not the time to sit back and hope for the best — it is the time to be intentional.',
      },
      {
        type: 'intro',
        text: 'This guide walks through what children in each age band actually need from their parents, what responsibilities are developmentally appropriate, and how to make the most of this remarkable six-year stretch.',
      },
      {
        type: 'h2',
        text: 'Why Ages 5–11 Are So Important',
      },
      {
        type: 'p',
        text: 'Child psychologists consistently identify the primary school years as a critical period for developing what researchers call "self-regulation" — the ability to manage emotions, plan ahead, and persist through difficulty. Children who develop strong self-regulation by age 11 are statistically more likely to succeed academically, maintain healthier relationships, and manage money more responsibly as adults.',
      },
      {
        type: 'p',
        text: 'The good news: self-regulation is not a fixed trait. It is a skill, and like any skill, it is built through practice. The everyday routines of your home — chores, bedtimes, screen-time rules, dinner conversations — are the training ground. The stakes feel low, but the lessons are lifelong.',
      },
      {
        type: 'h2',
        text: 'Ages 5–6: The Foundation Years',
      },
      {
        type: 'feature',
        icon: '🧠',
        title: 'What\'s happening developmentally',
        text: 'Children this age are transitioning from pure play-based learning to structured school environments. They are developing cause-and-effect thinking ("if I do this, that happens") and beginning to understand rules as something that exist for a reason, not just because grown-ups say so.',
      },
      {
        type: 'feature',
        icon: '✅',
        title: 'What they can take responsibility for',
        text: 'Making their bed (not perfectly, but consistently), putting dirty clothes in a hamper, tidying toys before bed, feeding a pet, carrying their own school bag, and clearing their plate from the table. Short, simple, daily tasks work best.',
      },
      {
        type: 'feature',
        icon: '💬',
        title: 'What they need most from you',
        text: 'Warmth, clear predictable routines, and immediate positive feedback. Children aged 5–6 are not yet good at delayed gratification — praise right after the task matters far more than a reward promised for next week. Be specific: "You put all your toys in the box without being asked — that\'s brilliant" lands better than "good job."',
      },
      {
        type: 'feature',
        icon: '⚠️',
        title: 'Common parenting pitfall',
        text: 'Doing everything for them because it\'s faster. A five-year-old who never makes their own bed will still be expecting someone else to do it at fifteen. Resist the urge to rescue. It takes longer, but the independence is worth it.',
      },
      {
        type: 'h2',
        text: 'Ages 7–8: The Competence Window',
      },
      {
        type: 'p',
        text: 'Children at this age experience what developmental psychologist Erik Erikson called the "industry vs. inferiority" stage — they desperately want to feel capable and competent. This makes it the single best time to introduce genuine household responsibilities and let them feel the pride of doing something real.',
      },
      {
        type: 'feature',
        icon: '✅',
        title: 'What they can take responsibility for',
        text: 'Helping prepare simple meals, loading and unloading the dishwasher, vacuuming a room, watering plants, folding and putting away their own laundry, taking out bins, and helping younger siblings with simple tasks.',
      },
      {
        type: 'feature',
        icon: '💬',
        title: 'What they need most from you',
        text: 'Opportunities to demonstrate skill. Give them a real task with real stakes — not a pretend job. "Can you be responsible for feeding the dog every morning this week?" creates a sense of genuine ownership. Praise the effort and the follow-through, not just the outcome.',
      },
      {
        type: 'feature',
        icon: '🎯',
        title: 'Introducing a reward system',
        text: 'Ages 7–8 are the sweet spot for point-based systems. Children this age understand the logic of "earn, save, spend" and have enough memory to connect effort today with reward tomorrow. A simple chore chart — physical or digital — makes the contract visible and fair.',
      },
      {
        type: 'feature',
        icon: '⚠️',
        title: 'Common parenting pitfall',
        text: 'Criticising the quality of work so often that they stop trying. A seven-year-old\'s dishwasher loading will not be perfect. That\'s fine. Correct gently, no more than once, and lead with what they did right.',
      },
      {
        type: 'h2',
        text: 'Ages 9–11: The Responsibility Leap',
      },
      {
        type: 'p',
        text: 'The final years of primary school are marked by rapidly growing abstract thinking. Children this age can plan ahead, understand fairness at a deep level, manage basic schedules, and hold themselves to standards without constant parental oversight — if they have been given the opportunity to practise.',
      },
      {
        type: 'feature',
        icon: '✅',
        title: 'What they can take responsibility for',
        text: 'Managing their own homework schedule, cooking simple meals independently, cleaning bathrooms and kitchens with instruction, doing their own laundry from start to finish, mowing the lawn (with supervision), caring for younger siblings for short periods, and managing a small weekly allowance.',
      },
      {
        type: 'feature',
        icon: '💬',
        title: 'What they need most from you',
        text: 'Trust and increasing autonomy — with clear boundaries. Children this age need to know you believe they can handle things. Micromanaging is the enemy of confidence at this stage. Step back, let them try, let them fail safely, and be there to talk through what went wrong rather than swooping in to fix it.',
      },
      {
        type: 'feature',
        icon: '💰',
        title: 'Money conversations start here',
        text: 'Ages 9–11 are developmentally ready for real financial conversations: the difference between needs and wants, why some rewards require saving, what "value" means. A reward shop — whether physical or in an app — makes these abstract ideas concrete and immediate.',
      },
      {
        type: 'feature',
        icon: '⚠️',
        title: 'Common parenting pitfall',
        text: 'Caving under pressure. Nine to eleven-year-olds are skilled negotiators who will test every boundary. Consistency is more important now than it has ever been. If screen time is earned, it is always earned. If a chore is agreed upon, it is always expected. Exceptions teach children that rules are optional.',
      },
      {
        type: 'h2',
        text: 'The Five Habits Worth Building Before Age 12',
      },
      {
        type: 'benefit',
        number: 1,
        title: 'Contributing to the household without being asked',
        text: 'The goal is not obedience — it is intrinsic motivation. Children who understand that a household runs because everyone contributes, and who feel the satisfaction of being a real part of that, carry that team mentality into school, friendships, and eventually workplaces.',
      },
      {
        type: 'benefit',
        number: 2,
        title: 'Managing their own belongings',
        text: 'A child who knows where their school bag is, keeps their room tidy enough to find things, and takes care of their possessions develops a sense of personal ownership and accountability. These are not trivial skills. They are foundational ones.',
      },
      {
        type: 'benefit',
        number: 3,
        title: 'Connecting effort to reward',
        text: 'Every time a child earns a reward through their own effort, they build the neural pathway that says "my actions have consequences." Every time a parent shortcuts this — buying the toy anyway, giving the screen time without the chore — that pathway weakens. Protect the connection.',
      },
      {
        type: 'benefit',
        number: 4,
        title: 'Handling disappointment without falling apart',
        text: 'Not getting the reward, losing the game, being told no — these moments are opportunities, not emergencies. Children who learn to process disappointment in a safe environment at age eight are far better equipped to handle it at eighteen. Don\'t protect them from small failures. Coach them through.',
      },
      {
        type: 'benefit',
        number: 5,
        title: 'Communicating needs clearly',
        text: 'Encourage children to say what they want, ask for help when they need it, and express frustration with words rather than behaviour. Family dinners, bedtime chats, and even in-app messages between parents and kids all create low-stakes spaces to practise this essential skill.',
      },
      {
        type: 'h2',
        text: 'What About Screen Time?',
      },
      {
        type: 'p',
        text: 'No parenting guide for this age group would be complete without addressing screens. The research on this has settled considerably: it is not the screen time itself that causes harm, but what it replaces. Children who have limited physical play, face-to-face conversation, and opportunities for boredom — because screens fill every gap — show measurable deficits in creativity, attention, and emotional regulation.',
      },
      {
        type: 'p',
        text: 'The most effective approach parents report is not banning screens, but earning them. When screen time is a reward for completed responsibilities rather than a default activity, two things happen: children value it more, and they are less likely to be addicted to it. The act of earning also reinforces the effort-reward cycle that underpins every other habit on this list.',
      },
      {
        type: 'h2',
        text: 'Talking With Your Child, Not At Them',
      },
      {
        type: 'p',
        text: 'Children aged 5–11 respond very differently to instructions than teenagers do, but one thing is consistent across the whole age range: they comply more readily when they understand the reason. "Put your shoes away because I said so" produces resentment. "Put your shoes away so nobody trips over them" produces understanding. "You remembered to put your shoes away — that was really thoughtful" produces a child who does it again tomorrow.',
      },
      {
        type: 'p',
        text: 'Make it a habit to explain, not just instruct. Ask what they think about the rules rather than simply imposing them. When children feel that their perspective is heard — even when the answer is still no — they are far more likely to cooperate and far less likely to rebel.',
      },
      {
        type: 'h2',
        text: 'A Note on Comparing Siblings',
      },
      {
        type: 'p',
        text: 'If you have more than one child in this age range, resist the urge to compare them — to each other or to what you remember of yourself at their age. Each child\'s development is individual. A nine-year-old who still struggles to remember to make their bed is not failing; they may simply need a different kind of reminder, a different reward, or a bit more time.',
      },
      {
        type: 'p',
        text: 'What works is giving each child their own responsibilities at their own level, tracking their individual progress rather than ranking them against each other, and celebrating each one\'s growth on its own terms. A fair system is not an identical system — it is one where every child feels seen and valued for what they specifically contribute.',
      },
      {
        type: 'quote',
        text: "The primary years are not about raising a child who is perfectly behaved. They are about raising a child who is building the skills, habits, and self-belief to navigate a complicated world. Every chore done, every reward earned, every conversation had at the dinner table is a small investment in the person they are becoming. It adds up faster than you think.",
      },
    ],
  },
]

// ── Renderers ─────────────────────────────────────────────────────────────────

function renderContent(block, i) {
  switch (block.type) {
    case 'intro':
      return (
        <p key={i} style={{ fontSize: '1.05rem', color: '#334155', lineHeight: 1.8, marginBottom: 20, fontWeight: 400 }}>
          {block.text}
        </p>
      )
    case 'h2':
      return (
        <h2 key={i} style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f766e', marginTop: 40, marginBottom: 14, letterSpacing: '-0.3px' }}>
          {block.text}
        </h2>
      )
    case 'p':
      return (
        <p key={i} style={{ fontSize: '0.97rem', color: '#334155', lineHeight: 1.8, marginBottom: 16 }}>
          {block.text}
        </p>
      )
    case 'scenario':
      return (
        <div key={i} style={{ background: 'linear-gradient(135deg,#f0fdfa,#f0fdf4)', border: '1px solid #99f6e4', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
          {block.items.map((item, j) => (
            <div key={j} style={{ display: 'flex', gap: 14, marginBottom: j < block.items.length - 1 ? 16 : 0 }}>
              <div style={{ flexShrink: 0, minWidth: 100, fontWeight: 700, fontSize: '0.82rem', color: '#0d9488', paddingTop: 2 }}>{item.time}</div>
              <p style={{ fontSize: '0.93rem', color: '#334155', lineHeight: 1.7, margin: 0 }}>{item.text}</p>
            </div>
          ))}
        </div>
      )
    case 'feature':
      return (
        <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20, padding: '16px 18px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 12, background: 'linear-gradient(135deg,#f0fdfa,#ccfbf1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            {block.icon}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: 5 }}>{block.title}</div>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.7, margin: 0 }}>{block.text}</p>
          </div>
        </div>
      )
    case 'benefit':
      return (
        <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, flexShrink: 0, borderRadius: '50%', background: 'linear-gradient(135deg,#0f766e,#0d9488)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
            {block.number}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: 5 }}>{block.title}</div>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.7, margin: 0 }}>{block.text}</p>
          </div>
        </div>
      )
    case 'steps':
      return (
        <ol key={i} style={{ paddingLeft: 0, listStyle: 'none', marginBottom: 24 }}>
          {block.items.map((step, j) => (
            <li key={j} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, flexShrink: 0, borderRadius: '50%', background: 'linear-gradient(135deg,#0f766e,#0d9488)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem' }}>
                {j + 1}
              </div>
              <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.6, margin: 0, paddingTop: 3 }}>{step}</p>
            </li>
          ))}
        </ol>
      )
    case 'quote':
      return (
        <blockquote key={i} style={{ borderLeft: '4px solid #0d9488', paddingLeft: 20, margin: '32px 0', fontStyle: 'italic', color: '#475569', fontSize: '1rem', lineHeight: 1.8 }}>
          {block.text}
        </blockquote>
      )
    default:
      return null
  }
}

// ── Single post view ──────────────────────────────────────────────────────────

function PostView({ post }) {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top nav */}
      <div style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }}>
        <button
          onClick={() => navigate('/blog')}
          style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← Back
        </button>
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: 600 }}>🏆 Reward Ur Kids · Blog</span>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg,#0f766e,#0d9488,#2dd4bf)', padding: '48px 24px 56px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>{post.emoji}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {post.tags.map(t => (
            <span key={t} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 999, padding: '3px 12px', fontSize: '0.78rem', fontWeight: 600 }}>{t}</span>
          ))}
        </div>
        <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(1.3rem, 4vw, 2rem)', maxWidth: 720, margin: '0 auto 14px', lineHeight: 1.3, letterSpacing: '-0.4px' }}>
          {post.title}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
          {post.subtitle}
        </p>
        <div style={{ marginTop: 20, color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', display: 'flex', justifyContent: 'center', gap: 16 }}>
          <span>📅 {post.date}</span>
          <span>⏱ {post.readTime}</span>
        </div>
      </div>

      {/* Article body */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 60px' }}>
        {post.content.map((block, i) => renderContent(block, i))}

        {/* CTA */}
        <div style={{ marginTop: 48, background: 'linear-gradient(135deg,#0f766e,#0d9488)', borderRadius: 20, padding: '36px 32px', textAlign: 'center', color: '#fff', boxShadow: '0 8px 32px rgba(13,148,136,0.3)' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>🚀</div>
          <h3 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: 8 }}>Ready to get started?</h3>
          <p style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: 24, maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Join thousands of families using Reward Ur Kids to make chores fun and raise responsible children.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{ background: '#fff', color: '#0d9488', border: 'none', borderRadius: 10, padding: '13px 32px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
          >
            Create Free Account →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Blog listing ──────────────────────────────────────────────────────────────

function BlogList() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Nav */}
      <div style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>🏆 Reward Ur Kids</span>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
        >
          Sign In
        </button>
      </div>

      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg,#0f766e,#0d9488,#2dd4bf)', padding: '48px 24px 56px', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', marginBottom: 12, letterSpacing: '-0.5px' }}>
          📖 Our Blog
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1.05rem', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
          Tips, guides, and ideas for families using Reward Ur Kids — and for parents who want to raise responsible, motivated children.
        </p>
      </div>

      {/* Posts grid */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {POSTS.map(post => (
            <article
              key={post.id}
              onClick={() => navigate(`/blog/${post.slug}`)}
              style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'none' }}
            >
              {/* Card hero */}
              <div style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)', padding: '28px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.8rem' }}>{post.emoji}</div>
              </div>

              {/* Card body */}
              <div style={{ padding: '20px 22px 24px' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {post.tags.slice(0, 2).map(t => (
                    <span key={t} style={{ background: '#f0fdfa', color: '#0d9488', borderRadius: 999, padding: '2px 10px', fontSize: '0.73rem', fontWeight: 600 }}>{t}</span>
                  ))}
                </div>
                <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b', lineHeight: 1.4, marginBottom: 10 }}>
                  {post.title}
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
                  {post.subtitle}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>📅 {post.date} · ⏱ {post.readTime}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0d9488' }}>Read →</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function Blogs() {
  const { slug } = useParams()
  const post = slug ? POSTS.find(p => p.slug === slug) : null

  if (slug && !post) {
    // Unknown slug — fall back to listing
    return <BlogList />
  }

  if (post) return <PostView post={post} />
  return <BlogList />
}
