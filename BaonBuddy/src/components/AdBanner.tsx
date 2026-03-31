// src/components/AdBanner.tsx
import React from 'react';

import { usePro } from '../hooks/usePro';
import { AdMob } from '../constants/admob';

let BannerAd: any = null;
let BannerAdSize: any = null;
try {
  const ads = require('react-native-google-mobile-ads');
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
} catch {
  // Native module not available (e.g. running in Expo Go)
}

export function AdBanner() {
  const { isPro } = usePro();
  if (isPro || !BannerAd) return null;

  try {
    return (
      <BannerAd
        unitId={AdMob.BANNER_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    );
  } catch {
    return null;
  }
}
