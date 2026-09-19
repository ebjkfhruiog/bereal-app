export interface User {
  id: string;
  name: string;
  email: string;
  grade: string | null;
  isPremium: boolean;
  studyWindowStart: string;
  studyWindowEnd: string;
  onboarded: boolean;
  createdAt: string;
}

export type Category = 'School' | 'Sports' | 'Extracurricular' | 'Work' | 'Family' | 'Homework' | 'Other';

export const CATEGORIES: Category[] = ['School', 'Sports', 'Extracurricular', 'Work', 'Family', 'Homework', 'Other'];

export type Recurrence = 'none' | 'daily' | 'weekly';

export interface ScheduleEvent {
  id: string;
  name: string;
  category: Category;
  date: string | null;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  recurrence: Recurrence;
  untilDate: string | null;
  notes: string | null;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface TestItem {
  id: string;
  subject: string;
  name: string;
  date: string;
  difficulty: Difficulty;
  dailyStudyMinutes: number;
  notes: string | null;
  sessionsCompleted: number;
}

export interface StudySession {
  id: string;
  testId: string | null;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  completed: boolean;
  completedAt: string | null;
  actualSeconds: number | null;
}

export interface Stats {
  totalMinutes: number;
  sessionsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  weekMinutes: number;
  monthMinutes: number;
  bySubject: { subject: string; minutes: number; sessions: number }[];
  dailyHistory: { date: string; minutes: number }[];
}
