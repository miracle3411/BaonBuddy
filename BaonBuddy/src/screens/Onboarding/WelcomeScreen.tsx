import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';

type Props = NativeStackScreenProps<any, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>💰</Text>
        <Text style={styles.title}>Baon Buddy</Text>
        <Text style={styles.tagline}>
          Alam mo ba kung kaya ng baon mo hanggang Friday?
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('SetAllowance')}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Magsimula na</Text>
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
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.purple,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 18,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: Colors.purple,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
