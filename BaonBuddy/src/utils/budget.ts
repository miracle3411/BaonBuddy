// src/utils/budget.ts
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { AllowancePeriod, Expense, BudgetStatus } from '../types';

export function calculateBudgetStatus(
  period: AllowancePeriod,
  expenses: Expense[]
): BudgetStatus {
  const today = new Date();
  const endDate = parseISO(period.endDate);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = Math.max(0, period.amount - totalSpent);
  // +1 to include today in the count
  const daysLeft = Math.max(1, differenceInCalendarDays(endDate, today) + 1);
  const dailySafeToSpend = remaining / daysLeft;
  const percentUsed = (totalSpent / period.amount) * 100;

  // Meter logic:
  // Green  = spent <= 75% of budget proportionally for days elapsed
  // Yellow = spent 75-100% proportionally
  // Red    = spent over budget
  const daysElapsed = differenceInCalendarDays(today, parseISO(period.startDate));
  const totalDays = differenceInCalendarDays(endDate, parseISO(period.startDate)) + 1;
  const expectedSpentRatio = daysElapsed / totalDays;
  const actualSpentRatio = totalSpent / period.amount;
  // If no days have elapsed yet but money was spent, treat as overpacing
  const ratio = expectedSpentRatio > 0
    ? actualSpentRatio / expectedSpentRatio
    : (actualSpentRatio > 0 ? Infinity : 0);

  let meterStatus: 'green' | 'yellow' | 'red';
  if (totalSpent >= period.amount || percentUsed >= 90) {
    meterStatus = 'red';
  } else if (ratio > 1.15 || percentUsed >= 75) {
    meterStatus = 'yellow';
  } else {
    meterStatus = 'green';
  }

  // Streak: count consecutive days where spending <= dailySafeToSpend
  const streak = calculateStreak(expenses, period);

  return {
    totalBudget: period.amount,
    totalSpent,
    remaining,
    daysLeft,
    dailySafeToSpend,
    percentUsed,
    meterStatus,
    isOverspending: totalSpent > period.amount,
    currentStreak: streak,
  };
}

export function calculateStreak(expenses: Expense[], period: AllowancePeriod): number {
  // Group expenses by date, count consecutive on-budget days backwards from yesterday
  const byDate: Record<string, number> = {};
  expenses.forEach(e => {
    byDate[e.date] = (byDate[e.date] ?? 0) + e.amount;
  });

  const totalDays = differenceInCalendarDays(
    parseISO(period.endDate),
    parseISO(period.startDate)
  ) + 1;
  const dailyBudget = period.amount / totalDays;

  let streak = 0;
  let checkDate = new Date();
  checkDate.setDate(checkDate.getDate() - 1); // start from yesterday

  for (let i = 0; i < 60; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const spent = byDate[dateStr] ?? 0;
    if (spent <= dailyBudget) {
      streak++;
    } else {
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
}

export function getNextPeriodDates(
  frequency: AllowancePeriod['frequency'],
  fromDate: Date = new Date()
): { startDate: string; endDate: string } {
  const start = new Date(fromDate);
  const end = new Date(fromDate);

  if (frequency === 'weekly') {
    end.setDate(end.getDate() + 6);
  } else if (frequency === 'biweekly') {
    end.setDate(end.getDate() + 13);
  } else {
    // monthly: last day of current month
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate:   end.toISOString().split('T')[0],
  };
}
