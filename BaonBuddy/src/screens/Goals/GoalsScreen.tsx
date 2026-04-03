import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { SavingsGoal } from '../../types';
import { getGoals, updateGoal, deleteGoal } from '../../storage/storage';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';

type Props = { navigation: any };

export default function GoalsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  // Contribution modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [contribution, setContribution] = useState('');

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [])
  );

  async function loadGoals() {
    try {
      const all = await getGoals();
      setGoals(all);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  function openContributeModal(goal: SavingsGoal) {
    setSelectedGoal(goal);
    setContribution('');
    setModalVisible(true);
  }

  async function handleContribute() {
    if (!selectedGoal) return;
    const amount = parseFloat(contribution) || 0;
    if (amount <= 0) return;

    try {
      const newSaved = selectedGoal.savedAmount + amount;
      const isNowComplete = newSaved >= selectedGoal.targetAmount;

      const updated: SavingsGoal = {
        ...selectedGoal,
        savedAmount: newSaved,
        isCompleted: isNowComplete,
        completedAt: isNowComplete ? new Date().toISOString() : selectedGoal.completedAt,
      };

      await updateGoal(updated);
      setModalVisible(false);

      if (isNowComplete) {
        Alert.alert(t('goalComplete'), `${selectedGoal.name} — ${t('goalCompleteSub')}`);
      }

      await loadGoals();
    } catch {
      Alert.alert(t('error'), t('contributeError'));
    }
  }

  function openEditModal(goal: SavingsGoal) {
    setEditGoal(goal);
    setEditName(goal.name);
    setEditTarget(goal.targetAmount.toString());
    setEditModalVisible(true);
  }

  async function handleSaveEdit() {
    if (!editGoal) return;
    const newTarget = parseFloat(editTarget) || 0;
    if (editName.trim().length === 0 || newTarget <= 0) return;

    try {
      const updated: SavingsGoal = {
        ...editGoal,
        name: editName.trim(),
        targetAmount: newTarget,
        isCompleted: editGoal.savedAmount >= newTarget,
        completedAt: editGoal.savedAmount >= newTarget
          ? (editGoal.completedAt ?? new Date().toISOString())
          : null,
      };
      await updateGoal(updated);
      setEditModalVisible(false);
      await loadGoals();
    } catch {
      Alert.alert(t('error'), t('savingError'));
    }
  }

  function handleDeleteGoal(goal: SavingsGoal) {
    Alert.alert(t('deleteGoal'), t('deleteGoalConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteGoal(goal.id);
          await loadGoals();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('goals')}</Text>
      </View>

      {goals.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🐷</Text>
          <Text style={{ fontSize: 16, color: colors.textSecondary }}>
            {t('noGoals')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeGoals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const progress = item.targetAmount > 0
              ? Math.min(100, (item.savedAmount / item.targetAmount) * 100)
              : 0;
            const remaining = Math.max(0, item.targetAmount - item.savedAmount);

            return (
              <View style={[styles.goalCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Text style={[styles.goalName, { color: colors.text }]}>{item.name}</Text>
                <View style={[styles.progressBg, { backgroundColor: Colors.purpleLight }]}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={[styles.goalProgress, { color: colors.text }]}>
                  ₱{item.savedAmount.toFixed(2)} / ₱{item.targetAmount.toFixed(2)}
                </Text>
                <Text style={[styles.goalRemaining, { color: colors.textSecondary }]}>
                  ₱{remaining.toFixed(2)} {t('moreNeeded')}
                </Text>
                <View style={styles.goalActions}>
                  <TouchableOpacity
                    style={[styles.addButton, { flex: 1 }]}
                    onPress={() => openContributeModal(item)}
                  >
                    <Text style={styles.addButtonText}>{t('addAmount')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.goalIconButton}
                    onPress={() => openEditModal(item)}
                  >
                    <Ionicons name="pencil" size={18} color={Colors.purple} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.goalIconButton}
                    onPress={() => handleDeleteGoal(item)}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.meterRed} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            completedGoals.length > 0 ? (
              <View>
                <TouchableOpacity
                  style={styles.completedHeader}
                  onPress={() => setShowCompleted(!showCompleted)}
                >
                  <Text style={[styles.completedTitle, { color: colors.textSecondary }]}>
                    {t('completed')} ({completedGoals.length})
                  </Text>
                  <Ionicons
                    name={showCompleted ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
                {showCompleted &&
                  completedGoals.map((g) => (
                    <View
                      key={g.id}
                      style={[styles.goalCard, styles.completedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      <View style={styles.completedRow}>
                        <Ionicons name="checkmark-circle" size={20} color={Colors.meterGreen} />
                        <Text style={[styles.goalName, { color: colors.textSecondary, marginLeft: 8, flex: 1 }]}>
                          {g.name}
                        </Text>
                        <TouchableOpacity onPress={() => handleDeleteGoal(g)}>
                          <Ionicons name="trash-outline" size={18} color={Colors.meterRed} />
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.goalProgress, { color: colors.textSecondary }]}>
                        ₱{g.targetAmount.toFixed(2)}
                      </Text>
                    </View>
                  ))}
              </View>
            ) : null
          }
        />
      )}

      {/* New Goal button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(24, insets.bottom + 16) }]}>
        <TouchableOpacity
          style={styles.newGoalButton}
          onPress={() => navigation.navigate('AddGoal')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={styles.newGoalButtonText}>{t('newGoal')}</Text>
        </TouchableOpacity>
      </View>

      {/* Contribution Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('addTo')} "{selectedGoal?.name}"
            </Text>
            <View style={styles.modalInputRow}>
              <Text style={styles.modalCurrency}>₱</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                value={contribution}
                onChangeText={setContribution}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.border}
                autoFocus
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 16 }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirm,
                  (parseFloat(contribution) || 0) <= 0 && { backgroundColor: Colors.border },
                ]}
                onPress={handleContribute}
                disabled={(parseFloat(contribution) || 0) <= 0}
              >
                <Text style={styles.modalConfirmText}>{t('contribute')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('editGoal')}
            </Text>
            <Text style={[styles.editLabel, { color: colors.textSecondary }]}>{t('editGoalName')}</Text>
            <TextInput
              style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
              value={editName}
              onChangeText={setEditName}
            />
            <Text style={[styles.editLabel, { color: colors.textSecondary, marginTop: 12 }]}>{t('editGoalTarget')}</Text>
            <TextInput
              style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
              value={editTarget}
              onChangeText={setEditTarget}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 16 }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalConfirmText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 40) + 8 : 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  goalCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  goalName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  progressBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.purple,
    borderRadius: 5,
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalRemaining: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 10,
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: Colors.purple,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.purple,
    fontWeight: '600',
    fontSize: 14,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  completedTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  completedCard: {
    opacity: 0.7,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
  },
  newGoalButton: {
    backgroundColor: Colors.purple,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  newGoalButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalCurrency: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.purple,
    marginRight: 8,
  },
  modalInput: {
    fontSize: 28,
    fontWeight: '700',
    flex: 1,
    borderBottomWidth: 2,
    paddingVertical: 4,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalConfirm: {
    backgroundColor: Colors.purple,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalConfirmText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  goalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalIconButton: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 8,
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
    fontSize: 16,
  },
});
