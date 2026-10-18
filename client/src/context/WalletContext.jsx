import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { apiRequest } from '../utils/api.js';
import { useAuth } from './AuthContext.jsx';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const { user, token, setWallet: setAuthWallet } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [buyModalDefaultType, setBuyModalDefaultType] = useState('silver');
  const [viewReceiptId, setViewReceiptId] = useState(null);

  const refreshWallet = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await apiRequest('/wallet/balances');
      if (res.success && res.wallet) {
        setWallet(res.wallet);
        setAuthWallet(res.wallet);
      }
    } catch (err) {
      console.warn('Error refreshing wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshWallet();
    } else {
      setWallet(null);
    }
  }, [token]);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00F2FE', '#9d4edd', '#fbbf24', '#10b981']
      });
    } catch (e) {
      // safe fallback if canvas not available
    }
  };

  const openBuyModal = (type = 'silver') => {
    setBuyModalDefaultType(type);
    setIsBuyModalOpen(true);
  };

  const closeBuyModal = () => {
    setIsBuyModalOpen(false);
  };

  const openReceipt = (receiptId) => {
    setViewReceiptId(receiptId);
  };

  const closeReceipt = () => {
    setViewReceiptId(null);
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        loading,
        refreshWallet,
        isBuyModalOpen,
        openBuyModal,
        closeBuyModal,
        buyModalDefaultType,
        viewReceiptId,
        openReceipt,
        closeReceipt,
        triggerCelebration
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
