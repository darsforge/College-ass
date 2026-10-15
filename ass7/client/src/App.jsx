import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import { rupees, todayStr, monthLabel, COLORS } from "./constants.js";
import ExpenseForm from "./components/ExpenseForm.jsx";
import ExpenseList from "./components/ExpenseList.jsx";
import Analysis from "./components/Analysis.jsx";

export default function App() {
  const [month, setMonth] = useState(todayStr().slice(0, 7));
  const [category, setCategory] = useState("All");
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([api.list(month, category), api.summary(month)]);
      setExpenses(list);
      setSummary(sum);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [month, category]);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(text) {
    setToast(text);
    setTimeout(() => setToast(""), 2500);
  }

  async function handleSave(data) {
    if (editing) {
      await api.update(editing._id, data);
      setEditing(null);
      showToast("Expense updated");
    } else {
      await api.create(data);
      showToast("Expense added");
    }
    // Jump to the month of the saved expense so the person sees it
    const savedMonth = data.date.slice(0, 7);
    if (savedMonth !== month) setMonth(savedMonth);
    else await load();
  }

  async function handleDelete(id) {
    try {
      await api.remove(id);
      showToast("Expense deleted");
      if (editing && editing._id === id) setEditing(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const formInitial = editing
    ? {
        _id: editing._id,
        title: editing.title,
        amount: String(editing.amount),
        category: editing.category,
        date: editing.date.slice(0, 10),
        note: editing.note || "",
      }
    : { title: "", amount: "", category: "Food", date: todayStr(), note: "" };

  const top = summary && summary.byCategory[0];

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Personal Expense Tracker</h1>
          <p className="muted">Record what you spend and see where it goes.</p>
        </div>
        <label className="month-pick">
          Month
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        </label>
      </header>

      {error && <p className="banner error">{error}</p>}

      <section className="stats" aria-label={`Summary for ${monthLabel(month, "long")}`}>
        <div className="stat main">
          <span>Spent in {monthLabel(month, "long")}</span>
          <strong>{summary ? rupees(summary.total) : "..."}</strong>
        </div>
        <div className="stat">
          <span>Transactions</span>
          <strong>{summary ? summary.count : "..."}</strong>
        </div>
        <div className="stat">
          <span>Daily average</span>
          <strong>{summary ? rupees(summary.dailyAverage) : "..."}</strong>
        </div>
        <div className="stat">
          <span>Top category</span>
          <strong>
            {top ? (
              <>
                <i className="dot" style={{ background: COLORS[top.category] }} />
                {top.category}
              </>
            ) : (
              "None yet"
            )}
          </strong>
        </div>
        <div className="stat">
          <span>Biggest expense</span>
          <strong>{summary && summary.biggest ? rupees(summary.biggest.amount) : "None yet"}</strong>
          {summary && summary.biggest && <small className="muted">{summary.biggest.title}</small>}
        </div>
      </section>

      <div className="grid">
        <ExpenseForm key={editing ? editing._id : "new"} initial={formInitial} onSubmit={handleSave} onCancel={() => setEditing(null)} />
        <Analysis summary={summary} />
      </div>

      {loading ? (
        <p className="muted">Loading expenses...</p>
      ) : (
        <ExpenseList
          expenses={expenses}
          category={category}
          onCategory={setCategory}
          onEdit={(x) => {
            setEditing(x);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onDelete={handleDelete}
        />
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
