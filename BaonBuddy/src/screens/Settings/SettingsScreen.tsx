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
import { Ionicons } from '@expo/vector-icons';
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
// getNextPeriodDates removed — frequency edit recalculates inline
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

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function to24Hour(hour: number, minute: number, ampm: 'AM' | 'PM'): string {
  let h = hour;
  if (ampm === 'AM' && h === 12) h = 0;
  if (ampm === 'PM' && h !== 12) h += 12;
  return `${h.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function from24Hour(time: string): { hour: number; minute: number; ampm: 'AM' | 'PM' } {
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const minute = parseInt(mStr, 10);
  const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return { hour: h, minute, ampm };
}

const FREQ_KEYS: Record<string, any> = {
  weekly: 'weekly',
  biweekly: 'biweekly',
  monthly: 'monthly',
};

export default function SettingsScreen({ navigation }: Props) {
  const { colors, reload: reloadTheme } = useTheme();
  const { t, lang, setLang, reload: reloadLang } = useLanguage();
  const [settings, setSettingsState] = useState<AppSettings | null>(null);
  const [period, setPeriod] = useState<AllowancePeriod | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editFrequency, setEditFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerHour, setPickerHour] = useState(8);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [pickerAmPm, setPickerAmPm] = useState<'AM' | 'PM'>('PM');
  const [showHourList, setShowHourList] = useState(false);
  const [showMinuteList, setShowMinuteList] = useState(false);

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
    // Update local state immediately (optimistic), then persist
    const updated = { ...settings!, ...partial };
    setSettingsState(updated);
    try {
      await saveSettings(partial);
    } catch {
      // Revert on failure
      setSettingsState(settings);
      Alert.alert(t('error'), t('settingSaveError'));
    }
  }

  async function handleToggleDailyReminder(value: boolean) {
    const updated = { ...settings!, dailyReminderEnabled: value };
    setSettingsState(updated);
    try {
      await saveSettings({ dailyReminderEnabled: value });
      if (value) {
        await scheduleDailyReminder(settings!.dailyReminderTime);
      } else {
        await cancelDailyReminder();
      }
    } catch {
      setSettingsState(settings);
      Alert.alert(t('error'), t('reminderError'));
    }
  }

  async function handleToggleOverspendAlert(value: boolean) {
    const updated = { ...settings!, overspendAlertEnabled: value };
    setSettingsState(updated);
    try {
      await saveSettings({ overspendAlertEnabled: value });
    } catch {
      setSettingsState(settings);
    }
  }

  async function handleToggleResetReminder(value: boolean) {
    const updated = { ...settings!, resetReminderEnabled: value };
    setSettingsState(updated);
    try {
      await saveSettings({ resetReminderEnabled: value });
      if (value && period) {
        await scheduleResetReminder(period.endDate);
      } else {
        await cancelResetReminder();
      }
    } catch {
      setSettingsState(settings);
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
          <td>${cat ? t(cat.labelKey) : e.category}</td>
          <td>₱${e.amount.toFixed(2)}</td>
          <td>${e.note}</td>
        </tr>`;
      });

      const html = `
        <html><body>
        <h1>${t('expenseReport')}</h1>
        <p>${t('exported')} ${new Date().toISOString().split('T')[0]}</p>
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
      let newEndDate = period.endDate;
      if (frequencyChanged) {
        // Keep the same startDate, only recalculate endDate from it
        const start = parseISO(period.startDate);
        const end = new Date(start);
        if (editFrequency === 'weekly') {
          end.setDate(end.getDate() + 6);
        } else if (editFrequency === 'biweekly') {
          end.setDate(end.getDate() + 13);
        } else {
          end.setMonth(end.getMonth() + 1);
          end.setDate(0);
        }
        newEndDate = end.toISOString().split('T')[0];
      }

      const updatedPeriod: AllowancePeriod = {
        ...period,
        amount: newAmount,
        frequency: editFrequency,
        endDate: newEndDate,
      };

      const allPeriods = await getPeriods();
      const updated = allPeriods.map((p) =>
        p.id === period.id ? updatedPeriod : p
      );
      await savePeriods(updated);
      setPeriod(updatedPeriod);
      setEditing(false);

      if (frequencyChanged) {
        await scheduleResetReminder(newEndDate);
      }
    } catch {
      Alert.alert(t('error'), t('editSaveError'));
    }
  }

  function handleResetPeriod() {
    if (!period) return;
    showResetFlow(period, expenses, () => {
      loadAll();
    }, lang);
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
                {format(parseISO(period.endDate), 'MMM d')} ({t(FREQ_KEYS[period.frequency])}, ₱
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
                      {t(FREQ_KEYS[freq])}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditing(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                  <Text style={styles.saveButtonText}>{t('save')}</Text>
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
          <>
            <TouchableOpacity
              style={[styles.timeDropdown, { borderColor: colors.border }]}
              onPress={() => {
                if (!showTimePicker) {
                  const parsed = from24Hour(settings.dailyReminderTime);
                  setPickerHour(parsed.hour);
                  setPickerMinute(parsed.minute);
                  setPickerAmPm(parsed.ampm);
                  setShowHourList(false);
                  setShowMinuteList(false);
                }
                setShowTimePicker(!showTimePicker);
              }}
            >
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>{t('time')}</Text>
              <Text style={[styles.timeValue, { color: colors.text }]}>
                {(() => { const p = from24Hour(settings.dailyReminderTime); return `${p.hour}:${p.minute.toString().padStart(2, '0')} ${p.ampm}`; })()}
              </Text>
              <Ionicons
                name={showTimePicker ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {showTimePicker && (
              <View style={[styles.timePickerContainer, { borderColor: colors.border }]}>
                {/* Hour / Minute / AM-PM row */}
                <View style={styles.timePickerRow}>
                  {/* Hour dropdown */}
                  <View style={styles.timePickerColumn}>
                    <Text style={[styles.timePickerLabel, { color: colors.textSecondary }]}>{t('hour')}</Text>
                    <TouchableOpacity
                      style={[styles.timePickerSelect, { borderColor: colors.border }]}
                      onPress={() => { setShowHourList(!showHourList); setShowMinuteList(false); }}
                    >
                      <Text style={[styles.timePickerSelectText, { color: colors.text }]}>{pickerHour}</Text>
                      <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {showHourList && (
                      <ScrollView style={[styles.timePickerList, { borderColor: colors.border }]} nestedScrollEnabled>
                        {HOURS.map((h) => (
                          <TouchableOpacity
                            key={h}
                            style={[styles.timePickerItem, pickerHour === h && { backgroundColor: Colors.purpleLight }]}
                            onPress={() => { setPickerHour(h); setShowHourList(false); }}
                          >
                            <Text style={[styles.timePickerItemText, { color: colors.text }, pickerHour === h && { color: Colors.purple, fontWeight: '700' }]}>{h}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>

                  {/* Minute dropdown */}
                  <View style={styles.timePickerColumn}>
                    <Text style={[styles.timePickerLabel, { color: colors.textSecondary }]}>{t('minute')}</Text>
                    <TouchableOpacity
                      style={[styles.timePickerSelect, { borderColor: colors.border }]}
                      onPress={() => { setShowMinuteList(!showMinuteList); setShowHourList(false); }}
                    >
                      <Text style={[styles.timePickerSelectText, { color: colors.text }]}>{pickerMinute.toString().padStart(2, '0')}</Text>
                      <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {showMinuteList && (
                      <ScrollView style={[styles.timePickerList, { borderColor: colors.border }]} nestedScrollEnabled>
                        {MINUTES.map((m) => (
                          <TouchableOpacity
                            key={m}
                            style={[styles.timePickerItem, pickerMinute === m && { backgroundColor: Colors.purpleLight }]}
                            onPress={() => { setPickerMinute(m); setShowMinuteList(false); }}
                          >
                            <Text style={[styles.timePickerItemText, { color: colors.text }, pickerMinute === m && { color: Colors.purple, fontWeight: '700' }]}>{m.toString().padStart(2, '0')}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>

                  {/* AM/PM toggle */}
                  <View style={styles.timePickerColumn}>
                    <Text style={[styles.timePickerLabel, { color: colors.textSecondary }]}>  </Text>
                    <View style={styles.ampmContainer}>
                      <TouchableOpacity
                        style={[styles.ampmButton, pickerAmPm === 'AM' && styles.ampmButtonActive]}
                        onPress={() => setPickerAmPm('AM')}
                      >
                        <Text style={[styles.ampmText, pickerAmPm === 'AM' && styles.ampmTextActive]}>AM</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.ampmButton, pickerAmPm === 'PM' && styles.ampmButtonActive]}
                        onPress={() => setPickerAmPm('PM')}
                      >
                        <Text style={[styles.ampmText, pickerAmPm === 'PM' && styles.ampmTextActive]}>PM</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Save button */}
                <TouchableOpacity
                  style={styles.timePickerSave}
                  onPress={async () => {
                    const time24 = to24Hour(pickerHour, pickerMinute, pickerAmPm);
                    await updateSetting({ dailyReminderTime: time24 });
                    await scheduleDailyReminder(time24);
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={styles.timePickerSaveText}>{t('setTime')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
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

      <View style={{ height: 80 }} />
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
  timeLabel: {
    fontSize: 14,
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
  timeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  timePickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  timePickerRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  timePickerColumn: {
    flex: 1,
  },
  timePickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  timePickerSelect: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timePickerSelectText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timePickerList: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 150,
  },
  timePickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  timePickerItemText: {
    fontSize: 15,
    textAlign: 'center',
  },
  ampmContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ampmButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ampmButtonActive: {
    backgroundColor: Colors.purple,
  },
  ampmText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray,
  },
  ampmTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  timePickerSave: {
    backgroundColor: Colors.purple,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  timePickerSaveText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
