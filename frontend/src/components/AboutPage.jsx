import { useNavigate } from 'react-router-dom'

// Why the app exists and how it actually helps, as a dedicated standalone page
// linked from the landing page's top nav -- same visual language as Blogs.jsx
// (teal gradient header + hero) since both are public content pages reached
// from that same nav bar.

const HELPS = [
  {
    icon: '✅',
    title: 'Chores Become Points, Not Nagging',
    text: "Every chore a kid completes earns points the moment a guardian approves it -- no chart to remember, no eraser, no \"I did it yesterday too\" arguments. The effort is tracked automatically, so the conversation at home shifts from reminding to recognizing.",
  },
  {
    icon: '🎯',
    title: 'Points Connect to a Real Goal',
    text: "Kids can set their own savings goal -- a name and a target -- and watch a real progress bar move as they save toward it. Earning stops being abstract and becomes \"12 points closer to the thing I actually want,\" which is a far stronger motivator than a vague point total.",
  },
  {
    icon: '🌱',
    title: 'Future-Ready Skills, Not Just Task Lists',
    text: "Short, age-matched lessons on investing, AI, online safety, public speaking, and manners sit right next to the chores -- so the app teaches more than tidiness. Kids earn points for learning the same way they earn points for chores, which puts real-world skills on equal footing with daily responsibilities.",
  },
  {
    icon: '👨‍👩‍👧',
    title: 'Built for the Whole Family, Not Just One Parent',
    text: "Co-guardians can be added to a family at any time, so both parents (or any trusted adult) see the same chores, approvals, and progress -- nobody has to relay updates secondhand, and nobody's effort to stay involved gets lost.",
  },
]

const PILLARS = [
  { icon: '🆓', text: '100% free -- no subscriptions, no paywalls' },
  { icon: '🔒', text: 'Every profile is PIN-protected' },
  { icon: '👨‍👩‍👧', text: 'Add a co-guardian anytime' },
  { icon: '📱', text: 'Works great on mobile' },
]

function SectionHeading({ children }) {
  return (
    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f766e', marginTop: 40, marginBottom: 14, letterSpacing: '-0.3px' }}>
      {children}
    </h2>
  )
}

export default function AboutPage() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top nav */}
      <div style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← Back
        </button>
        <div style={{ background: '#fff', borderRadius: 8, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
          <img src="/branding/RewardURKids_Website_Compact_Logo.png" alt="Reward Ur Kids" style={{ height: 20, display: 'block' }} />
        </div>
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: 600 }}>· About</span>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg,#0f766e,#0d9488,#2dd4bf)', padding: '48px 24px 56px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🌱</div>
        <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', maxWidth: 720, margin: '0 auto 14px', lineHeight: 1.3, letterSpacing: '-0.4px' }}>
          Why We Built Reward Ur Kids
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1rem', maxWidth: 580, margin: '0 auto', lineHeight: 1.6 }}>
          Small tasks, tracked honestly and rewarded consistently, teach kids more than any lecture about responsibility ever could. Here's what that actually looks like, and why it works.
        </p>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 64px' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '28px 28px 8px' }}>
          <p style={{ fontSize: '1.05rem', color: '#334155', lineHeight: 1.8, marginBottom: 20 }}>
            Most families start the same way: a sticker chart on the fridge, or a verbal promise that finishing homework earns screen time. It works for a week or two. Then the chart runs out of room, the stickers run out, or everyone just forgets to check it -- and the system that was supposed to build good habits quietly disappears, taking the motivation with it.
          </p>
          <p style={{ fontSize: '0.97rem', color: '#334155', lineHeight: 1.8, marginBottom: 16 }}>
            Reward Ur Kids exists to fix that specific failure, not to reinvent the idea of rewarding kids for effort. Chores still get assigned, completed, and approved -- the difference is that a points balance, a savings goal, and a history of what was done and when never run out of room, never get thrown away, and never depend on anyone's memory.
          </p>

          <SectionHeading>How Reward Ur Kids Helps</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 8 }}>
            {HELPS.map(h => (
              <div key={h.title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 12, background: 'linear-gradient(135deg,#f0fdfa,#ccfbf1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                  {h.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: 5 }}>{h.title}</div>
                  <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.7, margin: 0 }}>{h.text}</p>
                </div>
              </div>
            ))}
          </div>

          <SectionHeading>Built for Real Families</SectionHeading>
          <p style={{ fontSize: '0.97rem', color: '#334155', lineHeight: 1.8, marginBottom: 20 }}>
            Every decision in the app starts from the same question: what does a real household actually need, not what looks impressive in a demo. That's why it stays simple and verifiable:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            {PILLARS.map(p => (
              <div key={p.text} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 999, padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, color: '#0f766e' }}>
                <span>{p.icon}</span>{p.text}
              </div>
            ))}
          </div>

          <SectionHeading>Our Approach</SectionHeading>
          <p style={{ fontSize: '0.97rem', color: '#334155', lineHeight: 1.8, marginBottom: 16 }}>
            Small Tasks. Big Smiles. isn't just a tagline -- it's the actual bet the app makes: that consistency on small, achievable things builds far more lasting confidence and responsibility than the occasional big lecture ever does. A kid who reliably earns, saves toward, and eventually reaches a goal they picked themselves learns something a parent can't simply explain to them. They have to live it, one approved chore at a time.
          </p>
          <p style={{ fontSize: '0.97rem', color: '#334155', lineHeight: 1.8, marginBottom: 8 }}>
            That's the whole idea behind Reward Ur Kids: make the loop between effort and reward visible, fair, and impossible to forget about -- so good habits have a real chance to stick, for kids and for the parents trying to help them build it.
          </p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', background: 'linear-gradient(135deg, #f0fdfa, #fff)', border: '1px solid #99f6e4', borderRadius: 20, padding: '28px 20px', marginTop: 32 }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b', marginBottom: 14 }}>
            Ready to turn chores into good habits?
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('/')}
              style={{ background: '#0d9488', color: '#fff', border: 'none', borderRadius: 999, padding: '12px 28px', fontSize: '0.92rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 16px rgba(13,148,136,0.3)' }}
            >
              Get Started — It's Free →
            </button>
            <button
              onClick={() => navigate('/blog')}
              style={{ background: '#fff', color: '#0d9488', border: '2px solid #0d9488', borderRadius: 999, padding: '10px 26px', fontSize: '0.92rem', fontWeight: 800, cursor: 'pointer' }}
            >
              Read the Blog →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
