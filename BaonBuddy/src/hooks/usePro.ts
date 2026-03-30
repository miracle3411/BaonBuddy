// src/hooks/usePro.ts
import { useEffect, useState } from 'react';
import Purchases from 'react-native-purchases';

const ENTITLEMENT_ID = 'pro'; // Must match your RevenueCat entitlement ID exactly

export function usePro() {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkProStatus();
  }, []);

  async function checkProStatus() {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setIsPro(customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined);
    } catch (e) {
      setIsPro(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function purchasePro() {
    try {
      const offerings = await Purchases.getOfferings();
      const monthly = offerings.current?.monthly;
      if (!monthly) throw new Error('No monthly offering found');
      await Purchases.purchasePackage(monthly);
      await checkProStatus();
      return true;
    } catch (e) {
      return false;
    }
  }

  async function restorePurchases() {
    try {
      await Purchases.restorePurchases();
      await checkProStatus();
      return true;
    } catch (e) {
      return false;
    }
  }

  return { isPro, isLoading, checkProStatus, purchasePro, restorePurchases };
}
