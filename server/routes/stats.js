const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Sunday
  const diff = date.getDate() - day;
  const result = new Date(date.setDate(diff));
  return result.toISOString().slice(0, 10);
}

router.get("/", (req, res) => {
  const userId = req.userId;
  const completed = db
    .prepare("SELECT * FROM study_sessions WHERE user_id = ? AND completed = 1 ORDER BY date")
    .all(userId);

  const totalMinutes = completed.reduce((sum, s) => sum + s.duration_minutes, 0);
  const sessionsCompleted = completed.length;

  const today = new Date().toISOString().slice(0, 10);
  const weekStart = startOfWeek(new Date());
  const monthStart = today.slice(0, 7) + "-01";

  const weekMinutes = completed.filter((s) => s.date >= weekStart).reduce((sum, s) => sum + s.duration_minutes, 0);
  const monthMinutes = completed.filter((s) => s.date >= monthStart).reduce((sum, s) => sum + s.duration_minutes, 0);

  // Streak: consecutive days (including today or most recent studied day) with >=1 completed session.
  const studiedDates = [...new Set(completed.map((s) => s.date))].sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let prevDate = null;
  let running = 0;
  for (const d of studiedDates) {
    if (prevDate) {
      const gap = (new Date(d) - new Date(prevDate)) / 86400000;
      running = gap === 1 ? running + 1 : 1;
    } else {
      running = 1;
    }
    longestStreak = Math.max(longestStreak, running);
    prevDate = d;
  }
  if (studiedDates.length > 0) {
    const last = studiedDates[studiedDates.length - 1];
    const gapFromToday = (new Date(today) - new Date(last)) / 86400000;
    currentStreak = gapFromToday <= 1 ? running : 0;
  }

  const bySubjectMap = {};
  for (const s of completed) {
    if (!bySubjectMap[s.subject]) bySubjectMap[s.subject] = { subject: s.subject, minutes: 0, sessions: 0 };
    bySubjectMap[s.subject].minutes += s.duration_minutes;
    bySubjectMap[s.subject].sessions += 1;
  }

  // Last 14 days of history, zero-filled, for a weekly/daily chart.
  const dailyHistory = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const minutes = completed.filter((s) => s.date === key).reduce((sum, s) => sum + s.duration_minutes, 0);
    dailyHistory.push({ date: key, minutes });
  }

  res.json({
    totalMinutes,
    sessionsCompleted,
    currentStreak,
    longestStreak,
    weekMinutes,
    monthMinutes,
    bySubject: Object.values(bySubjectMap).sort((a, b) => b.minutes - a.minutes),
    dailyHistory,
  });
});

module.exports = router;
