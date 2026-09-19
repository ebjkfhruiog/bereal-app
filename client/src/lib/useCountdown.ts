import { useEffect, useState } from 'react';

/** Ticking countdown (seconds remaining) to a "YYYY-MM-DD" + "HH:MM" target. */
export function useCountdown(date: string, time: string) {
  const target = new Date(`${date}T${time}:00`).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diffMs = target - now;
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    isPast: diffMs <= 0,
    hasStarted: diffMs <= 0,
    hours,
    minutes,
    seconds,
    label: hours > 0 ? `${hours}h ${minutes}m` : minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`,
  };
}
