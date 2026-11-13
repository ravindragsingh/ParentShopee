// Small "New" pill for highlighting a recently-launched feature. Visually
// matches the private NewBadge() copies in the Future-Ready/Quests tabs.
export default function NewBadge({ style }) {
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 800, borderRadius: 999, padding: '2px 8px',
      background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', flexShrink: 0,
      textTransform: 'uppercase', letterSpacing: '0.03em',
      ...style,
    }}>
      New
    </span>
  )
}
