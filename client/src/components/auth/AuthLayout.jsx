import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from './useAuth.js';

const initialRegisterState = {
  name: '',
  email: '',
  password: ''
};

const initialLoginState = {
  email: '',
  password: ''
};

const initialVerifyState = {
  email: '',
  code: ''
};

const initialResetState = {
  email: ''
};

const passwordRuleMessage = 'Use at least 8 characters with upper, lower case letters and a number.';

const validatePassword = (password = '') => {
  const trimmed = password.trim();
  if (trimmed.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(trimmed) || !/[a-z]/.test(trimmed)) {
    return 'Include both uppercase and lowercase letters.';
  }
  if (!/\d/.test(trimmed)) {
    return 'Include at least one number.';
  }
  return null;
};

const FormInput = ({
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  placeholder,
  required = true,
  error,
  inputMode
}) => {
  const baseClasses = 'rounded-2xl border bg-white px-3 py-2 text-base text-[#333333] shadow-sm focus:outline-none focus:ring-4';
  const inputClasses = error
    ? `${baseClasses} border-[#FF6F91] focus:border-[#FF6F91] focus:ring-[#FF6F91]/40`
    : `${baseClasses} border-[#E5E5E5] focus:border-[#A0E7E5] focus:ring-[#A0E7E5]/40`;

  return (
    <label className="flex flex-col gap-2 text-sm text-[#333333]">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        className={inputClasses}
      />
      {error ? <span className="text-xs text-[#FF6F91]">{error}</span> : null}
    </label>
  );
};

const PasswordInput = ({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  isVisible,
  onToggleVisibility,
  error,
  helper
}) => {
  const baseClasses = 'w-full rounded-2xl border bg-white px-3 py-2 text-base text-[#333333] shadow-sm focus:outline-none focus:ring-4';
  const inputClasses = error
    ? `${baseClasses} border-[#FF6F91] focus:border-[#FF6F91] focus:ring-[#FF6F91]/40`
    : `${baseClasses} border-[#E5E5E5] focus:border-[#A0E7E5] focus:ring-[#A0E7E5]/40`;

  return (
    <label className="flex flex-col gap-2 text-sm text-[#333333]">
      <span className="font-medium">{label}</span>
      <div className="relative">
        <input
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={inputClasses}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wide text-[#333333] transition hover:text-[#000]"
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
      {helper && !error ? <span className="text-xs text-[#9E9E9E]">{helper}</span> : null}
      {error ? <span className="text-xs text-[#FF6F91]">{error}</span> : null}
    </label>
  );
};

const AuthLayout = ({ isOpen = true, initialView = 'login', onClose }) => {
  const {
    register,
    login,
    verifyEmail,
    resendCode,
    requestPasswordReset,
    authError,
    setAuthError,
    isLoading,
    pendingEmail
  } = useAuth();

  const [view, setView] = useState(pendingEmail ? 'verify' : initialView);
  const [registerState, setRegisterState] = useState(initialRegisterState);
  const [loginState, setLoginState] = useState(initialLoginState);
  const [verifyState, setVerifyState] = useState(initialVerifyState);
  const [resetState, setResetState] = useState(initialResetState);
  const [passwordErrors, setPasswordErrors] = useState({ login: null, register: null });
  const [isLoginPasswordVisible, setIsLoginPasswordVisible] = useState(false);
  const [isRegisterPasswordVisible, setIsRegisterPasswordVisible] = useState(false);
  const [infoMessage, setInfoMessage] = useState(null);

  const shouldRender = Boolean(isOpen);

  useEffect(() => {
    if (pendingEmail) {
      setVerifyState((prev) => ({ ...prev, email: pendingEmail }));
      setView('verify');
      setInfoMessage('We sent a verification code to your email. Enter it below to activate your account.');
    }
  }, [pendingEmail]);

  useEffect(() => {
    if (!pendingEmail) {
      setView(initialView);
    }
  }, [initialView, pendingEmail]);

  useEffect(() => {
    setAuthError(null);
    setPasswordErrors({ login: null, register: null });
    setIsLoginPasswordVisible(false);
    setIsRegisterPasswordVisible(false);
  }, [view, setAuthError]);

  useEffect(() => {
    if (!shouldRender) {
      setRegisterState(initialRegisterState);
      setLoginState(initialLoginState);
      setVerifyState(initialVerifyState);
      setResetState(initialResetState);
      setInfoMessage(null);
      setView(pendingEmail ? 'verify' : initialView);
      setPasswordErrors({ login: null, register: null });
      setIsLoginPasswordVisible(false);
      setIsRegisterPasswordVisible(false);
    }
  }, [shouldRender, initialView, pendingEmail]);

  useEffect(() => {
    if (!shouldRender) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [shouldRender]);

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    const passwordError = validatePassword(registerState.password);
    if (passwordError) {
      setPasswordErrors((prev) => ({ ...prev, register: passwordError }));
      return;
    }
    const payload = {
      name: registerState.name.trim(),
      email: registerState.email.trim().toLowerCase(),
      password: registerState.password
    };

    try {
      await register(payload);
      setInfoMessage('Registration successful. Check your inbox for the verification code.');
      setRegisterState(initialRegisterState);
      setPasswordErrors((prev) => ({ ...prev, register: null }));
    } catch (error) {
      console.error('Registration failed', error);
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    if (!loginState.password.trim()) {
      setPasswordErrors((prev) => ({ ...prev, login: 'Password is required.' }));
      return;
    }
    const payload = {
      email: loginState.email.trim().toLowerCase(),
      password: loginState.password
    };

    try {
      await login(payload);
      setLoginState(initialLoginState);
      setPasswordErrors((prev) => ({ ...prev, login: null }));
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleVerifySubmit = async (event) => {
    event.preventDefault();
    try {
      await verifyEmail({
        email: verifyState.email,
        code: verifyState.code
      });
      setVerifyState(initialVerifyState);
      setInfoMessage('Email verified! You are now logged in.');
    } catch (error) {
      console.error('Verification failed', error);
    }
  };

  const handleResend = async () => {
    if (!verifyState.email) return;
    try {
      await resendCode({ email: verifyState.email });
      setInfoMessage('We sent you a fresh verification code.');
    } catch (error) {
      console.error('Resend code failed', error);
    }
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();
    try {
      await requestPasswordReset({ email: resetState.email.trim().toLowerCase() });
      setInfoMessage('If that email exists with us, a password reset link is on the way.');
      setResetState(initialResetState);
    } catch (error) {
      console.error('Password reset request failed', error);
    }
  };

  const views = {
    login: {
      title: 'Login',
      subtitle: '',
      form: (
        <form className="space-y-4" onSubmit={handleLoginSubmit}>
          <FormInput
            label="Email"
            type="email"
            value={loginState.email}
            onChange={(event) => setLoginState((prev) => ({ ...prev, email: event.target.value }))}
            autoComplete="email"
            placeholder="you@example.com"
          />
          <PasswordInput
            label="Password"
            value={loginState.password}
            onChange={(event) => {
              const { value } = event.target;
              setLoginState((prev) => ({ ...prev, password: value }));
              setPasswordErrors((prev) => ({ ...prev, login: null }));
            }}
            autoComplete="current-password"
            placeholder="••••••••"
            isVisible={isLoginPasswordVisible}
            onToggleVisibility={() => setIsLoginPasswordVisible((prev) => !prev)}
            error={passwordErrors.login}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-[#A0E7E5] px-4 py-2 text-sm font-semibold text-[#333333] transition hover:bg-[#7BD8D5] disabled:opacity-60"
          >
            {isLoading ? 'Signing in…' : 'Continue'}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              type="button"
              onClick={() => {
                setInfoMessage(null);
                setView('register');
              }}
              className="text-[#9E9E9E] hover:text-[#333333]"
            >
              Create account
            </button>
            <button
              type="button"
              onClick={() => {
                setInfoMessage(null);
                setResetState(initialResetState);
                setView('forgot');
              }}
              className="text-[#9E9E9E] hover:text-[#333333]"
            >
              Forgot password?
            </button>
          </div>
        </form>
      )
    },
    register: {
      title: 'Register',
      subtitle: '',
      form: (
        <form className="space-y-4" onSubmit={handleRegisterSubmit}>
          <FormInput
            label="Name"
            type="text"
            value={registerState.name}
            onChange={(event) => setRegisterState((prev) => ({ ...prev, name: event.target.value }))}
            autoComplete="name"
            placeholder="Your full name"
            required={false}
          />
          <FormInput
            label="Email"
            type="email"
            value={registerState.email}
            onChange={(event) => setRegisterState((prev) => ({ ...prev, email: event.target.value }))}
            autoComplete="email"
            placeholder="you@example.com"
          />
          <PasswordInput
            label="Password"
            value={registerState.password}
            onChange={(event) => {
              const { value } = event.target;
              setRegisterState((prev) => ({ ...prev, password: value }));
              setPasswordErrors((prev) => ({ ...prev, register: null }));
            }}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            isVisible={isRegisterPasswordVisible}
            onToggleVisibility={() => setIsRegisterPasswordVisible((prev) => !prev)}
            helper={passwordRuleMessage}
            error={passwordErrors.register}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-[#A0E7E5] px-4 py-2 text-sm font-semibold text-[#333333] transition hover:bg-[#7BD8D5] disabled:opacity-60"
          >
            {isLoading ? 'Creating…' : 'Continue'}
          </button>
          <button
            type="button"
            onClick={() => {
              setInfoMessage(null);
              setResetState(initialResetState);
              setView('login');
            }}
            className="text-sm text-[#9E9E9E] hover:text-[#333333]"
          >
            Back to login
          </button>
        </form>
      )
    },
    forgot: {
      title: 'Reset password',
      subtitle: '',
      form: (
        <form className="space-y-4" onSubmit={handleResetSubmit}>
          <FormInput
            label="Email"
            type="email"
            value={resetState.email}
            onChange={(event) => setResetState((prev) => ({ ...prev, email: event.target.value }))}
            autoComplete="email"
            placeholder="you@example.com"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-[#A0E7E5] px-4 py-2 text-sm font-semibold text-[#333333] transition hover:bg-[#7BD8D5] disabled:opacity-60"
          >
            {isLoading ? 'Sending…' : 'Send reset link'}
          </button>
          <button
            type="button"
            onClick={() => {
              setInfoMessage(null);
              setView('login');
            }}
            className="text-sm text-[#9E9E9E] hover:text-[#333333]"
          >
            Back to login
          </button>
        </form>
      )
    },
    verify: {
      title: 'Verify',
      subtitle: '',
      form: (
        <form className="space-y-4" onSubmit={handleVerifySubmit}>
          <FormInput
            label="Email"
            type="email"
            value={verifyState.email}
            onChange={(event) => setVerifyState((prev) => ({ ...prev, email: event.target.value }))}
            autoComplete="email"
            placeholder="you@example.com"
          />
          <FormInput
            label="Verification code"
            type="text"
            value={verifyState.code}
            onChange={(event) => setVerifyState((prev) => ({ ...prev, code: event.target.value }))}
            autoComplete="one-time-code"
            placeholder="Enter 6-digit code"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-[#A0E7E5] px-4 py-2 text-sm font-semibold text-[#333333] transition hover:bg-[#7BD8D5] disabled:opacity-60"
          >
            {isLoading ? 'Checking…' : 'Confirm'}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={isLoading || !verifyState.email}
            className="text-sm text-[#9E9E9E] hover:text-[#333333] disabled:opacity-60"
          >
            Resend code
          </button>
        </form>
      )
    }
  };

  const currentView = views[view] || views.login;

  if (!shouldRender) {
    return null;
  }

  if (typeof document === 'undefined') {
    return null;
  }

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F2F2F2]/90 px-4 py-6">
      <div className="relative w-full max-w-md rounded-[32px] border border-[#E5E5E5] bg-white px-8 py-10 shadow-xl">
        {onClose && (
          <button
            type="button"
            onClick={() => onClose?.()}
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E5E5] text-[#9E9E9E] transition hover:text-[#333333]"
            aria-label="Close authentication panel"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6L18 18" />
              <path d="M6 18L18 6" />
            </svg>
          </button>
        )}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-[#333333]">{currentView.title}</h2>
          {infoMessage && (
            <div className="rounded-2xl border border-[#A0E7E5]/60 bg-[#A0E7E5]/20 px-4 py-3 text-sm text-[#333333]">
              {infoMessage}
            </div>
          )}
          {authError && (
            <div className="rounded-2xl border border-[#FFB6C1]/60 bg-[#FFB6C1]/20 px-4 py-3 text-sm text-[#333333]">
              {authError}
            </div>
          )}
          <div>{currentView.form}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default AuthLayout;
