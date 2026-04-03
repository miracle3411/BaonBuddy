import { Platform } from 'react-native';
import { parseISO } from 'date-fns';
import { Language } from '../types';
import { t, tFn } from '../constants/translations';
import { getSettings } from '../storage/storage';

let Notifications: any = null;
let Device: any = null;
try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch {
  // Not available in Expo Go
}

async function getLang(): Promise<Language> {
  try {
    const settings = await getSettings();
    return settings.language;
  } catch {
    return 'en';
  }
}

export async function requestPermissions(): Promise<boolean> {
  if (!Notifications || !Device) return false;
  try {
    if (!Device.isDevice) return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Baon Buddy',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#534AB7',
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
    const lang = await getLang();

    const [hourStr, minStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);

    await Notifications.scheduleNotificationAsync({
      identifier: 'daily-reminder',
      content: {
        title: t('notifDailyTitle', lang),
        body: t('notifDailyBody', lang),
        channelId: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'default',
      },
    });
  } catch (e) {
    console.warn('scheduleDailyReminder failed:', e);
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
    const lang = await getLang();

    const end = parseISO(endDate);
    const reminderDate = new Date(end);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(9, 0, 0, 0);

    if (reminderDate <= new Date()) return;

    await Notifications.scheduleNotificationAsync({
      identifier: 'reset-reminder',
      content: {
        title: t('notifResetTitle', lang),
        body: t('notifResetBody', lang),
        channelId: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
        channelId: 'default',
      },
    });
  } catch (e) {
    console.warn('scheduleResetReminder failed:', e);
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
    const granted = await requestPermissions();
    if (!granted) return;
    const lang = await getLang();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: t('notifOverspendTitle', lang),
        body: tFn('notifOverspendBody', lang)(amount.toFixed(2)),
        channelId: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
        channelId: 'default',
      },
    });
  } catch (e) {
    console.warn('sendOverspendAlert failed:', e);
  }
}

export async function sendStreakMilestone(days: number): Promise<void> {
  if (!Notifications) return;
  const milestones = [3, 7, 14, 30];
  if (!milestones.includes(days)) return;
  try {
    const granted = await requestPermissions();
    if (!granted) return;
    const lang = await getLang();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: tFn('notifStreakTitle', lang)(days),
        body: tFn('notifStreakBody', lang)(days),
        channelId: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
        channelId: 'default',
      },
    });
  } catch (e) {
    console.warn('sendStreakMilestone failed:', e);
  }
}
