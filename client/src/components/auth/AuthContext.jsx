import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AuthContext from './AuthContext.js';
import authApi from './authApi.js';

const storageKey = 'sgpapers.auth';

const readPersistedAuth = () => {
  if (typeof window === 'undefined') {
    return { user: null, token: null };
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return { user: null, token: null };
    }
    const parsed = JSON.parse(raw);
    return {
      user: parsed?.user ?? null,
      token: parsed?.token ?? null,
    };
  } catch (error) {
    console.error('Failed to parse persisted auth state', error);
    return { user: null, token: null };
  }
};

export const AuthProvider = ({ children }) => {
  const persisted = useMemo(() => readPersistedAuth(), []);
  const [user, setUser] = useState(persisted.user);
  const [token, setToken] = useState(persisted.token);
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!token || !user) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ token, user })
    );
  }, [token, user]);

  const handleLogin = async (credentials) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.login(credentials);
      setUser(data.user);
      setToken(data.token);
      setPendingEmail(null);
      return data;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (payload) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.register(payload);
      setPendingEmail(payload.email.trim().toLowerCase());
      return data;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async ({ email, code }) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.verifyEmail({ email, code });
      setUser(data.user);
      setToken(data.token);
      setPendingEmail(null);
      return data;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async ({ email }) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.resendCode({ email });
      return data;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPasswordReset = async ({ email }) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.requestPasswordReset({ email });
      return data;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (payload) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.resetPassword(payload);
      return data;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setPendingEmail(null);
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authError,
        isLoading,
        pendingEmail,
        register: handleRegister,
        login: handleLogin,
        verifyEmail: handleVerifyEmail,
        resendCode: handleResendCode,
        requestPasswordReset: handleRequestPasswordReset,
        resetPassword: handleResetPassword,
        logout,
        isAuthenticated: Boolean(user && token),
        setAuthError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
