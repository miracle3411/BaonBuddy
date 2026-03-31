import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { usePro } from '../../hooks/usePro';
import { useLanguage } from '../../hooks/useLanguage';
import { Colors } from '../../constants/colors';

const BENEFIT_KEYS = [
  'noAds',
  'spendingCharts',
  'weeklyInsights',
  'unlimitedGoals',
  'shareableSummary',
  'pdfExport',
] as const;

export default function UpgradeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { isPro, purchasePro, restorePurchases } = usePro();
  const { t } = useLanguage();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  async function handlePurchase() {
    setPurchasing(true);
    const success = await purchasePro();
    setPurchasing(false);
    if (success) {
      Alert.alert(t('purchaseSuccess'), t('purchaseSuccessSub'), [
        { text: t('ok'), onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert(t('purchaseFail'), t('purchaseFailSub'));
    }
  }

  async function handleRestore() {
    setRestoring(true);
    const success = await restorePurchases();
    setRestoring(false);
    if (success && isPro) {
      Alert.alert(t('restoreSuccess'), t('restoreSuccessSub'), [
        { text: t('ok'), onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert(t('restoreFail'), t('restoreFailSub'));
    }
  }

  if (isPro) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.proActive, { color: Colors.meterGreen }]}>{t('proActive')}</Text>
        <Text style={[styles.proSubtext, { color: colors.textSecondary }]}>
          {t('proThankYou')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.heading, { color: colors.text }]}>{t('baonBuddyPro')}</Text>

      <View style={styles.benefitsList}>
        {BENEFIT_KEYS.map((key) => (
          <View key={key} style={styles.benefitRow}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={[styles.benefitText, { color: colors.text }]}>{t(key)}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.price, { color: colors.text }]}>₱25 {t('perMonth')}</Text>
      <Text style={[styles.trial, { color: Colors.meterGreen }]}>{t('freeTrial')}</Text>

      <TouchableOpacity
        style={[styles.purchaseButton, purchasing && styles.buttonDisabled]}
        onPress={handlePurchase}
        disabled={purchasing || restoring}
      >
        {purchasing ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.purchaseButtonText}>{t('tryFree')}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleRestore}
        disabled={purchasing || restoring}
      >
        {restoring ? (
          <ActivityIndicator color={Colors.purple} />
        ) : (
          <Text style={[styles.restoreText, { color: Colors.purple }]}>
            {t('restorePurchase')}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={[styles.finePrint, { color: colors.textSecondary }]}>
        {t('cancelAnytime')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 32,
    marginTop: 16,
  },
  benefitsList: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  checkmark: {
    fontSize: 18,
    color: Colors.meterGreen,
    fontWeight: '700',
    marginRight: 12,
    width: 24,
  },
  benefitText: {
    fontSize: 16,
    flex: 1,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  trial: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 28,
  },
  purchaseButton: {
    backgroundColor: Colors.purple,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  restoreButton: {
    paddingVertical: 12,
    marginBottom: 24,
  },
  restoreText: {
    fontSize: 15,
    fontWeight: '600',
  },
  finePrint: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  proActive: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 60,
  },
  proSubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 32,
  },
});
