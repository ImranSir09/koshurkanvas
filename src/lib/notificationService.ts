import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

const KASHMIRI_DAILY_QUOTES = [
  { title: "کٲشُر لیٚکھُن – Daily Inspiration", body: "پۆز وُنُک کٲشُر مَثَل: «گۆڈَن کَرو کار، تُہِند دِل روزِ خوش» – Create a beautiful Kashmiri graphic design today!" },
  { title: "کٲشُر کینواس – Calligraphy Prompt", body: "کٲشُر مَثَل: «علم چھُ نُور» – Design a calligraphy poster using Urdu/Kashmiri Nastaliq font!" },
  { title: "کٲشُر سٹوڈیو – New Design Idea", body: "کٲشُر بٲتھ: «یہِ چھُ سۆندَر کٲشُر وادی» – Share your poetry design with friends and family." },
  { title: "Kashur Kanvas Reminder", body: "Design a quote or proverb in beautiful Kashmiri script today. Tap to open Koshur Kanvas!" },
];

export interface NotificationState {
  pushToken: string | null;
  pushEnabled: boolean;
  localEnabled: boolean;
  lastError: string | null;
}

let notificationState: NotificationState = {
  pushToken: typeof window !== 'undefined' ? localStorage.getItem('kashur_fcm_token') || null : null,
  pushEnabled: typeof window !== 'undefined' && localStorage.getItem('kashur_push_enabled') === 'true',
  localEnabled: typeof window !== 'undefined' && localStorage.getItem('kashur_local_enabled') === 'true',
  lastError: null,
};

type NotificationCallback = (notification: { title: string; body: string; data?: any }) => void;
const notificationListeners: NotificationCallback[] = [];

export function onNotificationReceived(callback: NotificationCallback) {
  notificationListeners.push(callback);
}

/**
 * Initialize Push Notifications (FCM) & Local Notifications only when explicitly called/enabled by user
 */
export async function initNotificationService(): Promise<NotificationState> {
  if (typeof window === 'undefined') return notificationState;

  if (Capacitor.isNativePlatform()) {
    try {
      // 1. Create Notification Channel on Android if local notifications enabled
      try {
        await LocalNotifications.createChannel({
          id: 'kashur_kanvas_notifications',
          name: 'Kashur Kanvas Notifications',
          description: 'Daily Kashmiri Calligraphy Prompts & Custom Alerts',
          importance: 4,
          visibility: 1,
          vibration: true,
          sound: 'default',
        });
      } catch (e) {
        console.warn('Could not create local notification channel:', e);
      }

      // 2. Push Notifications registration if enabled
      if (notificationState.pushEnabled) {
        try {
          const pushPerm = await PushNotifications.checkPermissions();
          if (pushPerm.receive === 'prompt' || pushPerm.receive === 'prompt-with-rationale') {
            const req = await PushNotifications.requestPermissions();
            if (req.receive === 'granted') {
              await registerPushListeners();
            }
          } else if (pushPerm.receive === 'granted') {
            await registerPushListeners();
          }
        } catch (e: any) {
          console.warn('Push notification check/registration warning:', e);
          notificationState.lastError = e?.message || String(e);
        }
      }

      // 3. Local Notifications permission & schedule if enabled
      if (notificationState.localEnabled) {
        try {
          const localPerm = await LocalNotifications.checkPermissions();
          if (localPerm.display === 'prompt' || localPerm.display === 'prompt-with-rationale') {
            await LocalNotifications.requestPermissions();
          }
          await scheduleDailyInspiration();
        } catch (e: any) {
          console.warn('Local notification check/schedule warning:', e);
          notificationState.lastError = e?.message || String(e);
        }
      }
    } catch (err: any) {
      console.warn('Native notification service error (non-blocking):', err);
      notificationState.lastError = err?.message || String(err);
    }
  }

  return notificationState;
}

/**
 * Register FCM push notification listeners
 */
async function registerPushListeners() {
  try {
    // Register device with APNs / FCM
    await PushNotifications.register();

    // On registration success, get FCM token
    await PushNotifications.addListener('registration', (token: Token) => {
      console.log('FCM Registration Token:', token.value);
      notificationState.pushToken = token.value;
      localStorage.setItem('kashur_fcm_token', token.value);
    });

    // On registration error
    await PushNotifications.addListener('registrationError', (err: any) => {
      console.error('FCM Registration Error:', err);
      notificationState.lastError = err?.error || 'Registration failed';
    });

    // Foreground notification received
    await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received in foreground:', notification);
      notificationListeners.forEach(cb => cb({
        title: notification.title || 'Kashur Kanvas',
        body: notification.body || '',
        data: notification.data
      }));
    });

    // Tap action on notification
    await PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push notification tapped:', action);
      const data = action.notification.data;
      if (data && data.quote) {
        // Broadcast event or window dispatch if needed
        window.dispatchEvent(new CustomEvent('kashur_notification_tap', { detail: data }));
      }
    });

    // Listen to local notification taps
    await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      console.log('Local notification tapped:', action);
      window.dispatchEvent(new CustomEvent('kashur_notification_tap', { detail: action.notification.extra }));
    });
  } catch (err: any) {
    console.warn('Error setting up Push Notification listeners:', err);
  }
}

/**
 * Schedule recurring daily local notification for daily Kashmiri calligraphy prompts
 */
export async function scheduleDailyInspiration() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Cancel any previous scheduled daily notification
    await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });

    const randomQuote = KASHMIRI_DAILY_QUOTES[Math.floor(Math.random() * KASHMIRI_DAILY_QUOTES.length)];

    // Schedule for 9:00 AM daily
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(9, 0, 0, 0);
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1001,
          title: randomQuote.title,
          body: randomQuote.body,
          schedule: {
            at: scheduledTime,
            repeats: true,
            every: 'day',
          },
          channelId: 'kashur_kanvas_notifications',
          smallIcon: 'ic_launcher_foreground',
          iconColor: '#047857',
          extra: { type: 'daily_inspiration', quote: randomQuote.body },
        },
      ],
    });

    localStorage.setItem('kashur_local_enabled', 'true');
    notificationState.localEnabled = true;
  } catch (err) {
    console.warn('Failed to schedule daily local notification:', err);
  }
}

/**
 * Trigger an instant test notification (useful for testing in-app or settings)
 */
export async function sendTestNotification(customTitle?: string, customBody?: string) {
  const title = customTitle || 'کٲشُر لیٚکھُن سٹوڈیو – Test Notification';
  const body = customBody || ' Push & Local Notifications are active on your device!';

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 100000),
            title,
            body,
            channelId: 'kashur_kanvas_notifications',
            smallIcon: 'ic_launcher_foreground',
            iconColor: '#047857',
            extra: { type: 'test' },
          },
        ],
      });
      return true;
    } catch (e) {
      console.warn('Native test notification failed:', e);
    }
  }

  // Web notification fallback
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icon-192.png',
    });
    return true;
  }

  return false;
}

/**
 * Toggle push notification settings
 */
export async function togglePushNotifications(enabled: boolean) {
  notificationState.pushEnabled = enabled;
  localStorage.setItem('kashur_push_enabled', enabled ? 'true' : 'false');
  if (enabled && Capacitor.isNativePlatform()) {
    try {
      const pushPerm = await PushNotifications.requestPermissions();
      if (pushPerm.receive === 'granted') {
        await registerPushListeners();
      }
    } catch (e: any) {
      console.warn('Push notification enable failed:', e);
      notificationState.lastError = e?.message || String(e);
    }
  }
}

/**
 * Toggle local scheduled daily notifications
 */
export async function toggleLocalNotifications(enabled: boolean) {
  notificationState.localEnabled = enabled;
  localStorage.setItem('kashur_local_enabled', enabled ? 'true' : 'false');
  if (enabled) {
    if (Capacitor.isNativePlatform()) {
      try {
        const localPerm = await LocalNotifications.requestPermissions();
        if (localPerm.display === 'granted') {
          await scheduleDailyInspiration();
        }
      } catch (e: any) {
        console.warn('Local notification enable failed:', e);
        notificationState.lastError = e?.message || String(e);
      }
    }
  } else if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
    } catch (e) {
      console.warn('Failed to cancel local notifications:', e);
    }
  }
}

export function getNotificationState(): NotificationState {
  return { ...notificationState };
}
