import { Platform } from 'react-native';
import { parseISO } from 'date-fns';

let Notifications: any = null;
let Device: any = null;
try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch {
  // Not available in Expo Go
}

export async function requestPermissions(): Promise<boolean> {
  if (!Notifications || !Device) return false;
  try {
    if (!Device.isDevice) return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleDailyReminder(time: string): Promise<void> {
  if (!Notifications) return;
  try {
    await cancelDailyReminder();

    const [hourStr, minStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);

    await Notifications.scheduleNotificationAsync({
      identifier: 'daily-reminder',
      content: {
        title: 'Baon Buddy',
        body: 'Huwag kalimutang i-log ang gastos mo ngayon!',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch {
    // silent
  }
}

export async function cancelDailyReminder(): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync('daily-reminder');
  } catch {
    // silent
  }
}

export async function scheduleResetReminder(endDate: string): Promise<void> {
  if (!Notifications) return;
  try {
    await cancelResetReminder();

    const end = parseISO(endDate);
    const reminderDate = new Date(end);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(9, 0, 0, 0);

    if (reminderDate <= new Date()) return;

    await Notifications.scheduleNotificationAsync({
      identifier: 'reset-reminder',
      content: {
        title: 'Baon Buddy',
        body: 'Bukas na ang huling araw ng iyong baon period. Handa ka na bang mag-reset?',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });
  } catch {
    // silent
  }
}

export async function cancelResetReminder(): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync('reset-reminder');
  } catch {
    // silent
  }
}

export async function sendOverspendAlert(amount: number): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Sobra na ang gastos!',
        body: `₱${amount.toFixed(2)} na ang gastos mo ngayon. Mag-ingat na.`,
      },
      trigger: null,
    });
  } catch {
    // silent
  }
}

export async function sendStreakMilestone(days: number): Promise<void> {
  if (!Notifications) return;
  const milestones = [3, 7, 14, 30];
  if (!milestones.includes(days)) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔥 ${days}-day streak!`,
        body: `${days} araw ka nang nasa budget. Galing mo!`,
      },
      trigger: null,
    });
  } catch {
    // silent
  }
}
