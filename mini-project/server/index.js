require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gymdb";

// ---- Model ----
const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  planMonths: { type: Number, required: true },
  price: { type: Number, required: true },
  personalTrainer: { type: String, enum: ["yes", "no"], required: true },
  createdAt: { type: Date, default: Date.now },
});
const Member = mongoose.model("Member", memberSchema);

// ---- Server-side validation (safety net behind the React alerts) ----
function validate(b) {
  if (!/^[A-Za-z ]{2,50}$/.test(b.name || "")) return "Name: add only letters here";
  if (!/^[0-9]{10}$/.test(b.phone || "")) return "Phone: add only numbers here (10 digits)";
  if (!/^[0-9]+$/.test(String(b.planMonths)) || Number(b.planMonths) < 1) return "Plan: add only numbers here";
  if (!/^[0-9]+$/.test(String(b.price)) || Number(b.price) < 1) return "Price: add only numbers here";
  if (!["yes", "no"].includes(String(b.personalTrainer).toLowerCase())) return "Personal trainer: only yes or no";
  return null;
}

// ---- Routes ----
app.get("/api/members", async (req, res) => {
  const members = await Member.find().sort({ createdAt: -1 });
  res.json(members);
});

app.post("/api/members", async (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  const member = await Member.create({
    name: req.body.name.trim(),
    phone: req.body.phone,
    planMonths: Number(req.body.planMonths),
    price: Number(req.body.price),
    personalTrainer: String(req.body.personalTrainer).toLowerCase(),
  });
  res.json(member);
});

app.put("/api/members/:id", async (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  const updated = await Member.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name.trim(),
      phone: req.body.phone,
      planMonths: Number(req.body.planMonths),
      price: Number(req.body.price),
      personalTrainer: String(req.body.personalTrainer).toLowerCase(),
    },
    { new: true }
  );
  res.json(updated);
});

app.delete("/api/members/:id", async (req, res) => {
  await Member.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log("API running on http://localhost:" + PORT));
  })
  .catch((err) => console.log("MongoDB connection failed:", err.message));
