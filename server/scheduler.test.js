const assert = require("assert");
const {
  findValidSlots,
  chooseRandomSlot,
  rankTestsByPriority,
  computeFreeIntervals,
  toMinutes,
} = require("./scheduler");

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok  - ${name}`);
  } catch (e) {
    console.error(`FAIL - ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log("Scheduler algorithm tests");

test("matches the spec example: soccer 3:30-5, home free 6-9, 30min slots", () => {
  const busy = [{ start: "15:30", end: "17:00" }];
  const slots = findValidSlots("06:00", "21:00", busy, 30);
  // must include 6:00-6:30 ... 8:30-9:00, all within free window, none overlapping soccer
  assert(slots.some((s) => s.start === "18:00" && s.end === "18:30"));
  assert(slots.some((s) => s.start === "20:30" && s.end === "21:00"));
  assert(!slots.some((s) => s.start === "15:30"));
  for (const s of slots) {
    const start = toMinutes(s.start);
    assert(!(start >= toMinutes("15:30") && start < toMinutes("17:00")), `slot ${s.start} overlaps soccer`);
  }
});

test("no overlap with multiple busy events", () => {
  const busy = [
    { start: "08:00", end: "15:00" }, // school
    { start: "15:30", end: "17:00" }, // sports
    { start: "19:00", end: "19:30" }, // dinner
  ];
  const slots = findValidSlots("07:00", "22:00", busy, 45);
  for (const s of slots) {
    const start = toMinutes(s.start);
    const end = toMinutes(s.end);
    for (const b of busy) {
      const bs = toMinutes(b.start);
      const be = toMinutes(b.end);
      assert(end <= bs || start >= be, `slot ${s.start}-${s.end} overlaps busy ${b.start}-${b.end}`);
    }
  }
  assert(slots.length > 0);
});

test("day with no free time yields zero slots", () => {
  const busy = [{ start: "00:00", end: "23:59" }];
  const slots = findValidSlots("06:00", "22:00", busy, 30);
  assert.strictEqual(slots.length, 0);
});

test("duration longer than any free gap yields zero slots", () => {
  const busy = [
    { start: "06:00", end: "12:00" },
    { start: "12:20", end: "22:00" },
  ];
  // only a 20 minute gap exists (12:00-12:20)
  const slots = findValidSlots("06:00", "22:00", busy, 30);
  assert.strictEqual(slots.length, 0);
  const slots2 = findValidSlots("06:00", "22:00", busy, 20);
  assert(slots2.length >= 1);
});

test("overlapping busy events are merged correctly (no false gaps)", () => {
  const busy = [
    { start: "10:00", end: "12:00" },
    { start: "11:00", end: "13:00" }, // overlaps previous
  ];
  const free = computeFreeIntervals(toMinutes("09:00"), toMinutes("14:00"), busy.map(b => ({start: toMinutes(b.start), end: toMinutes(b.end)})));
  assert.deepStrictEqual(free, [
    { start: toMinutes("09:00"), end: toMinutes("10:00") },
    { start: toMinutes("13:00"), end: toMinutes("14:00") },
  ]);
});

test("randomize again avoids repeating the same slot when alternatives exist", () => {
  const busy = [];
  const current = { start: "18:00", end: "18:30" };
  let differentFound = false;
  for (let i = 0; i < 25; i++) {
    const next = chooseRandomSlot("06:00", "21:00", busy, 30, current);
    if (next.start !== current.start) {
      differentFound = true;
      break;
    }
  }
  assert(differentFound, "expected randomize-again to eventually pick a different slot");
});

test("randomize again with only one legal slot returns it without erroring", () => {
  const busy = [
    { start: "06:00", end: "18:00" },
    { start: "18:30", end: "23:59" },
  ];
  const current = { start: "18:00", end: "18:30" };
  const next = chooseRandomSlot("06:00", "22:00", busy, 30, current);
  assert.strictEqual(next.start, "18:00");
});

test("prioritizes a test due tomorrow over one due in two weeks", () => {
  const today = "2026-09-19";
  const tests = [
    { id: "a", date: "2026-10-03", difficulty: "medium", daily_study_minutes: 30, sessionsCompleted: 0 },
    { id: "b", date: "2026-09-20", difficulty: "medium", daily_study_minutes: 30, sessionsCompleted: 0 },
  ];
  const ranked = rankTestsByPriority(tests, today);
  assert.strictEqual(ranked[0].id, "b");
});

test("harder test outranks an easier test at equal distance", () => {
  const today = "2026-09-19";
  const tests = [
    { id: "easy", date: "2026-09-26", difficulty: "easy", daily_study_minutes: 30, sessionsCompleted: 0 },
    { id: "hard", date: "2026-09-26", difficulty: "hard", daily_study_minutes: 30, sessionsCompleted: 0 },
  ];
  const ranked = rankTestsByPriority(tests, today);
  assert.strictEqual(ranked[0].id, "hard");
});

test("a test with more completed sessions is deprioritized vs a fresh one", () => {
  const today = "2026-09-19";
  const tests = [
    { id: "fresh", date: "2026-09-26", difficulty: "medium", daily_study_minutes: 30, sessionsCompleted: 0 },
    { id: "studied", date: "2026-09-26", difficulty: "medium", daily_study_minutes: 30, sessionsCompleted: 5 },
  ];
  const ranked = rankTestsByPriority(tests, today);
  assert.strictEqual(ranked[0].id, "fresh");
});

test("past tests are excluded from ranking", () => {
  const today = "2026-09-19";
  const tests = [{ id: "past", date: "2026-09-10", difficulty: "hard", daily_study_minutes: 30, sessionsCompleted: 0 }];
  const ranked = rankTestsByPriority(tests, today);
  assert.strictEqual(ranked.length, 0);
});

test("recurring-style multiple busy blocks across a packed day still find late slot", () => {
  const busy = [
    { start: "07:30", end: "14:45" }, // school
    { start: "15:30", end: "17:00" }, // sports
    { start: "17:30", end: "18:00" }, // dinner
  ];
  const slots = findValidSlots("07:00", "21:30", busy, 30);
  assert(slots.some((s) => s.start === "20:00"));
});

console.log(`\n${passed} test(s) passed.`);
