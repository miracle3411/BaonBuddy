import { Alert } from 'react-native';
import { format, parseISO } from 'date-fns';
import { AllowancePeriod, Expense, Language } from '../types';
import { getPeriods, savePeriods } from '../storage/storage';
import { calculateBudgetStatus, getNextPeriodDates } from './budget';
import { scheduleResetReminder } from '../hooks/useNotifications';
import { t } from '../constants/translations';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function showResetFlow(
  period: AllowancePeriod,
  expenses: Expense[],
  onComplete: () => void,
  lang: Language = 'en'
): void {
  const status = calculateBudgetStatus(period, expenses);
  const saved = period.amount - status.totalSpent;
  const startLabel = format(parseISO(period.startDate), 'MMM d');
  const endLabel = format(parseISO(period.endDate), 'MMM d');

  const summaryLine = saved >= 0
    ? `${t('youSaved', lang)}: ₱${saved.toFixed(2)}`
    : `${t('youOverspent', lang)} ₱${Math.abs(saved).toFixed(2)}`;

  Alert.alert(
    t('periodEnded', lang),
    `${startLabel} – ${endLabel}\n${t('totalExpenses', lang)}: ₱${status.totalSpent.toFixed(2)}\n${summaryLine}`,
    [
      { text: t('notNow', lang), style: 'cancel' },
      {
        text: t('startNewPeriod', lang),
        onPress: async () => {
          try {
            const allPeriods = await getPeriods();
            const deactivated = allPeriods.map(p => ({ ...p, isActive: false }));

            const { startDate, endDate } = getNextPeriodDates(period.frequency);
            const newPeriod: AllowancePeriod = {
              id: generateId(),
              amount: period.amount,
              startDate,
              endDate,
              frequency: period.frequency,
              isActive: true,
            };

            await savePeriods([...deactivated, newPeriod]);
            await scheduleResetReminder(endDate);
            onComplete();
          } catch {
            Alert.alert('Error', t('resetError', lang));
          }
        },
      },
    ]
  );
}
