import { useState } from "react";
import { CATEGORIES, COLORS, rupees, formatDate } from "../constants.js";

export default function ExpenseList({ expenses, category, onCategory, onEdit, onDelete }) {
  const [confirmId, setConfirmId] = useState(null);

  return (
    <section className="card">
      <div className="list-head">
        <h2>Expenses</h2>
        <select value={category} onChange={(e) => onCategory(e.target.value)} aria-label="Filter by category">
          <option>All</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {expenses.length === 0 ? (
        <p className="empty">Nothing here for this month{category !== "All" ? ` in ${category}` : ""}. Use the form to add an expense.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Expense</th>
                <th>Category</th>
                <th className="num">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((x) => (
                <tr key={x._id}>
                  <td className="nowrap">{formatDate(x.date)}</td>
                  <td>
                    {x.title}
                    {x.note && <small className="muted block">{x.note}</small>}
                  </td>
                  <td>
                    <span className="chip" style={{ "--c": COLORS[x.category] }}>
                      {x.category}
                    </span>
                  </td>
                  <td className="num">{rupees(x.amount)}</td>
                  <td className="row-actions">
                    {confirmId === x._id ? (
                      <>
                        <button className="link danger" onClick={() => { setConfirmId(null); onDelete(x._id); }}>Yes, delete</button>
                        <button className="link" onClick={() => setConfirmId(null)}>Keep</button>
                      </>
                    ) : (
                      <>
                        <button className="link" onClick={() => onEdit(x)}>Edit</button>
                        <button className="link danger" onClick={() => setConfirmId(x._id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
