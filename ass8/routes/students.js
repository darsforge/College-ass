const express = require("express");
const mongoose = require("mongoose");
const Student = require("../models/Student");

const router = express.Router();

// Reject malformed ids before they reach MongoDB
function checkId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid student id" });
  }
  next();
}

// CREATE - POST /api/students
router.post("/", async (req, res, next) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) {
    next(err);
  }
});

// READ ALL - GET /api/students  (optional filters: ?branch=IT&year=3)
router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.branch) filter.branch = req.query.branch;
    if (req.query.year) filter.year = Number(req.query.year);
    const students = await Student.find(filter).sort({ createdAt: -1 });
    res.json({ count: students.length, students });
  } catch (err) {
    next(err);
  }
});

// READ ONE - GET /api/students/:id
router.get("/:id", checkId, async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    next(err);
  }
});

// UPDATE - PUT /api/students/:id
router.put("/:id", checkId, async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,            // return the updated document
      runValidators: true,  // apply schema rules on update too
    });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    next(err);
  }
});

// DELETE - DELETE /api/students/:id
router.delete("/:id", checkId, async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student deleted", student });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
