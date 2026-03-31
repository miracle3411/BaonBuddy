import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format, parseISO } from 'date-fns';
import { Colors } from '../../constants/colors';
import { CATEGORIES } from '../../constants/categories';
import { AppSettings, AllowancePeriod, Expense } from '../../types';
import {
  getSettings,
  saveSettings,
  getActivePeriod,
  getExpenses,
  getExpensesForPeriod,
  getPeriods,
  savePeriods,
  clearAllData,
} from '../../storage/storage';
import { getNextPeriodDates } from '../../utils/budget';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { showResetFlow } from '../../utils/resetPeriod';
import {
  scheduleDailyReminder,
  cancelDailyReminder,
  scheduleResetReminder,
  cancelResetReminder,
} from '../../hooks/useNotifications';

type Props = { navigation: any };

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
};

export default function SettingsScreen({ navigation }: Props) {
  const { colors, reload: reloadTheme } = useTheme();
  const { t, setLang, reload: reloadLang } = useLanguage();
  const [settings, setSettingsState] = useState<AppSettings | null>(null);
  const [period, setPeriod] = useState<AllowancePeriod | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editFrequency, setEditFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  async function loadAll() {
    try {
      const [s, p] = await Promise.all([getSettings(), getActivePeriod()]);
      setSettingsState(s);
      setPeriod(p);
      if (p) {
        const exps = await getExpensesForPeriod(p.id);
        setExpenses(exps);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function updateSetting(partial: Partial<AppSettings>) {
    try {
      await saveSettings(partial);
      const updated = { ...settings!, ...partial };
      setSettingsState(updated);
    } catch {
      Alert.alert(t('error'), t('settingSaveError'));
    }
  }

  async function handleToggleDailyReminder(value: boolean) {
    try {
      await updateSetting({ dailyReminderEnabled: value });
      if (value) {
        await scheduleDailyReminder(settings!.dailyReminderTime);
      } else {
        await cancelDailyReminder();
      }
    } catch {
      Alert.alert(t('error'), t('reminderError'));
    }
  }

  async function handleToggleOverspendAlert(value: boolean) {
    await updateSetting({ overspendAlertEnabled: value });
  }

  async function handleToggleResetReminder(value: boolean) {
    try {
      await updateSetting({ resetReminderEnabled: value });
      if (value && period) {
        await scheduleResetReminder(period.endDate);
      } else {
        await cancelResetReminder();
      }
    } catch {
      Alert.alert(t('error'), t('reminderError'));
    }
  }

  async function handleDarkModeChange(mode: 'auto' | 'light' | 'dark') {
    try {
      await updateSetting({ darkMode: mode });
      await reloadTheme();
    } catch {
      Alert.alert(t('error'), t('themeError'));
    }
  }

  async function handleLanguageChange(language: 'fil' | 'en') {
    try {
      await updateSetting({ language });
      setLang(language);
      await reloadLang();
    } catch {
      Alert.alert(t('error'), t('settingSaveError'));
    }
  }

  async function handleExportData() {
    try {
      const allExpenses = await getExpenses();
      if (allExpenses.length === 0) {
        Alert.alert(t('error'), t('noDataExport'));
        return;
      }

      const rows = allExpenses.map((e) => {
        const cat = CATEGORIES.find((c) => c.key === e.category);
        return `<tr>
          <td>${e.date}</td>
          <td>${cat?.label ?? e.category}</td>
          <td>₱${e.amount.toFixed(2)}</td>
          <td>${e.note}</td>
        </tr>`;
      });

      const html = `
        <html><body>
        <h1>Baon Buddy — Expense Report</h1>
        <p>Exported: ${new Date().toISOString().split('T')[0]}</p>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
          <tr><th>Date</th><th>Category</th><th>Amount</th><th>Note</th></tr>
          ${rows.join('')}
        </table>
        </body></html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch {
      Alert.alert(t('error'), t('exportError'));
    }
  }

  function handleClearData() {
    Alert.alert(
      t('clearConfirmTitle'),
      t('clearConfirmMsg'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clearButton'),
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
          },
        },
      ]
    );
  }

  function startEditing() {
    if (!period) return;
    setEditAmount(period.amount.toString());
    setEditFrequency(period.frequency);
    setEditing(true);
  }

  async function handleSaveEdit() {
    if (!period) return;
    const newAmount = parseFloat(editAmount) || 0;
    if (newAmount <= 0) {
      Alert.alert(t('error'), t('invalidAmount'));
      return;
    }

    try {
      const frequencyChanged = editFrequency !== period.frequency;
      const newDates = frequencyChanged
        ? getNextPeriodDates(editFrequency, parseISO(period.startDate))
        : { startDate: period.startDate, endDate: period.endDate };

      const updatedPeriod: AllowancePeriod = {
        ...period,
        amount: newAmount,
        frequency: editFrequency,
        startDate: newDates.startDate,
        endDate: newDates.endDate,
      };

      const allPeriods = await getPeriods();
      const updated = allPeriods.map((p) =>
        p.id === period.id ? updatedPeriod : p
      );
      await savePeriods(updated);
      setPeriod(updatedPeriod);
      setEditing(false);

      if (frequencyChanged) {
        await scheduleResetReminder(newDates.endDate);
      }
    } catch {
      Alert.alert(t('error'), t('editSaveError'));
    }
  }

  function handleResetPeriod() {
    if (!period) return;
    showResetFlow(period, expenses, () => {
      loadAll();
    });
  }

  if (loading || !settings) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings')}</Text>

      {/* ── BAON SECTION ── */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('baon')}</Text>
      {period ? (
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {!editing ? (
            <>
              <Text style={[styles.cardText, { color: colors.text }]}>
                {format(parseISO(period.startDate), 'MMM d')} –{' '}
                {format(parseISO(period.endDate), 'MMM d')} ({FREQ_LABELS[period.frequency]}, ₱
                {period.amount.toFixed(2)})
              </Text>
              <View style={styles.baonActions}>
                <TouchableOpacity style={styles.editButton} onPress={startEditing}>
                  <Text style={styles.editButtonText}>{t('edit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resetButton} onPress={handleResetPeriod}>
                  <Text style={styles.resetButtonText}>{t('resetPeriod')}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.editLabel, { color: colors.textSecondary }]}>{t('editAmount')}</Text>
              <TextInput
                style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.border}
              />

              <Text style={[styles.editLabel, { color: colors.textSecondary, marginTop: 12 }]}>{t('frequency')}</Text>
              <View style={styles.freqRow}>
                {(['weekly', 'biweekly', 'monthly'] as const).map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.freqOption,
                      editFrequency === freq && styles.freqOptionActive,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => setEditFrequency(freq)}
                  >
                    <Text
                      style={[
                        styles.freqOptionText,
                        editFrequency === freq && styles.freqOptionTextActive,
                      ]}
                    >
                      {FREQ_LABELS[freq]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditing(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                  <Text style={styles.saveButtonText}>I-save</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>{t('noPeriod')}</Text>
        </View>
      )}

      {/* ── NOTIFICATIONS SECTION ── */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('notifications')}</Text>
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: colors.text }]}>{t('dailyReminder')}</Text>
          <Switch
            value={settings.dailyReminderEnabled}
            onValueChange={handleToggleDailyReminder}
            trackColor={{ true: Colors.purple }}
          />
        </View>
        {settings.dailyReminderEnabled && (
          <View style={styles.timeRow}>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Time:</Text>
            <TextInput
              style={[styles.timeInput, { color: colors.text, borderColor: colors.border }]}
              value={settings.dailyReminderTime}
              onChangeText={async (val) => {
                await updateSetting({ dailyReminderTime: val });
                if (/^\d{2}:\d{2}$/.test(val)) {
                  await scheduleDailyReminder(val);
                }
              }}
              placeholder="20:00"
              placeholderTextColor={colors.border}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        )}
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: colors.text }]}>{t('overspendAlert')}</Text>
          <Switch
            value={settings.overspendAlertEnabled}
            onValueChange={handleToggleOverspendAlert}
            trackColor={{ true: Colors.purple }}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: colors.text }]}>{t('resetReminder')}</Text>
          <Switch
            value={settings.resetReminderEnabled}
            onValueChange={handleToggleResetReminder}
            trackColor={{ true: Colors.purple }}
          />
        </View>
      </View>

      {/* ── APPEARANCE SECTION ── */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('appearance')}</Text>
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[styles.toggleLabel, { color: colors.text, marginBottom: 10 }]}>{t('darkMode')}</Text>
        <View style={styles.segmented}>
          {(['auto', 'light', 'dark'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.segmentedButton,
                settings.darkMode === mode && styles.segmentedButtonActive,
              ]}
              onPress={() => handleDarkModeChange(mode)}
            >
              <Text
                style={[
                  styles.segmentedText,
                  settings.darkMode === mode && styles.segmentedTextActive,
                ]}
              >
                {mode === 'auto' ? 'Auto' : mode === 'light' ? 'Light' : 'Dark'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.toggleRow, { marginTop: 16 }]}>
          <Text style={[styles.toggleLabel, { color: colors.text }]}>{t('currency')}</Text>
          <TextInput
            style={[styles.currencyInput, { color: colors.text, borderColor: colors.border }]}
            value={settings.currency}
            onChangeText={(val) => updateSetting({ currency: val })}
          />
        </View>

        <Text style={[styles.toggleLabel, { color: colors.text, marginTop: 16, marginBottom: 10 }]}>
          {t('language')}
        </Text>
        <View style={styles.segmented}>
          {(['fil', 'en'] as const).map((langOption) => (
            <TouchableOpacity
              key={langOption}
              style={[
                styles.segmentedButton,
                settings.language === langOption && styles.segmentedButtonActive,
              ]}
              onPress={() => handleLanguageChange(langOption)}
            >
              <Text
                style={[
                  styles.segmentedText,
                  settings.language === langOption && styles.segmentedTextActive,
                ]}
              >
                {langOption === 'fil' ? 'Filipino' : 'English'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── PRO SECTION ── */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PRO</Text>
      <TouchableOpacity
        style={styles.upgradeButton}
        onPress={() => navigation.navigate('Upgrade')}
      >
        <Text style={styles.upgradeButtonText}>{t('upgradeProButton')}</Text>
        <Text style={styles.upgradeButtonSub}>{t('removeAds')}</Text>
      </TouchableOpacity>

      {/* ── DATA SECTION ── */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('data')}</Text>
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.dataButton} onPress={handleExportData}>
          <Text style={[styles.dataButtonText, { color: Colors.purple }]}>{t('exportData')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dataButton} onPress={handleClearData}>
          <Text style={[styles.dataButtonText, { color: Colors.meterRed }]}>{t('clearAllData')}</Text>
        </TouchableOpacity>
      </View>

      {/* ── ABOUT SECTION ── */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('about')}</Text>
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <View style={styles.aboutRow}>
          <Text style={[styles.toggleLabel, { color: colors.text }]}>{t('version')}</Text>
          <Text style={[styles.aboutValue, { color: colors.textSecondary }]}>{version}</Text>
        </View>
        <TouchableOpacity
          style={styles.dataButton}
          onPress={() => Linking.openURL('https://baonbuddy.app/privacy')}
        >
          <Text style={[styles.dataButtonText, { color: Colors.purple }]}>{t('privacyPolicy')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dataButton}
          onPress={() => Linking.openURL('market://details?id=com.baonbuddy.app')}
        >
          <Text style={[styles.dataButtonText, { color: Colors.purple }]}>{t('rateApp')}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 40) + 8 : 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  cardText: {
    fontSize: 15,
    marginBottom: 12,
  },
  baonActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.purple,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: Colors.purple,
    fontWeight: '600',
    fontSize: 14,
  },
  resetButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.meterYellow,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: Colors.meterYellow,
    fontWeight: '600',
    fontSize: 14,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '700',
  },
  freqRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  freqOption: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  freqOptionActive: {
    backgroundColor: Colors.purple,
    borderColor: Colors.purple,
  },
  freqOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray,
  },
  freqOptionTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.purple,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 8,
    gap: 8,
  },
  timeLabel: {
    fontSize: 14,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 15,
    fontWeight: '600',
    width: 70,
    textAlign: 'center',
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentedButtonActive: {
    backgroundColor: Colors.purple,
  },
  segmentedText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray,
  },
  segmentedTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  currencyInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 16,
    fontWeight: '600',
    width: 50,
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: Colors.purple,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  upgradeButtonSub: {
    color: Colors.white,
    fontSize: 13,
    opacity: 0.85,
    marginTop: 2,
  },
  dataButton: {
    paddingVertical: 12,
  },
  dataButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  aboutValue: {
    fontSize: 15,
  },
});
