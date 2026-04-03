import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { addGoal } from '../../storage/storage';
import { SavingsGoal } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';

type Props = NativeStackScreenProps<any, 'AddGoal'>;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export default function AddGoalScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const isValid = name.trim().length > 0 && numericAmount > 0;

  async function handleSave() {
    if (!isValid || saving) return;
    setSaving(true);

    try {
      const goal: SavingsGoal = {
        id: generateId(),
        name: name.trim(),
        targetAmount: numericAmount,
        savedAmount: 0,
        createdAt: new Date().toISOString(),
        completedAt: null,
        isCompleted: false,
      };

      await addGoal(goal);
      navigation.goBack();
    } catch {
      Alert.alert(t('error'), t('savingError'));
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('goalName')}</Text>
        <TextInput
          style={[styles.nameInput, { color: colors.text, borderColor: colors.border }]}
          value={name}
          onChangeText={setName}
          placeholder={t('goalPlaceholder')}
          placeholderTextColor={colors.border}
          autoFocus
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('targetAmount')}</Text>
        <View style={styles.amountRow}>
          <Text style={styles.currency}>₱</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.text, borderColor: colors.border }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.border}
          />
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(32, insets.bottom + 16) }]}>
        <TouchableOpacity
          style={[styles.saveButton, (!isValid || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isValid || saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {saving ? t('loading') : t('saveGoal')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currency: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.purple,
    marginRight: 8,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '700',
    flex: 1,
    borderBottomWidth: 2,
    paddingVertical: 4,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: Colors.purple,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.border,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
