import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('knovera_token'));
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newSignupBonusAlert, setNewSignupBonusAlert] = useState(false);

  // Initialize and check current user on load
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiRequest('/auth/me');
        if (res.success) {
          setUser(res.user);
          setWallet(res.wallet);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Failed to load user profile with token:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  // Dev-Mode Quick Login Bypass (instant testing for student or teacher)
  const devLogin = async (role = 'student', customEmail, customName) => {
    setLoading(true);
    try {
      const res = await apiRequest('/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({ role, customEmail, customName })
      });
      if (res.success) {
        localStorage.setItem('knovera_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setWallet(res.wallet);
        if (role === 'student' && res.wallet?.silver_coins >= 60) {
          setNewSignupBonusAlert(true);
        }
        return res;
      }
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth / Google Identity Services login
  const loginWithGoogle = async (profileData) => {
    setLoading(true);
    try {
      const res = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify(profileData)
      });
      if (res.success) {
        localStorage.setItem('knovera_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setWallet(res.wallet);
        if (res.isNewUser) {
          setNewSignupBonusAlert(true);
        }
        return res;
      }
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Mobile OTP / Email verification
  const loginWithOtp = async (phoneOrEmail, otp, role = 'student') => {
    setLoading(true);
    try {
      const res = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phoneOrEmail, otp, role })
      });
      if (res.success) {
        localStorage.setItem('knovera_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setWallet(res.wallet);
        if (res.isNewUser) {
          setNewSignupBonusAlert(true);
        }
        return res;
      }
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Role Switcher: seamlessly switch between Student and Teacher anytime
  const switchRole = async (newRole) => {
    try {
      const res = await apiRequest('/auth/switch-role', {
        method: 'POST',
        body: JSON.stringify({ newRole })
      });
      if (res.success) {
        localStorage.setItem('knovera_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setWallet(res.wallet);
        return res;
      }
    } catch (err) {
      console.error('Role switch failed:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('knovera_token');
    setToken(null);
    setUser(null);
    setWallet(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'student',
        token,
        wallet,
        loading,
        isLoggedIn: Boolean(user && token),
        devLogin,
        loginWithGoogle,
        loginWithOtp,
        switchRole,
        logout,
        setWallet,
        setUser,
        newSignupBonusAlert,
        setNewSignupBonusAlert
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
