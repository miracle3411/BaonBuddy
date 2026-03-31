import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { AllowancePeriod } from '../../types';
import { savePeriods, saveSettings } from '../../storage/storage';
import { getNextPeriodDates } from '../../utils/budget';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { scheduleDailyReminder, scheduleResetReminder, requestPermissions } from '../../hooks/useNotifications';

type Frequency = 'weekly' | 'biweekly' | 'monthly';

type Props = NativeStackScreenProps<any, 'SetResetDate'>;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export default function SetResetDateScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const amount = route.params?.amount as number;
  const [selected, setSelected] = useState<Frequency>('weekly');
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    if (loading) return;
    setLoading(true);

    try {
      const { startDate, endDate } = getNextPeriodDates(selected);

      const newPeriod: AllowancePeriod = {
        id: generateId(),
        amount,
        startDate,
        endDate,
        frequency: selected,
        isActive: true,
      };

      await savePeriods([newPeriod]);
      await saveSettings({ hasCompletedOnboarding: true });

      // Schedule notifications
      await requestPermissions();
      await scheduleDailyReminder('20:00');
      await scheduleResetReminder(endDate);

      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (e) {
      Alert.alert('Error', 'Hindi mai-save ang data. Subukan ulit.');
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{t('whenReload')}</Text>

        {([
          { key: 'weekly' as Frequency, labelKey: 'weekly' as const },
          { key: 'biweekly' as Frequency, labelKey: 'biweekly' as const },
          { key: 'monthly' as Frequency, labelKey: 'monthly' as const },
        ]).map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.card,
              { borderColor: colors.border },
              selected === opt.key && styles.cardSelected,
            ]}
            onPress={() => setSelected(opt.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.cardLabel,
                { color: colors.text },
                selected === opt.key && styles.cardLabelSelected,
              ]}
            >
              {t(opt.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleStart}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {loading ? t('loading') : t('letsStart')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
  },
  card: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: Colors.purple,
    backgroundColor: Colors.purpleLight,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardLabelSelected: {
    color: Colors.purple,
  },
  cardSublabel: {
    fontSize: 14,
    marginTop: 4,
  },
  cardSublabelSelected: {
    color: Colors.purpleDark,
  },
  button: {
    backgroundColor: Colors.purple,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.border,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
