# CLAUDE.md — Baon Buddy
## Complete Build Instructions for Claude Code

---

## WHAT THIS FILE IS

This is the single source of truth for building **Baon Buddy** — a React Native Expo app for Filipino students to track their allowance (baon). Read this entire file before writing any code. Follow every section in order. Do not skip steps.

---

## PROJECT SUMMARY

| Field | Value |
|---|---|
| App name | Baon Buddy |
| Platform | Android (Google Play), iOS later |
| Framework | React Native + Expo (managed workflow) |
| Language | TypeScript |
| Local storage | AsyncStorage |
| Billing | RevenueCat |
| Ads | Google AdMob |
| Navigation | React Navigation v6 |
| Charts | Victory Native |
| Notifications | Expo Notifications |
| Sharing | react-native-view-shot + Expo Sharing |
| PDF export | expo-print + Expo Sharing |

---

## MONETIZATION MODEL

- **Free tier** — all features fully unlocked, ads shown
  - Banner ad at the bottom of the home screen
  - Rewarded video ad: user watches voluntarily to unlock charts for the day
  - Interstitial ad: shown max once per session when navigating to History
- **Pro tier — ₱25/month** — exact same features, zero ads
  - RevenueCat handles subscription billing
  - On app launch, check RevenueCat subscription status
  - If subscribed → hide all AdMob units
  - If not subscribed → show AdMob normally
- **No locked features** — paying only removes ads

---

## TECH STACK — EXACT PACKAGES

Install these exact packages. Do not substitute alternatives.

```bash
# Initialize project
npx create-expo-app BaonBuddy --template blank-typescript
cd BaonBuddy

# Navigation
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# Storage
npx expo install @react-native-async-storage/async-storage

# Ads
npx expo install react-native-google-mobile-ads

# Billing
npm install react-native-purchases

# Charts
npm install victory-native react-native-svg

# Notifications
npx expo install expo-notifications expo-device

# Sharing & PDF
npx expo install react-native-view-shot expo-sharing expo-print

# Date utilities
npm install date-fns

# Icons
npx expo install @expo/vector-icons
```

---

## FOLDER STRUCTURE

Create this exact folder structure before writing any component:

```
BaonBuddy/
├── CLAUDE.md                    ← this file
├── app.json
├── App.tsx                      ← entry point, navigation setup
├── src/
│   ├── constants/
│   │   ├── colors.ts            ← all color values
│   │   ├── categories.ts        ← expense category definitions
│   │   └── admob.ts             ← AdMob unit IDs
│   ├── types/
│   │   └── index.ts             ← all TypeScript interfaces
│   ├── storage/
│   │   └── storage.ts           ← all AsyncStorage read/write functions
│   ├── hooks/
│   │   ├── useAllowance.ts      ← allowance period state and logic
│   │   ├── useExpenses.ts       ← expense list state and logic
│   │   ├── usePro.ts            ← RevenueCat subscription status
│   │   └── useNotifications.ts  ← notification scheduling
│   ├── utils/
│   │   ├── budget.ts            ← budget calculations
│   │   └── shareReport.ts       ← shareable summary image generator
│   └── screens/
│       ├── Onboarding/
│       │   ├── WelcomeScreen.tsx
│       │   ├── SetAllowanceScreen.tsx
│       │   └── SetResetDateScreen.tsx
│       ├── Home/
│       │   └── HomeScreen.tsx
│       ├── AddExpense/
│       │   └── AddExpenseScreen.tsx
│       ├── History/
│       │   └── HistoryScreen.tsx
│       ├── Analytics/
│       │   └── AnalyticsScreen.tsx
│       ├── Goals/
│       │   ├── GoalsScreen.tsx
│       │   └── AddGoalScreen.tsx
│       ├── Settings/
│       │   └── SettingsScreen.tsx
│       ├── Upgrade/
│       │   └── UpgradeScreen.tsx
│       └── Shared/
│           ├── EmptyState.tsx
│           └── LoadingScreen.tsx
```

---

## TYPESCRIPT INTERFACES

Create `src/types/index.ts` with these exact interfaces. All data in the app uses these types.

```typescript
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
```

---

## COLORS

Create `src/constants/colors.ts`:

```typescript
// src/constants/colors.ts

export const Colors = {
  // Primary brand
  purple: '#534AB7',
  purpleLight: '#EEEDFE',
  purpleDark: '#3C3489',

  // Meter states
  meterGreen: '#1D9E75',
  meterGreenBg: '#E1F5EE',
  meterYellow: '#EF9F27',
  meterYellowBg: '#FAEEDA',
  meterRed: '#E24B4A',
  meterRedBg: '#FCEBEB',

  // Neutrals
  dark: '#2C2C2A',
  gray: '#888780',
  grayLight: '#F1EFE8',
  border: '#D3D1C7',
  white: '#FFFFFF',

  // Category colors
  pagkain:   '#E24B4A',  // red
  pamasahe:  '#378ADD',  // blue
  supplies:  '#EF9F27',  // amber
  load:      '#1D9E75',  // teal
  libre:     '#D4537E',  // pink
  iba_pa:    '#888780',  // gray
};

export const DarkColors = {
  background: '#1A1A18',
  surface: '#2C2C2A',
  border: '#444441',
  text: '#F1EFE8',
  textSecondary: '#B4B2A9',
};
```

---

## CATEGORIES

Create `src/constants/categories.ts`:

```typescript
// src/constants/categories.ts
import { ExpenseCategory } from '../types';

export interface CategoryDef {
  key: ExpenseCategory;
  label: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: CategoryDef[] = [
  { key: 'pagkain',  label: 'Pagkain',   emoji: '🍚', color: '#E24B4A' },
  { key: 'pamasahe', label: 'Pamasahe',  emoji: '🚌', color: '#378ADD' },
  { key: 'supplies', label: 'Supplies',  emoji: '📚', color: '#EF9F27' },
  { key: 'load',     label: 'Load/Data', emoji: '📱', color: '#1D9E75' },
  { key: 'libre',    label: 'Libre',     emoji: '🤝', color: '#D4537E' },
  { key: 'iba_pa',   label: 'Iba pa',    emoji: '📦', color: '#888780' },
];
```

---

## ADMOB UNIT IDs

Create `src/constants/admob.ts` with your real AdMob IDs already filled in below.

```typescript
// src/constants/admob.ts

// ✅ These are your REAL AdMob IDs — do not change them
// During development, Expo/EAS automatically serves test ads on your device
// Real ads will serve once the app is live and approved on the Play Store
export const AdMob = {
  APP_ID:          'ca-app-pub-4655832858609329~8931338572',  // used in app.json
  BANNER_ID:       'ca-app-pub-4655832858609329/2589389569',
  INTERSTITIAL_ID: 'ca-app-pub-4655832858609329/1872143618',
  REWARDED_ID:     'ca-app-pub-4655832858609329/4713726117',
};
```

---

## STORAGE LAYER

Create `src/storage/storage.ts`. All AsyncStorage operations go here. No screen should call AsyncStorage directly.

```typescript
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
  darkMode: 'auto',
  dailyReminderEnabled: true,
  dailyReminderTime: '20:00',
  overspendAlertEnabled: true,
  resetReminderEnabled: true,
  hasCompletedOnboarding: false,
  hasSeenProUpgrade: false,
};

// ── Periods ──────────────────────────────────────────────────────────────
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

// ── Expenses ─────────────────────────────────────────────────────────────
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

// ── Goals ────────────────────────────────────────────────────────────────
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

// ── Settings ─────────────────────────────────────────────────────────────
export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
}
export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
}

// ── Reset ────────────────────────────────────────────────────────────────
export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
```

---

## BUDGET CALCULATIONS

Create `src/utils/budget.ts`. All budget math goes here. Never calculate budget inline in a component.

```typescript
// src/utils/budget.ts
import { differenceInCalendarDays, isToday, parseISO } from 'date-fns';
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
  // Green  = spent ≤ 75% of budget proportionally for days elapsed
  // Yellow = spent 75–100% proportionally
  // Red    = spent over budget
  const daysElapsed = differenceInCalendarDays(today, parseISO(period.startDate));
  const totalDays = differenceInCalendarDays(endDate, parseISO(period.startDate)) + 1;
  const expectedSpentRatio = daysElapsed / totalDays;
  const actualSpentRatio = totalSpent / period.amount;
  const ratio = expectedSpentRatio > 0 ? actualSpentRatio / expectedSpentRatio : 0;

  let meterStatus: 'green' | 'yellow' | 'red';
  if (totalSpent >= period.amount) {
    meterStatus = 'red';
  } else if (ratio > 1.15) {
    meterStatus = 'yellow';
  } else {
    meterStatus = 'green';
  }

  // Streak: count consecutive days where spending ≤ dailySafeToSpend
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
```

---

## HOOKS

### usePro.ts — subscription status

```typescript
// src/hooks/usePro.ts
import { useEffect, useState } from 'react';
import Purchases from 'react-native-purchases';

const ENTITLEMENT_ID = 'pro'; // Must match your RevenueCat entitlement ID exactly

export function usePro() {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkProStatus();
  }, []);

  async function checkProStatus() {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setIsPro(customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined);
    } catch (e) {
      setIsPro(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function purchasePro() {
    try {
      const offerings = await Purchases.getOfferings();
      const monthly = offerings.current?.monthly;
      if (!monthly) throw new Error('No monthly offering found');
      await Purchases.purchasePackage(monthly);
      await checkProStatus();
      return true;
    } catch (e) {
      return false;
    }
  }

  async function restorePurchases() {
    try {
      await Purchases.restorePurchases();
      await checkProStatus();
      return true;
    } catch (e) {
      return false;
    }
  }

  return { isPro, isLoading, checkProStatus, purchasePro, restorePurchases };
}
```

---

## REVCATCAT SETUP

Add to `App.tsx` before the NavigationContainer:

```typescript
// App.tsx — add this in a useEffect at the top level
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

useEffect(() => {
  const REVENUECAT_GOOGLE_KEY = 'test_zErSzrKALOdeWQJRdVnFimSmrZL'; // ✅ Your RevenueCat API key
  Purchases.configure({ apiKey: REVENUECAT_GOOGLE_KEY });
}, []);
```

---

## ADMOB SETUP

Create an `AdBanner` component used in all free-tier screens:

```typescript
// src/components/AdBanner.tsx
import React from 'react';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { usePro } from '../hooks/usePro';
import { AdMob } from '../constants/admob';

export function AdBanner() {
  const { isPro } = usePro();
  if (isPro) return null; // ← hide all ads for Pro users
  return (
    <BannerAd
      unitId={AdMob.BANNER_ID}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: true }}
    />
  );
}
```

---

## NAVIGATION STRUCTURE

Set up `App.tsx` with this exact navigation structure:

```typescript
// App.tsx (navigation structure)

// Stack 1: Onboarding — shown only if hasCompletedOnboarding === false
// Screens: WelcomeScreen → SetAllowanceScreen → SetResetDateScreen

// Stack 2: Main App — shown after onboarding complete
// Bottom tabs:
//   Tab 1: Home (HomeScreen) — house icon
//   Tab 2: History (HistoryScreen) — list icon
//   Tab 3: Goals (GoalsScreen) — target icon
//   Tab 4: Settings (SettingsScreen) — gear icon
//
// Modal stack on top of tabs (no tab bar):
//   AddExpenseScreen — opens from floating + button on HomeScreen
//   AddGoalScreen    — opens from Goals screen
//   UpgradeScreen    — opens from Settings or paywall triggers
//   AnalyticsScreen  — opens from History tab header button
```

---

## SCREEN-BY-SCREEN BUILD INSTRUCTIONS

Build screens in this exact order. Complete each screen fully before moving to the next.

---

### SCREEN 1: WelcomeScreen

**File:** `src/screens/Onboarding/WelcomeScreen.tsx`

**What it shows:**
- App name "Baon Buddy" in large purple text
- Tagline: "Alam mo ba kung kaya ng baon mo hanggang Friday?"
- A simple illustration: coins or a peso sign (use emoji 💰 if no asset available)
- "Magsimula na" (Get Started) button in purple

**Behavior:**
- Tapping the button navigates to `SetAllowanceScreen`
- No back button — this is the first screen
- Do not show this screen if `settings.hasCompletedOnboarding === true`

---

### SCREEN 2: SetAllowanceScreen

**File:** `src/screens/Onboarding/SetAllowanceScreen.tsx`

**What it shows:**
- Title: "Magkano ang baon mo?"
- Large number input for allowance amount (numeric keyboard)
- Currency prefix showing ₱ (from settings.currency)
- "Susunod" (Next) button — disabled until amount > 0

**Behavior:**
- Amount must be a positive number greater than 0
- Store the value in component state, pass to next screen via navigation params
- Tapping Next navigates to `SetResetDateScreen` with the amount as a param

---

### SCREEN 3: SetResetDateScreen

**File:** `src/screens/Onboarding/SetResetDateScreen.tsx`

**What it shows:**
- Title: "Kailan mag-rereload ang baon mo?"
- Three option cards to select frequency:
  - "Linggu-linggo" (Weekly)
  - "Tuwing 2 Linggo" (Every 2 Weeks)
  - "Buwanan" (Monthly)
- Selected card is highlighted in purple
- "Simulan na!" (Let's Start!) button

**Behavior:**
- On tap "Simulan na!":
  1. Generate a UUID for the new period
  2. Calculate startDate = today, endDate based on frequency using `getNextPeriodDates()`
  3. Create `AllowancePeriod` object with `isActive: true`
  4. Save to storage via `savePeriods([newPeriod])`
  5. Save settings: `hasCompletedOnboarding: true`
  6. Schedule notifications (daily reminder, reset reminder)
  7. Navigate to HomeScreen and clear the onboarding stack

---

### SCREEN 4: HomeScreen ⭐ (most important screen)

**File:** `src/screens/Home/HomeScreen.tsx`

**What it shows (top to bottom):**

1. **Header row** — property name left, settings icon right
2. **Period label** — "Jan 1 – Jan 7" in small gray text
3. **Remaining balance** — huge number: "₱ 342.50" in black or white (dark mode)
4. **Days left** — "5 days left" in gray below the balance
5. **"Will I make it?" meter** — full-width colored progress bar
   - Green background + green fill when meterStatus = 'green'
   - Amber background + amber fill when meterStatus = 'yellow'
   - Red background + red fill when meterStatus = 'red'
   - Fill width = (totalSpent / totalBudget) * 100%
   - Label inside or below: "On track ✓" / "Mag-ingat na ⚠️" / "Sobra na! ❌"
6. **Daily safe-to-spend** — "Safe to spend: ₱87.00/day" in a small card
7. **Overspend warning banner** — red banner shown ONLY when `isOverspending === true`
   - Text: "Sobra na ang gastos mo ngayon! ₱[overspent amount] over budget."
8. **Budget streak** — "🔥 3-day streak — on budget!" shown when streak > 0
9. **Today's expenses list** — scrollable list of today's expenses
   - Each row: category emoji + category name, amount right-aligned, note in gray below
   - Swipe left to delete (with confirmation)
   - Tap to edit (opens AddExpenseScreen in edit mode)
   - Empty state: "Wala pang gastos ngayon. I-add na!" with a + icon
10. **Floating + button** — bottom right corner, purple, always visible
    - Taps opens `AddExpenseScreen`
11. **AdBanner** — bottom of screen (hidden for Pro users automatically)

**Behavior:**
- On mount: load active period and its expenses from storage
- Calculate `BudgetStatus` using `calculateBudgetStatus()`
- If no active period exists → show a card prompting to set up allowance → navigate to SetAllowanceScreen
- If active period's endDate has passed → show a "Reset Period" banner with a button to start a new period
- Refresh data every time the screen comes into focus (use `useFocusEffect`)

---

### SCREEN 5: AddExpenseScreen

**File:** `src/screens/AddExpense/AddExpenseScreen.tsx`

**What it shows:**
- Amount input at top — large, auto-focused, numeric keyboard, ₱ prefix
- Category grid — 2 columns × 3 rows, each category as a card with emoji and label
- Selected category highlighted in that category's color
- Note input — single line text, placeholder "Ano ito? (optional)"
- Date picker — defaults to today, can be changed (allows backdating within current period)
- "I-save" (Save) button — disabled until amount > 0 and category is selected
- If in edit mode: show "I-save ang Pagbabago" button + "I-delete" button in red

**Behavior (add mode):**
1. Validate: amount > 0 and category selected
2. Create `Expense` object with new UUID, current periodId, amount, category, note, date
3. Call `addExpense(expense)`
4. If `isOverspending` after adding → trigger overspend push notification
5. Navigate back to HomeScreen
6. HomeScreen refreshes automatically via `useFocusEffect`

**Behavior (edit mode):**
- Receives existing `Expense` via navigation params
- Pre-fills all fields
- Save calls `updateExpense()`
- Delete calls `deleteExpense()` with a confirmation alert

---

### SCREEN 6: HistoryScreen

**File:** `src/screens/History/HistoryScreen.tsx`

**What it shows:**
- Period selector at top — left/right arrows to navigate between past periods
- Current period label: "Jan 1 – Jan 7 (Current)" or "Dec 25 – Dec 31"
- Period summary card: total spent, total budget, % used
- Expenses grouped by date — each date is a section header
- Each expense row: emoji + category, amount, note, date
- Tap expense to edit (opens AddExpenseScreen in edit mode)
- Header right button: chart icon → opens AnalyticsScreen
- **Interstitial ad shown once per session** when user first navigates to this screen (free tier only)
  - Use a session flag `interstitialShownThisSession` (in-memory, resets on app restart)
  - Do NOT show interstitial on subsequent visits to History in the same session

**Empty state:** "Wala pang gastos sa panahon na ito." with a small illustration

---

### SCREEN 7: AnalyticsScreen

**File:** `src/screens/Analytics/AnalyticsScreen.tsx`

**What it shows:**
1. **Spending by category** — pie chart using Victory Native
   - Each slice is the category's color
   - Legend below with category name and ₱ amount
2. **Daily spending trend** — line chart using Victory Native
   - X axis = days of the period
   - Y axis = amount spent
3. **Insights text** — auto-generated:
   - "Ang pinakamalaking gastos mo ay [category] na ₱[amount] ([percent]% ng baon mo)."
   - "Ang pinaka-mahal mong araw ay [day name]."
4. **Best day** — day with lowest spending, shown in green
5. **Worst day** — day with highest spending, shown in red

**Behavior for free users:**
- Charts are shown blurred (use `style={{ opacity: 0.15 }}` + overlay)
- Overlay shows: "I-unlock ang Analytics"
- Two options:
  - "Manood ng video para makita ngayon" → show rewarded ad → on reward earned, set `rewardedUnlockDate = today` in state → show charts for rest of session
  - "Mag-upgrade sa Pro — ₱25/buwan" → navigate to UpgradeScreen
- If `isPro === true` → show charts directly with no blur

---

### SCREEN 8: GoalsScreen

**File:** `src/screens/Goals/GoalsScreen.tsx`

**What it shows:**
- List of active savings goals
- Each goal card:
  - Goal name (e.g., "Nike shoes")
  - Progress bar — fill = savedAmount / targetAmount
  - "₱[saved] / ₱[target]" label
  - "₱[remaining] pa kailangan" below
  - "Add ₱" button to contribute
- Completed goals section (collapsed by default, tap to expand)
- "+ New Goal" button at bottom
- Empty state: "Walang goal pa. Mag-ipon na!" with a piggy bank emoji

**Behavior:**
- Tapping "Add ₱" shows a small modal/bottom sheet with a number input
- Contribution deducted from current period balance? No — savings goals are separate from the budget. They are aspirational targets, not expense tracking.
- When `savedAmount >= targetAmount`: mark as completed, show celebration message "🎉 Nakamit mo na ang iyong goal!", trigger a push notification

---

### SCREEN 9: AddGoalScreen

**File:** `src/screens/Goals/AddGoalScreen.tsx`

**What it shows:**
- Goal name input: "Pangalan ng goal mo" (e.g., "Bag", "Phone")
- Target amount input: ₱ prefix, numeric keyboard
- "I-save ang Goal" button — disabled until both fields filled

**Behavior:**
- Creates a new `SavingsGoal` with UUID, name, targetAmount, savedAmount = 0
- Saves via `addGoal()`
- Navigates back to GoalsScreen

---

### SCREEN 10: SettingsScreen

**File:** `src/screens/Settings/SettingsScreen.tsx`

**Sections:**

**Allowance**
- Current period: "Jan 1 – Jan 7 (Weekly, ₱500)" — tap to edit
- Reset period now: button to start a new period early (confirmation prompt)

**Notifications**
- Daily reminder toggle + time picker (shown when toggle is on)
- Overspend alert toggle
- Reset reminder toggle

**Appearance**
- Dark mode: Auto / Light / Dark (segmented control)
- Currency: text input (default ₱)

**Pro**
- If free: "Mag-upgrade sa Pro — ₱25/buwan — Alisin ang ads" button → UpgradeScreen
- If Pro: "Pro aktibo ✓" badge + "I-manage ang subscription" link to Play Store subscriptions
- "I-restore ang purchase" button (calls `restorePurchases()`)

**Data**
- "I-export ang data" — exports all expenses as CSV via Expo Sharing
- "I-clear ang lahat ng data" — confirmation alert (destructive) then `clearAllData()`

**About**
- Version number (from `expo-constants`)
- Privacy policy link (opens in browser)
- Rate Baon Buddy (opens Play Store listing)

---

### SCREEN 11: UpgradeScreen

**File:** `src/screens/Upgrade/UpgradeScreen.tsx`

**What it shows:**
- "Baon Buddy Pro" heading
- Benefit list with checkmarks:
  - ✓ Walang ads
  - ✓ Spending breakdown charts
  - ✓ Weekly insights
  - ✓ Savings goals (unlimited)
  - ✓ Shareable weekly summary
  - ✓ PDF export
- Pricing: "₱25 / buwan" in large text
- "14-day free trial" label below price
- "Subukan nang Libre — 14 Araw" (Try Free — 14 Days) button in purple
- "I-restore ang purchase" link below button
- Fine print: "Cancel anytime. Billing managed by Google Play."

**Behavior:**
- Tapping the trial button calls `purchasePro()` from `usePro()`
- On success: show "Pro na ikaw! 🎉" alert, close screen, hide all ads
- On failure: show error alert "Hindi matuloy ang pagbili. Subukan ulit."

---

### SCREEN 12: Shareable Weekly Summary (component, not a full screen)

**File:** `src/utils/shareReport.ts` + `src/screens/Home/ShareSummaryView.tsx`

**What the shareable image shows:**
- Property name "Baon Buddy" header
- Period: "Jan 1 – Jan 7"
- Total spent: ₱[amount]
- Breakdown by category with color bars
- Days on budget: [n] / [total days]
- Footer: "Made with Baon Buddy"

**How to generate:**
1. Render `ShareSummaryView` off-screen using a `ref`
2. Use `react-native-view-shot` to capture it as a base64 PNG
3. Use `expo-sharing` to share the image

---

## ALLOWANCE RESET FLOW

When the user resets to a new period (either via Settings or auto-detected expired period):

1. Show a summary of the ending period:
   - "Panahon na lumipas: Jan 1 – Jan 7"
   - "Kabuuang gastos: ₱[amount]"
   - "Natipid mo: ₱[saved] 🎉" (or "Sobra ka ng ₱[amount] ❌")
2. Prompt: "Magsimula ng bagong panahon?"
3. On confirm:
   - Set all existing `AllowancePeriod.isActive = false`
   - Create new `AllowancePeriod` with same amount and frequency, starting today
   - Reschedule reset reminder notification for new end date

---

## NOTIFICATIONS

Set up in `src/hooks/useNotifications.ts`:

```typescript
// Notification types to schedule:

// 1. Daily reminder — scheduled daily at user's preferred time
//    Title: "Baon Buddy"
//    Body:  "Huwag kalimutang i-log ang gastos mo ngayon! 📝"
//    Trigger: daily at settings.dailyReminderTime

// 2. Overspend alert — triggered immediately after logging an expense that exceeds budget
//    Title: "Sobra na ang gastos! ⚠️"
//    Body:  "₱[amount] na ang gastos mo ngayon. Mag-ingat na."
//    Trigger: immediate

// 3. Reset reminder — scheduled for the day before period ends
//    Title: "Baon Buddy"
//    Body:  "Bukas na ang huling araw ng iyong baon period. Handa ka na bang mag-reset?"
//    Trigger: date-based, one day before period.endDate at 9:00 AM

// 4. Streak milestone — triggered when streak reaches 3, 7, 14, 30 days
//    Title: "🔥 [N]-day streak!"
//    Body:  "[N] araw ka nang nasa budget. Galing mo!"
//    Trigger: immediate after calculating streak

// Always request notification permissions on first launch
// Use expo-notifications: Notifications.requestPermissionsAsync()
// Check permission before scheduling any notification
```

---

## APP.JSON CONFIGURATION

Update `app.json` with these fields:

```json
{
  "expo": {
    "name": "Baon Buddy",
    "slug": "baon-buddy",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#534AB7"
    },
    "android": {
      "package": "com.baonbuddy.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#534AB7"
      },
      "permissions": [
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
        "android.permission.POST_NOTIFICATIONS"
      ]
    },
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-4655832858609329~8931338572"
        }
      ],
      "expo-notifications"
    ]
  }
}
```

---

## BUILD ORDER — FOLLOW THIS EXACTLY

Complete each phase fully before starting the next. Test on a real Android device or emulator after each phase.

### Phase 1 — Core MVP (Week 1–2)
- [ ] Project setup: `npx create-expo-app` + install all packages
- [ ] Create folder structure exactly as specified
- [ ] Create all files in `src/types/`, `src/constants/`, `src/storage/`, `src/utils/`
- [ ] Build WelcomeScreen
- [ ] Build SetAllowanceScreen
- [ ] Build SetResetDateScreen (creates first AllowancePeriod in storage)
- [ ] Build HomeScreen — meter, balance, days left, today's expenses, floating + button
- [ ] Build AddExpenseScreen — add mode only
- [ ] Test: complete onboarding → add 5 expenses → see meter update → restart app → data persists
- [ ] Set up App.tsx navigation (onboarding stack + main stack)

### Phase 2 — Full Free Features (Week 3–4)
- [ ] AddExpenseScreen — edit mode + delete
- [ ] HistoryScreen — period selector, grouped expense list, interstitial ad (once per session)
- [ ] GoalsScreen + AddGoalScreen
- [ ] SettingsScreen — all sections except Pro billing
- [ ] Allowance reset flow
- [ ] Set up Expo Notifications — daily reminder, reset reminder
- [ ] Dark mode — implement DarkColors, wire to settings.darkMode
- [ ] AdBanner component — place on HomeScreen bottom
- [ ] Test all screens on real device in both light and dark mode

### Phase 3 — Pro Features + Billing (Week 5–6)
- [ ] Set up RevenueCat account + create ₱25/month product in Google Play Console
- [ ] Wire `usePro` hook to real RevenueCat API key
- [ ] UpgradeScreen — purchase flow, restore purchases
- [ ] AnalyticsScreen — Victory Native charts, rewarded ad paywall for free users
- [ ] Shareable weekly summary — react-native-view-shot capture + expo-sharing
- [ ] PDF export — expo-print monthly report
- [ ] Wire AdBanner to hide for Pro users (`isPro` check)
- [ ] Wire rewarded ad to AnalyticsScreen unlock
- [ ] Wire interstitial ad to HistoryScreen (once per session)
- [ ] Overspend push notification after expense logging
- [ ] Test full purchase flow end-to-end in sandbox mode

### Phase 4 — Polish + Launch (Week 7–8)
- [ ] Empty states: HomeScreen no expenses, GoalsScreen no goals, HistoryScreen no history
- [ ] Error handling: wrap all storage calls in try/catch, show user-friendly error messages
- [ ] In-app review prompt — trigger after user hits 7-day streak (use `expo-store-review`)
- [ ] App icon: 1024×1024 PNG (purple background, coin or peso symbol)
- [ ] Splash screen: purple background, app name centered
- [ ] Adaptive icon for Android
- [ ] Run `eas build --platform android --profile preview` to generate APK
- [ ] Test APK on 3 different real Android devices
- [ ] Submit to Google Play internal testing track
- [ ] Beta test with 5–10 real students
- [ ] Fix all bugs from beta

---

## COMMON BUGS TO WATCH FOR

| Bug | How to prevent |
|---|---|
| Data not persisting after restart | Always use `await` on all AsyncStorage calls. Never fire-and-forget. |
| Meter not updating after adding expense | Use `useFocusEffect` on HomeScreen to reload expenses every time screen is focused |
| Negative remaining balance displayed | Use `Math.max(0, remaining)` in budget calculations |
| Ads showing for Pro users | Always check `isPro` before rendering AdBanner. Check is async — show nothing while loading. |
| RevenueCat entitlement ID mismatch | The string `'pro'` in `usePro.ts` must exactly match the entitlement ID in RevenueCat dashboard |
| Notification not firing | Check `Notifications.requestPermissionsAsync()` returns `granted` before scheduling |
| Victory Native chart crash | Wrap chart components in try/catch. Supply fallback empty state if data array is empty |
| Period not resetting correctly | When creating new period, always set `isActive: false` on ALL existing periods first |
| TypeScript errors on date strings | Always use `.toISOString().split('T')[0]` to get YYYY-MM-DD strings. Never use `.toLocaleDateString()` |

---

## KEYS AND IDs — ALREADY FILLED IN

All API keys and IDs are already set in this file. Here is a reference of what was added and where each one lives:

```
AdMob App ID:          ca-app-pub-4655832858609329~8931338572  → app.json (android plugin)
AdMob Banner ID:       ca-app-pub-4655832858609329/2589389569  → src/constants/admob.ts
AdMob Interstitial ID: ca-app-pub-4655832858609329/1872143618  → src/constants/admob.ts
AdMob Rewarded ID:     ca-app-pub-4655832858609329/4713726117  → src/constants/admob.ts
RevenueCat API Key:    test_zErSzrKALOdeWQJRdVnFimSmrZL        → App.tsx
```

⚠️ BEFORE PUBLISHING TO PLAY STORE — two things to update:
1. RevenueCat key: swap `test_zErSzrKALOdeWQJRdVnFimSmrZL` for your PRODUCTION key
   (found in RevenueCat dashboard → Project Settings → API Keys → Production)
2. Expo Project ID: fill in after running `eas init` in the project folder
   (add to app.json under `expo.extra.eas.projectId`)

---

## PLAY STORE SUBMISSION CHECKLIST

- [ ] AdMob IDs already filled in ✅ — no changes needed
- [ ] RevenueCat API key swapped to PRODUCTION key (not the test_ key)
- [ ] `app.json` version and versionCode incremented
- [ ] `eas build --platform android --profile production` completed successfully
- [ ] AAB (Android App Bundle) uploaded to Google Play Console
- [ ] App listing: title, short description, long description, screenshots (5 minimum)
- [ ] Privacy policy URL entered in Play Console
- [ ] "Contains ads" checkbox ticked in Play Console content rating
- [ ] App tested on Android 8.0 (API 26) minimum
- [ ] Internal testing → Closed testing → Production track promotion

---

## NOTES FOR CLAUDE CODE

- Always use TypeScript. Never use `.js` files in `src/`.
- Always use `async/await`. Never use `.then()` chains.
- Never put business logic inside components. Put it in `utils/` or `hooks/`.
- Never call AsyncStorage directly from a screen. Always go through `src/storage/storage.ts`.
- All colors must come from `src/constants/colors.ts`. Never hardcode color strings in components.
- All category definitions must come from `src/constants/categories.ts`.
- All budget math must go through `src/utils/budget.ts`. Never calculate budget inline.
- Every screen that shows data must handle three states: loading, empty, and populated.
- Every screen must support dark mode by checking `settings.darkMode`.
- Never use `console.log` in production code. Remove all debug logs before building.
- Use `expo-constants` to get app version. Never hardcode the version string.
- Test every screen with: no data (first launch), one item, many items (50+), and very large numbers (₱99,999.99).
