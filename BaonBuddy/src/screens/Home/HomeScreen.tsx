import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { CATEGORIES } from '../../constants/categories';
import { AllowancePeriod, Expense, BudgetStatus } from '../../types';
import { getActivePeriod, getExpensesForPeriod, deleteExpense } from '../../storage/storage';
import { calculateBudgetStatus } from '../../utils/budget';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { AdBanner } from '../../components/AdBanner';
import { showResetFlow } from '../../utils/resetPeriod';
import * as StoreReview from 'expo-store-review';
import ShareSummaryView from './ShareSummaryView';
import { shareReport } from '../../utils/shareReport';

type Props = { navigation: any };

export default function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const shareRef = useRef<View>(null) as React.RefObject<View>;
  const [period, setPeriod] = useState<AllowancePeriod | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<BudgetStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      const activePeriod = await getActivePeriod();
      setPeriod(activePeriod);

      if (activePeriod) {
        const periodExpenses = await getExpensesForPeriod(activePeriod.id);
        setExpenses(periodExpenses);
        const status = calculateBudgetStatus(activePeriod, periodExpenses);
        setBudget(status);

        // Trigger in-app review on 7-day streak
        if (status.currentStreak === 7) {
          try {
            if (await StoreReview.hasAction()) {
              await StoreReview.requestReview();
            }
          } catch {
            // Review prompt not available
          }
        }
      }
    } catch (e) {
      // silent fail — data will show empty state
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteExpense(id: string) {
    Alert.alert(t('deleteExpense'), t('confirmDelete'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteExpense(id);
          await loadData();
        },
      },
    ]);
  }

  // Period expired check
  const isPeriodExpired =
    period && new Date(period.endDate + 'T23:59:59') < new Date();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayExpenses = expenses.filter((e) => e.date === todayStr);

  const meterColors = {
    green: { bg: Colors.meterGreenBg, fill: Colors.meterGreen, label: t('onTrack') },
    yellow: { bg: Colors.meterYellowBg, fill: Colors.meterYellow, label: t('beCareful') },
    red: { bg: Colors.meterRedBg, fill: Colors.meterRed, label: t('overBudget') },
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  if (!period) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('noActivePeriod')}</Text>
        <TouchableOpacity
          style={styles.setupButton}
          onPress={() => navigation.navigate('SetAllowanceModal')}
        >
          <Text style={styles.setupButtonText}>{t('setupAllowance')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const meter = meterColors[budget?.meterStatus ?? 'green'];
  const fillWidth = Math.min(100, budget?.percentUsed ?? 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Baon Buddy</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={async () => {
              try {
                await shareReport(shareRef);
              } catch {
                Alert.alert(t('error'), t('shareError'));
              }
            }}
            style={{ marginRight: 12 }}
          >
            <Ionicons name="share-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={todayExpenses}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Period label */}
            <Text style={[styles.periodLabel, { color: colors.textSecondary }]}>
              {format(parseISO(period.startDate), 'MMM d')} –{' '}
              {format(parseISO(period.endDate), 'MMM d')}
            </Text>

            {/* Expired banner */}
            {isPeriodExpired && (
              <TouchableOpacity
                style={styles.expiredBanner}
                onPress={() => showResetFlow(period!, expenses, loadData, lang)}
              >
                <Text style={styles.expiredText}>
                  {t('periodExpired')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Remaining balance */}
            <Text style={[styles.balance, { color: colors.text }]}>
              ₱ {(budget?.remaining ?? 0).toFixed(2)}
            </Text>
            <Text style={[styles.daysLeft, { color: colors.textSecondary }]}>
              {budget?.daysLeft} {budget?.daysLeft !== 1 ? t('daysLeft') : t('dayLeft')}
            </Text>

            {/* Meter */}
            <View style={[styles.meterBg, { backgroundColor: meter.bg }]}>
              <View
                style={[
                  styles.meterFill,
                  { backgroundColor: meter.fill, width: `${fillWidth}%` },
                ]}
              />
            </View>
            <Text style={[styles.meterLabel, { color: meter.fill }]}>
              {meter.label}
            </Text>

            {/* Safe to spend */}
            <View style={[styles.safeCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.safeLabel, { color: colors.textSecondary }]}>{t('safeToSpend')}</Text>
              <Text style={[styles.safeAmount, { color: colors.text }]}>
                ₱{(budget?.dailySafeToSpend ?? 0).toFixed(2)}{t('perDay')}
              </Text>
            </View>

            {/* Overspend warning */}
            {budget?.isOverspending && (
              <View style={styles.overspendBanner}>
                <Text style={styles.overspendText}>
                  {t('overspendWarning')} ₱
                  {((budget.totalSpent - budget.totalBudget)).toFixed(2)} {t('overBudgetBy')}
                </Text>
              </View>
            )}

            {/* Streak */}
            {(budget?.currentStreak ?? 0) > 0 && (
              <View style={styles.streakCard}>
                <Text style={styles.streakText}>
                  🔥 {budget?.currentStreak}{t('streakLabel')}
                </Text>
              </View>
            )}

            {/* Today's expenses header */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('todayExpenses')}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyExpenses}>
            <Text style={[styles.emptyExpensesText, { color: colors.textSecondary }]}>
              {t('noExpensesToday')}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const cat = CATEGORIES.find((c) => c.key === item.category);
          return (
            <TouchableOpacity
              style={[styles.expenseRow, { borderBottomColor: colors.border }]}
              onPress={() =>
                navigation.navigate('AddExpense', { expense: item })
              }
              onLongPress={() => handleDeleteExpense(item.id)}
            >
              <View style={styles.expenseLeft}>
                <Text style={styles.expenseEmoji}>{cat?.emoji ?? '📦'}</Text>
                <View>
                  <Text style={[styles.expenseCat, { color: colors.text }]}>{cat ? t(cat.labelKey) : item.category}</Text>
                  {item.note ? (
                    <Text style={[styles.expenseNote, { color: colors.textSecondary }]}>{item.note}</Text>
                  ) : null}
                </View>
              </View>
              <Text style={[styles.expenseAmount, { color: colors.text }]}>
                ₱{item.amount.toFixed(2)}
              </Text>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 90 + (insets.bottom > 0 ? insets.bottom : 0) }]}
        onPress={() => navigation.navigate('AddExpense')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color={Colors.white} />
      </TouchableOpacity>

      {/* AdBanner */}
      <View style={[styles.adBannerWrap, { bottom: insets.bottom > 0 ? insets.bottom : 0 }]}>
        <AdBanner />
      </View>

      {/* Off-screen share summary view */}
      {period && (
        <View style={styles.offScreen}>
          <ShareSummaryView ref={shareRef} period={period} expenses={expenses} lang={lang} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray,
  },
  emptyTitle: {
    fontSize: 18,
    color: Colors.dark,
    marginBottom: 16,
    textAlign: 'center',
  },
  setupButton: {
    backgroundColor: Colors.purple,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  setupButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
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
    color: Colors.purple,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 200,
  },
  periodLabel: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 4,
  },
  expiredBanner: {
    backgroundColor: Colors.meterYellowBg,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  expiredText: {
    color: Colors.meterYellow,
    fontWeight: '600',
    fontSize: 14,
  },
  balance: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.dark,
    textAlign: 'center',
  },
  daysLeft: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 16,
  },
  meterBg: {
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 6,
  },
  meterFill: {
    height: '100%',
    borderRadius: 7,
  },
  meterLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  safeCard: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  safeLabel: {
    fontSize: 14,
    color: Colors.gray,
  },
  safeAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  overspendBanner: {
    backgroundColor: Colors.meterRedBg,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  overspendText: {
    color: Colors.meterRed,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  streakCard: {
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  streakText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.meterGreen,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 8,
    marginTop: 4,
  },
  emptyExpenses: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyExpensesText: {
    fontSize: 14,
    color: Colors.gray,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
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
    color: Colors.dark,
  },
  expenseNote: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  adBannerWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offScreen: {
    position: 'absolute',
    left: -9999,
    top: -9999,
  },
});
