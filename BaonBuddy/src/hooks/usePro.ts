// src/hooks/usePro.ts
import { useEffect, useState } from 'react';

let Purchases: any = null;
try {
  Purchases = require('react-native-purchases').default;
} catch {
  // Native module not available (e.g. running in Expo Go)
}

const ENTITLEMENT_ID = 'pro';

export function usePro() {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkProStatus();
  }, []);

  async function checkProStatus() {
    if (!Purchases) {
      setIsLoading(false);
      return;
    }
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setIsPro(customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined);
    } catch {
      setIsPro(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function purchasePro() {
    if (!Purchases) return false;
    try {
      const offerings = await Purchases.getOfferings();
      const monthly = offerings.current?.monthly;
      if (!monthly) throw new Error('No monthly offering found');
      await Purchases.purchasePackage(monthly);
      await checkProStatus();
      return true;
    } catch {
      return false;
    }
  }

  async function restorePurchases() {
    if (!Purchases) return false;
    try {
      await Purchases.restorePurchases();
      await checkProStatus();
      return true;
    } catch {
      return false;
    }
  }

  return { isPro, isLoading, checkProStatus, purchasePro, restorePurchases };
}
