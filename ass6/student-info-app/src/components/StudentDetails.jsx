const PASS_MARK = 35;

function getGrade(marks) {
  if (marks < PASS_MARK) return "F";
  if (marks >= 90) return "A+";
  if (marks >= 80) return "A";
  if (marks >= 70) return "B+";
  if (marks >= 60) return "B";
  if (marks >= 50) return "C";
  return "D";
}

function getInitials(name) {
  const parts = name.split(" ").filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default function StudentDetails({ student, onRemove }) {
  const { id, name, rollNo, department, marks } = student;
  const passed = marks >= PASS_MARK;

  return (
    <article className="card">
      <div className="card-top">
        <div className="avatar" aria-hidden="true">
          {getInitials(name)}
        </div>
        <div className="card-title">
          <h3>{name}</h3>
          <p>{department}</p>
        </div>
        <span className={`result ${passed ? "pass" : "fail"}`}>
          {passed ? "Pass" : "Fail"}
        </span>
      </div>

      <dl className="facts">
        <div>
          <dt>Roll number</dt>
          <dd>{rollNo}</dd>
        </div>
        <div>
          <dt>Marks</dt>
          <dd>{marks} / 100</dd>
        </div>
        <div>
          <dt>Grade</dt>
          <dd>{getGrade(marks)}</dd>
        </div>
      </dl>

      <div
        className="meter"
        role="img"
        aria-label={`${marks} out of 100 marks`}
      >
        <span className={passed ? "pass" : "fail"} style={{ width: `${marks}%` }} />
      </div>

      <button
        type="button"
        className="remove"
        onClick={() => onRemove(id)}
        aria-label={`Remove ${name}`}
      >
        Remove
      </button>
    </article>
  );
}
