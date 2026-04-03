import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import { format, parseISO } from 'date-fns';

import { useTheme } from '../../hooks/useTheme';
import { usePro } from '../../hooks/usePro';
import { useLanguage } from '../../hooks/useLanguage';
import { Colors } from '../../constants/colors';
import { CATEGORIES } from '../../constants/categories';
import { getActivePeriod, getExpensesForPeriod } from '../../storage/storage';
import { AllowancePeriod, Expense } from '../../types';

// Safe require for rewarded ads
let RewardedAd: any = null;
let RewardedAdEventType: any = null;
let AdMobRewarded: any = null;
try {
  const ads = require('react-native-google-mobile-ads');
  RewardedAd = ads.RewardedAd;
  RewardedAdEventType = ads.RewardedAdEventType;
  const { AdMob } = require('../../constants/admob');
  AdMobRewarded = RewardedAd?.createForAdRequest(AdMob.REWARDED_ID, {
    requestNonPersonalizedAdsOnly: true,
  });
} catch {
  // Not available in Expo Go
}

interface CategorySpending {
  key: string;
  label: string;
  emoji: string;
  color: string;
  amount: number;
  percent: number;
}

interface DailySpending {
  date: string;
  label: string;
  amount: number;
}

export default function AnalyticsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { isPro } = usePro();
  const { t } = useLanguage();
  const [period, setPeriod] = useState<AllowancePeriod | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsUnlocked, setChartsUnlocked] = useState(false);
  const [adLoading, setAdLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      const p = await getActivePeriod();
      setPeriod(p);
      if (p) {
        const exps = await getExpensesForPeriod(p.id);
        setExpenses(exps);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function getCategorySpending(): CategorySpending[] {
    const totals: Record<string, number> = {};
    expenses.forEach((e) => {
      totals[e.category] = (totals[e.category] ?? 0) + e.amount;
    });
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

    return CATEGORIES.map((c) => ({
      key: c.key,
      label: t(c.labelKey),
      emoji: c.emoji,
      color: c.color,
      amount: totals[c.key] ?? 0,
      percent: totalSpent > 0 ? ((totals[c.key] ?? 0) / totalSpent) * 100 : 0,
    })).filter((c) => c.amount > 0);
  }

  function getDailySpending(): DailySpending[] {
    const byDate: Record<string, number> = {};
    expenses.forEach((e) => {
      byDate[e.date] = (byDate[e.date] ?? 0) + e.amount;
    });
    const dates = Object.keys(byDate).sort();
    return dates.map((d) => ({
      date: d,
      label: format(parseISO(d), 'MMM d'),
      amount: byDate[d],
    }));
  }

  function getInsights() {
    const catSpending = getCategorySpending();
    const dailySpending = getDailySpending();

    if (catSpending.length === 0) return null;

    const topCat = catSpending.reduce((a, b) => (a.amount > b.amount ? a : b));
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

    let bestDay = dailySpending[0];
    let worstDay = dailySpending[0];
    dailySpending.forEach((d) => {
      if (d.amount < bestDay.amount) bestDay = d;
      if (d.amount > worstDay.amount) worstDay = d;
    });

    return {
      topCategory: topCat,
      topCategoryPercent: totalSpent > 0 ? ((topCat.amount / totalSpent) * 100).toFixed(0) : '0',
      bestDay,
      worstDay,
    };
  }

  function handleWatchAd() {
    if (!AdMobRewarded) {
      // In Expo Go, just unlock directly for testing
      setChartsUnlocked(true);
      return;
    }

    setAdLoading(true);
    const unsubLoaded = AdMobRewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        AdMobRewarded.show();
      }
    );
    const unsubEarned = AdMobRewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        setChartsUnlocked(true);
        setAdLoading(false);
      }
    );

    AdMobRewarded.load();

    // Timeout fallback
    setTimeout(() => {
      setAdLoading(false);
      unsubLoaded();
      unsubEarned();
    }, 15000);
  }

  const canViewCharts = isPro || chartsUnlocked;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.purple} />
      </View>
    );
  }

  if (!period || expenses.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>📊</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {t('noExpensesAnalyze')}
        </Text>
      </View>
    );
  }

  const catSpending = getCategorySpending();
  const dailySpending = getDailySpending();
  const insights = getInsights();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Paywall overlay for free users */}
      {!canViewCharts && (
        <View style={styles.paywallCard}>
          <Text style={styles.paywallTitle}>{t('unlockAnalytics')}</Text>
          <TouchableOpacity
            style={styles.watchAdButton}
            onPress={handleWatchAd}
            disabled={adLoading}
          >
            {adLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.watchAdText}>
                {t('watchVideo')}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.upgradeLink}
            onPress={() => navigation.navigate('Upgrade')}
          >
            <Text style={[styles.upgradeLinkText, { color: Colors.purple }]}>
              {t('upgradeToPro')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pie Chart — Spending by Category */}
      <View style={[styles.section, !canViewCharts && styles.blurred]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('spendingByCategory')}
        </Text>
        <View style={styles.chartCenter}>
          <PieChart data={catSpending} size={200} />
        </View>
        <View style={styles.legend}>
          {catSpending.map((c) => (
            <View key={c.key} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: c.color }]} />
              <Text style={[styles.legendLabel, { color: colors.text }]}>
                {c.emoji} {c.label}
              </Text>
              <Text style={[styles.legendAmount, { color: colors.textSecondary }]}>
                ₱{c.amount.toFixed(2)} ({c.percent.toFixed(0)}%)
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Line Chart — Daily Spending Trend */}
      <View style={[styles.section, !canViewCharts && styles.blurred]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('dailyTrend')}
        </Text>
        <View style={styles.chartCenter}>
          <LineChart data={dailySpending} width={300} height={180} color={Colors.purple} textColor={colors.textSecondary} />
        </View>
      </View>

      {/* Insights */}
      {insights && (
        <View style={[styles.section, !canViewCharts && styles.blurred]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('insights')}</Text>

          <Text style={[styles.insightText, { color: colors.text }]}>
            {t('topCategoryInsight')} {insights.topCategory.emoji}{' '}
            {insights.topCategory.label} — ₱{insights.topCategory.amount.toFixed(2)} (
            {insights.topCategoryPercent}% {t('ofBudget')}).
          </Text>

          {dailySpending.length > 1 && (
            <>
              <View style={[styles.dayCard, { backgroundColor: Colors.meterGreenBg }]}>
                <Text style={[styles.dayLabel, { color: Colors.meterGreen }]}>
                  {t('lowestSpending')}
                </Text>
                <Text style={[styles.dayValue, { color: Colors.meterGreen }]}>
                  {insights.bestDay.label} — ₱{insights.bestDay.amount.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.dayCard, { backgroundColor: Colors.meterRedBg }]}>
                <Text style={[styles.dayLabel, { color: Colors.meterRed }]}>
                  {t('highestSpending')}
                </Text>
                <Text style={[styles.dayValue, { color: Colors.meterRed }]}>
                  {insights.worstDay.label} — ₱{insights.worstDay.amount.toFixed(2)}
                </Text>
              </View>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ── Simple SVG Pie Chart ─────────────────────────────────────────────────
function PieChart({ data, size }: { data: CategorySpending[]; size: number }) {
  const radius = size / 2;
  const center = radius;
  let currentAngle = -Math.PI / 2; // Start at top

  const total = data.reduce((s, d) => s + d.amount, 0);
  if (total === 0) return null;

  const slices = data.map((d) => {
    const sliceAngle = (d.amount / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const path = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    return { path, color: d.color, key: d.key };
  });

  return (
    <Svg width={size} height={size}>
      {slices.map((s) => (
        <Path key={s.key} d={s.path} fill={s.color} />
      ))}
      {/* White center circle for donut effect */}
      <Circle cx={center} cy={center} r={radius * 0.45} fill="white" />
    </Svg>
  );
}

// ── Simple SVG Line Chart ────────────────────────────────────────────────
function LineChart({
  data,
  width,
  height,
  color,
  textColor,
}: {
  data: DailySpending[];
  width: number;
  height: number;
  color: string;
  textColor: string;
}) {
  if (data.length === 0) return null;

  const padding = { top: 10, right: 10, bottom: 30, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.amount), 1);
  const minVal = 0;

  const points = data.map((d, i) => ({
    x: padding.left + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW),
    y: padding.top + chartH - ((d.amount - minVal) / (maxVal - minVal)) * chartH,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <Svg width={width} height={height}>
      {/* Y axis lines */}
      {[0, 0.5, 1].map((ratio) => {
        const y = padding.top + chartH * (1 - ratio);
        const val = (minVal + (maxVal - minVal) * ratio).toFixed(0);
        return (
          <React.Fragment key={ratio}>
            <SvgLine
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#ddd"
              strokeWidth={1}
            />
            <SvgText
              x={padding.left - 5}
              y={y + 4}
              fontSize={10}
              fill={textColor}
              textAnchor="end"
            >
              {val}
            </SvgText>
          </React.Fragment>
        );
      })}
      {/* Line path */}
      <Path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Data points */}
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={4} fill={color} />
      ))}
      {/* X axis labels */}
      {data.map((d, i) => {
        // Show max ~6 labels to avoid overlap
        if (data.length > 6 && i % Math.ceil(data.length / 6) !== 0 && i !== data.length - 1) {
          return null;
        }
        return (
          <SvgText
            key={i}
            x={points[i].x}
            y={height - 5}
            fontSize={9}
            fill={textColor}
            textAnchor="middle"
          >
            {d.label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  blurred: {
    opacity: 0.15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  chartCenter: {
    alignItems: 'center',
    marginBottom: 12,
  },
  legend: {
    marginTop: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 14,
    flex: 1,
  },
  legendAmount: {
    fontSize: 14,
  },
  insightText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  dayCard: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  dayValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  paywallCard: {
    backgroundColor: Colors.purpleLight,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  paywallTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.purpleDark,
    marginBottom: 16,
  },
  watchAdButton: {
    backgroundColor: Colors.purple,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  watchAdText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  upgradeLink: {
    paddingVertical: 8,
  },
  upgradeLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
