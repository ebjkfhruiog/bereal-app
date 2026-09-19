const express = require("express");
const { v4: uuid } = require("uuid");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const DIFFICULTIES = ["easy", "medium", "hard"];

function serialize(t) {
  const sessionsCompleted = db
    .prepare("SELECT COUNT(*) AS c FROM study_sessions WHERE test_id = ? AND completed = 1")
    .get(t.id).c;
  return {
    id: t.id,
    subject: t.subject,
    name: t.name,
    date: t.date,
    difficulty: t.difficulty,
    dailyStudyMinutes: t.daily_study_minutes,
    notes: t.notes,
    sessionsCompleted,
  };
}

function validate(body) {
  const { subject, name, date, difficulty, dailyStudyMinutes } = body;
  if (!subject || !name || !date) return "subject, name, and date are required.";
  if (difficulty && !DIFFICULTIES.includes(difficulty)) return `difficulty must be one of: ${DIFFICULTIES.join(", ")}`;
  if (dailyStudyMinutes !== undefined && (!Number.isFinite(dailyStudyMinutes) || dailyStudyMinutes <= 0)) {
    return "dailyStudyMinutes must be a positive number.";
  }
  return null;
}

router.get("/", (req, res) => {
  const tests = db.prepare("SELECT * FROM tests WHERE user_id = ? ORDER BY date").all(req.userId);
  res.json({ tests: tests.map(serialize) });
});

router.post("/", (req, res) => {
  const err = validate(req.body || {});
  if (err) return res.status(400).json({ error: err });
  const { subject, name, date, difficulty, dailyStudyMinutes, notes } = req.body;
  const id = uuid();
  db.prepare(
    `INSERT INTO tests (id, user_id, subject, name, date, difficulty, daily_study_minutes, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.userId, subject.trim(), name.trim(), date, difficulty || "medium", dailyStudyMinutes || 30, notes || null);
  res.status(201).json({ test: serialize(db.prepare("SELECT * FROM tests WHERE id = ?").get(id)) });
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM tests WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "Test not found." });
  const merged = {
    subject: req.body.subject ?? existing.subject,
    name: req.body.name ?? existing.name,
    date: req.body.date ?? existing.date,
    difficulty: req.body.difficulty ?? existing.difficulty,
    dailyStudyMinutes: req.body.dailyStudyMinutes ?? existing.daily_study_minutes,
    notes: req.body.notes ?? existing.notes,
  };
  const err = validate(merged);
  if (err) return res.status(400).json({ error: err });
  db.prepare(
    `UPDATE tests SET subject=?, name=?, date=?, difficulty=?, daily_study_minutes=?, notes=? WHERE id=?`
  ).run(merged.subject.trim(), merged.name.trim(), merged.date, merged.difficulty, merged.dailyStudyMinutes, merged.notes, req.params.id);
  res.json({ test: serialize(db.prepare("SELECT * FROM tests WHERE id = ?").get(req.params.id)) });
});

router.delete("/:id", (req, res) => {
  const existing = db.prepare("SELECT id FROM tests WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "Test not found." });
  db.prepare("DELETE FROM tests WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

module.exports = router;
