import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { AllowancePeriod } from '../../types';
import { savePeriods, saveSettings } from '../../storage/storage';
import { getNextPeriodDates } from '../../utils/budget';

type Frequency = 'weekly' | 'biweekly' | 'monthly';

interface FrequencyOption {
  key: Frequency;
  label: string;
  sublabel: string;
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { key: 'weekly',   label: 'Linggu-linggo',  sublabel: 'Weekly' },
  { key: 'biweekly', label: 'Tuwing 2 Linggo', sublabel: 'Every 2 Weeks' },
  { key: 'monthly',  label: 'Buwanan',         sublabel: 'Monthly' },
];

type Props = NativeStackScreenProps<any, 'SetResetDate'>;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export default function SetResetDateScreen({ navigation, route }: Props) {
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
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Kailan mag-rereload ang baon mo?</Text>

        {FREQUENCY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.card,
              selected === opt.key && styles.cardSelected,
            ]}
            onPress={() => setSelected(opt.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.cardLabel,
                selected === opt.key && styles.cardLabelSelected,
              ]}
            >
              {opt.label}
            </Text>
            <Text
              style={[
                styles.cardSublabel,
                selected === opt.key && styles.cardSublabelSelected,
              ]}
            >
              {opt.sublabel}
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
          {loading ? 'Loading...' : 'Simulan na!'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
    color: Colors.dark,
    marginBottom: 32,
    textAlign: 'center',
  },
  card: {
    borderWidth: 2,
    borderColor: Colors.border,
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
    color: Colors.dark,
  },
  cardLabelSelected: {
    color: Colors.purple,
  },
  cardSublabel: {
    fontSize: 14,
    color: Colors.gray,
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
