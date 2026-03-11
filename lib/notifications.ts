import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and store the Expo push token in Supabase.
 * Call this once after the user is authenticated.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[Push] Not a physical device — skipping push registration');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permission denied');
    return null;
  }

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('sos', {
      name: 'SOS Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#DC2626',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('default', {
      name: 'DawnBreaker',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: undefined, // uses app.json expo.extra.eas.projectId if set
  });
  const token = tokenData.data;

  // Store token in Supabase
  await savePushToken(token);
  return token;
}

/**
 * Upsert the push token for the current user in Supabase.
 */
async function savePushToken(token: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const deviceId = Device.modelName ?? 'unknown';

  await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: user.id,
        token,
        device_id: deviceId,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,device_id' }
    );
}

/**
 * Send an SOS push notification to all members of a squad (except the sender).
 * Uses the Expo Push API directly from the client.
 */
export async function sendSOSNotification(
  squadId: string,
  senderUsername: string
): Promise<void> {
  // Get push tokens for all squad members except the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: members } = await supabase
    .from('squad_members')
    .select('user_id')
    .eq('squad_id', squadId)
    .neq('user_id', user.id);

  if (!members || members.length === 0) return;

  const memberIds = members.map((m: any) => m.user_id);

  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .in('user_id', memberIds);

  if (!tokens || tokens.length === 0) return;

  // Send via Expo Push API
  const messages = tokens.map((row: any) => ({
    to: row.token,
    channelId: 'sos',
    sound: 'default',
    title: '🚨 SOS — SOLDIER DOWN',
    body: `${senderUsername.toUpperCase()} NEEDS BACKUP NOW`,
    data: { type: 'sos', squadId },
    priority: 'high' as const,
    badge: 1,
  }));

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error('[Push] Failed to send SOS notification:', err);
  }
}

/**
 * Send a generic squad notification (e.g., new message, check-in reminder).
 */
export async function sendSquadNotification(
  squadId: string,
  title: string,
  body: string,
  excludeUserId?: string
): Promise<void> {
  const { data: members } = await supabase
    .from('squad_members')
    .select('user_id')
    .eq('squad_id', squadId);

  if (!members) return;

  const memberIds = members
    .map((m: any) => m.user_id)
    .filter((id: string) => id !== excludeUserId);

  if (memberIds.length === 0) return;

  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .in('user_id', memberIds);

  if (!tokens || tokens.length === 0) return;

  const messages = tokens.map((row: any) => ({
    to: row.token,
    channelId: 'default',
    sound: 'default',
    title,
    body,
    data: { squadId },
  }));

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error('[Push] Failed to send squad notification:', err);
  }
}
