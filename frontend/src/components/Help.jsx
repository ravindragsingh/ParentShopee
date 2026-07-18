import { useState } from 'react'

// Reusable accordion section
function Section({ icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: 10, borderRadius: 12, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', textAlign: 'left', padding: '13px 16px',
          background: open ? '#f0fdfa' : '#fafafa',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          transition: 'background 0.15s',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f766e', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.1rem' }}>{icon}</span>
          {title}
        </span>
        <span style={{ color: '#94a3b8', fontSize: '0.85rem', flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '14px 18px', background: 'white', borderTop: '1px solid #f1f5f9' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Step({ number, text }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg,#0f766e,#0d9488)',
        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: 700,
      }}>{number}</div>
      <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.55, margin: 0 }}>{text}</p>
    </div>
  )
}

function Tip({ emoji, text }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{emoji}</span>
      <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.55, margin: 0 }}>{text}</p>
    </div>
  )
}

// ── Parent help content ─────────────────────────────────────────────────────

function ParentHelp() {
  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg,#f0fdfa,#ccfbf1)',
        borderRadius: 12, padding: '16px 20px', marginBottom: 20,
        border: '1px solid #ddd6fe',
      }}>
        <div style={{ fontWeight: 700, color: '#134e4a', fontSize: '1.05rem', marginBottom: 6 }}>
          👑 Welcome, Parent!
        </div>
        <p style={{ fontSize: '0.875rem', color: '#115e59', lineHeight: 1.6, margin: 0 }}>
          You are the family admin. You create chores, approve completions, manage the reward shop,
          and can send messages to your children and co-parent.
        </p>
      </div>

      <Section icon="🚀" title="Getting Started" defaultOpen>
        <Step number="1" text="Go to the Kids tab and click '+ Add Child' to add each of your children with a name, avatar, birthday, and a 6-digit PIN." />
        <Step number="2" text="Optionally open the Admin Panel (☰ menu) to invite a co-parent (partner, spouse, etc.) who shares full access to your family — give them a name, avatar, and PIN too." />
        <Step number="3" text="Go to Chores and create your first chore. Pick a points value, an emoji, and optionally assign it to a specific child." />
        <Step number="4" text="Share each PIN with the right person. Right after you sign in, everyone picks their own profile from the picker and enters their PIN to get in." />
      </Section>

      <Section icon="🔐" title="Profiles & PINs">
        <Tip emoji="🔑" text="Only you sign in with a real username and password. Kids and your co-parent get in through the profile picker with their own 6-digit PIN — no separate login to create or remember for them." />
        <Tip emoji="🔒" text="Every profile is PIN-protected, including your own — picking any tile in the picker asks for its PIN. That means Switch Profile always locks the device, even to get back into your own account." />
        <Tip emoji="🔄" text="Use 'Switch Profile' in the ☰ menu to return to the picker without signing out of the device completely." />
        <Tip emoji="❓" text="Forgot your own PIN? Click your tile in the picker, then 'Forgot PIN?' — re-enter your account password to set a new PIN on the spot. Kids and your co-parent don't need this: reset their PIN any time from the Kids tab or Admin Panel." />
      </Section>

      <Section icon="✅" title="Managing Chores">
        <Tip emoji="✨" text="Open chores are available for kids to pick up. Assigned chores go directly to one child." />
        <Tip emoji="⏳" text="When a child marks a chore done, it moves to Pending Approval, shown at the top of the Chores tab so you see it first." />
        <Tip emoji="🏆" text="Approved chores move to Complete and the child's wallet is credited with the points automatically." />
        <Tip emoji="🔁" text="Completed or expired chores have a 'Repeat' / 'Add Again' button so you can reuse them easily." />
        <Tip emoji="📅" text="Set a due date so the chore auto-expires if it isn't done in time." />
        <Tip emoji="➕" text="The 'Add New Chore' form starts collapsed to keep the page tidy — click its header to expand it." />
        <Tip emoji="🔒" text="You can pick freely from the built-in sample chores at any time. Custom chores you write yourself (one-off or recurring) are capped at 10 per family — a badge on the Add New Chore header shows how many you've used. Need more? Contact support from the ☰ menu." />
      </Section>

      <Section icon="🛍️" title="Running the Shop">
        <Tip emoji="🎁" text="Add reward items kids can buy — things like 'Extra screen time', 'Choose dinner', or 'Stay up later'." />
        <Tip emoji="💰" text="Set a point cost for each item. Kids can only buy what they can afford." />
        <Tip emoji="📋" text="Use the sample templates dropdown to quickly fill in popular reward ideas." />
        <Tip emoji="↕️" text="Kids can sort shop items by points (low → high or high → low) to find what they can afford." />
        <Tip emoji="🔒" text="Sample rewards are unlimited. Custom rewards you write yourself are capped at 10 per family, shown as a badge on the Add Shop Item header. Contact support from the ☰ menu to add more." />
      </Section>

      <Section icon="🎁" title="Award Bonus & Remove Points">
        <Tip emoji="🎁" text="On the Kids page, click 'Award Bonus' or 'Remove Points' on a child's card to adjust their balance for anything outside the chore list — good behaviour, extra effort, or a consequence." />
        <Tip emoji="✅" text="Use the quick-select buttons (5, 10, 15, 20, 50 pts) or type a custom amount." />
        <Tip emoji="💬" text="You must add a short message (up to 15 characters) explaining why — it's saved to the child's wallet history so they know exactly what it was for." />
        <Tip emoji="➖" text="Remove Points deducts from their balance. A child's balance cannot go below zero." />
      </Section>

      <Section icon="📋" title="Viewing Kids' Wallets">
        <Tip emoji="👁" text="Click '👁 View' inside a child's balance circle to open their full wallet in a popup." />
        <Tip emoji="📋" text="Click 'Transactions' on their card — or click anywhere on the card itself — to expand their last 15 transactions inline." />
        <Tip emoji="🟢" text="Green = chore points earned · Gold ⭐ = bonus awarded (including Award Bonus) · Red = points removed or spent in Shop." />
      </Section>

      <Section icon="👨‍👩‍👧" title="Co-Parent Management">
        <Tip emoji="👨‍👩‍👧" text="Open the Admin Panel (☰ menu) to add a second parent (partner, spouse, etc.) who shares full access to your family — children, chores, shop and wallets." />
        <Tip emoji="➕" text="Enter their name, pick an avatar, and set a 6-digit PIN, then click 'Create Co-Parent'. Share the PIN with them — they unlock their profile from the picker, same as your kids." />
        <Tip emoji="🔑" text="Use '🔑 Change PIN' on their card any time you need to update it." />
        <Tip emoji="🗑️" text="'Remove Co-Parent' immediately revokes their access. Only one co-parent per family is allowed." />
      </Section>

      <Section icon="🛡️" title="Admin Panel & Account">
        <Tip emoji="🔑" text="Open the Admin Panel (☰ menu) to change your sign-in password, or your own profile-picker PIN — they're separate secrets, and both live here alongside co-parent management." />
        <Tip emoji="🔢" text="To change a child's PIN, go to the Kids tab and click '🔑 PIN' next to their name." />
        <Tip emoji="🚪" text="Use 'Sign Out' in the Admin Panel — or the ☰ menu — to log out of the device completely. 'Switch Profile' only leaves your profile, keeping the family signed in." />
      </Section>

      <Section icon="📩" title="Contact & Support">
        <Tip emoji="📩" text="Found a bug or need help? Use the 'Contact Us' option in the ☰ menu to send a message to the Reward Ur Kids team." />
        <Tip emoji="📎" text="You can attach a screenshot to your message to help us understand the issue faster." />
      </Section>

      <Section icon="🔁" title="Recurring Chores">
        <Tip emoji="🔁" text="Recurring chores repeat automatically — Daily, Weekly (choose specific days), or Monthly (choose a day of the month). Only one instance appears at a time, on the day it is due." />
        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f766e', margin: '10px 0 6px' }}>Adding a recurring chore</div>
        <Step number="1" text="In the Chores tab, fill in the chore title, points, emoji and optionally assign a child." />
        <Step number="2" text="Tick the '🔁 Make this a recurring chore' checkbox that appears below the Description field." />
        <Step number="3" text="Choose Daily, Weekly, or Monthly. For Weekly, tap the day buttons (Mon – Sun). For Monthly, enter the day number (use 1–28 to ensure it works every month)." />
        <Step number="4" text="Click 'Add Chore'. The first instance for today (if it matches) appears immediately, and future instances are created automatically each day." />
        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f766e', margin: '10px 0 6px' }}>Stopping a recurring chore</div>
        <Step number="1" text="Scroll down past the chore lists to find the '🔁 Active Recurring Chores' panel." />
        <Step number="2" text="Click 'Stop' next to the template you want to end. This deletes today's and all future open instances and disables the repeat." />
        <Tip emoji="💡" text="Stopping a recurring chore does not remove instances that are already Pending or Complete — those stay in the history." />
      </Section>

      <Section icon="💬" title="Messaging">
        <Tip emoji="💬" text="Use the Messages tab to chat with your kids or co-parent directly inside the app." />
        <Tip emoji="🔴" text="A red badge on the Messages tab (or contact) shows how many unread messages you have." />
        <Tip emoji="↵" text="Press Enter to send a message. Use Shift + Enter for a new line." />
        <Tip emoji="🛡️" text="Messages, chore names, and shop items are all automatically checked for age-appropriate language before they're saved." />
      </Section>
    </div>
  )
}

// ── Kid help content ──────────────────────────────────────────────────────────

function KidHelp() {
  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
        borderRadius: 12, padding: '16px 20px', marginBottom: 20,
        border: '1px solid #bbf7d0',
      }}>
        <div style={{ fontWeight: 700, color: '#065f46', fontSize: '1.05rem', marginBottom: 6 }}>
          🌟 Welcome!
        </div>
        <p style={{ fontSize: '0.875rem', color: '#047857', lineHeight: 1.6, margin: 0 }}>
          Complete chores to earn points, then spend them in the Shop on fun rewards.
          The more chores you do, the more you can get!
        </p>
      </div>

      <Section icon="🚀" title="Getting Started" defaultOpen>
        <Step number="1" text="Open the Chores tab — you'll see all available chores your parent has created." />
        <Step number="2" text="Click 'Claim & Complete' on a chore you want to do. Do the chore in real life, then click the button." />
        <Step number="3" text="The chore moves to 'My Pending' while your parent reviews it." />
        <Step number="4" text="Once your parent approves it, the points land in your Wallet — go spend them in the Shop!" />
      </Section>

      <Section icon="📋" title="Doing Chores">
        <Tip emoji="✨" text="Available chores are open to anyone (or just you, if it's assigned to you specifically)." />
        <Tip emoji="⏳" text="After you complete a chore, it goes to 'My Pending' until your parent approves or rejects it." />
        <Tip emoji="🏆" text="Approved chores appear in 'My Completed' — nice work! The points are yours." />
        <Tip emoji="📅" text="Chores with a due date will expire if not done in time — try to finish them early!" />
        <Tip emoji="🔁" text="Some chores are recurring — they show a teal '🔁 Recurring' badge and come back automatically each day, week, or month. Complete them on time to keep earning!" />
      </Section>

      <Section icon="🛍️" title="Spending in the Shop">
        <Tip emoji="🎁" text="The Shop has rewards your parent has set up. Browse what's available and how many points each costs." />
        <Tip emoji="↕️" text="Use the sort buttons to see cheapest items first so you know what you can already afford." />
        <Tip emoji="🛒" text="Click 'Buy' on an item and points are deducted from your wallet instantly." />
        <Tip emoji="💡" text="Can't afford something yet? Keep doing chores — you'll get there!" />
      </Section>

      <Section icon="💰" title="Your Wallet">
        <Tip emoji="💰" text="The Wallet tab shows your current point balance and the last 15 transactions." />
        <Tip emoji="🟢" text="Green entries are points you earned from completing chores." />
        <Tip emoji="⭐" text="Gold ⭐ entries are bonus points your parent awarded you — check the message next to it to see why!" />
        <Tip emoji="🔴" text="Red entries are points you spent in the Shop or had removed, with a message explaining why." />
      </Section>

      <Section icon="💬" title="Messaging">
        <Tip emoji="💬" text="Use the Messages tab to send a message to your parent or co-parent." />
        <Tip emoji="🔴" text="A red badge shows when you have new unread messages." />
        <Tip emoji="↵" text="Press Enter to send. Use Shift + Enter for a new line." />
        <Tip emoji="🛡️" text="Messages are automatically checked for age-appropriate language before they're sent." />
      </Section>

      <Section icon="⚙️" title="Settings & Account">
        <Tip emoji="🔒" text="Your profile is protected by a 6-digit PIN instead of a password. Forgot it? Ask your parent — they can set you a new one from the Kids tab." />
        <Tip emoji="🔄" text="Use 'Switch Profile' in the ☰ menu to go back to the profile picker without fully signing out." />
        <Tip emoji="🚪" text="Use 'Sign Out' in the ☰ menu to log out of the device completely." />
      </Section>

      <Section icon="📩" title="Need Help?">
        <Tip emoji="📩" text="If something isn't working, use 'Contact Us' in the ☰ menu to send a message to the Reward Ur Kids team." />
        <Tip emoji="📎" text="You can attach a screenshot to help explain the problem." />
      </Section>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function HelpTab({ role }) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>❓ Help & Guide</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Everything you need to know about using Reward Ur Kids.
        </p>
      </div>
      {role === 'parent' ? <ParentHelp /> : <KidHelp />}
    </div>
  )
}

// ── Login-page mini overview (no accordion, just cards) ───────────────────────

export const LOGIN_HELP_CARDS = [
  { icon: '🔐', title: 'One Login, Many Profiles', text: 'Only the parent signs in with a username and password. From there, pick a profile — yourself, your co-parent, or any kid — and unlock it with its own 6-digit PIN, just like Netflix.' },
  { icon: '✅', title: 'Create Chores', text: 'Parents create chores with a points value. Kids see them and complete them in real life.' },
  { icon: '🔁', title: 'Recurring Chores', text: 'Mark a chore as Daily, Weekly, or Monthly. One instance appears on the day it is due — no duplicates. Stop the series any time from the Active Recurring Chores panel.' },
  { icon: '⭐', title: 'Earn Points', text: "Once a parent approves a chore, the child's wallet is credited automatically." },
  { icon: '🎁', title: 'Award Bonus & Remove Points', text: "Parents can award or deduct points any time — not just for completing chores — with a short message explaining why, saved right into the child's wallet history." },
  { icon: '🛍️', title: 'Spend in Shop', text: 'Kids redeem their points for rewards the parent has set up — screen time, picking dinner, and more.' },
  { icon: '💬', title: 'Stay Connected', text: 'Parents and kids can message each other inside the app. Add a co-parent from the Admin Panel so both parents share full family access.' },
]

// kept for any legacy import — no longer rendered on the login page
export function LoginHelp() { return null }
