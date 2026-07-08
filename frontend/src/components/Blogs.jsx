import { useState } from 'react'

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

function PostView({ post, onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top nav */}
      <div style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }}>
        <button
          onClick={onBack}
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
            onClick={onBack}
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

function BlogList({ onSelectPost, onBackToLogin }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Nav */}
      <div style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>🏆 Reward Ur Kids</span>
        <button
          onClick={onBackToLogin}
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
              onClick={() => onSelectPost(post)}
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

export default function Blogs({ onBackToLogin }) {
  const [selectedPost, setSelectedPost] = useState(null)

  if (selectedPost) {
    return <PostView post={selectedPost} onBack={() => setSelectedPost(null)} />
  }

  return <BlogList onSelectPost={setSelectedPost} onBackToLogin={onBackToLogin} />
}
