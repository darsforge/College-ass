import { useState } from "react";
import { CATEGORIES, todayStr } from "../constants.js";

function validate(v) {
  const e = {};
  if (!v.title.trim()) e.title = "Enter what you spent on.";
  else if (v.title.trim().length > 60) e.title = "Title must be 60 characters or fewer.";

  const amount = Number(v.amount);
  if (v.amount === "") e.amount = "Enter the amount.";
  else if (Number.isNaN(amount) || amount <= 0) e.amount = "Amount must be a number greater than 0.";
  else if (amount > 10000000) e.amount = "Amount is too large.";

  if (!CATEGORIES.includes(v.category)) e.category = "Pick a category.";
  if (!v.date) e.date = "Pick a date.";
  if (v.note.length > 200) e.note = "Note must be 200 characters or fewer.";
  return e;
}

function Field({ label, error, children }) {
  return (
    <div className={"field" + (error ? " has-error" : "")}>
      <label>{label}</label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export default function ExpenseForm({ initial, onSubmit, onCancel }) {
  const editing = Boolean(initial._id);
  const blank = { title: "", amount: "", category: "Food", date: todayStr(), note: "" };
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (name) => (e) => {
    setValues({ ...values, [name]: e.target.value });
    if (errors[name]) setErrors({ ...errors, [name]: undefined });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await onSubmit({
        title: values.title.trim(),
        amount: Number(values.amount),
        category: values.category,
        date: values.date,
        note: values.note.trim(),
      });
      if (!editing) setValues(blank);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h2>{editing ? "Edit expense" : "Add an expense"}</h2>
      {serverError && <p className="banner error">{serverError}</p>}

      <Field label="What did you spend on?" error={errors.title}>
        <input value={values.title} onChange={set("title")} placeholder="e.g. Canteen lunch" />
      </Field>

      <div className="two">
        <Field label="Amount (₹)" error={errors.amount}>
          <input value={values.amount} onChange={set("amount")} inputMode="decimal" placeholder="e.g. 120" />
        </Field>
        <Field label="Date" error={errors.date}>
          <input type="date" value={values.date} onChange={set("date")} />
        </Field>
      </div>

      <Field label="Category" error={errors.category}>
        <select value={values.category} onChange={set("category")}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>

      <Field label="Note (optional)" error={errors.note}>
        <input value={values.note} onChange={set("note")} placeholder="Anything to remember" />
      </Field>

      <div className="actions">
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "Saving..." : editing ? "Save changes" : "Add expense"}
        </button>
        {editing && (
          <button className="btn ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
