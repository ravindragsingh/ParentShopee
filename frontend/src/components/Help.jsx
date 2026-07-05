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
        <Step number="1" text="Go to the Kids tab and click '+ Add Child' to add each of your children with a name, username and password." />
        <Step number="2" text="Optionally go to Co-Parent tab to invite a second parent who will share access to your family." />
        <Step number="3" text="Go to Chores and create your first chore. Pick a points value, an emoji, and optionally assign it to a specific child." />
        <Step number="4" text="Tell your kids to log in — they'll see the chores and can start claiming them!" />
      </Section>

      <Section icon="✅" title="Managing Chores">
        <Tip emoji="✨" text="Open chores are available for kids to pick up. Assigned chores go directly to one child." />
        <Tip emoji="⏳" text="When a child marks a chore done, it moves to Pending — you'll see it here to approve or reject." />
        <Tip emoji="🏆" text="Approved chores move to Complete and the child's wallet is credited with the points automatically." />
        <Tip emoji="🔁" text="Completed or expired chores have a 'Repeat' / 'Add Again' button so you can reuse them easily." />
        <Tip emoji="📅" text="Set a due date so the chore auto-expires if it isn't done in time." />
      </Section>

      <Section icon="🛍️" title="Running the Shop">
        <Tip emoji="🎁" text="Add reward items kids can buy — things like 'Extra screen time', 'Choose dinner', or 'Stay up later'." />
        <Tip emoji="💰" text="Set a point cost for each item. Kids can only buy what they can afford." />
        <Tip emoji="📋" text="Use the sample templates dropdown to quickly fill in popular reward ideas." />
        <Tip emoji="↕️" text="Kids can sort shop items by points (low → high or high → low) to find what they can afford." />
      </Section>

      <Section icon="🌟" title="Good Behaviour Points">
        <Tip emoji="🌟" text="Go to the Kids tab and click '🌟 Behaviour' next to a child's name to award or remove points based on their behaviour." />
        <Tip emoji="✅" text="Use the quick-select buttons (5, 10, 15, 20, 50 pts) or type a custom amount, then click 'Award Good Behaviour' to add points." />
        <Tip emoji="➖" text="Click 'Remove Points' to deduct points if behaviour has been poor. A child's balance cannot go below zero." />
        <Tip emoji="📒" text="Good behaviour awards show as a gold 🌟 entry in the child's wallet. Deductions show as a red entry." />
      </Section>

      <Section icon="📋" title="Viewing Kids' Wallets">
        <Tip emoji="👁" text="Click the green balance chip next to a kid's name to open their full wallet in a popup." />
        <Tip emoji="📋" text="Click '📋 Transactions' to expand their last 15 transactions inline in the Kids table." />
        <Tip emoji="🟢" text="Green = chore points earned · Gold ⭐ = bonus · Gold 🌟 = good behaviour · Red = points removed or spent in Shop." />
      </Section>

      <Section icon="👨‍👩‍👧" title="Co-Parent Management">
        <Tip emoji="👨‍👩‍👧" text="Use the Co-Parent tab to add a second parent (partner, spouse, etc.) who shares full access to your family — children, chores, shop and wallets." />
        <Tip emoji="➕" text="Enter their name, username and a password, then click 'Create Co-Parent'. Share those credentials with them to log in." />
        <Tip emoji="🔑" text="Use '🔑 Change Password' on their card any time you need to update their login credentials." />
        <Tip emoji="🗑️" text="'Remove Co-Parent' immediately revokes their access. Only one co-parent per family is allowed." />
      </Section>

      <Section icon="⚙️" title="Settings & Account">
        <Tip emoji="🔑" text="Open the Settings tab (via the ☰ menu) to change your own password. Enter a new password and confirm it, then click 'Update Password'." />
        <Tip emoji="🔑" text="To change a child's password, go to the Kids tab and click '🔑 Password' next to their name." />
        <Tip emoji="🚪" text="Use the 'Sign Out' button in Settings — or the one in the top navbar — to log out." />
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
        <Tip emoji="⭐" text="Gold ⭐ entries are bonus points your parent gave you." />
        <Tip emoji="🌟" text="Gold 🌟 entries are good behaviour points your parent awarded you — keep it up!" />
        <Tip emoji="🔴" text="Red entries are points you spent in the Shop or had removed." />
      </Section>

      <Section icon="💬" title="Messaging">
        <Tip emoji="💬" text="Use the Messages tab to send a message to your parent or co-parent." />
        <Tip emoji="🔴" text="A red badge shows when you have new unread messages." />
        <Tip emoji="↵" text="Press Enter to send. Use Shift + Enter for a new line." />
      </Section>

      <Section icon="⚙️" title="Settings & Account">
        <Tip emoji="🔑" text="Open the Settings tab (via the ☰ menu) to change your own password. Enter a new password, confirm it, and click 'Update Password'." />
        <Tip emoji="🚪" text="Use 'Sign Out' in Settings — or the button in the top navbar — to log out." />
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
    <div style={{ maxWidth: 700 }}>
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

export function LoginHelp() {
  const [open, setOpen] = useState(false)
  const cards = [
    { icon: '✅', title: 'Create Chores', text: 'Parents create chores with a points value. Kids see them and complete them in real life.' },
    { icon: '🔁', title: 'Recurring Chores', text: 'Mark a chore as Daily, Weekly, or Monthly. One instance appears on the day it is due — no duplicates. Stop the series any time from the Active Recurring Chores panel.' },
    { icon: '⭐', title: 'Earn Points',   text: "Once a parent approves a chore, the child's wallet is credited automatically." },
    { icon: '🌟', title: 'Good Behaviour', text: "Parents can award or deduct points for behaviour at any time — not just for completing chores. It shows as a special entry in the child's wallet." },
    { icon: '🛍️', title: 'Spend in Shop', text: 'Kids redeem their points for rewards the parent has set up — screen time, picking dinner, and more.' },
    { icon: '💬', title: 'Stay Connected', text: 'Parents and kids can message each other inside the app. Add a co-parent so both parents share full family access.' },
  ]

  return (
    <div style={{ width: '100%', maxWidth: 390, marginTop: 20 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '11px 16px',
          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.35)', borderRadius: 12,
          color: 'white', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.2s',
        }}
      >
        {open ? '▲ Hide Guide' : '❓ How does Reward Ur Kids work?'}
      </button>

      {open && (
        <div style={{
          marginTop: 10, background: 'rgba(255,255,255,0.97)', borderRadius: 16,
          padding: 20, boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
        }}>
          <h3 style={{ fontWeight: 800, color: '#0f766e', marginBottom: 4, fontSize: '1rem' }}>🛒 Reward Ur Kids</h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 16 }}>
            A chore &amp; reward app for the whole family.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cards.map(c => (
              <div key={c.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg,#f0fdfa,#ccfbf1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                }}>
                  {c.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginBottom: 2 }}>{c.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>{c.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: '10px 14px', background: '#f0fdfa', borderRadius: 10, fontSize: '0.78rem', color: '#115e59' }}>
            👑 <strong>Parents</strong> register an account · 🧒 <strong>Kids</strong> log in with credentials the parent creates for them
          </div>
        </div>
      )}
    </div>
  )
}
