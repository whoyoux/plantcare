import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const android = Platform.OS === 'android';

/**
 * The app's haptics, named by meaning so each feeling always says the same thing. Keep them for
 * moments that matter: native tabs, context menus, alerts and the share sheet already give their
 * own. iOS stays silent in Low Power Mode, with system haptics off, and while the camera runs.
 */
export const haptics = {
  /** A press that starts something: the shutter, opening an action sheet. */
  tap() {
    void (android
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Context_Click)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },
  /** Something switched on or off: the torch, reminders. */
  toggle(on: boolean) {
    void (android
      ? Haptics.performAndroidHapticsAsync(on ? Haptics.AndroidHaptics.Toggle_On : Haptics.AndroidHaptics.Toggle_Off)
      : Haptics.selectionAsync());
  },
  /** A swipe went far enough to act when released. */
  threshold() {
    void (android
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  },
  /** It worked: an identification arrived, a plant was added or watered, signed in. */
  success() {
    void (android
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  /** Stop and read: a delete confirmation, "not a plant", the daily limit. */
  warning() {
    void (android
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  },
  /** It failed: network or server errors. */
  error() {
    void (android
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  },
};
