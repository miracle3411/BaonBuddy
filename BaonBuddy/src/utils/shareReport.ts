import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { RefObject } from 'react';
import { View } from 'react-native';

export async function shareReport(viewRef: RefObject<View>): Promise<void> {
  if (!viewRef.current) return;

  try {
    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing not available on this device');
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'Share Baon Buddy Summary',
    });
  } catch (e) {
    throw e;
  }
}
