// MentorCard.jsx — human escalation pattern
function MentorCard({ mentor, message, verdict = "Pursue" }) {
  return (
    <div className="mentor">
      <div className="mentor-avatar">{mentor.initials}</div>
      <div>
        <div className="mentor-head">
          <span className="mentor-name">{mentor.name}</span>
          <span className="mentor-role">{mentor.role}</span>
          <span className="mentor-time">{mentor.time}</span>
        </div>
        <div className="mentor-body">
          {message.map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p }} />)}
          <span className="mentor-verdict">Recommendation · {verdict}</span>
        </div>
      </div>
    </div>
  );
}
window.MentorCard = MentorCard;
