// Interactive lesson + quiz content for each age-group module under the
// "Entrepreneurship" topic. Same split as investingContent.js: the backend's
// learning_modules catalog seeds the metadata, this file holds the content.
export const ENTREPRENEURSHIP_CONTENT = {
  'entrepreneurship-4-6': {
    slides: [
      { emoji: '🍋', title: 'What is a lemonade stand?', text: "A lemonade stand is a tiny business — you make something (lemonade!) and sell it to people who want to buy it." },
      { emoji: '🤝', title: 'What is trading?', text: "Trading means giving someone something they want, and getting something you want back — like a coin for a cup of lemonade." },
      { emoji: '💡', title: 'Where ideas come from', text: "A business often starts with a simple idea — like noticing people get thirsty and thinking, 'I could sell them a cold drink!'" },
      { emoji: '🙋', title: 'Who is a customer?', text: "A customer is someone who buys what you're selling. Being friendly and helpful makes customers want to come back." },
      { emoji: '🎨', title: 'You can make things too!', text: "Drawing pictures, making bracelets, or baking cookies to share or sell are all little ways of being an entrepreneur — someone who makes and offers things." },
      { emoji: '💪', title: 'It takes effort', text: "Making a lemonade stand work takes real effort — squeezing lemons, making a sign, and standing there smiling at customers!" },
    ],
    quiz: [
      {
        question: 'What is a lemonade stand?',
        choices: ['A tiny business selling lemonade', 'A place to take a nap'],
        correctIndex: 0,
        explanation: 'A lemonade stand is a simple, real example of running a tiny business.',
      },
      {
        question: 'What is a customer?',
        choices: ['Someone who buys what you\'re selling', 'A type of lemon'],
        correctIndex: 0,
        explanation: 'Customers are the people who buy from your business.',
      },
      {
        question: 'What happens when you trade?',
        choices: ['You give something and get something back', 'Nothing happens at all'],
        correctIndex: 0,
        explanation: 'Trading is a fair exchange — giving something, getting something back.',
      },
      {
        question: 'Where do business ideas often come from?',
        choices: ['Noticing something people want or need', 'They only come from grown-ups, never kids'],
        correctIndex: 0,
        explanation: 'Great business ideas often start by noticing a want or need, like being thirsty on a hot day.',
      },
      {
        question: 'Does running a lemonade stand take effort?',
        choices: ['Yes, it takes real work', 'No, it happens by itself'],
        correctIndex: 0,
        explanation: 'From squeezing lemons to making a sign, a lemonade stand takes real effort to run.',
      },
    ],
  },

  'entrepreneurship-7-9': {
    slides: [
      { emoji: '🔍', title: 'Spotting a problem to solve', text: "Good business ideas often start by spotting a problem — like 'nobody sells cold water at the park' — and figuring out how to fix it." },
      { emoji: '💰', title: 'Cost vs. price', text: "Cost is what it takes to make something (like lemons and sugar). Price is what you charge someone to buy it. The difference is your profit." },
      { emoji: '📋', title: 'A simple plan', text: "Before starting, it helps to plan: what will you sell, how much will it cost to make, and how much will you charge?" },
      { emoji: '😊', title: 'Good customer service', text: "Being friendly, honest, and helpful makes people want to buy from you again — and tell their friends about you too." },
      { emoji: '📢', title: 'Telling people about it', text: "Even a great product needs people to know it exists! A colorful sign or telling your neighbors is a simple form of marketing." },
      { emoji: '🧾', title: 'Keeping track', text: "Writing down what you spent and what you earned helps you see if your little business is actually making money." },
      { emoji: '🔁', title: 'Trying again if it doesn\'t work', text: "If a business idea doesn't work the first time, entrepreneurs often tweak it and try again instead of giving up." },
    ],
    quiz: [
      {
        question: 'What does it mean to "spot a problem" for a business idea?',
        choices: ['Noticing something people need that isn\'t available', 'Finding a hole in your sock'],
        correctIndex: 0,
        explanation: 'Great business ideas often start by noticing a real need that isn\'t being met.',
      },
      {
        question: 'What is "profit"?',
        choices: ['The difference between what something costs to make and its price', 'Another word for a customer'],
        correctIndex: 0,
        explanation: 'Profit is what\'s left over after you subtract the cost from the price you charged.',
      },
      {
        question: 'Why is a simple plan helpful before starting a business?',
        choices: ['It helps you figure out what to sell and for how much', 'Plans are only for grown-ups'],
        correctIndex: 0,
        explanation: 'A simple plan helps you think through what you\'ll sell, what it costs, and what to charge.',
      },
      {
        question: 'Why does good customer service matter?',
        choices: ['It makes customers want to come back and tell friends', 'It has no real effect on a business'],
        correctIndex: 0,
        explanation: 'Friendly, helpful service builds trust and brings customers back.',
      },
      {
        question: 'What is marketing, in simple terms?',
        choices: ['Telling people about what you\'re selling', 'Counting your money at the end of the day'],
        correctIndex: 0,
        explanation: 'Marketing is simply letting people know your product or service exists.',
      },
      {
        question: 'If a business idea doesn\'t work at first, what do entrepreneurs usually do?',
        choices: ['Tweak the idea and try again', 'Never attempt anything again'],
        correctIndex: 0,
        explanation: 'Adjusting and retrying is a normal, healthy part of entrepreneurship.',
      },
    ],
  },

  'entrepreneurship-10-13': {
    slides: [
      { emoji: '📊', title: 'Profit and loss', text: "If you earn more than you spend, that's a profit. If you spend more than you earn, that's a loss. Tracking both helps a business survive." },
      { emoji: '🎯', title: 'Knowing your customer', text: "Successful businesses understand who they're selling to — what that person likes, needs, and is willing to pay for." },
      { emoji: '🧑‍🤝‍🧑', title: 'Teamwork in business', text: "Many businesses run better with a team — different people handling different jobs, like making the product, selling it, and managing money." },
      { emoji: '🎲', title: 'Taking a smart risk', text: "Starting a business always involves some risk — it might not work. Smart entrepreneurs take risks they can afford, not risks that could ruin them." },
      { emoji: '♻️', title: 'Reinvesting in growth', text: "Instead of spending all the profit right away, many entrepreneurs put some of it back into the business — better supplies, a nicer sign, more inventory." },
      { emoji: '🏷️', title: 'Standing out from competitors', text: "If other people sell something similar, a business needs a reason customers should pick them — better quality, price, or service." },
      { emoji: '📣', title: 'Word of mouth', text: "Happy customers telling their friends is one of the most powerful (and free!) ways a small business grows." },
    ],
    quiz: [
      {
        question: 'What is a "loss" in business?',
        choices: ['Spending more than you earn', 'Earning more than you spend'],
        correctIndex: 0,
        explanation: 'A loss happens when costs are higher than what the business earns.',
      },
      {
        question: 'Why does it help to understand your customer?',
        choices: ['So you can offer what they actually want and can afford', 'It doesn\'t matter who buys your product'],
        correctIndex: 0,
        explanation: 'Knowing your customer helps you shape a product or service they\'ll actually want.',
      },
      {
        question: 'What does "reinvesting" mean?',
        choices: ['Putting some profit back into growing the business', 'Spending every bit of profit immediately'],
        correctIndex: 0,
        explanation: 'Reinvesting profit helps a business grow bigger and stronger over time.',
      },
      {
        question: 'What is a "smart risk" in business?',
        choices: ['A risk you can afford, taken thoughtfully', 'Any risk at all, no matter the size'],
        correctIndex: 0,
        explanation: 'Smart entrepreneurs weigh risks carefully instead of risking everything blindly.',
      },
      {
        question: 'Why might a business need to "stand out" from competitors?',
        choices: ['So customers have a reason to choose them specifically', 'Standing out never matters in business'],
        correctIndex: 0,
        explanation: 'If others sell something similar, standing out gives customers a reason to pick you.',
      },
      {
        question: 'What is "word of mouth"?',
        choices: ['Happy customers telling other people about a business', 'A type of advertisement you have to pay a lot for'],
        correctIndex: 0,
        explanation: 'Word of mouth is free, powerful marketing that comes from satisfied customers.',
      },
    ],
  },

  'entrepreneurship-13-17': {
    slides: [
      { emoji: '📝', title: 'What is a business plan?', text: "A business plan lays out what a business will sell, who it's for, how it'll make money, and what it needs to get started — a roadmap for turning an idea into reality." },
      { emoji: '🌱', title: 'Startup vs. small business', text: "A small business often grows steadily and stays similar in size. A startup usually aims to grow very fast, often testing a new idea that hasn't been proven yet." },
      { emoji: '💵', title: 'Where funding comes from', text: "Businesses can be funded with personal savings, loans, or investors who give money in exchange for a share of future profits or ownership." },
      { emoji: '📈', title: 'What does "scaling" mean?', text: "Scaling means growing a business to serve many more customers without everything becoming proportionally more expensive or difficult to manage." },
      { emoji: '⚠️', title: 'Failure is part of the process', text: "Many successful entrepreneurs failed at a first (or second, or third) attempt. Learning from what went wrong is often what makes the next attempt succeed." },
      { emoji: '⚖️', title: 'Ethics in business', text: "Long-term success usually depends on being honest with customers, treating employees fairly, and not cutting corners just to make a quick profit." },
      { emoji: '🎯', title: 'Solving a real problem', text: "The most durable businesses tend to solve a genuine problem for people — not just chase a trend that might fade quickly." },
      { emoji: '🧭', title: 'Resilience and persistence', text: "Markets change, plans fail, and competitors appear. Entrepreneurs who adapt and keep going tend to outlast those who give up at the first setback." },
    ],
    quiz: [
      {
        question: 'What is a business plan?',
        choices: ['A roadmap covering what a business will sell, who it\'s for, and how it makes money', 'A legal document required only for huge companies'],
        correctIndex: 0,
        explanation: 'A business plan turns a rough idea into a structured, actionable roadmap.',
      },
      {
        question: 'How does a startup typically differ from a small business?',
        choices: ['A startup usually aims to grow very fast with an unproven idea', 'There is no real difference between them'],
        correctIndex: 0,
        explanation: 'Startups often chase fast, unproven growth; small businesses often grow more steadily.',
      },
      {
        question: 'What might an investor get in exchange for funding a business?',
        choices: ['A share of future profits or ownership', 'Nothing at all, ever'],
        correctIndex: 0,
        explanation: 'Investors typically fund a business in exchange for equity or a share of future returns.',
      },
      {
        question: 'What does "scaling" a business mean?',
        choices: ['Growing to serve many more customers without costs exploding proportionally', 'Weighing the business on a scale'],
        correctIndex: 0,
        explanation: 'Scaling is about growing efficiently, not just growing bigger at any cost.',
      },
      {
        question: 'Why do many successful entrepreneurs talk openly about past failures?',
        choices: ['Learning from what went wrong often shapes what succeeds next', 'Failure has no useful lessons at all'],
        correctIndex: 0,
        explanation: 'Failure is frequently a genuine part of the path to eventual success.',
      },
      {
        question: 'Why does ethical behavior matter for long-term business success?',
        choices: ['Cutting corners for quick profit tends to damage trust over time', 'Ethics have no real impact on whether a business succeeds'],
        correctIndex: 0,
        explanation: 'Businesses built on trust and fairness tend to last longer than ones that cut corners.',
      },
      {
        question: 'What tends to make a business durable over the long run?',
        choices: ['Solving a genuine, ongoing problem for people', 'Only ever chasing whatever trend is popular right now'],
        correctIndex: 0,
        explanation: 'Businesses solving real, lasting problems tend to outlast those chasing short-lived trends.',
      },
    ],
  },
}
