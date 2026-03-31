import { Language } from '../types';

const translations = {
  // ── Common ──
  save: { fil: 'I-save', en: 'Save' },
  cancel: { fil: 'Hindi', en: 'Cancel' },
  delete: { fil: 'I-delete', en: 'Delete' },
  error: { fil: 'Error', en: 'Error' },
  loading: { fil: 'Loading...', en: 'Loading...' },
  ok: { fil: 'OK', en: 'OK' },

  // ── Onboarding ──
  welcomeTagline: {
    fil: 'Alam mo ba kung kaya ng baon mo hanggang Friday?',
    en: 'Do you know if your allowance can last until Friday?',
  },
  getStarted: { fil: 'Magsimula na', en: 'Get Started' },
  howMuchAllowance: { fil: 'Magkano ang baon mo?', en: 'How much is your allowance?' },
  next: { fil: 'Susunod', en: 'Next' },
  whenReload: {
    fil: 'Kailan mag-rereload ang baon mo?',
    en: 'When does your allowance reload?',
  },
  weekly: { fil: 'Linggu-linggo', en: 'Weekly' },
  biweekly: { fil: 'Tuwing 2 Linggo', en: 'Every 2 Weeks' },
  monthly: { fil: 'Buwanan', en: 'Monthly' },
  letsStart: { fil: 'Simulan na!', en: "Let's Start!" },

  // ── Home ──
  daysLeft: { fil: 'araw na lang', en: 'days left' },
  dayLeft: { fil: 'araw na lang', en: 'day left' },
  safeToSpend: { fil: 'Safe to spend:', en: 'Safe to spend:' },
  perDay: { fil: '/araw', en: '/day' },
  onTrack: { fil: 'On track ✓', en: 'On track ✓' },
  beCareful: { fil: 'Mag-ingat na ⚠️', en: 'Be careful ⚠️' },
  overBudget: { fil: 'Sobra na! ❌', en: 'Over budget! ❌' },
  overspendWarning: {
    fil: 'Sobra na ang gastos mo ngayon!',
    en: 'You have exceeded your budget!',
  },
  overBudgetBy: { fil: 'over budget.', en: 'over budget.' },
  streakLabel: { fil: '-day streak — on budget!', en: '-day streak — on budget!' },
  todayExpenses: { fil: 'Gastos Ngayon', en: "Today's Expenses" },
  noExpensesToday: {
    fil: 'Wala pang gastos ngayon. I-add na!',
    en: 'No expenses today. Add one!',
  },
  noActivePeriod: {
    fil: 'Walang active na baon period',
    en: 'No active allowance period',
  },
  setupAllowance: { fil: 'I-setup ang baon mo', en: 'Set up your allowance' },
  periodExpired: {
    fil: 'Tapos na ang period mo. Mag-reset na!',
    en: 'Your period has ended. Reset now!',
  },
  shareError: {
    fil: 'Hindi ma-share ang summary.',
    en: 'Could not share the summary.',
  },

  // ── Add Expense ──
  categoryLabel: { fil: 'Kategorya', en: 'Category' },
  noteLabel: { fil: 'Note', en: 'Note' },
  dateLabel: { fil: 'Petsa:', en: 'Date:' },
  confirmDeleteTitle: { fil: 'I-delete?', en: 'Delete?' },
  whatIsThis: { fil: 'Ano ito? (optional)', en: 'What is this? (optional)' },
  saveExpense: { fil: 'I-save', en: 'Save' },
  saveChanges: { fil: 'I-save ang Pagbabago', en: 'Save Changes' },
  deleteExpense: { fil: 'I-delete', en: 'Delete' },
  confirmDelete: {
    fil: 'Sigurado ka bang gusto mong i-delete ito?',
    en: 'Are you sure you want to delete this?',
  },
  savingError: {
    fil: 'Hindi mai-save. Subukan ulit.',
    en: 'Could not save. Try again.',
  },
  noActivePeriodError: {
    fil: 'Walang active na period. I-setup muna ang baon mo.',
    en: 'No active period. Set up your allowance first.',
  },

  // ── History ──
  history: { fil: 'History', en: 'History' },
  noHistory: { fil: 'Wala pang history.', en: 'No history yet.' },
  noExpensesInPeriod: {
    fil: 'Wala pang gastos sa panahon na ito.',
    en: 'No expenses in this period.',
  },
  current: { fil: '(Kasalukuyan)', en: '(Current)' },
  budget: { fil: 'Budget', en: 'Budget' },
  spent: { fil: 'Nagastos', en: 'Spent' },
  used: { fil: '% Used', en: '% Used' },
  loadError: {
    fil: 'Hindi ma-load ang expenses.',
    en: 'Could not load expenses.',
  },

  // ── Analytics ──
  unlockAnalytics: { fil: 'I-unlock ang Analytics', en: 'Unlock Analytics' },
  watchVideo: {
    fil: 'Manood ng video para makita ngayon',
    en: 'Watch a video to unlock now',
  },
  upgradeToPro: {
    fil: 'Mag-upgrade sa Pro — ₱25/buwan',
    en: 'Upgrade to Pro — ₱25/month',
  },
  spendingByCategory: { fil: 'Gastos per Category', en: 'Spending by Category' },
  dailyTrend: { fil: 'Daily Spending Trend', en: 'Daily Spending Trend' },
  insights: { fil: 'Insights', en: 'Insights' },
  topCategoryInsight: {
    fil: 'Ang pinakamalaking gastos mo ay',
    en: 'Your biggest expense is',
  },
  ofBudget: { fil: 'ng baon mo', en: 'of your budget' },
  lowestSpending: { fil: 'Pinakamababang gastos', en: 'Lowest spending' },
  highestSpending: { fil: 'Pinakamataas na gastos', en: 'Highest spending' },
  noExpensesAnalyze: {
    fil: 'Wala pang gastos para i-analyze.',
    en: 'No expenses to analyze yet.',
  },

  // ── Goals ──
  goals: { fil: 'Mga Goal', en: 'Goals' },
  noGoals: {
    fil: 'Walang goal pa. Mag-ipon na!',
    en: 'No goals yet. Start saving!',
  },
  moreNeeded: { fil: 'pa kailangan', en: 'more needed' },
  addAmount: { fil: 'Magdagdag ng ₱', en: 'Add ₱' },
  contribute: { fil: 'I-dagdag', en: 'Add' },
  goalComplete: {
    fil: 'Nakamit mo na ang iyong goal!',
    en: 'You reached your goal!',
  },
  goalCompleteSub: { fil: 'natapos na!', en: 'completed!' },
  completed: { fil: 'Natapos na', en: 'Completed' },
  newGoal: { fil: 'Bagong Goal', en: 'New Goal' },
  goalName: { fil: 'Pangalan ng goal mo', en: 'Goal name' },
  targetAmount: { fil: 'Target na halaga', en: 'Target amount' },
  saveGoal: { fil: 'I-save ang Goal', en: 'Save Goal' },
  contributeError: {
    fil: 'Hindi mai-save. Subukan ulit.',
    en: 'Could not save. Try again.',
  },

  // ── Settings ──
  settings: { fil: 'Settings', en: 'Settings' },
  baon: { fil: 'BAON', en: 'ALLOWANCE' },
  noPeriod: { fil: 'Walang active na period.', en: 'No active period.' },
  edit: { fil: 'I-edit', en: 'Edit' },
  resetPeriod: { fil: 'I-reset ang period', en: 'Reset period' },
  editAmount: { fil: 'Halaga ng baon', en: 'Allowance amount' },
  frequency: { fil: 'Frequency', en: 'Frequency' },
  notifications: { fil: 'NOTIFICATIONS', en: 'NOTIFICATIONS' },
  dailyReminder: { fil: 'Daily reminder', en: 'Daily reminder' },
  overspendAlert: { fil: 'Overspend alert', en: 'Overspend alert' },
  resetReminder: { fil: 'Reset reminder', en: 'Reset reminder' },
  appearance: { fil: 'HITSURA', en: 'APPEARANCE' },
  darkMode: { fil: 'Dark mode', en: 'Dark mode' },
  currency: { fil: 'Currency', en: 'Currency' },
  language: { fil: 'Wika', en: 'Language' },
  filipino: { fil: 'Filipino', en: 'Filipino' },
  english: { fil: 'English', en: 'English' },
  pro: { fil: 'PRO', en: 'PRO' },
  upgradeProButton: {
    fil: 'Mag-upgrade sa Pro — ₱25/buwan',
    en: 'Upgrade to Pro — ₱25/month',
  },
  removeAds: { fil: 'Alisin ang ads', en: 'Remove ads' },
  data: { fil: 'DATA', en: 'DATA' },
  exportData: { fil: 'I-export ang data (PDF)', en: 'Export data (PDF)' },
  clearAllData: { fil: 'I-clear ang lahat ng data', en: 'Clear all data' },
  clearConfirmTitle: {
    fil: 'I-clear ang lahat ng data?',
    en: 'Clear all data?',
  },
  clearConfirmMsg: {
    fil: 'Sigurado ka ba? Mababura ang lahat ng data. Hindi na ito maibabalik.',
    en: 'Are you sure? All data will be deleted. This cannot be undone.',
  },
  clearButton: { fil: 'I-clear', en: 'Clear' },
  noDataExport: {
    fil: 'Wala pang expenses na i-export.',
    en: 'No expenses to export.',
  },
  exportError: {
    fil: 'Hindi ma-export ang data.',
    en: 'Could not export data.',
  },
  about: { fil: 'TUNGKOL', en: 'ABOUT' },
  version: { fil: 'Version', en: 'Version' },
  privacyPolicy: { fil: 'Privacy Policy', en: 'Privacy Policy' },
  rateApp: { fil: 'I-rate ang Baon Buddy', en: 'Rate Baon Buddy' },
  settingSaveError: {
    fil: 'Hindi mai-save ang setting.',
    en: 'Could not save setting.',
  },
  reminderError: {
    fil: 'Hindi ma-update ang reminder.',
    en: 'Could not update reminder.',
  },
  themeError: {
    fil: 'Hindi ma-update ang theme.',
    en: 'Could not update theme.',
  },
  editSaveError: {
    fil: 'Hindi mai-save ang pagbabago.',
    en: 'Could not save changes.',
  },
  invalidAmount: {
    fil: 'Maglagay ng tamang halaga.',
    en: 'Enter a valid amount.',
  },

  // ── Upgrade ──
  baonBuddyPro: { fil: 'Baon Buddy Pro', en: 'Baon Buddy Pro' },
  noAds: { fil: 'Walang ads', en: 'No ads' },
  spendingCharts: { fil: 'Spending breakdown charts', en: 'Spending breakdown charts' },
  weeklyInsights: { fil: 'Weekly insights', en: 'Weekly insights' },
  unlimitedGoals: { fil: 'Savings goals (unlimited)', en: 'Savings goals (unlimited)' },
  shareableSummary: { fil: 'Shareable weekly summary', en: 'Shareable weekly summary' },
  pdfExport: { fil: 'PDF export', en: 'PDF export' },
  perMonth: { fil: '/ buwan', en: '/ month' },
  freeTrial: { fil: '14-day free trial', en: '14-day free trial' },
  tryFree: {
    fil: 'Subukan nang Libre — 14 Araw',
    en: 'Try Free — 14 Days',
  },
  restorePurchase: {
    fil: 'I-restore ang purchase',
    en: 'Restore purchase',
  },
  cancelAnytime: {
    fil: 'Cancel anytime. Billing managed by Google Play.',
    en: 'Cancel anytime. Billing managed by Google Play.',
  },
  proActive: { fil: 'Pro aktibo ✓', en: 'Pro active ✓' },
  proThankYou: {
    fil: 'Salamat sa pag-support! Enjoy ang Baon Buddy Pro.',
    en: 'Thanks for your support! Enjoy Baon Buddy Pro.',
  },
  purchaseSuccess: { fil: 'Pro na ikaw! 🎉', en: "You're Pro now! 🎉" },
  purchaseSuccessSub: {
    fil: 'Salamat sa pag-subscribe!',
    en: 'Thanks for subscribing!',
  },
  purchaseFail: {
    fil: 'Hindi matuloy ang pagbili',
    en: 'Purchase could not be completed',
  },
  purchaseFailSub: {
    fil: 'Subukan ulit mamaya.',
    en: 'Please try again later.',
  },
  restoreSuccess: { fil: 'Na-restore na!', en: 'Restored!' },
  restoreSuccessSub: {
    fil: 'Pro na ulit ikaw! 🎉',
    en: "You're Pro again! 🎉",
  },
  restoreFail: {
    fil: 'Walang nakitang purchase',
    en: 'No purchase found',
  },
  restoreFailSub: {
    fil: 'Wala kaming nakitang Pro subscription sa account mo.',
    en: 'We could not find a Pro subscription on your account.',
  },

  // ── Share Summary ──
  totalSpent: { fil: 'Kabuuang gastos', en: 'Total spent' },
  breakdown: { fil: 'Breakdown', en: 'Breakdown' },
  savedSoFar: { fil: 'Natipid so far:', en: 'Saved so far:' },
  overBy: { fil: 'Sobra:', en: 'Over:' },
  dayOf: { fil: 'Day', en: 'Day' },
  of: { fil: 'of', en: 'of' },
  allDaysOnBudget: {
    fil: (n: number) => `Nasa budget ka sa lahat ng ${n} araw! ✓`,
    en: (n: number) => `On budget for all ${n} days! ✓`,
  },
  someDaysOnBudget: {
    fil: (x: number, y: number) => `Nasa budget ka ${x} sa ${y} araw`,
    en: (x: number, y: number) => `On budget ${x} out of ${y} days`,
  },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Language): string {
  const entry = translations[key];
  if (!entry) return key;
  const val = entry[lang];
  if (typeof val === 'function') return val as unknown as string;
  return val as string;
}

// For dynamic translations with functions
export function tFn(key: 'allDaysOnBudget', lang: Language): (n: number) => string;
export function tFn(key: 'someDaysOnBudget', lang: Language): (x: number, y: number) => string;
export function tFn(key: string, lang: Language): (...args: number[]) => string {
  const entry = (translations as any)[key];
  if (!entry) return () => key;
  return entry[lang];
}

export default translations;
