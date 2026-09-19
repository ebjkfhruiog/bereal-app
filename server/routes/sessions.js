const express = require("express");
const { v4: uuid } = require("uuid");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const { eventsOnDate } = require("../eventUtils");
const { chooseRandomSlot, findValidSlots, rankTestsByPriority } = require("../scheduler");

const router = express.Router();
router.use(requireAuth);

function serialize(s) {
  return {
    id: s.id,
    testId: s.test_id,
    subject: s.subject,
    date: s.date,
    startTime: s.start_time,
    endTime: s.end_time,
    durationMinutes: s.duration_minutes,
    completed: !!s.completed,
    completedAt: s.completed_at,
    actualSeconds: s.actual_seconds,
  };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** All busy time blocks on a date: real schedule events + other study sessions. */
function busyBlocksForDate(userId, date, excludeSessionId) {
  const events = db.prepare("SELECT * FROM schedule_events WHERE user_id = ?").all(userId);
  const dayEvents = eventsOnDate(events, date).map((e) => ({ start: e.start_time, end: e.end_time }));

  const sessions = db
    .prepare("SELECT * FROM study_sessions WHERE user_id = ? AND date = ?")
    .all(userId, date)
    .filter((s) => s.id !== excludeSessionId)
    .map((s) => ({ start: s.start_time, end: s.end_time }));

  return [...dayEvents, ...sessions];
}

function userWindow(userId) {
  const u = db.prepare("SELECT study_window_start, study_window_end FROM users WHERE id = ?").get(userId);
  return { start: u.study_window_start, end: u.study_window_end };
}

router.get("/", (req, res) => {
  const { date, from, to } = req.query;
  let rows;
  if (date) {
    rows = db.prepare("SELECT * FROM study_sessions WHERE user_id = ? AND date = ? ORDER BY start_time").all(req.userId, date);
  } else if (from && to) {
    rows = db
      .prepare("SELECT * FROM study_sessions WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date, start_time")
      .all(req.userId, from, to);
  } else {
    rows = db.prepare("SELECT * FROM study_sessions WHERE user_id = ? ORDER BY date, start_time").all(req.userId);
  }
  res.json({ sessions: rows.map(serialize) });
});

router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM study_sessions WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!row) return res.status(404).json({ error: "Session not found." });
  res.json({ session: serialize(row) });
});

/**
 * The core "Stubby decides for you" endpoint. Ranks upcoming tests by
 * priority, then greedily places one randomly-chosen study session per
 * test into remaining free time until the day is out of room.
 */
router.post("/generate", (req, res) => {
  const date = req.body?.date || todayStr();
  const window = userWindow(req.userId);
  const tests = db.prepare("SELECT * FROM tests WHERE user_id = ? AND date >= ?").all(req.userId, date);

  const testsWithProgress = tests.map((t) => ({
    ...t,
    sessionsCompleted: db.prepare("SELECT COUNT(*) AS c FROM study_sessions WHERE test_id = ? AND completed = 1").get(t.id).c,
  }));

  const alreadyPlanned = new Set(
    db
      .prepare("SELECT test_id FROM study_sessions WHERE user_id = ? AND date = ? AND test_id IS NOT NULL")
      .all(req.userId, date)
      .map((r) => r.test_id)
  );

  const ranked = rankTestsByPriority(
    testsWithProgress.filter((t) => !alreadyPlanned.has(t.id)),
    date
  );

  const created = [];
  const skipped = [];

  for (const test of ranked) {
    const busy = [...busyBlocksForDate(req.userId, date), ...created.map((s) => ({ start: s.startTime, end: s.endTime }))];
    const slots = findValidSlots(window.start, window.end, busy, test.daily_study_minutes);
    if (slots.length === 0) {
      skipped.push({ testId: test.id, subject: test.subject, reason: "No free time left today." });
      continue;
    }
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const id = uuid();
    db.prepare(
      `INSERT INTO study_sessions (id, user_id, test_id, subject, date, start_time, end_time, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, req.userId, test.id, test.subject, date, slot.start, slot.end, test.daily_study_minutes);
    created.push(serialize(db.prepare("SELECT * FROM study_sessions WHERE id = ?").get(id)));
  }

  res.status(201).json({ sessions: created, skipped });
});

/** Recalculates free slots fresh and picks a genuinely new random one. */
router.post("/:id/randomize", (req, res) => {
  const existing = db.prepare("SELECT * FROM study_sessions WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "Session not found." });
  if (existing.completed) return res.status(400).json({ error: "Cannot randomize a completed session." });

  const window = userWindow(req.userId);
  const busy = busyBlocksForDate(req.userId, existing.date, existing.id);
  const slot = chooseRandomSlot(window.start, window.end, busy, existing.duration_minutes, {
    start: existing.start_time,
    end: existing.end_time,
  });
  if (!slot) return res.status(409).json({ error: "No valid time slots available today." });

  db.prepare("UPDATE study_sessions SET start_time = ?, end_time = ? WHERE id = ?").run(slot.start, slot.end, existing.id);
  res.json({ session: serialize(db.prepare("SELECT * FROM study_sessions WHERE id = ?").get(existing.id)) });
});

router.post("/:id/complete", (req, res) => {
  const existing = db.prepare("SELECT * FROM study_sessions WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "Session not found." });
  const actualSeconds = Number.isFinite(req.body?.actualSeconds) ? req.body.actualSeconds : null;
  db.prepare(
    `UPDATE study_sessions SET completed = 1, completed_at = datetime('now'), actual_seconds = ? WHERE id = ?`
  ).run(actualSeconds, existing.id);
  res.json({ session: serialize(db.prepare("SELECT * FROM study_sessions WHERE id = ?").get(existing.id)) });
});

router.delete("/:id", (req, res) => {
  const existing = db.prepare("SELECT id FROM study_sessions WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "Session not found." });
  db.prepare("DELETE FROM study_sessions WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

module.exports = router;
