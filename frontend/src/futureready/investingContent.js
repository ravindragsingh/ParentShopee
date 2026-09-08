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
    ],
  },

  'investing-7-9': {
    slides: [
      { emoji: '🏦', title: 'What is a bank?', text: "A bank is a safe place where people keep their money — like a giant, super-secure piggy bank." },
      { emoji: '🎯', title: 'Saving for a goal', text: 'Instead of spending money the moment you get it, you can save it up for something bigger you really want.' },
      { emoji: '➕', title: 'What is interest?', text: "Some banks pay you a little extra money just for keeping your savings there. That extra bit is called interest — a small reward for saving." },
      { emoji: '⚖️', title: 'Wants vs. needs', text: 'A need is something you must have, like food. A want is something nice to have, like a video game. Knowing the difference helps you spend wisely.' },
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
    ],
  },

  'investing-10-13': {
    slides: [
      { emoji: '📈', title: 'What is investing?', text: 'Investing means using your money to buy a small piece of something — like a company — hoping it grows in value over time.' },
      { emoji: '🏢', title: 'What is a stock?', text: "A stock is a tiny piece of ownership in a company. If the company does well, your tiny piece can become worth more." },
      { emoji: '🎢', title: 'Risk and reward', text: 'Investments can go up AND down in value. Taking on some risk is part of how investing can lead to bigger rewards over time.' },
      { emoji: '⏳', title: 'The power of time', text: "The earlier you start investing — even with a small amount — the more time your money has to grow. Time is a young investor's biggest advantage." },
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
    ],
  },

  'investing-13-17': {
    slides: [
      { emoji: '🧺', title: "Don't put all your eggs in one basket", text: 'Diversification means spreading your money across many different investments instead of just one, so one bad outcome doesn\'t wipe you out.' },
      { emoji: '📊', title: 'What is an index fund?', text: 'Instead of picking one company, an index fund lets you own a tiny piece of hundreds of companies at once — an easy way to diversify.' },
      { emoji: '🔥', title: 'Inflation: the silent thief', text: 'Prices tend to rise over time. Money that just sits still loses buying power. Investing is one way to try to grow money faster than inflation shrinks it.' },
      { emoji: '🧠', title: 'Long-term thinking beats quick wins', text: 'Investors who stay patient through ups and downs, over years or decades, tend to do far better than those chasing quick trades.' },
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
    ],
  },
}
