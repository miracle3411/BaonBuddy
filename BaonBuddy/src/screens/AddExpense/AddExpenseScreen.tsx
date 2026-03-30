import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { CATEGORIES } from '../../constants/categories';
import { ExpenseCategory, Expense } from '../../types';
import { addExpense, getActivePeriod, getExpensesForPeriod } from '../../storage/storage';
import { calculateBudgetStatus } from '../../utils/budget';

type Props = NativeStackScreenProps<any, 'AddExpense'>;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export default function AddExpenseScreen({ navigation, route }: Props) {
  const editExpense = route.params?.expense as Expense | undefined;
  const isEdit = !!editExpense;

  const [amount, setAmount] = useState(isEdit ? editExpense.amount.toString() : '');
  const [category, setCategory] = useState<ExpenseCategory | null>(
    isEdit ? editExpense.category : null
  );
  const [note, setNote] = useState(isEdit ? editExpense.note : '');
  const [date] = useState(
    isEdit ? editExpense.date : new Date().toISOString().split('T')[0]
  );
  const [saving, setSaving] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const isValid = numericAmount > 0 && category !== null;

  async function handleSave() {
    if (!isValid || saving) return;
    setSaving(true);

    try {
      const activePeriod = await getActivePeriod();
      if (!activePeriod) {
        Alert.alert('Error', 'Walang active na baon period.');
        setSaving(false);
        return;
      }

      const expense: Expense = {
        id: generateId(),
        periodId: activePeriod.id,
        amount: numericAmount,
        category: category!,
        note: note.trim(),
        date,
        createdAt: new Date().toISOString(),
      };

      await addExpense(expense);

      // Check if overspending after adding
      const allExpenses = await getExpensesForPeriod(activePeriod.id);
      const status = calculateBudgetStatus(activePeriod, allExpenses);
      if (status.isOverspending) {
        // In Phase 2 we'll trigger a push notification here
      }

      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Hindi mai-save. Subukan ulit.');
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Amount input */}
        <View style={styles.amountSection}>
          <Text style={styles.currency}>₱</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={Colors.border}
            autoFocus
          />
        </View>

        {/* Category grid */}
        <Text style={styles.label}>Kategorya</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryCard,
                  isSelected && { borderColor: cat.color, backgroundColor: cat.color + '15' },
                ]}
                onPress={() => setCategory(cat.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    isSelected && { color: cat.color, fontWeight: '700' },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Note */}
        <Text style={styles.label}>Note</Text>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="Ano ito? (optional)"
          placeholderTextColor={Colors.border}
          returnKeyType="done"
        />

        {/* Date display */}
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Petsa:</Text>
          <Text style={styles.dateValue}>{date}</Text>
        </View>
      </ScrollView>

      {/* Save button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveButton, (!isValid || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isValid || saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'I-save'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  currency: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.purple,
    marginRight: 8,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.dark,
    minWidth: 100,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  categoryCard: {
    width: '47%',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.dark,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    color: Colors.gray,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.grayLight,
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
