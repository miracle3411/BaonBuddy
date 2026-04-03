import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { CATEGORIES } from '../../constants/categories';
import { AllowancePeriod, Expense, Language } from '../../types';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { t as translate, tFn } from '../../constants/translations';

interface Props {
  period: AllowancePeriod;
  expenses: Expense[];
  lang?: Language;
}

const ShareSummaryView = forwardRef<View, Props>(({ period, expenses, lang = 'fil' }, ref) => {
  const t = (key: Parameters<typeof translate>[0]) => translate(key, lang);
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const totalDays =
    differenceInCalendarDays(parseISO(period.endDate), parseISO(period.startDate)) + 1;

  // Category breakdown
  const catTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] ?? 0) + e.amount;
  });
  const maxCatAmount = Math.max(...Object.values(catTotals), 1);

  // Days on budget — only count elapsed days, not future
  const dailyBudget = period.amount / totalDays;
  const today = new Date();
  const daysElapsed = Math.min(
    totalDays,
    differenceInCalendarDays(today, parseISO(period.startDate)) + 1
  );
  const byDate: Record<string, number> = {};
  expenses.forEach((e) => {
    byDate[e.date] = (byDate[e.date] ?? 0) + e.amount;
  });
  const daysOnBudget = Object.values(byDate).filter((v) => v <= dailyBudget).length;
  // Elapsed days with no spending also count as on-budget
  const daysWithSpending = Object.keys(byDate).length;
  const totalOnBudget = daysOnBudget + (daysElapsed - daysWithSpending);

  const periodLabel = `${format(parseISO(period.startDate), 'MMM d')} – ${format(
    parseISO(period.endDate),
    'MMM d, yyyy'
  )}`;

  return (
    <View ref={ref} style={styles.container} collapsable={false}>
      {/* Header */}
      <Text style={styles.appName}>Baon Buddy</Text>
      <Text style={styles.period}>{periodLabel}</Text>

      {/* Total spent */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{t('totalSpent')}</Text>
        <Text style={styles.totalAmount}>₱{totalSpent.toFixed(2)}</Text>
      </View>

      <View style={styles.budgetRow}>
        <Text style={styles.budgetLabel}>{t('budget')}: ₱{period.amount.toFixed(2)}</Text>
        <Text style={styles.dayContext}>({t('dayOf')} {daysElapsed} {t('of')} {totalDays})</Text>
      </View>
      <View style={styles.budgetRow}>
        <Text
          style={[
            styles.budgetStatus,
            { color: totalSpent <= period.amount ? Colors.meterGreen : Colors.meterRed },
          ]}
        >
          {totalSpent <= period.amount
            ? `${t('savedSoFar')} ₱${(period.amount - totalSpent).toFixed(2)}`
            : `${t('overBy')} ₱${(totalSpent - period.amount).toFixed(2)}`}
        </Text>
      </View>

      {/* Category breakdown */}
      <Text style={styles.sectionTitle}>{t('breakdown')}</Text>
      {CATEGORIES.filter((c) => (catTotals[c.key] ?? 0) > 0).map((c) => {
        const amount = catTotals[c.key] ?? 0;
        const barWidth = (amount / maxCatAmount) * 100;
        return (
          <View key={c.key} style={styles.catRow}>
            <Text style={styles.catLabel}>
              {c.emoji} {t(c.labelKey)}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: c.color }]}
              />
            </View>
            <Text style={styles.catAmount}>₱{amount.toFixed(2)}</Text>
          </View>
        );
      })}

      {/* Days on budget */}
      <View style={styles.streakRow}>
        <Text style={styles.streakText}>
          {totalOnBudget === daysElapsed
            ? tFn('allDaysOnBudget', lang)(daysElapsed)
            : tFn('someDaysOnBudget', lang)(totalOnBudget, daysElapsed)}
        </Text>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>Made with Baon Buddy</Text>
    </View>
  );
});

ShareSummaryView.displayName = 'ShareSummaryView';
export default ShareSummaryView;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    padding: 24,
    width: 360,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.purple,
    textAlign: 'center',
    marginBottom: 4,
  },
  period: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  totalRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 13,
    color: Colors.gray,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.dark,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 8,
  },
  budgetLabel: {
    fontSize: 13,
    color: Colors.gray,
  },
  dayContext: {
    fontSize: 12,
    color: Colors.gray,
  },
  budgetStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 12,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  catLabel: {
    fontSize: 12,
    width: 85,
    color: Colors.dark,
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.grayLight,
    borderRadius: 5,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  catAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark,
    width: 70,
    textAlign: 'right',
  },
  streakRow: {
    marginTop: 16,
    padding: 10,
    backgroundColor: Colors.meterGreenBg,
    borderRadius: 8,
    alignItems: 'center',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.meterGreen,
  },
  footer: {
    fontSize: 11,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 16,
  },
});
