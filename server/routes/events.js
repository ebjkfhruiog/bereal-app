const express = require("express");
const { v4: uuid } = require("uuid");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const CATEGORIES = ["School", "Sports", "Extracurricular", "Work", "Family", "Homework", "Other"];
const RECURRENCE = ["none", "daily", "weekly"];

function serialize(e) {
  return {
    id: e.id,
    name: e.name,
    category: e.category,
    date: e.date,
    daysOfWeek: e.days_of_week ? JSON.parse(e.days_of_week) : [],
    startTime: e.start_time,
    endTime: e.end_time,
    recurrence: e.recurrence,
    untilDate: e.until_date,
    notes: e.notes,
  };
}

function validate(body) {
  const { name, category, startTime, endTime, recurrence } = body;
  if (!name || !category || !startTime || !endTime) return "name, category, startTime, and endTime are required.";
  if (!CATEGORIES.includes(category)) return `category must be one of: ${CATEGORIES.join(", ")}`;
  if (recurrence && !RECURRENCE.includes(recurrence)) return `recurrence must be one of: ${RECURRENCE.join(", ")}`;
  if (startTime >= endTime) return "startTime must be before endTime.";
  if ((recurrence === "weekly") && (!Array.isArray(body.daysOfWeek) || body.daysOfWeek.length === 0)) {
    return "weekly recurring events require at least one day of week.";
  }
  if ((!recurrence || recurrence === "none") && !body.date) {
    return "date is required for one-off events.";
  }
  return null;
}

router.get("/", (req, res) => {
  const events = db.prepare("SELECT * FROM schedule_events WHERE user_id = ? ORDER BY created_at").all(req.userId);
  res.json({ events: events.map(serialize) });
});

router.post("/", (req, res) => {
  const err = validate(req.body || {});
  if (err) return res.status(400).json({ error: err });
  const { name, category, date, daysOfWeek, startTime, endTime, recurrence, untilDate, notes } = req.body;
  const id = uuid();
  db.prepare(
    `INSERT INTO schedule_events (id, user_id, name, category, date, days_of_week, start_time, end_time, recurrence, until_date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.userId,
    name.trim(),
    category,
    date || null,
    recurrence === "weekly" ? JSON.stringify(daysOfWeek) : null,
    startTime,
    endTime,
    recurrence || "none",
    untilDate || null,
    notes || null
  );
  res.status(201).json({ event: serialize(db.prepare("SELECT * FROM schedule_events WHERE id = ?").get(id)) });
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM schedule_events WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "Event not found." });
  const merged = { ...serialize(existing), ...req.body };
  const err = validate(merged);
  if (err) return res.status(400).json({ error: err });
  db.prepare(
    `UPDATE schedule_events SET name=?, category=?, date=?, days_of_week=?, start_time=?, end_time=?, recurrence=?, until_date=?, notes=? WHERE id=?`
  ).run(
    merged.name.trim(),
    merged.category,
    merged.date || null,
    merged.recurrence === "weekly" ? JSON.stringify(merged.daysOfWeek) : null,
    merged.startTime,
    merged.endTime,
    merged.recurrence || "none",
    merged.untilDate || null,
    merged.notes || null,
    req.params.id
  );
  res.json({ event: serialize(db.prepare("SELECT * FROM schedule_events WHERE id = ?").get(req.params.id)) });
});

router.delete("/:id", (req, res) => {
  const existing = db.prepare("SELECT id FROM schedule_events WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "Event not found." });
  db.prepare("DELETE FROM schedule_events WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

module.exports = router;
