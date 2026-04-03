// src/storage/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AllowancePeriod, Expense, SavingsGoal, AppSettings } from '../types';

const KEYS = {
  PERIODS:   'bb:periods',
  EXPENSES:  'bb:expenses',
  GOALS:     'bb:goals',
  SETTINGS:  'bb:settings',
};

// Default settings for first-time users
const DEFAULT_SETTINGS: AppSettings = {
  currency: '₱',
  language: 'en',
  darkMode: 'auto',
  dailyReminderEnabled: true,
  dailyReminderTime: '20:00',
  overspendAlertEnabled: true,
  resetReminderEnabled: true,
  hasCompletedOnboarding: false,
  hasSeenProUpgrade: false,
};

// -- Periods ------------------------------------------------------------------
export async function getPeriods(): Promise<AllowancePeriod[]> {
  const raw = await AsyncStorage.getItem(KEYS.PERIODS);
  return raw ? JSON.parse(raw) : [];
}
export async function savePeriods(periods: AllowancePeriod[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.PERIODS, JSON.stringify(periods));
}
export async function getActivePeriod(): Promise<AllowancePeriod | null> {
  const periods = await getPeriods();
  return periods.find(p => p.isActive) ?? null;
}

// -- Expenses -----------------------------------------------------------------
export async function getExpenses(): Promise<Expense[]> {
  const raw = await AsyncStorage.getItem(KEYS.EXPENSES);
  return raw ? JSON.parse(raw) : [];
}
export async function saveExpenses(expenses: Expense[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
}
export async function getExpensesForPeriod(periodId: string): Promise<Expense[]> {
  const all = await getExpenses();
  return all.filter(e => e.periodId === periodId);
}
export async function addExpense(expense: Expense): Promise<void> {
  const all = await getExpenses();
  await saveExpenses([...all, expense]);
}
export async function updateExpense(updated: Expense): Promise<void> {
  const all = await getExpenses();
  await saveExpenses(all.map(e => e.id === updated.id ? updated : e));
}
export async function deleteExpense(id: string): Promise<void> {
  const all = await getExpenses();
  await saveExpenses(all.filter(e => e.id !== id));
}

// -- Goals --------------------------------------------------------------------
export async function getGoals(): Promise<SavingsGoal[]> {
  const raw = await AsyncStorage.getItem(KEYS.GOALS);
  return raw ? JSON.parse(raw) : [];
}
export async function saveGoals(goals: SavingsGoal[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
}
export async function addGoal(goal: SavingsGoal): Promise<void> {
  const all = await getGoals();
  await saveGoals([...all, goal]);
}
export async function updateGoal(updated: SavingsGoal): Promise<void> {
  const all = await getGoals();
  await saveGoals(all.map(g => g.id === updated.id ? updated : g));
}
export async function deleteGoal(id: string): Promise<void> {
  const all = await getGoals();
  await saveGoals(all.filter(g => g.id !== id));
}

// -- Settings -----------------------------------------------------------------
export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
}
export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
}

// -- Reset --------------------------------------------------------------------
export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
