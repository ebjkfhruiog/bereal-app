// Core scheduling engine for Stubby.
// Pure, dependency-free functions so they can be unit tested in isolation.

const SLOT_STEP_MINUTES = 15;

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(mins) {
  const clamped = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(clamped / 60)
    .toString()
    .padStart(2, "0");
  const m = (clamped % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Merge overlapping/touching [start,end] minute intervals. */
function mergeIntervals(intervals) {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged = [];
  for (const cur of sorted) {
    const last = merged[merged.length - 1];
    if (last && cur.start <= last.end) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

/**
 * Subtract busy intervals from a single day window, returning free intervals.
 * windowStart/End and busy[].start/end are all minutes-from-midnight.
 */
function computeFreeIntervals(windowStart, windowEnd, busyIntervals) {
  const busy = mergeIntervals(
    busyIntervals.filter((b) => b.end > windowStart && b.start < windowEnd)
  );
  const free = [];
  let cursor = windowStart;
  for (const b of busy) {
    const start = Math.max(b.start, windowStart);
    const end = Math.min(b.end, windowEnd);
    if (start > cursor) free.push({ start: cursor, end: start });
    cursor = Math.max(cursor, end);
  }
  if (cursor < windowEnd) free.push({ start: cursor, end: windowEnd });
  return free.filter((f) => f.end > f.start);
}

/**
 * Enumerate every valid slot of `durationMinutes` that fits inside the free
 * intervals, stepping by SLOT_STEP_MINUTES. This is deliberately exhaustive
 * (not a single arbitrary placement) so a "random slot" is a genuine random
 * choice among all legal options, matching the product spec.
 */
function enumerateSlots(freeIntervals, durationMinutes, stepMinutes = SLOT_STEP_MINUTES) {
  const slots = [];
  for (const interval of freeIntervals) {
    let start = interval.start;
    while (start + durationMinutes <= interval.end) {
      slots.push({ start, end: start + durationMinutes });
      start += stepMinutes;
    }
  }
  return slots;
}

function pickRandom(arr, exclude) {
  if (arr.length === 0) return null;
  if (!exclude) return arr[Math.floor(Math.random() * arr.length)];
  const filtered = arr.filter((s) => !(s.start === exclude.start && s.end === exclude.end));
  const pool = filtered.length > 0 ? filtered : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Find every legal slot for a study session on a given day.
 * @param {string} windowStart HH:MM day-window start (e.g. wake time)
 * @param {string} windowEnd HH:MM day-window end (e.g. bedtime)
 * @param {Array<{start:string,end:string}>} busyEvents other commitments/sessions (HH:MM)
 * @param {number} durationMinutes desired study duration
 */
function findValidSlots(windowStart, windowEnd, busyEvents, durationMinutes) {
  const busy = busyEvents.map((e) => ({ start: toMinutes(e.start), end: toMinutes(e.end) }));
  const free = computeFreeIntervals(toMinutes(windowStart), toMinutes(windowEnd), busy);
  return enumerateSlots(free, durationMinutes).map((s) => ({
    start: toHHMM(s.start),
    end: toHHMM(s.end),
  }));
}

/** Random valid slot, optionally avoiding the current one (for "randomize again"). */
function chooseRandomSlot(windowStart, windowEnd, busyEvents, durationMinutes, exclude) {
  const slots = findValidSlots(windowStart, windowEnd, busyEvents, durationMinutes);
  if (slots.length === 0) return null;
  const excludeMin = exclude ? { start: toMinutes(exclude.start), end: toMinutes(exclude.end) } : null;
  const slotsMin = slots.map((s) => ({ start: toMinutes(s.start), end: toMinutes(s.end) }));
  const chosen = pickRandom(slotsMin, excludeMin);
  return { start: toHHMM(chosen.start), end: toHHMM(chosen.end) };
}

const DIFFICULTY_WEIGHT = { easy: 1, medium: 1.5, hard: 2.2 };

/**
 * Priority score for a test — higher means "study this sooner."
 * Factors: how soon the test is, difficulty, requested daily study time,
 * and how many sessions have already been completed toward it.
 */
function priorityScore(test, today) {
  const daysUntil = Math.max(
    0.5,
    (new Date(test.date) - new Date(today)) / 86400000
  );
  const urgency = 6 / daysUntil; // closer test => sharply higher priority
  const difficulty = DIFFICULTY_WEIGHT[test.difficulty] || 1.5;
  const goalWeight = (test.daily_study_minutes || 30) / 30;
  const completedPenalty = Math.min(test.sessionsCompleted || 0, 6) * 0.4;
  return urgency * 3 + difficulty * 2 + goalWeight - completedPenalty;
}

function rankTestsByPriority(tests, today) {
  return [...tests]
    .filter((t) => new Date(t.date) >= new Date(today))
    .map((t) => ({ ...t, score: priorityScore(t, today) }))
    .sort((a, b) => b.score - a.score);
}

module.exports = {
  toMinutes,
  toHHMM,
  mergeIntervals,
  computeFreeIntervals,
  enumerateSlots,
  findValidSlots,
  chooseRandomSlot,
  priorityScore,
  rankTestsByPriority,
  SLOT_STEP_MINUTES,
};
