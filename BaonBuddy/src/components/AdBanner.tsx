// src/components/AdBanner.tsx
import React from 'react';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { usePro } from '../hooks/usePro';
import { AdMob } from '../constants/admob';

export function AdBanner() {
  const { isPro } = usePro();
  if (isPro) return null;
  return (
    <BannerAd
      unitId={AdMob.BANNER_ID}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: true }}
    />
  );
}
