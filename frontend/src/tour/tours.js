// Registry of guided tours. Adding a new tour for a future feature means
// adding a new entry here (plus `data-tour="..."` attributes on whatever it
// should point at) -- nothing in the engine itself (TourContext/TourOverlay)
// needs to change.
//
// A step's `path` (if set) is navigated to before the step is shown, so a
// tour can walk across tabs/screens -- the engine just updates the URL the
// same way any in-app link does, then waits for the new content to mount
// before measuring `target`. A step with no `target` renders as a plain
// centered card (used for intro/outro slides), not a spotlight. `autoClick`
// (a selector) is clicked once, before measuring, for targets that only
// exist once a toggle/form on the page is opened.

export const TOURS = {
  guardianOnboarding: {
    label: 'Getting Started',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Reward Ur Kids! 👋',
        text: "Let's take a quick look at how to set up your family and start using the app. This takes about two minutes.",
      },
      {
        id: 'add-child',
        title: 'Add your first child',
        text: 'Everything starts here — tap "Kids" to add a child profile, give them their own PIN, and they can start earning points right away.',
        path: '/dashboard',
        target: '[data-tour="home-kids-tile"]',
      },
      {
        id: 'kids-tab-add',
        title: "That's the button",
        text: 'Use "+ Add Child" to create a profile for each of your kids. You can always add more later.',
        path: '/dashboard?tab=kids',
        target: '[data-tour="kids-add-button"]',
      },
      {
        id: 'admin-coguardian',
        title: 'Invite your co-parent',
        text: "If another parent helps manage things, invite them here — they'll get their own PIN with the same access as you.",
        path: '/dashboard?tab=admin',
        target: '[data-tour="admin-coguardian-section"]',
      },
      {
        id: 'switch-profile',
        title: 'Switching between family members',
        text: 'This device is shared — tap here, then "Switch Profile", whenever someone else (another parent, or one of your kids) wants to use their own profile. Everyone unlocks their own with their own PIN.',
        path: '/dashboard',
        target: '[data-tour="hamburger-menu-button"]',
      },
      {
        id: 'chores-tile',
        title: 'Review and approve chores',
        text: 'Once your kids start completing chores, this is where you approve them and the points get paid out.',
        path: '/dashboard',
        target: '[data-tour="home-chores-tile"]',
      },
      {
        id: 'chores-add-button',
        title: 'Add a chore',
        text: 'Tap "+ Add Chore" to create a one-off task — give it a title, an emoji, and how many points it\'s worth.',
        path: '/dashboard?tab=chores',
        target: '[data-tour="chores-add-button"]',
      },
      {
        id: 'chores-recurring',
        title: 'Make it repeat automatically',
        text: 'Check "Make this a recurring chore" to have it come back daily, weekly, or monthly — no need to re-add the same chore every time.',
        path: '/dashboard?tab=chores',
        target: '[data-tour="chores-recurring-checkbox"]',
        autoClick: '[data-tour="chores-add-button"]',
      },
      {
        id: 'shop-tile',
        title: 'Set up rewards',
        text: "The Shop is where your kids spend the points they've earned — add items they'll actually want, from screen time to a trip to the park.",
        path: '/dashboard',
        target: '[data-tour="home-shop-tile"]',
      },
      {
        id: 'futureready-tile',
        title: 'Free bonus: Future-Ready lessons',
        text: 'Short, age-appropriate lessons on money, AI, online safety, and more — included free, and your kids earn points for finishing them too.',
        path: '/dashboard',
        target: '[data-tour="home-futureready-tile"]',
      },
      {
        id: 'done',
        title: "You're all set! 🎉",
        text: "That's the basics. You can replay this tour anytime from the Admin Panel.",
      },
    ],
  },
}
