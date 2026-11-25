// Lightweight **bold**/==highlight== markup for support-ticket messages and
// replies -- the admin reply box's toolbar (see AdminDashboard.jsx) wraps
// selected text in these same delimiters. Rendered as real React elements
// here, never raw HTML, so there's no injection risk from ticket text a
// guardian/kid submitted themselves. Mirrored server-side in
// backend/email_utils.py for the reply-notification email.
export function renderTicketMarkup(text) {
  if (!text) return null
  const pattern = /\*\*(.+?)\*\*|==(.+?)==/g
  const nodes = []
  let lastIndex = 0
  let match
  let key = 0
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    if (match[1] !== undefined) {
      nodes.push(<strong key={key++}>{match[1]}</strong>)
    } else {
      nodes.push(
        <mark key={key++} style={{ background: '#fef08a', padding: '0 2px', borderRadius: 2 }}>{match[2]}</mark>
      )
    }
    lastIndex = pattern.lastIndex
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}
