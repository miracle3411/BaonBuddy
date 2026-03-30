import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';

type Props = NativeStackScreenProps<any, 'SetAllowance'>;

export default function SetAllowanceScreen({ navigation }: Props) {
  const [amount, setAmount] = useState('');

  const numericAmount = parseFloat(amount) || 0;
  const isValid = numericAmount > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Magkano ang baon mo?</Text>

        <View style={styles.inputRow}>
          <Text style={styles.currency}>₱</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={Colors.border}
            autoFocus
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, !isValid && styles.buttonDisabled]}
        onPress={() => navigation.navigate('SetResetDate', { amount: numericAmount })}
        disabled={!isValid}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Susunod</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 32,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currency: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.purple,
    marginRight: 8,
  },
  input: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.dark,
    minWidth: 120,
    textAlign: 'center',
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
