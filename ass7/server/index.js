require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5050;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/expensedb";

const CATEGORIES = ["Food", "Transport", "Education", "Shopping", "Bills", "Entertainment", "Health", "Other"];

/* ---------- Model ---------- */
const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [60, "Title must be 60 characters or fewer"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: { values: CATEGORIES, message: "Pick a valid category" },
    },
    date: { type: Date, required: [true, "Date is required"] },
    note: { type: String, trim: true, maxlength: [200, "Note must be 200 characters or fewer"], default: "" },
  },
  { timestamps: true }
);
const Expense = mongoose.model("Expense", expenseSchema);

/* ---------- Helpers ---------- */
// Dates are stored as UTC midnight, so month boundaries are computed in UTC too.
function monthRange(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || "")) return null;
  const [y, m] = month.split("-").map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
}
const round2 = (n) => Math.round(n * 100) / 100;

function checkId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid expense id" });
  next();
}

/* ---------- CRUD routes ---------- */
// READ - GET /api/expenses?month=2026-10&category=Food
app.get("/api/expenses", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.month) {
      const range = monthRange(req.query.month);
      if (!range) return res.status(400).json({ message: "month must look like 2026-10" });
      filter.date = { $gte: range.start, $lt: range.end };
    }
    if (req.query.category) filter.category = req.query.category;
    const expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (err) { next(err); }
});

// CREATE - POST /api/expenses
app.post("/api/expenses", async (req, res, next) => {
  try {
    res.status(201).json(await Expense.create(req.body));
  } catch (err) { next(err); }
});

// UPDATE - PUT /api/expenses/:id
app.put("/api/expenses/:id", checkId, async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json(expense);
  } catch (err) { next(err); }
});

// DELETE - DELETE /api/expenses/:id
app.delete("/api/expenses/:id", checkId, async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted" });
  } catch (err) { next(err); }
});

/* ---------- Analysis route ---------- */
// GET /api/summary?month=2026-10
app.get("/api/summary", async (req, res, next) => {
  try {
    const range = monthRange(req.query.month);
    if (!range) return res.status(400).json({ message: "month must look like 2026-10" });
    const inMonth = { date: { $gte: range.start, $lt: range.end } };

    // Spending per category for the chosen month
    const grouped = await Expense.aggregate([
      { $match: inMonth },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
    const total = grouped.reduce((s, g) => s + g.total, 0);
    const count = grouped.reduce((s, g) => s + g.count, 0);
    const byCategory = grouped.map((g) => ({
      category: g._id,
      total: round2(g.total),
      count: g.count,
      percent: total > 0 ? (g.total / total) * 100 : 0,
    }));

    // Daily average: days passed so far if it is the current month, else the full month
    const [y, m] = req.query.month.split("-").map(Number);
    const now = new Date();
    const isCurrent = now.getFullYear() === y && now.getMonth() + 1 === m;
    const days = isCurrent ? now.getDate() : new Date(Date.UTC(y, m, 0)).getUTCDate();

    const biggest = await Expense.findOne(inMonth).sort({ amount: -1 });

    // Last 6 months ending with the chosen month
    const trendStart = new Date(Date.UTC(y, m - 6, 1));
    const monthly = await Expense.aggregate([
      { $match: { date: { $gte: trendStart, $lt: range.end } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$date" } }, total: { $sum: "$amount" } } },
    ]);
    const lookup = Object.fromEntries(monthly.map((x) => [x._id, x.total]));
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(y, m - 1 - i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      trend.push({ month: key, total: round2(lookup[key] || 0) });
    }

    res.json({
      month: req.query.month,
      total: round2(total),
      count,
      dailyAverage: round2(total / days),
      biggest: biggest ? { title: biggest.title, amount: biggest.amount, category: biggest.category } : null,
      byCategory,
      trend,
    });
  } catch (err) { next(err); }
});

/* ---------- Errors ---------- */
app.use("/api", (req, res) => res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` }));

app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "Validation failed", errors: Object.values(err.errors).map((e) => e.message) });
  }
  if (err.type === "entity.parse.failed") return res.status(400).json({ message: "Request body is not valid JSON" });
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

/* ---------- Start ---------- */
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected:", MONGO_URI);
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    console.error("Is MongoDB running? Try: net start MongoDB");
    process.exit(1);
  });
