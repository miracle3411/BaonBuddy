import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { Colors } from '../../constants/colors';
import { CATEGORIES } from '../../constants/categories';
import { AllowancePeriod, Expense } from '../../types';
import { getPeriods, getExpensesForPeriod } from '../../storage/storage';
import { calculateBudgetStatus } from '../../utils/budget';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { usePro } from '../../hooks/usePro';
import { AdMob } from '../../constants/admob';

let InterstitialAd: any = null;
let AdEventType: any = null;
try {
  const ads = require('react-native-google-mobile-ads');
  InterstitialAd = ads.InterstitialAd;
  AdEventType = ads.AdEventType;
} catch {
  // Native module not available in Expo Go
}

let interstitialShownThisSession = false;

let interstitial: any = null;
try {
  if (InterstitialAd) {
    interstitial = InterstitialAd.createForAdRequest(AdMob.INTERSTITIAL_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
  }
} catch {
  // silent
}

type Props = { navigation: any };

interface Section {
  title: string;
  data: Expense[];
}

export default function HistoryScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { isPro } = usePro();
  const [periods, setPeriods] = useState<AllowancePeriod[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
      showInterstitial();
    }, [])
  );

  function showInterstitial() {
    if (isPro || interstitialShownThisSession || !interstitial) return;

    const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      interstitial.show();
    });
    const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialShownThisSession = true;
      unsubLoaded();
      unsubClosed();
    });

    try {
      interstitial.load();
    } catch {
      // Ad failed to load — silently skip
    }

    interstitialShownThisSession = true; // Mark shown even if load fails to avoid retrying
  }

  async function loadData() {
    try {
      const allPeriods = await getPeriods();
      const sorted = allPeriods.sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
      setPeriods(sorted);

      if (sorted.length > 0) {
        const idx = Math.min(selectedIndex, sorted.length - 1);
        setSelectedIndex(idx);
        const periodExpenses = await getExpensesForPeriod(sorted[idx].id);
        setExpenses(periodExpenses);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function selectPeriod(newIndex: number) {
    setSelectedIndex(newIndex);
    try {
      if (periods[newIndex]) {
        const periodExpenses = await getExpensesForPeriod(periods[newIndex].id);
        setExpenses(periodExpenses);
      }
    } catch {
      Alert.alert(t('error'), t('loadError'));
    }
  }

  const currentPeriod = periods[selectedIndex];

  // Group expenses by date for SectionList
  const sections: Section[] = [];
  if (expenses.length > 0) {
    const grouped: Record<string, Expense[]> = {};
    expenses.forEach((e) => {
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push(e);
    });
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
    sortedDates.forEach((date) => {
      sections.push({
        title: format(parseISO(date), 'EEEE, MMM d'),
        data: grouped[date],
      });
    });
  }

  // Summary
  const summary = currentPeriod
    ? calculateBudgetStatus(currentPeriod, expenses)
    : null;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  if (periods.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 16, color: colors.textSecondary }}>
          {t('noHistory')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('history')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Analytics')}>
          <Ionicons name="bar-chart-outline" size={22} color={Colors.purple} />
        </TouchableOpacity>
      </View>

      {/* Period selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          onPress={() => selectPeriod(selectedIndex + 1)}
          disabled={selectedIndex >= periods.length - 1}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={selectedIndex >= periods.length - 1 ? colors.border : colors.text}
          />
        </TouchableOpacity>

        <View style={styles.periodLabelWrap}>
          <Text style={[styles.periodLabel, { color: colors.text }]}>
            {format(parseISO(currentPeriod.startDate), 'MMM d')} –{' '}
            {format(parseISO(currentPeriod.endDate), 'MMM d')}
            {currentPeriod.isActive ? ` ${t('current')}` : ''}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => selectPeriod(selectedIndex - 1)}
          disabled={selectedIndex <= 0}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={selectedIndex <= 0 ? colors.border : colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Summary card */}
      {summary && (
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('budget')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₱{summary.totalBudget.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('spent')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₱{summary.totalSpent.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('used')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {summary.percentUsed.toFixed(1)}%
            </Text>
          </View>
        </View>
      )}

      {/* Expenses grouped by date */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: colors.textSecondary, backgroundColor: colors.background }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => {
          const cat = CATEGORIES.find((c) => c.key === item.category);
          return (
            <TouchableOpacity
              style={[styles.expenseRow, { borderBottomColor: colors.border }]}
              onPress={() => navigation.navigate('AddExpense', { expense: item })}
            >
              <View style={styles.expenseLeft}>
                <Text style={styles.expenseEmoji}>{cat?.emoji ?? '📦'}</Text>
                <View>
                  <Text style={[styles.expenseCat, { color: colors.text }]}>
                    {cat?.label ?? item.category}
                  </Text>
                  {item.note ? (
                    <Text style={[styles.expenseNote, { color: colors.textSecondary }]}>
                      {item.note}
                    </Text>
                  ) : null}
                </View>
              </View>
              <Text style={[styles.expenseAmount, { color: colors.text }]}>
                ₱{item.amount.toFixed(2)}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              {t('noExpensesInPeriod')}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 40) + 8 : 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  periodLabelWrap: {
    flex: 1,
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  summaryCard: {
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  expenseEmoji: {
    fontSize: 24,
  },
  expenseCat: {
    fontSize: 15,
    fontWeight: '600',
  },
  expenseNote: {
    fontSize: 13,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
});
