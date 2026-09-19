export const MOTIVATION_QUOTES = [
  "Don't wait until you're motivated. Just start.",
  '30 minutes today is better than cramming for 3 hours tomorrow.',
  'You don’t have to want to. You just have to start.',
  'Future you is counting on the next 30 minutes.',
  'Progress, not perfection. Show up.',
  'The hardest part is opening the book. You’re already here.',
  'Small sessions, done consistently, beat marathon cramming.',
  'Stubby already picked the time. All you have to do is start.',
];

export function quoteForToday(): string {
  const day = Math.floor(Date.now() / 86400000);
  return MOTIVATION_QUOTES[day % MOTIVATION_QUOTES.length];
}

export function randomQuote(excluding?: string): string {
  const pool = excluding ? MOTIVATION_QUOTES.filter((q) => q !== excluding) : MOTIVATION_QUOTES;
  return pool[Math.floor(Math.random() * pool.length)];
}
