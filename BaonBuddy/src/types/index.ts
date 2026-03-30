// src/types/index.ts

export interface AllowancePeriod {
  id: string;                    // uuid
  amount: number;                // total baon for this period
  startDate: string;             // ISO date string "2025-01-01"
  endDate: string;               // ISO date string "2025-01-07"
  frequency: 'weekly' | 'biweekly' | 'monthly';
  isActive: boolean;
}

export interface Expense {
  id: string;                    // uuid
  periodId: string;              // links to AllowancePeriod.id
  amount: number;
  category: ExpenseCategory;
  note: string;                  // optional, can be empty string
  date: string;                  // ISO date string
  createdAt: string;             // ISO datetime string
}

export type ExpenseCategory =
  | 'pagkain'
  | 'pamasahe'
  | 'supplies'
  | 'load'
  | 'libre'
  | 'iba_pa';

export interface SavingsGoal {
  id: string;
  name: string;                  // "Nike shoes", "Concert ticket"
  targetAmount: number;
  savedAmount: number;
  createdAt: string;
  completedAt: string | null;
  isCompleted: boolean;
}

export interface AppSettings {
  currency: string;              // default "₱"
  darkMode: 'auto' | 'light' | 'dark';
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;     // "20:00"
  overspendAlertEnabled: boolean;
  resetReminderEnabled: boolean;
  hasCompletedOnboarding: boolean;
  hasSeenProUpgrade: boolean;
}

export interface BudgetStatus {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  daysLeft: number;
  dailySafeToSpend: number;      // remaining / daysLeft
  percentUsed: number;           // totalSpent / totalBudget * 100
  meterStatus: 'green' | 'yellow' | 'red';
  isOverspending: boolean;
  currentStreak: number;         // consecutive on-budget days
}
