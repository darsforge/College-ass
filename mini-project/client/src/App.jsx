import { useEffect, useMemo, useState } from "react";

const PLANS = [
  { months: 1, price: 1000, name: "1 month", perks: ["Full gym floor access", "Locker room", "Free fitness check"] },
  { months: 3, price: 2700, name: "3 months", perks: ["Everything in 1 month", "Group classes", "Diet chart"] },
  { months: 6, price: 5000, name: "6 months", popular: true, perks: ["Everything in 3 months", "Monthly progress review", "Guest pass"] },
  { months: 12, price: 9000, name: "12 months", perks: ["Everything in 6 months", "Best price per month", "Priority booking"] },
];

const emptyForm = { name: "", phone: "", planMonths: "", price: "", personalTrainer: "" };

const FIELD_ORDER = ["name", "phone", "planMonths", "price", "personalTrainer"];

// Returns an error message for one field, or "" if the value is fine
function validateField(name, raw) {
  const v = raw.trim();
  if (name === "name") {
    if (!v) return "Enter the customer's name.";
    if (!/^[A-Za-z ]{2,50}$/.test(v)) return "Name can have only letters and spaces. No numbers or symbols.";
  }
  if (name === "phone") {
    if (!v) return "Enter a 10-digit phone number.";
    if (!/^[0-9]+$/.test(v)) return "Phone can have only numbers. No letters or symbols.";
    if (v.length !== 10) return `Phone number must be exactly 10 digits. You entered ${v.length}.`;
  }
  if (name === "planMonths") {
    if (!v) return "Enter the plan length in months.";
    if (!/^[0-9]+$/.test(v)) return "Plan must be a number of months, for example 3.";
    if (Number(v) < 1) return "Plan must be at least 1 month.";
  }
  if (name === "price") {
    if (!v) return "Enter the price.";
    if (!/^[0-9]+$/.test(v)) return "Price can have only numbers.";
    if (Number(v) < 1) return "Price must be more than 0.";
  }
  if (name === "personalTrainer") {
    const t = v.toLowerCase();
    if (t !== "yes" && t !== "no") return "Type only yes or no.";
  }
  return "";
}

function validateAll(f) {
  const errors = {};
  FIELD_ORDER.forEach((name) => {
    const msg = validateField(name, f[name]);
    if (msg) errors[name] = msg;
  });
  return errors;
}

// One form field with its error message shown right under it
function Field({ label, name, value, error, onChange, onBlur, placeholder, inputMode }) {
  return (
    <label>
      {label}
      <input
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        inputMode={inputMode}
        className={error ? "bad" : ""}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? name + "-error" : undefined}
      />
      {error && (
        <span className="field-error" id={name + "-error"} role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

function expiryInfo(m) {
  const end = new Date(m.createdAt);
  end.setMonth(end.getMonth() + Number(m.planMonths));
  const daysLeft = Math.ceil((end - new Date()) / 86400000);
  let status = "active";
  if (daysLeft < 0) status = "expired";
  else if (daysLeft <= 7) status = "soon";
  return { end, daysLeft, status };
}

const money = (n) => "₹" + Number(n).toLocaleString("en-IN");
const dateText = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const STATUS_TEXT = { active: "Active", soon: "Expiring soon", expired: "Expired" };

export default function App() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [search, setSearch] = useState("");
  const [trainerFilter, setTrainerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("gym-theme") === "dark"; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try { localStorage.setItem("gym-theme", dark ? "dark" : "light"); } catch { /* ignore */ }
  }, [dark]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  async function loadMembers() {
    try {
      const res = await fetch("/api/members");
      setMembers(await res.json());
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
    setLoading(false);
  }
  useEffect(() => { loadMembers(); }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" }); // clear the message while the person fixes it
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    if (value.trim() === "") return; // do not scold an untouched field
    setErrors({ ...errors, [name]: validateField(name, value) });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validateAll(form);
    const firstBad = FIELD_ORDER.find((n) => found[n]);
    if (firstBad) {
      setErrors(found); // every problem is shown under its own field, nothing is sent to the database
      const el = document.querySelector(`[name="${firstBad}"]`);
      if (el) el.focus();
      return;
    }

    const body = JSON.stringify({
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      personalTrainer: form.personalTrainer.trim().toLowerCase(),
    });
    const url = editingId ? "/api/members/" + editingId : "/api/members";
    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!res.ok) {
      const data = await res.json();
      return setToast({ type: "error", text: data.error });
    }
    setToast({ type: "ok", text: editingId ? "Member updated" : "Member added" });
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
    loadMembers();
  }

  function startEdit(m) {
    setForm({
      name: m.name,
      phone: m.phone,
      planMonths: String(m.planMonths),
      price: String(m.price),
      personalTrainer: m.personalTrainer,
    });
    setEditingId(m._id);
    setErrors({});
    document.getElementById("add").scrollIntoView({ behavior: "smooth" });
  }

  function cancelEdit() {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
  }

  function choosePlan(p) {
    setForm({ ...form, planMonths: String(p.months), price: String(p.price) });
    setErrors({ ...errors, planMonths: "", price: "" });
    setEditingId(null);
    document.getElementById("add").scrollIntoView({ behavior: "smooth" });
  }

  async function confirmDelete() {
    await fetch("/api/members/" + deleteTarget._id, { method: "DELETE" });
    setToast({ type: "ok", text: "Member deleted" });
    setDeleteTarget(null);
    loadMembers();
  }

  // ----- derived data -----
  const stats = useMemo(() => {
    const withInfo = members.map((m) => ({ ...m, ...expiryInfo(m) }));
    return {
      total: members.length,
      active: withInfo.filter((m) => m.status !== "expired").length,
      soon: withInfo.filter((m) => m.status === "soon").length,
      revenue: members.reduce((sum, m) => sum + Number(m.price), 0),
      trainers: members.filter((m) => m.personalTrainer === "yes").length,
      byPlan: PLANS.map((p) => ({ ...p, count: members.filter((m) => m.planMonths === p.months).length })),
    };
  }, [members]);

  const visible = useMemo(() => {
    let list = members.map((m) => ({ ...m, ...expiryInfo(m) }));
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((m) => m.name.toLowerCase().includes(q) || m.phone.includes(q));
    if (trainerFilter !== "all") list = list.filter((m) => m.personalTrainer === trainerFilter);
    if (statusFilter !== "all") list = list.filter((m) => m.status === statusFilter);
    const sorters = {
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      name: (a, b) => a.name.localeCompare(b.name),
      price: (a, b) => b.price - a.price,
      expiry: (a, b) => a.daysLeft - b.daysLeft,
    };
    return list.sort(sorters[sortBy]);
  }, [members, search, trainerFilter, statusFilter, sortBy]);

  function exportCsv() {
    const rows = [["Name", "Phone", "Plan (months)", "Price", "Personal trainer", "Expires", "Status"]];
    visible.forEach((m) =>
      rows.push([m.name, m.phone, m.planMonths, m.price, m.personalTrainer, dateText(m.end), STATUS_TEXT[m.status]])
    );
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "gym-members.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const maxPlanCount = Math.max(1, ...stats.byPlan.map((p) => p.count));
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* ---------- Navbar ---------- */}
      <header className="nav">
        <div className="nav-inner">
          <a href="#home" className="brand" onClick={closeMenu}>
            <span className="plate" aria-hidden="true" />
            FitDesk
          </a>
          <nav className={"links" + (menuOpen ? " open" : "")}>
            <a href="#dashboard" onClick={closeMenu}>Dashboard</a>
            <a href="#plans" onClick={closeMenu}>Plans</a>
            <a href="#add" onClick={closeMenu}>Add member</a>
            <a href="#members" onClick={closeMenu}>Members</a>
            <a href="#contact" onClick={closeMenu}>Contact</a>
          </nav>
          <div className="nav-actions">
            <button className="ghost" onClick={() => setDark(!dark)} aria-label="Switch light or dark theme">
              {dark ? "Light" : "Dark"}
            </button>
            <button className="ghost burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">
              Menu
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ---------- Hero ---------- */}
        <section className="hero" id="home">
          <div className="hero-copy">
            <h1>Run your gym from one desk.</h1>
            <p>
              Sign up members, track who is about to expire, and see your revenue as it happens.
              Everything you type is saved to your own database.
            </p>
            <div className="hero-cta">
              <a className="btn primary" href="#add">Add a member</a>
              <a className="btn" href="#members">View members</a>
            </div>
          </div>
          <div className="rack" aria-label="Members by plan">
            <h2>Members on each plan</h2>
            {stats.byPlan.map((p) => (
              <div className="rack-row" key={p.months}>
                <span className="rack-label">{p.name}</span>
                <span className="rack-bar">
                  <span style={{ width: (p.count / maxPlanCount) * 100 + "%" }} />
                </span>
                <span className="rack-count">{p.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Dashboard ---------- */}
        <section className="section" id="dashboard">
          <h2 className="title">Dashboard</h2>
          <div className="stats">
            <div className="stat"><strong>{stats.total}</strong><span>Total members</span></div>
            <div className="stat"><strong>{stats.active}</strong><span>Active memberships</span></div>
            <div className="stat warn"><strong>{stats.soon}</strong><span>Expiring within 7 days</span></div>
            <div className="stat"><strong>{money(stats.revenue)}</strong><span>Total revenue</span></div>
            <div className="stat"><strong>{stats.trainers}</strong><span>With personal trainer</span></div>
          </div>
        </section>

        {/* ---------- Plans ---------- */}
        <section className="section" id="plans">
          <h2 className="title">Plans</h2>
          <p className="sub">Pick a plan to fill in the form for a new member. You can change the price afterwards.</p>
          <div className="plans">
            {PLANS.map((p) => (
              <div className={"plan" + (p.popular ? " popular" : "")} key={p.months}>
                {p.popular && <span className="badge">Most chosen</span>}
                <h3>{p.name}</h3>
                <div className="plan-price">{money(p.price)}</div>
                <div className="plan-per">{money(Math.round(p.price / p.months))} per month</div>
                <ul>{p.perks.map((x) => <li key={x}>{x}</li>)}</ul>
                <button className={"btn " + (p.popular ? "primary" : "")} onClick={() => choosePlan(p)}>
                  Use this plan
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Add / Edit form ---------- */}
        <section className="section" id="add">
          <h2 className="title">{editingId ? "Edit member" : "Add member"}</h2>
          <form className="panel form" onSubmit={handleSubmit} noValidate>
            <Field label="Customer name" name="name" value={form.name} error={errors.name} onChange={handleChange} onBlur={handleBlur} placeholder="Letters only, for example Rahul Patil" />
            <Field label="Phone number" name="phone" value={form.phone} error={errors.phone} onChange={handleChange} onBlur={handleBlur} placeholder="Exactly 10 digits" inputMode="numeric" />
            <Field label="Subscription plan (months)" name="planMonths" value={form.planMonths} error={errors.planMonths} onChange={handleChange} onBlur={handleBlur} placeholder="1, 3, 6 or 12" inputMode="numeric" />
            <Field label="Price (₹)" name="price" value={form.price} error={errors.price} onChange={handleChange} onBlur={handleBlur} placeholder="Numbers only" inputMode="numeric" />
            <Field label="Personal trainer" name="personalTrainer" value={form.personalTrainer} error={errors.personalTrainer} onChange={handleChange} onBlur={handleBlur} placeholder="yes or no" />
            <div className="form-actions">
              <button type="submit" className="btn primary">{editingId ? "Save changes" : "Add member"}</button>
              {editingId && <button type="button" className="btn" onClick={cancelEdit}>Cancel</button>}
            </div>
          </form>
        </section>

        {/* ---------- Members ---------- */}
        <section className="section" id="members">
          <div className="members-head">
            <h2 className="title">Members</h2>
            <button className="btn" onClick={exportCsv} disabled={!visible.length}>Download CSV</button>
          </div>

          <div className="toolbar">
            <input className="search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone" aria-label="Search members" />
            <select value={trainerFilter} onChange={(e) => setTrainerFilter(e.target.value)} aria-label="Filter by trainer">
              <option value="all">All members</option>
              <option value="yes">With trainer</option>
              <option value="no">Without trainer</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
              <option value="all">Any status</option>
              <option value="active">Active</option>
              <option value="soon">Expiring soon</option>
              <option value="expired">Expired</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort members">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A to Z</option>
              <option value="price">Highest price</option>
              <option value="expiry">Expiring first</option>
            </select>
          </div>

          <div className="panel table-wrap">
            {loading ? (
              <p className="empty">Loading members...</p>
            ) : loadError ? (
              <p className="empty">Cannot reach the server. Start it with <code>npm start</code> inside the server folder, then refresh.</p>
            ) : members.length === 0 ? (
              <p className="empty">No members yet. Add your first member using the form above.</p>
            ) : visible.length === 0 ? (
              <p className="empty">No members match these filters. Clear the search or choose another filter.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Member</th><th>Phone</th><th>Plan</th><th>Price</th><th>Trainer</th><th>Expires</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((m) => (
                    <tr key={m._id}>
                      <td>
                        <span className="member">
                          <span className="avatar">{m.name.charAt(0).toUpperCase()}</span>
                          {m.name}
                        </span>
                      </td>
                      <td>{m.phone}</td>
                      <td>{m.planMonths} {m.planMonths === 1 ? "month" : "months"}</td>
                      <td>{money(m.price)}</td>
                      <td><span className={"pill " + (m.personalTrainer === "yes" ? "yes" : "no")}>{m.personalTrainer === "yes" ? "Yes" : "No"}</span></td>
                      <td>{dateText(m.end)}<small>{m.daysLeft < 0 ? Math.abs(m.daysLeft) + " days ago" : m.daysLeft + " days left"}</small></td>
                      <td><span className={"status " + m.status}>{STATUS_TEXT[m.status]}</span></td>
                      <td>
                        <span className="row-actions">
                          <button className="small" onClick={() => startEdit(m)}>Edit</button>
                          <button className="small danger" onClick={() => setDeleteTarget(m)}>Delete</button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {!loading && !loadError && members.length > 0 && (
            <p className="count">Showing {visible.length} of {members.length} members</p>
          )}
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="footer" id="contact">
        <div className="footer-inner">
          <div>
            <div className="brand"><span className="plate" aria-hidden="true" />FitDesk</div>
            <p>Gym management mini project built with MongoDB, Express, React and Node.</p>
          </div>
          <div>
            <h3>Visit us</h3>
            <p>123 Fitness Street, Your City</p>
            <p>Open daily, 5:30 am to 10:00 pm</p>
          </div>
          <div>
            <h3>Contact</h3>
            <p>+91 98765 43210</p>
            <p>hello@fitdesk.example</p>
          </div>
        </div>
        <p className="copy">© {new Date().getFullYear()} FitDesk. All rights reserved.</p>
      </footer>

      {/* ---------- Delete confirmation ---------- */}
      {deleteTarget && (
        <div className="overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Delete {deleteTarget.name}?</h3>
            <p>This removes the member from the database. You cannot undo it.</p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setDeleteTarget(null)}>Keep member</button>
              <button className="btn danger-solid" onClick={confirmDelete}>Delete member</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Toast ---------- */}
      {toast && <div className={"toast " + toast.type} role="status">{toast.text}</div>}
    </>
  );
}
