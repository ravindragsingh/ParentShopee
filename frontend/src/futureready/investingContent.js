// Interactive lesson + quiz content for each age-group module under the
// "Investing for Kids" topic. Keyed by module id so it lines up with the
// backend's learning_modules catalog (backend/main.py seeds the metadata;
// this is the actual lesson content, same split as games' DB metadata vs.
// frontend game logic).
export const INVESTING_CONTENT = {
  'investing-4-6': {
    slides: [
      { emoji: '💰', title: 'What is money?', text: "Money is what we use to buy things we want or need — like a snack, a toy, or a book." },
      { emoji: '💪', title: 'How do you get money?', text: 'People earn money by working or doing helpful jobs — like completing chores!' },
      { emoji: '🐷', title: 'What does "saving" mean?', text: 'Saving means keeping your money safe instead of spending it right away — like putting it in a piggy bank.' },
      { emoji: '🌱', title: 'Money can grow!', text: "If you plant a seed and take care of it, it grows into a big plant. Some ways of saving let your money grow bigger too, just like a seed!" },
      { emoji: '🛒', title: 'What does "spending" mean?', text: "Spending is using your money to get something you want right now, like a toy or an ice cream." },
      { emoji: '🤝', title: 'You can share money too', text: "Sometimes people use money to help others — like buying a gift for a friend, or giving to someone who needs it." },
      { emoji: '⭐', title: 'You get to choose!', text: "Every time you get money, you get to choose what to do with it: save it, spend it, or share it. There's no one right answer — it depends what you want most." },
    ],
    quiz: [
      {
        question: 'What can you use money for?',
        choices: ['Buying things you need', 'It has no use at all'],
        correctIndex: 0,
        explanation: "That's right! Money lets us buy things like food, clothes, and toys.",
      },
      {
        question: 'Where is a safe place to keep money you\'re saving?',
        choices: ['Leave it on the ground', 'A piggy bank'],
        correctIndex: 1,
        explanation: 'A piggy bank (or a real bank!) keeps your saved money safe.',
      },
      {
        question: 'If you plant a seed and take care of it, what happens?',
        choices: ['It grows into a plant', 'It disappears forever'],
        correctIndex: 0,
        explanation: 'Just like a seed, money that\'s cared for the right way can grow too!',
      },
      {
        question: 'What happens when you use your money to buy a toy?',
        choices: ['That\'s called spending', 'That\'s called flying'],
        correctIndex: 0,
        explanation: 'Using money to get something now is called spending.',
      },
      {
        question: 'What are three things you can do with money?',
        choices: ['Save it, spend it, or share it', 'Only ever spend it'],
        correctIndex: 0,
        explanation: 'You always get to choose between saving, spending, or sharing your money.',
      },
    ],
  },

  'investing-7-9': {
    slides: [
      { emoji: '🏦', title: 'What is a bank?', text: "A bank is a safe place where people keep their money — like a giant, super-secure piggy bank." },
      { emoji: '🎯', title: 'Saving for a goal', text: 'Instead of spending money the moment you get it, you can save it up for something bigger you really want.' },
      { emoji: '➕', title: 'What is interest?', text: "Some banks pay you a little extra money just for keeping your savings there. That extra bit is called interest — a small reward for saving." },
      { emoji: '⚖️', title: 'Wants vs. needs', text: 'A need is something you must have, like food. A want is something nice to have, like a video game. Knowing the difference helps you spend wisely.' },
      { emoji: '📝', title: 'Making a simple budget', text: 'A budget is just a plan for your money — deciding ahead of time how much you\'ll save, spend, and maybe share, before you actually get it.' },
      { emoji: '⏳', title: 'Patience pays off', text: "Waiting a little longer before buying something — instead of grabbing it right away — often means you can afford something even better later." },
      { emoji: '🏷️', title: 'Comparing prices', text: "Smart shoppers check if the same thing costs less somewhere else before buying it. A few minutes of comparing can save a lot of points or money." },
      { emoji: '🎁', title: 'Setting a savings goal', text: "Picking one specific thing to save for — and figuring out how many weeks of saving it'll take — makes saving feel a lot more real and exciting." },
    ],
    quiz: [
      {
        question: 'What is a bank?',
        choices: ['A safe place to keep money', 'A place that takes your money away'],
        correctIndex: 0,
        explanation: 'Banks keep money safe, and some even pay you a little extra for saving with them.',
      },
      {
        question: "If a bank gives you a little extra money just for saving, what's that called?",
        choices: ['A fine', 'Interest'],
        correctIndex: 1,
        explanation: 'Interest is like a small thank-you reward for keeping your money saved.',
      },
      {
        question: 'Which one is a "need"?',
        choices: ['A new video game', 'Food'],
        correctIndex: 1,
        explanation: "Food is something you must have to live — that's a need, not just a want.",
      },
      {
        question: "What's a smart way to get something big you really want?",
        choices: ['Save up for it over time', 'Never think about it'],
        correctIndex: 0,
        explanation: 'Saving a little at a time adds up to enough for bigger goals.',
      },
      {
        question: "What's it called when you plan out ahead of time how you'll use your money?",
        choices: ['A budget', 'A trophy'],
        correctIndex: 0,
        explanation: 'A budget is simply a plan for saving, spending, and sharing your money.',
      },
      {
        question: 'Why might someone check prices in more than one place before buying?',
        choices: ['To find the same thing for less', 'It never makes a difference'],
        correctIndex: 0,
        explanation: 'Comparing prices can help you find a better deal and save the rest.',
      },
      {
        question: 'What can help make a savings goal feel more real?',
        choices: ['Picking one specific thing to save for', 'Never deciding what you\'re saving for'],
        correctIndex: 0,
        explanation: 'A clear, specific goal makes it much easier to stay motivated while saving.',
      },
    ],
  },

  'investing-10-13': {
    slides: [
      { emoji: '📈', title: 'What is investing?', text: 'Investing means using your money to buy a small piece of something — like a company — hoping it grows in value over time.' },
      { emoji: '🏢', title: 'What is a stock?', text: "A stock is a tiny piece of ownership in a company. If the company does well, your tiny piece can become worth more." },
      { emoji: '🎢', title: 'Risk and reward', text: 'Investments can go up AND down in value. Taking on some risk is part of how investing can lead to bigger rewards over time.' },
      { emoji: '⏳', title: 'The power of time', text: "The earlier you start investing — even with a small amount — the more time your money has to grow. Time is a young investor's biggest advantage." },
      { emoji: '💵', title: 'What is compound interest?', text: "Compound interest means you earn money not just on what you put in, but also on the money it already earned before. It's growth building on growth." },
      { emoji: '🎯', title: 'Short-term vs. long-term goals', text: "Money you need soon (like next month) is usually better off saved, not invested. Money you won't need for many years has more room to ride out an investment's ups and downs." },
      { emoji: '📉', title: 'What is a "loss"?', text: "Sometimes an investment's value drops for a while — that's a loss on paper. It only becomes a real loss if you sell while it's down instead of waiting for it to recover." },
      { emoji: '🧾', title: 'Investing vs. an allowance', text: "An allowance is money you're simply given. Investing is different — it's money you put to work, hoping it grows into more than you started with." },
    ],
    quiz: [
      {
        question: 'What does "investing" mean?',
        choices: ['Using money to buy something that can grow in value', 'Hiding money so nobody can find it'],
        correctIndex: 0,
        explanation: 'Investing puts your money to work, hoping it grows over time.',
      },
      {
        question: 'What is a stock?',
        choices: ['A type of bank account', 'A small piece of ownership in a company'],
        correctIndex: 1,
        explanation: 'Owning a stock means owning a tiny slice of that company.',
      },
      {
        question: 'True or False: Investments only ever go up in value.',
        choices: ['True', 'False'],
        correctIndex: 1,
        explanation: 'Investments can go up and down — that ups-and-downs risk is part of how investing works.',
      },
      {
        question: 'Why is starting young such a big advantage for investing?',
        choices: ['More time for your money to grow', "It isn't actually an advantage"],
        correctIndex: 0,
        explanation: 'The earlier you start, the more time your money has to grow bigger.',
      },
      {
        question: 'If a company you own a tiny piece of grows and does well, what usually happens to your piece?',
        choices: ['It becomes worth more', 'It disappears'],
        correctIndex: 0,
        explanation: "When a company grows in value, the pieces of it people own — including yours — tend to grow in value too.",
      },
      {
        question: 'What does "compound interest" mean?',
        choices: ['You earn money on your original money AND on what it already earned', 'You only ever earn money once'],
        correctIndex: 0,
        explanation: 'Compounding is growth building on top of previous growth — it speeds up over time.',
      },
      {
        question: 'An investment drops in value for a while, but you leave it alone and it recovers later. Was that a real loss?',
        choices: ['No — it only becomes a real loss if you sell while it\'s down', 'Yes, any drop is a permanent loss'],
        correctIndex: 0,
        explanation: "A drop is just 'on paper' until you actually sell — patience often lets it recover.",
      },
    ],
  },

  'investing-13-17': {
    slides: [
      { emoji: '🧺', title: "Don't put all your eggs in one basket", text: 'Diversification means spreading your money across many different investments instead of just one, so one bad outcome doesn\'t wipe you out.' },
      { emoji: '📊', title: 'What is an index fund?', text: 'Instead of picking one company, an index fund lets you own a tiny piece of hundreds of companies at once — an easy way to diversify.' },
      { emoji: '🔥', title: 'Inflation: the silent thief', text: 'Prices tend to rise over time. Money that just sits still loses buying power. Investing is one way to try to grow money faster than inflation shrinks it.' },
      { emoji: '🧠', title: 'Long-term thinking beats quick wins', text: 'Investors who stay patient through ups and downs, over years or decades, tend to do far better than those chasing quick trades.' },
      { emoji: '💳', title: 'Debt works the opposite way', text: "Investing grows money for you over time. Borrowing money (debt) usually costs you extra over time through interest — it's compounding working against you instead of for you." },
      { emoji: '🏛️', title: 'Retirement accounts, simplified', text: "Many workplaces offer special accounts (like a 401(k) or an IRA in the US) built for long-term investing, often with tax advantages. They're designed to be left alone for decades." },
      { emoji: '📱', title: 'Getting started today', text: "Modern investing apps and custodial accounts have made it easier than ever for a teenager to start investing small, real amounts with a parent's help." },
      { emoji: '🧮', title: 'The Rule of 72', text: "A quick trick: divide 72 by your investment's yearly growth rate to estimate how many years it takes to double. At 8% growth, that's roughly 72 ÷ 8 = 9 years to double." },
    ],
    quiz: [
      {
        question: 'What does "diversification" mean?',
        choices: ['Putting all your money into one company', 'Spreading your money across many different investments'],
        correctIndex: 1,
        explanation: 'Diversification helps protect you — one investment doing poorly doesn\'t sink everything.',
      },
      {
        question: 'What is an index fund?',
        choices: ['A fund that owns tiny pieces of hundreds of companies at once', 'A savings account with no interest'],
        correctIndex: 0,
        explanation: 'Index funds are a simple way to diversify without picking individual companies yourself.',
      },
      {
        question: 'What is inflation?',
        choices: ['Prices rising over time, which reduces what your money can buy', 'A type of investment account'],
        correctIndex: 0,
        explanation: 'Inflation quietly erodes the value of money that just sits still.',
      },
      {
        question: 'True or False: Reacting quickly to every market dip usually leads to better long-term results.',
        choices: ['True', 'False'],
        correctIndex: 1,
        explanation: 'Panicking over short-term dips often hurts long-term investors more than it helps.',
      },
      {
        question: "What's one key benefit of starting to invest as a teenager instead of waiting until your 30s?",
        choices: ['Many more years for compound growth', 'No real benefit either way'],
        correctIndex: 0,
        explanation: 'Starting early gives your money decades more time to compound.',
      },
      {
        question: 'How is borrowing money (debt) different from investing?',
        choices: ['Debt usually costs you extra over time instead of growing your money', 'They work exactly the same way'],
        correctIndex: 0,
        explanation: 'Interest on debt compounds against you, while investing aims to compound growth for you.',
      },
      {
        question: 'Using the Rule of 72, about how many years would it take money to double at 9% yearly growth?',
        choices: ['About 8 years', 'About 50 years'],
        correctIndex: 0,
        explanation: '72 ÷ 9 = 8 — a handy shortcut for estimating doubling time.',
      },
    ],
  },
}
