// Expands schedule events (one-off or recurring) onto a specific calendar date.

function occursOnDate(event, dateStr) {
  const target = new Date(dateStr + "T00:00:00");
  if (event.recurrence === "none") {
    return event.date === dateStr;
  }
  if (event.recurrence === "weekly") {
    const days = JSON.parse(event.days_of_week || "[]");
    const startOk = !event.date || new Date(event.date + "T00:00:00") <= target;
    const untilOk = !event.until_date || new Date(event.until_date + "T00:00:00") >= target;
    return startOk && untilOk && days.includes(target.getDay());
  }
  if (event.recurrence === "daily") {
    const startOk = !event.date || new Date(event.date + "T00:00:00") <= target;
    const untilOk = !event.until_date || new Date(event.until_date + "T00:00:00") >= target;
    return startOk && untilOk;
  }
  return false;
}

function eventsOnDate(events, dateStr) {
  return events.filter((e) => occursOnDate(e, dateStr));
}

module.exports = { occursOnDate, eventsOnDate };
