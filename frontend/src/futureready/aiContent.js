// Interactive lesson + quiz content for each age-group module under the
// "AI for Kids" topic. Same split as investingContent.js: the backend's
// learning_modules catalog seeds the metadata (id, title, points), and this
// file holds the actual lesson content, keyed by module id.
export const AI_CONTENT = {
  'ai-4-6': {
    slides: [
      { emoji: '🤖', title: 'What is AI?', text: 'AI stands for "Artificial Intelligence." It\'s a computer program that can do smart things, like understand what you say or recognize a picture of a cat.' },
      { emoji: '🗣️', title: 'Have you talked to AI before?', text: "If you've ever asked a smart speaker to play a song, or asked a tablet a question out loud, you've talked to AI!" },
      { emoji: '🧑‍💻', title: 'A person made it', text: "AI doesn't think or feel like you do. People wrote special instructions, called code, to teach it how to answer questions and recognize things." },
      { emoji: '🐱', title: 'AI can recognize pictures', text: 'Some AI can look at a photo and tell you "that\'s a cat!" — it learned this by looking at lots and lots of cat pictures first.' },
      { emoji: '❤️', title: 'AI is not alive', text: "AI can seem smart, but it doesn't have real feelings, dreams, or a heartbeat like you do. It's a very clever tool, not a living thing." },
      { emoji: '👨‍👩‍👧', title: 'Always ask a grown-up', text: "If an AI helper says something confusing, or you're not sure if it's true, it's always smart to check with a grown-up." },
    ],
    quiz: [
      {
        question: 'What does AI stand for?',
        choices: ['Artificial Intelligence', 'Animal Island'],
        correctIndex: 0,
        explanation: 'AI is short for Artificial Intelligence — a computer doing smart things.',
      },
      {
        question: 'Is AI alive, like you?',
        choices: ['Yes, just like a person', 'No, it\'s a clever tool'],
        correctIndex: 1,
        explanation: "AI doesn't have real feelings or a heartbeat — it's a program, not a living thing.",
      },
      {
        question: 'How did picture-recognizing AI learn what a cat looks like?',
        choices: ['By looking at lots of cat pictures', 'By guessing randomly one time'],
        correctIndex: 0,
        explanation: 'AI usually learns by studying many, many examples first.',
      },
      {
        question: 'If a smart speaker plays your favorite song when you ask, what is that?',
        choices: ['AI helping you', 'Magic with no explanation'],
        correctIndex: 0,
        explanation: 'A voice assistant understanding and answering you is AI at work.',
      },
      {
        question: "If an AI helper says something confusing, what's the smart thing to do?",
        choices: ['Ask a grown-up', 'Just believe it no matter what'],
        correctIndex: 0,
        explanation: 'A trusted grown-up can help you figure out what\'s true.',
      },
    ],
  },

  'ai-7-9': {
    slides: [
      { emoji: '📚', title: 'AI learns from examples', text: 'Instead of being told exact rules, AI often learns by looking at thousands (or millions!) of examples and finding patterns in them.' },
      { emoji: '🎮', title: 'Where you already see AI', text: 'Video game characters that react to you, apps that recommend videos you might like, and voice assistants all use AI.' },
      { emoji: '🧩', title: 'Finding patterns', text: 'If AI sees enough pictures of dogs, it starts noticing patterns — like "dogs usually have four legs and fur" — and uses that to guess.' },
      { emoji: '❌', title: 'AI can make mistakes', text: "Because AI learns from patterns, it can sometimes get things wrong — especially with something unusual it hasn't seen much before." },
      { emoji: '🧠', title: 'AI vs. your brain', text: 'Your brain can understand feelings, come up with brand-new ideas, and truly care about people. AI is very good at specific tasks, but it doesn\'t understand things the way you do.' },
      { emoji: '🔍', title: 'Being a smart AI user', text: "Just because AI says something doesn't mean it's true. Smart AI users double-check important information instead of believing everything right away." },
      { emoji: '🤖', title: 'Robots vs. AI', text: "A robot is a physical machine. AI is the 'smart' software that can control a robot — or can run inside a phone or computer with no robot body at all." },
    ],
    quiz: [
      {
        question: 'How does AI usually learn to recognize things?',
        choices: ['By looking at lots of examples and finding patterns', 'By reading a single instruction book once'],
        correctIndex: 0,
        explanation: 'AI typically learns from huge numbers of examples, not a short list of rules.',
      },
      {
        question: 'True or False: AI never makes mistakes.',
        choices: ['True', 'False'],
        correctIndex: 1,
        explanation: 'AI can definitely get things wrong, especially with unusual situations.',
      },
      {
        question: "What's something your brain can do that AI really can't?",
        choices: ['Truly understand feelings and have original ideas', 'Recognize a picture of a dog'],
        correctIndex: 0,
        explanation: 'AI can recognize patterns well, but it doesn\'t truly feel or originate ideas the way you do.',
      },
      {
        question: 'If an app recommends a video you might like, what is it doing?',
        choices: ['Using patterns from what you\'ve watched before', 'Reading your mind'],
        correctIndex: 0,
        explanation: 'Recommendation systems use patterns in your past choices to guess what you\'ll like.',
      },
      {
        question: 'Is a robot the same thing as AI?',
        choices: ['Yes, they\'re identical', 'No — a robot is a machine; AI is the smart software'],
        correctIndex: 1,
        explanation: 'AI can control a robot, but AI can also run with no robot body at all, like inside an app.',
      },
      {
        question: "What should you do if AI tells you something you're not sure is true?",
        choices: ['Double-check it', 'Always assume it\'s correct'],
        correctIndex: 0,
        explanation: 'Checking important facts is a great habit, especially with AI answers.',
      },
    ],
  },

  'ai-10-13': {
    slides: [
      { emoji: '⚙️', title: 'Training data', text: 'AI systems are "trained" on huge amounts of data — text, images, or numbers — that teach the AI the patterns it\'s meant to learn.' },
      { emoji: '🎲', title: 'Prediction, not real understanding', text: 'Many AI tools, like chatbots, work by predicting the most likely next word or answer based on patterns — not by truly understanding meaning the way a person does.' },
      { emoji: '⚖️', title: 'AI can be biased', text: 'If the data used to train an AI contains unfair patterns, the AI can repeat those unfair patterns too. This is called bias, and it\'s a real challenge engineers work hard to fix.' },
      { emoji: '✨', title: 'Generative AI', text: 'Some AI can create brand-new text, images, or music by combining patterns it learned — this is called generative AI, and it powers many chatbots and art generators.' },
      { emoji: '🔒', title: 'AI and privacy', text: 'AI tools often need data to work well. Being thoughtful about what personal information you share with an AI app matters, just like with any app.' },
      { emoji: '🧭', title: 'Fact-checking AI answers', text: 'AI can sound very confident even when it\'s wrong — sometimes called a "hallucination." Always double-check important facts from a trusted source.' },
      { emoji: '🌍', title: "AI's growing role", text: 'AI already helps translate languages, spot diseases in medical scans, and recommend what you watch or read — and its role keeps growing.' },
    ],
    quiz: [
      {
        question: 'What is "training data"?',
        choices: ['The examples used to teach an AI its patterns', 'A type of computer chip'],
        correctIndex: 0,
        explanation: 'Training data is what an AI studies to learn the patterns it uses later.',
      },
      {
        question: 'Do chatbots truly "understand" language the way people do?',
        choices: ['Yes, exactly the same way', 'No — they mostly predict likely next words based on patterns'],
        correctIndex: 1,
        explanation: 'Chatbots are pattern-predictors, not conscious understanders of meaning.',
      },
      {
        question: 'What does it mean if an AI is "biased"?',
        choices: ['It repeats unfair patterns from the data it learned from', 'It always tells the truth'],
        correctIndex: 0,
        explanation: 'Bias in training data can show up as unfair patterns in what the AI produces.',
      },
      {
        question: 'What is generative AI?',
        choices: ['AI that can create new text, images, or other content', 'AI that can only sort numbers'],
        correctIndex: 0,
        explanation: 'Generative AI produces brand-new content by combining patterns it learned.',
      },
      {
        question: 'What is it called when AI confidently states something that\'s false?',
        choices: ['A hallucination', 'A firewall'],
        correctIndex: 0,
        explanation: 'A "hallucination" is AI stating something confidently that just isn\'t true.',
      },
      {
        question: 'Why should you be careful about what personal info you share with AI apps?',
        choices: ['That data might be stored or used by the app', 'It has no effect on anything'],
        correctIndex: 0,
        explanation: 'Just like any app, what you share with an AI tool can be stored or used elsewhere.',
      },
      {
        question: 'Which is a genuinely helpful real-world use of AI today?',
        choices: ['Translating languages', 'Doing all your homework so you learn nothing'],
        correctIndex: 0,
        explanation: 'Translation, medical scan analysis, and recommendations are real, helpful AI uses.',
      },
    ],
  },

  'ai-13-17': {
    slides: [
      { emoji: '🧠', title: 'Neural networks, simplified', text: 'Many modern AI systems are loosely inspired by how brain cells connect — layers of simple math functions combining to recognize very complex patterns.' },
      { emoji: '💬', title: 'Large language models', text: 'Chatbots you may have used are often "large language models" trained on enormous amounts of text to predict likely, coherent responses.' },
      { emoji: '⚖️', title: 'Bias and fairness', text: 'Because AI learns from real-world data, it can inherit real-world unfairness, like reflecting stereotypes. Researchers actively study how to detect and reduce this.' },
      { emoji: '🎭', title: 'Deepfakes and misinformation', text: 'AI can now generate very convincing fake images, video, or audio. Learning to question what you see online is a genuinely important skill now.' },
      { emoji: '💼', title: 'AI and jobs', text: 'AI is changing many jobs — automating some repetitive tasks while creating new kinds of work. Understanding AI, rather than fearing it, is a real advantage for your future.' },
      { emoji: '🎓', title: 'Using AI responsibly for school', text: 'AI can be a great study partner for explaining concepts, but relying on it to do your thinking for you weakens the exact skills you\'re in school to build.' },
      { emoji: '🔐', title: 'Data and consent', text: 'Many AI systems are trained on massive datasets pulled from the internet, which raises real questions about consent and ownership that society is still working out.' },
      { emoji: '🚀', title: 'Why understanding AI matters for you', text: 'Whatever career you choose, AI will likely touch it. Understanding the basics now — not just using AI, but roughly how it works and where it fails — is a genuine head start.' },
    ],
    quiz: [
      {
        question: 'What is a "large language model"?',
        choices: ['An AI trained on huge amounts of text to predict likely responses', 'A physical robot used in factories'],
        correctIndex: 0,
        explanation: 'LLMs are trained on massive text datasets to generate likely, coherent responses.',
      },
      {
        question: 'True or False: AI is completely free of bias since it\'s "just math."',
        choices: ['True', 'False'],
        correctIndex: 1,
        explanation: 'AI can absolutely inherit bias from the data it was trained on.',
      },
      {
        question: 'What is a "deepfake"?',
        choices: ['A realistic AI-generated fake image, video, or audio clip', 'A very deep ocean AI-powered submarine'],
        correctIndex: 0,
        explanation: 'Deepfakes are convincing AI-generated fakes, which is why questioning sources online matters.',
      },
      {
        question: 'Why is it risky to let AI fully do your homework for you?',
        choices: ['It weakens the exact skills you\'re meant to be building', 'There is no risk at all'],
        correctIndex: 0,
        explanation: 'Using AI as a shortcut around learning undermines the point of doing the work.',
      },
      {
        question: 'What is one real way AI is affecting the job market?',
        choices: ['Automating some tasks while creating new kinds of work', 'It has no effect on jobs whatsoever'],
        correctIndex: 0,
        explanation: 'AI both removes and creates work — understanding it is an advantage either way.',
      },
      {
        question: 'What ethical question does training AI on scraped internet data raise?',
        choices: ['Consent and ownership of that data', 'Whether the internet uses too much electricity'],
        correctIndex: 0,
        explanation: 'Whether creators consented to their work being used for AI training is a live debate.',
      },
      {
        question: 'What\'s a smart way to use AI as a student?',
        choices: ['As a study aid to help understand concepts', 'As a total replacement for your own thinking'],
        correctIndex: 0,
        explanation: 'AI works best as a tool that supports your learning, not one that replaces it.',
      },
      {
        question: 'Neural networks are loosely inspired by what?',
        choices: ['How brain cells connect to each other', 'How electricity flows through a wall socket'],
        correctIndex: 0,
        explanation: 'The "neural" in neural networks nods to this loose inspiration from the brain.',
      },
    ],
  },
}
