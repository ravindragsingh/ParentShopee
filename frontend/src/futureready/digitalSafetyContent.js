// Interactive lesson + quiz content for each age-group module under the
// "Digital Safety" topic. Same split as investingContent.js: the backend's
// learning_modules catalog seeds the metadata, this file holds the content.
export const DIGITAL_SAFETY_CONTENT = {
  'digital-safety-4-6': {
    slides: [
      { emoji: '🔒', title: 'Some things stay private', text: "Your full name, address, and phone number are private — they're only for you and your family to know, not for sharing on a screen." },
      { emoji: '👨‍👩‍👧', title: 'Always with a grown-up', text: "Using a tablet, phone, or computer with a grown-up nearby helps keep you safe while you explore and learn." },
      { emoji: '😟', title: 'If something feels weird', text: "If anything on a screen makes you feel confused, scared, or uncomfortable, telling a grown-up right away is always the right choice." },
      { emoji: '🎭', title: 'Not everyone is who they say', text: "Someone online might not actually be who their picture or name says they are — that's why grown-ups help keep an eye on things." },
      { emoji: '🖱️', title: 'Ask before you click', text: "Before clicking on a button, a game, or a pop-up you don't recognize, it's smart to ask a grown-up first." },
      { emoji: '⏰', title: 'Screens need breaks too', text: "Taking breaks from screens to play, read, or rest is part of staying healthy and happy." },
      { emoji: '📷', title: 'Pictures can be shared forever', text: "A picture you post can be saved or shared by others, even ones you didn't expect — so it's smart to only share pictures a grown-up says are okay." },
      { emoji: '🚪', title: 'Only trusted apps and games', text: "Grown-ups check that an app or game is actually safe before you use it — that's why you should only use ones they've said are okay." },
    ],
    quiz: [
      {
        question: 'Should you share your full name and address on a screen?',
        choices: ['No, that stays private', 'Yes, anytime someone asks'],
        correctIndex: 0,
        explanation: 'Personal details like your name and address should stay private.',
      },
      {
        question: 'Who should be nearby when you use a tablet or computer?',
        choices: ['A grown-up', 'Nobody — it\'s fine to be totally alone'],
        correctIndex: 0,
        explanation: 'Having a grown-up nearby helps keep you safe while using devices.',
      },
      {
        question: 'If something on a screen feels scary or confusing, what should you do?',
        choices: ['Tell a grown-up right away', 'Keep it a secret'],
        correctIndex: 0,
        explanation: 'Telling a grown-up is always the right move if something feels off.',
      },
      {
        question: 'Is everyone online always exactly who their picture says they are?',
        choices: ['No, that\'s not always true', 'Yes, always'],
        correctIndex: 0,
        explanation: 'People online aren\'t always who their profile claims — caution matters.',
      },
      {
        question: 'Before clicking something unfamiliar, what should you do?',
        choices: ['Ask a grown-up first', 'Just click it right away'],
        correctIndex: 0,
        explanation: 'Checking with a grown-up before clicking unfamiliar things is a safe habit.',
      },
      {
        question: 'Once you post a picture online, can it be shared by others too?',
        choices: ['Yes, it can be saved or shared even more than you expect', 'No, only you can ever see it'],
        correctIndex: 0,
        explanation: 'Pictures posted online can spread further than you might realize.',
      },
      {
        question: 'Which apps and games should you use?',
        choices: ['Ones a grown-up has said are okay', 'Any app at all, without asking'],
        correctIndex: 0,
        explanation: 'Grown-ups check that an app is safe before you use it.',
      },
    ],
  },

  'digital-safety-7-9': {
    slides: [
      { emoji: '🔑', title: 'What makes a password strong?', text: "A strong password is hard for others to guess — not something simple like '123456' or your pet's name that everyone already knows." },
      { emoji: '🙈', title: 'Privacy settings', text: "Many apps let you choose who can see what you post — keeping things visible only to people you actually know is a smart default." },
      { emoji: '🚫', title: 'Stranger danger applies online too', text: "Just like you wouldn't share personal details with a stranger in person, you shouldn't share them with strangers online either." },
      { emoji: '💬', title: 'Being kind online', text: "Mean comments or messages hurt just as much online as they do in person — being kind matters everywhere." },
      { emoji: '🚨', title: 'What to do about unkindness', text: "If someone is mean to you online, telling a grown-up and not responding with more meanness is the safest, smartest choice." },
      { emoji: '📥', title: 'Careful with downloads', text: "Not every game, app, or file is safe to download — checking with a grown-up before downloading something new is a good habit." },
      { emoji: '🕵️', title: 'Checking if a link is safe', text: "A message saying 'click here to win a prize!' from someone you don't know is usually a trick, not a real prize." },
      { emoji: '🎮', title: 'Chatting in online games', text: "Some games let you chat with other players you don't know in real life. Keep personal details out of game chats, just like anywhere else online." },
      { emoji: '🔔', title: 'In-app purchases need a grown-up', text: "Buying extra coins, skins, or upgrades inside a game usually costs real money — always check with a grown-up before buying anything." },
    ],
    quiz: [
      {
        question: 'What makes a password weak?',
        choices: ['Something simple and easy to guess', 'Something long and hard to guess'],
        correctIndex: 0,
        explanation: 'Simple, guessable passwords are weak and easy for others to break into.',
      },
      {
        question: 'What do privacy settings let you control?',
        choices: ['Who can see what you post', 'How fast your device charges'],
        correctIndex: 0,
        explanation: 'Privacy settings control the audience for what you share.',
      },
      {
        question: 'Should you share personal details with strangers online?',
        choices: ['No, just like in real life', 'Yes, it\'s completely different online'],
        correctIndex: 0,
        explanation: 'Stranger caution applies online exactly as it does in person.',
      },
      {
        question: 'If someone is mean to you online, what\'s the safest response?',
        choices: ['Tell a grown-up and don\'t respond with meanness', 'Say something even meaner back'],
        correctIndex: 0,
        explanation: 'Telling a trusted adult is safer and more effective than escalating.',
      },
      {
        question: 'Before downloading a new app or game, what should you do?',
        choices: ['Check with a grown-up first', 'Download anything that looks fun immediately'],
        correctIndex: 0,
        explanation: 'Not everything available to download is safe — checking first is smart.',
      },
      {
        question: 'A message from a stranger says "click here to win a prize!" What is it probably?',
        choices: ['A trick, not a real prize', 'Definitely a real, safe prize'],
        correctIndex: 0,
        explanation: 'Unexpected "prize" messages from strangers are almost always scams.',
      },
      {
        question: 'What should you avoid sharing in an online game chat?',
        choices: ['Personal details', 'Your favorite game strategy'],
        correctIndex: 0,
        explanation: 'Personal details should stay private, even when chatting with other players in a game.',
      },
      {
        question: 'Before buying coins or upgrades in a game, what should you do?',
        choices: ['Check with a grown-up first', 'Buy it right away without asking'],
        correctIndex: 0,
        explanation: 'In-app purchases usually cost real money, so a grown-up should always be involved.',
      },
    ],
  },

  'digital-safety-10-13': {
    slides: [
      { emoji: '🎣', title: 'What is phishing?', text: "Phishing is a trick where a fake message pretends to be from someone trustworthy (like a game company) to try to steal your password or personal information." },
      { emoji: '📸', title: 'Oversharing online', text: "Posting your location, school name, or daily schedule can reveal more about you to strangers than you might realize." },
      { emoji: '👣', title: 'Your digital footprint', text: "Everything you post, like, or comment online adds up over time into a 'digital footprint' — a trail that can be seen by others, even years later." },
      { emoji: '⏱️', title: 'Balancing screen time', text: "Noticing when screen time is crowding out sleep, friends, or activities you enjoy is an important digital safety and wellbeing skill." },
      { emoji: '🎭', title: 'Fake accounts and catfishing', text: "Someone online might use a fake photo and name to pretend to be someone they're not — this is sometimes called 'catfishing.'" },
      { emoji: '🔐', title: 'Two-factor authentication', text: "Some accounts offer an extra security step — like a code sent to your phone — on top of your password. It's an easy way to make an account harder to break into." },
      { emoji: '🛑', title: 'When to disengage and report', text: "If an online conversation starts feeling uncomfortable or pressuring, stopping the conversation and reporting or telling a trusted adult is always okay." },
      { emoji: '📍', title: 'Location sharing risks', text: "Live location sharing can be useful with close family, but sharing it publicly or with people you barely know can reveal exactly where you are, in real time." },
      { emoji: '🧑‍🤝‍🧑', title: 'Online friends vs. real friends', text: "Someone you've only ever talked to online is different from a friend you actually know in person — it's wise to be more cautious about what you share and trust." },
    ],
    quiz: [
      {
        question: 'What is "phishing"?',
        choices: ['A fake message trying to steal your info by pretending to be trustworthy', 'A type of online fishing game'],
        correctIndex: 0,
        explanation: 'Phishing scams disguise themselves as trustworthy to trick people into giving up information.',
      },
      {
        question: 'What is a "digital footprint"?',
        choices: ['The trail your posts, likes, and comments leave over time', 'A picture of your actual foot'],
        correctIndex: 0,
        explanation: 'Your digital footprint is the lasting online trail your activity creates.',
      },
      {
        question: 'Why can oversharing your location be risky?',
        choices: ['It can reveal more to strangers than intended', 'It has no effect on your safety at all'],
        correctIndex: 0,
        explanation: 'Sharing location or routine details can unintentionally reveal a lot to strangers.',
      },
      {
        question: 'What is "catfishing"?',
        choices: ['Pretending to be someone else online with a fake identity', 'A type of fishing you do with a net'],
        correctIndex: 0,
        explanation: 'Catfishing is using a fake identity to deceive someone online.',
      },
      {
        question: 'What does two-factor authentication add to an account?',
        choices: ['An extra security step beyond just a password', 'Nothing useful at all'],
        correctIndex: 0,
        explanation: 'Two-factor authentication adds a second layer of protection to your accounts.',
      },
      {
        question: 'If an online conversation starts feeling uncomfortable, what should you do?',
        choices: ['Stop the conversation and tell a trusted adult', 'Keep going no matter how it feels'],
        correctIndex: 0,
        explanation: 'It\'s always okay to disengage and tell a trusted adult if something feels wrong.',
      },
      {
        question: 'Why can public live location sharing be risky?',
        choices: ['It can reveal exactly where you are, in real time, to people you barely know', 'It has no risk in any situation'],
        correctIndex: 0,
        explanation: 'Sharing location broadly can expose your real-time whereabouts to strangers.',
      },
      {
        question: 'Should you trust an online-only friend the same as someone you know in person?',
        choices: ['It\'s wise to be more cautious', 'Yes, trust them exactly the same amount'],
        correctIndex: 0,
        explanation: 'Extra caution makes sense with people you\'ve never actually met in person.',
      },
    ],
  },

  'digital-safety-13-17': {
    slides: [
      { emoji: '🔐', title: 'Password managers', text: "A password manager securely stores unique, complex passwords for every account, so you don't have to reuse the same weak password everywhere." },
      { emoji: '🎭', title: 'Social engineering', text: "Social engineering means manipulating someone psychologically — through urgency, fear, or trust — to trick them into giving up information or access." },
      { emoji: '🖼️', title: 'Deepfakes and misinformation', text: "AI can now generate convincing fake images, video, and audio. Verifying a surprising claim through a second, trusted source is more important than ever." },
      { emoji: '📇', title: 'Your long-term digital footprint', text: "Posts made as a teenager can resurface years later — to college admissions, employers, or anyone who searches your name." },
      { emoji: '📵', title: 'Healthy social media habits', text: "Curating your feed, muting accounts that hurt your mood, and taking intentional breaks are all legitimate ways to protect your mental health online." },
      { emoji: '🚩', title: 'Recognizing predatory behavior', text: "Adults who push a minor toward secrecy, isolation from friends/family, or private communication are showing classic warning signs — reporting and telling a trusted adult matters." },
      { emoji: '🌐', title: 'Public Wi-Fi risks', text: "Using public Wi-Fi for anything sensitive (like banking) without protection can expose your data to others on the same network." },
      { emoji: '🧾', title: 'Reading privacy policies (a little)', text: "You don't need to read every word, but understanding roughly what data an app collects and how it's used is a genuinely useful digital literacy skill." },
      { emoji: '🏦', title: 'Protecting financial info online', text: "Only enter card or banking details on sites you trust, with a secure connection (look for https and a lock icon) — never through a link from an unexpected message." },
      { emoji: '🧠', title: 'Digital wellbeing', text: "Noticing signs of digital burnout — irritability, trouble sleeping, feeling worse after scrolling — and adjusting your habits is part of genuinely responsible tech use." },
    ],
    quiz: [
      {
        question: 'What does a password manager help you avoid?',
        choices: ['Reusing the same weak password across many accounts', 'Ever needing to log into anything'],
        correctIndex: 0,
        explanation: 'Password managers let you use strong, unique passwords everywhere without memorizing them all.',
      },
      {
        question: 'What is "social engineering"?',
        choices: ['Psychologically manipulating someone into giving up info or access', 'Building software for social media apps'],
        correctIndex: 0,
        explanation: 'Social engineering exploits trust, urgency, or fear rather than technical hacking.',
      },
      {
        question: 'Why are deepfakes concerning for digital safety?',
        choices: ['They can convincingly fake images, video, or audio', 'They are always obviously fake and harmless'],
        correctIndex: 0,
        explanation: 'Deepfakes can be highly convincing, making verification through trusted sources important.',
      },
      {
        question: 'Why does a long-term digital footprint matter for teenagers?',
        choices: ['Old posts can resurface years later to colleges or employers', 'Nothing posted online ever matters again'],
        correctIndex: 0,
        explanation: 'What\'s posted now can be found and judged much later by people who matter to your future.',
      },
      {
        question: 'What is a warning sign of predatory behavior from an adult online?',
        choices: ['Pushing a minor toward secrecy or isolation from family/friends', 'Being polite and never asking personal questions'],
        correctIndex: 0,
        explanation: 'Encouraging secrecy or isolation is a recognized red flag worth reporting.',
      },
      {
        question: 'Why is using public Wi-Fi for banking risky without protection?',
        choices: ['Others on the same network could potentially access your data', 'Public Wi-Fi is always perfectly safe for anything'],
        correctIndex: 0,
        explanation: 'Unsecured public networks can expose sensitive data to others sharing the connection.',
      },
      {
        question: 'Why is it useful to roughly understand an app\'s privacy policy?',
        choices: ['It helps you know what data is collected and how it\'s used', 'Privacy policies never contain any useful information'],
        correctIndex: 0,
        explanation: 'Even a rough understanding of data practices helps you make informed choices about apps.',
      },
      {
        question: 'Where should you ever enter card or banking details?',
        choices: ['Only on trusted, secure sites — never from a link in an unexpected message', 'Anywhere that asks, without checking'],
        correctIndex: 0,
        explanation: 'Financial information should only go into sites you trust and verified directly, not via surprise links.',
      },
      {
        question: 'What is a sign of possible "digital burnout"?',
        choices: ['Feeling worse after scrolling, or trouble sleeping', 'Feeling exactly the same as always'],
        correctIndex: 0,
        explanation: 'Noticing these signs is the first step toward adjusting unhealthy tech habits.',
      },
    ],
  },
}
