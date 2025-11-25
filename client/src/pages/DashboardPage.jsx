import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import RadarChart from '../components/RadarChart.jsx';
import { useAuth } from '../components/auth/useAuth.js';
import performanceApi from '../components/performance/performanceApi.js';
import { useProfile } from '../components/profile/useProfile.js';

const numberFormat = (value) => (Number.isFinite(value) ? value.toLocaleString('en-SG') : '0');

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0m';
  }
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs > 0) {
    return `${hrs}h ${remMins}m`;
  }
  return `${mins}m`;
};

const RADAR_PREVIEW_SIZE = 480;
const RADAR_MODAL_SIZE = 680;
const RADAR_MODAL_TITLE_ID = 'dashboard-lifetime-radar-modal-title';
const RADAR_MODAL_DESC_ID = 'dashboard-lifetime-radar-modal-description';

const DashboardPage = ({ onBack }) => {
  const { token, isAuthenticated, logout } = useAuth();
  const { profile } = useProfile();
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    setIsRefreshing(true);
    try {
      const data = await performanceApi.fetchSummary({ token });
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch dashboard summary', error);
      if (error?.status === 401 || error?.status === 403) {
        logout();
        setSummary(null);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated, token, logout]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setSummary(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetchSummary();
  }, [isAuthenticated, token, fetchSummary]);

  const sessions = useMemo(() => summary?.sessions ?? [], [summary]);
  const totals = summary?.totals ?? {};
  const practiceTotals = summary?.cumulativeByType?.practice ?? {};
  const paperTotals = summary?.cumulativeByType?.paper ?? {};
  const subjectStats = summary?.subjectStats ?? [];
  const practiceTopicStats = useMemo(() => summary?.practiceTopicStats ?? [], [summary]);

  const normaliseValue = (value) => (Number.isFinite(value) ? value : 0);
  const clampPercent = (value) => {
    const numeric = normaliseValue(value);
    if (numeric < 0) return 0;
    if (numeric > 100) return 100;
    return Math.round(numeric);
  };

  const totalSessions = normaliseValue(totals.totalSessions);
  const practiceSessionsCount = normaliseValue(totals.practiceSessions);
  const paperAttemptsCount = normaliseValue(totals.paperAttempts);
  const totalQuestions = normaliseValue(totals.totalQuestions);
  const totalCorrect = normaliseValue(totals.totalCorrect);
  const totalIncorrect = normaliseValue(totals.totalIncorrect);
  const totalDurationSeconds = normaliseValue(totals.totalDurationSeconds);
  const totalTokensEarned = normaliseValue(totals.totalTokensEarned);
  const totalTokensSpent = normaliseValue(totals.totalTokensSpent);
  const netTokens = Math.max(0, totalTokensEarned - totalTokensSpent);
  const walletTokens = normaliseValue(profile?.walletTokens ?? 0);

  const averageAccuracyPercent = clampPercent(totals.averageAccuracy);
  const practiceAccuracyPercent = clampPercent(practiceTotals.averageAccuracy);
  const paperAccuracyPercent = clampPercent(paperTotals.averageAccuracy);

  const averageAccuracy = `${averageAccuracyPercent}%`;
  const practiceAccuracy = `${practiceAccuracyPercent}%`;
  const paperAccuracy = `${paperAccuracyPercent}%`;

  const weeklySummary = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return { count: 0, durationSeconds: 0 };
    }
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return sessions.reduce(
      (acc, session) => {
        const completedAt = session?.completedAt ? new Date(session.completedAt).getTime() : null;
        if (completedAt && completedAt >= weekAgo) {
          acc.count += 1;
          acc.durationSeconds += normaliseValue(session.durationSeconds);
        }
        return acc;
      },
      { count: 0, durationSeconds: 0 }
    );
  }, [sessions]);

  const heroMessage = useMemo(() => {
    if (totalSessions === 0) {
      return 'Your story starts here. Start your first practice to unlock streaks and tokens.';
    }
    if (averageAccuracyPercent >= 85) {
      return 'Phenomenal accuracy! Keep stretching yourself with a new past paper.';
    }
    if (weeklySummary.count >= 3) {
      return 'You’re building a powerful habit—keep stacking those wins this week.';
    }
    if (averageAccuracyPercent >= 60) {
      return 'Solid effort! A little more practice will boost your confidence even more.';
    }
    return 'Every attempt is progress. BuddyNC is cheering you on—try another round today!';
  }, [averageAccuracyPercent, totalSessions, weeklySummary.count]);

  const heroSubtext = weeklySummary.count > 0
    ? `You’ve logged ${weeklySummary.count} session${weeklySummary.count === 1 ? '' : 's'} and ${formatDuration(weeklySummary.durationSeconds)} this week.`
    : 'Let’s make this week count with a fresh session.';

  const lifetimeBestStreak = useMemo(
    () => sessions.reduce((max, session) => Math.max(max, normaliseValue(session.bestStreak)), 0),
    [sessions]
  );

  const practiceDuration = formatDuration(normaliseValue(practiceTotals.totalDurationSeconds));
  const paperDuration = formatDuration(normaliseValue(paperTotals.totalDurationSeconds));

  const radarChartData = useMemo(() => {
    if (!practiceTopicStats || practiceTopicStats.length === 0) {
      return [];
    }
    return practiceTopicStats.map((topic) => {
      const label = typeof topic?.label === 'string' && topic.label.trim() ? topic.label.trim() : 'General';
      const attemptedRaw = normaliseValue(topic?.attempted);
      const correctRaw = normaliseValue(topic?.correct);
      const attempted = Math.max(0, Math.round(attemptedRaw));
      const correct = Math.max(0, Math.min(attempted, Math.round(correctRaw)));
      return {
        label,
        value: correct,
        total: Math.max(attempted, correct),
      };
    });
  }, [practiceTopicStats]);

  const hasRadarData = useMemo(
    () => radarChartData.some((topic) => Number.isFinite(topic.total) && topic.total > 0),
    [radarChartData]
  );

  const radarTopTopics = useMemo(() => {
    if (!practiceTopicStats || practiceTopicStats.length === 0) {
      return [];
    }
    return practiceTopicStats
      .map((topic) => {
        const label = typeof topic?.label === 'string' && topic.label.trim() ? topic.label.trim() : 'General';
        const attemptedRaw = normaliseValue(topic?.attempted);
        const correctRaw = normaliseValue(topic?.correct);
        const sessionsRaw = normaliseValue(topic?.sessions);
        const attempted = Math.max(0, Math.round(attemptedRaw));
        const correct = Math.max(0, Math.min(attempted, Math.round(correctRaw)));
        const sessionsCount = Math.max(0, Math.round(sessionsRaw));
        const accuracyPercent = attempted > 0 ? clampPercent((correct / attempted) * 100) : 0;
        return {
          label,
          attempted,
          correct,
          sessions: sessionsCount,
          accuracyPercent,
        };
      })
      .filter((topic) => topic.attempted > 0)
      .sort((a, b) => {
        if (b.accuracyPercent !== a.accuracyPercent) {
          return b.accuracyPercent - a.accuracyPercent;
        }
        if (b.attempted !== a.attempted) {
          return b.attempted - a.attempted;
        }
        return a.label.localeCompare(b.label);
      })
      .slice(0, 3);
  }, [practiceTopicStats]);

  useEffect(() => {
    if (!hasRadarData && isRadarModalOpen) {
      setIsRadarModalOpen(false);
    }
  }, [hasRadarData, isRadarModalOpen]);

  useEffect(() => {
    if (!isRadarModalOpen) {
      return;
    }
    if (typeof document === 'undefined') {
      return;
    }
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isRadarModalOpen]);

  useEffect(() => {
    if (!isRadarModalOpen) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsRadarModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRadarModalOpen]);

  const openRadarModal = useCallback(() => {
    if (!hasRadarData) return;
    setIsRadarModalOpen(true);
  }, [hasRadarData]);

  const closeRadarModal = useCallback(() => {
    setIsRadarModalOpen(false);
  }, []);

  const highlightCards = useMemo(() => ([
    {
      id: 'sessions',
      label: 'Lifetime sessions',
      value: numberFormat(totalSessions),
      helper: `Practice ${numberFormat(practiceSessionsCount)} · Papers ${numberFormat(paperAttemptsCount)}`,
      accent: '#A0E7E5',
      icon: (
        <svg className="h-6 w-6 text-[#333333]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M4 5h16" />
          <path d="M4 12h16" />
          <path d="M4 19h16" />
          <path d="M9 5v14" />
        </svg>
      ),
    },
    {
      id: 'questions',
      label: 'Questions answered',
      value: numberFormat(totalQuestions),
      helper: `✅ ${numberFormat(totalCorrect)} · ❌ ${numberFormat(totalIncorrect)}`,
      accent: '#FFD6E8',
      icon: (
        <svg className="h-6 w-6 text-[#333333]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="m5 12 4 4 10-10" />
        </svg>
      ),
    },
    {
      id: 'focus',
      label: 'Focus time',
      value: formatDuration(totalDurationSeconds),
      helper: `This week · ${formatDuration(weeklySummary.durationSeconds)}`,
      accent: '#FDE68A',
      icon: (
        <svg className="h-6 w-6 text-[#333333]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l3 2" />
        </svg>
      ),
    },
    {
      id: 'tokens',
      label: 'Tokens collected',
      value: `+${numberFormat(totalTokensEarned)}`,
      helper: `Net ${numberFormat(netTokens)} · Wallet ${numberFormat(walletTokens)}`,
      accent: '#C7F9CC',
      footnote: `Spent ${numberFormat(totalTokensSpent)}`,
      icon: (
        <svg className="h-6 w-6 text-[#333333]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3 4 7v10l8 4 8-4V7Z" />
          <path d="M12 3v18" />
          <path d="m4 7 8 4 8-4" />
        </svg>
      ),
    },
  ]), [netTokens, paperAttemptsCount, practiceSessionsCount, totalCorrect, totalDurationSeconds, totalIncorrect, totalQuestions, totalSessions, totalTokensEarned, totalTokensSpent, walletTokens, weeklySummary.durationSeconds]);

  const heroStats = useMemo(() => ([
    {
      id: 'accuracy',
      label: 'Lifetime accuracy',
      value: averageAccuracy,
      helper: 'Across all questions',
      percent: averageAccuracyPercent,
    },
    {
      id: 'weekly',
      label: 'This week',
      value: weeklySummary.count > 0 ? `${weeklySummary.count} session${weeklySummary.count === 1 ? '' : 's'}` : 'Let’s get started',
      helper: `Focus ${formatDuration(weeklySummary.durationSeconds)}`,
      percent: Math.min(100, weeklySummary.count * 20),
    },
    {
      id: 'wallet',
      label: 'Wallet tokens',
      value: numberFormat(walletTokens),
      helper: `Net earned ${numberFormat(netTokens)}`,
    },
  ]), [averageAccuracy, averageAccuracyPercent, netTokens, walletTokens, weeklySummary.count, weeklySummary.durationSeconds]);

  if (!isAuthenticated) {
    return (
      <div className="space-y-8">
        <PageHeader title="Dashboard" onBack={onBack} />
        <section className="rounded-3xl border border-[#E5E5E5] bg-white p-6 text-center text-[#9E9E9E] sm:p-10">
          Sign in to view progress.
        </section>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Dashboard" onBack={onBack} />
        <section className="rounded-3xl border border-[#E5E5E5] bg-white p-6 text-center text-[#9E9E9E] sm:p-10">
          Loading…
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" onBack={onBack} />

      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#A0E7E5] via-[#F9F7FF] to-[#FFB6C1] px-6 py-9 shadow-xl sm:px-8 sm:py-10">
        <div className="absolute -right-24 -top-20 h-60 w-60 rounded-full bg-white/40 blur-3xl" aria-hidden />
        <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-white/35 blur-2xl" aria-hidden />
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col gap-6 text-center text-[#1F2933] sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:text-left">
            <div className="space-y-3 sm:max-w-xl sm:space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#1F2933]/60">BuddyNC Dashboard</p>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Your learning journey</h1>
              <p className="text-base font-semibold leading-relaxed sm:text-lg">{heroMessage}</p>
              <p className="text-sm text-[#1F2933]/70">{heroSubtext}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#1F2933]/50">
                Synced {new Date().toLocaleDateString('en-SG')}
              </p>
            </div>
            <button
              type="button"
              onClick={fetchSummary}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white/80 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-[#1F2933] shadow-sm ring-1 ring-white/60 transition hover:bg-white disabled:opacity-60 sm:self-start"
            >
              {isRefreshing && (
                <svg className="h-4 w-4 animate-spin text-[#1F2933]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              <span>{isRefreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {heroStats.map((stat) => (
              <div
                key={stat.id}
                className="rounded-3xl border border-white/60 bg-white/70 p-5 text-[#1F2933] shadow-sm backdrop-blur-sm"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9E9E9E]">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold text-[#333333]">{stat.value}</p>
                <p className="text-xs text-[#9E9E9E]">{stat.helper}</p>
                {typeof stat.percent === 'number' && stat.percent > 0 && (
                  <div className="mt-3 h-2 rounded-full bg-[#F2F2F2]">
                    <div
                      className="h-full rounded-full bg-[#1FADAD]"
                      style={{ width: `${Math.max(6, Math.min(100, stat.percent))}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {highlightCards.map((card) => (
          <article
            key={card.id}
            className="relative overflow-hidden rounded-3xl border border-[#E5E5E5] bg-white p-5 shadow-sm sm:p-6"
          >
            <span
              className="absolute -right-16 -top-14 h-32 w-32 rounded-full opacity-60"
              style={{ backgroundColor: `${card.accent}33` }}
              aria-hidden
            />
            <div className="flex items-center justify-between">
              <span
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${card.accent}33` }}
              >
                {card.icon}
              </span>
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#333333]">{card.value}</p>
            <p className="text-xs text-[#9E9E9E]">{card.helper}</p>
            {card.footnote && <p className="mt-1 text-xs text-[#9E9E9E]">{card.footnote}</p>}
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="relative overflow-hidden rounded-[28px] border border-[#E5E5E5] bg-white p-5 shadow-sm sm:p-6">
          <span className="absolute -right-14 top-6 h-32 w-32 rounded-full bg-[#A0E7E5]/25 blur-lg" aria-hidden />
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">Practice mode</h2>
          <p className="mt-1 text-lg font-semibold text-[#333333]">Adaptive drills keep your streak alive.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#E5E5E5] bg-[#F9F9F9] px-4 py-3">
              <p className="text-xs text-[#9E9E9E]">Sessions</p>
              <p className="text-lg font-semibold text-[#333333]">{numberFormat(practiceTotals.count)}</p>
            </div>
            <div className="rounded-2xl border border-[#E5E5E5] bg-[#F9F9F9] px-4 py-3">
              <p className="text-xs text-[#9E9E9E]">Questions</p>
              <p className="text-lg font-semibold text-[#333333]">{numberFormat(practiceTotals.totalQuestions)}</p>
            </div>
            <div className="rounded-2xl border border-[#E5E5E5] bg-[#F9F9F9] px-4 py-3">
              <p className="text-xs text-[#9E9E9E]">Focus time</p>
              <p className="text-lg font-semibold text-[#333333]">{practiceDuration}</p>
            </div>
            <div className="rounded-2xl border border-[#E5E5E5] bg-[#F9F9F9] px-4 py-3">
              <p className="text-xs text-[#9E9E9E]">Best streak</p>
              <p className="text-lg font-semibold text-[#333333]">{numberFormat(lifetimeBestStreak)}</p>
            </div>
          </div>
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">Accuracy</p>
            <div className="mt-2 h-2 rounded-full bg-[#F2F2F2]">
              <div
                className="h-full rounded-full bg-[#A0E7E5]"
                style={{ width: `${Math.max(6, practiceAccuracyPercent)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-[#9E9E9E]">{practiceAccuracy}</p>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-[28px] border border-[#E5E5E5] bg-white p-5 shadow-sm sm:p-6">
          <span className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-[#FFB6C1]/30 blur-lg" aria-hidden />
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">Past papers</h2>
          <p className="mt-1 text-lg font-semibold text-[#333333]">Real exam practice to flex your skills.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFF6F8] px-4 py-3">
              <p className="text-xs text-[#9E9E9E]">Attempts</p>
              <p className="text-lg font-semibold text-[#333333]">{numberFormat(paperTotals.count)}</p>
            </div>
            <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFF6F8] px-4 py-3">
              <p className="text-xs text-[#9E9E9E]">Auto questions</p>
              <p className="text-lg font-semibold text-[#333333]">{numberFormat(paperTotals.totalQuestions)}</p>
            </div>
            <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFF6F8] px-4 py-3">
              <p className="text-xs text-[#9E9E9E]">Focus time</p>
              <p className="text-lg font-semibold text-[#333333]">{paperDuration}</p>
            </div>
            <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFF6F8] px-4 py-3">
              <p className="text-xs text-[#9E9E9E]">Tokens earned</p>
              <p className="text-lg font-semibold text-[#333333]">+{numberFormat(paperTotals.totalTokensEarned)}</p>
            </div>
          </div>
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">Accuracy</p>
            <div className="mt-2 h-2 rounded-full bg-[#F2F2F2]">
              <div
                className="h-full rounded-full bg-[#FFB6C1]"
                style={{ width: `${Math.max(6, paperAccuracyPercent)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-[#9E9E9E]">{paperAccuracy}</p>
          </div>
        </article>
      </section>

      <section className="space-y-6">
        <article className="rounded-3xl border border-[#E5E5E5] bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">Lifetime radar</h2>
              <p className="mt-1 text-sm text-[#9E9E9E]">Accumulated accuracy by topic across all recorded practice.</p>
            </div>
            {hasRadarData && (
              <button
                type="button"
                onClick={openRadarModal}
                className="inline-flex items-center gap-2 rounded-full border border-[#A0E7E5] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#0F766E] transition hover:border-[#0F766E] hover:text-[#0F766E]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M15 3h6v6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 21H3v-6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 3 14 10" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 21 10 14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Expand
              </button>
            )}
          </div>
          {hasRadarData ? (
            <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
              <button
                type="button"
                onClick={openRadarModal}
                className="group relative flex-1 overflow-hidden rounded-3xl border border-[#E5E5E5] bg-[#F9F9F9] p-6 transition hover:border-[#A0E7E5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A0E7E5]"
                aria-label="Open lifetime radar chart in a larger view"
              >
                <div className="pointer-events-none flex justify-center">
                  <div className="w-full max-w-[540px]">
                    <RadarChart data={radarChartData} size={RADAR_PREVIEW_SIZE} labelMode="outside" labelMargin={32} />
                  </div>
                </div>
                <span className="pointer-events-none absolute bottom-4 right-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0F766E] opacity-0 transition group-hover:opacity-100">
                  Click to zoom
                </span>
              </button>
              <ul className="flex-1 space-y-3">
                {radarTopTopics.map((topic) => (
                  <li key={topic.label} className="rounded-2xl border border-[#E5E5E5] bg-[#F9F9F9] p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#333333]">{topic.label}</span>
                      <span className="text-xs text-[#9E9E9E]">
                        {numberFormat(topic.correct)}/{numberFormat(topic.attempted)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#9E9E9E]">
                      {numberFormat(topic.sessions)} session{topic.sessions === 1 ? '' : 's'}
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-[#1FADAD]"
                        style={{ width: `${Math.max(6, topic.accuracyPercent)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[#9E9E9E]">{topic.accuracyPercent}% accuracy</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[#A0E7E5] bg-[#F5FEFF] p-6 text-center text-[#1F2933]">
              <p className="font-semibold">No practice history yet.</p>
              <p className="mt-1 text-sm text-[#4B5563]">Complete a practice session to unlock your radar chart.</p>
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-[#E5E5E5] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">Subject insight</h2>
          {subjectStats.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[#FFB6C1]/80 bg-[#FFF6F8] p-6 text-center text-[#7A1120]">
              <p className="font-semibold">Take on a past paper</p>
              <p className="mt-1 text-sm text-[#9E9E9E]">Complete a paper to unlock subject-by-subject trends.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {subjectStats.map((subject) => {
                const subjectAccuracy = clampPercent(subject.averageAccuracy);
                return (
                  <li key={subject.subject} className="rounded-2xl border border-[#E5E5E5] bg-[#F9F9F9] p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#333333]">{subject.subject}</span>
                      <span className="text-xs text-[#9E9E9E]">{subject.attempts} attempt{subject.attempts === 1 ? '' : 's'}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between text-xs text-[#9E9E9E]">
                      <span>{numberFormat(subject.totalQuestions)} questions</span>
                      <span>{subjectAccuracy}% accuracy</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-[#A0E7E5]"
                        style={{ width: `${Math.max(6, subjectAccuracy)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <article className="rounded-3xl border border-[#E5E5E5] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">Recent sessions</h2>
          {sessions.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[#A0E7E5] bg-[#F5FEFF] p-6 text-center text-[#1F2933]">
              <p className="font-semibold">No sessions yet.</p>
              <p className="mt-1 text-sm text-[#4B5563]">Kick off a practice round to see your wins appear here.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {sessions.slice(0, 8).map((session) => {
                const sessionType = session.sessionType === 'practice' ? 'Practice' : 'Past paper';
                const sessionTagClass = session.sessionType === 'practice'
                  ? 'bg-[#A0E7E5]/30 text-[#0F766E]'
                  : 'bg-[#FFB6C1]/35 text-[#7A1120]';
                const sessionDate = session.completedAt ? new Date(session.completedAt).toLocaleDateString('en-SG') : '—';
                return (
                  <li
                    key={session.id || `${session.sessionType}-${session.completedAt}`}
                    className="flex flex-col gap-3 rounded-2xl border border-[#E5E5E5] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${sessionTagClass}`}>{sessionType}</span>
                        <span className="text-sm font-semibold text-[#333333]">
                          {session.title || session.paperTitle || sessionType}
                        </span>
                      </div>
                      <p className="text-xs text-[#9E9E9E]">
                        {numberFormat(session.totalQuestions)} Q · {formatDuration(normaliseValue(session.durationSeconds))} · {sessionDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#333333]">
                        {Number.isFinite(session.accuracy) ? `${Math.round(session.accuracy)}%` : '—'}
                      </p>
                      <p className="text-xs text-[#9E9E9E]">Tokens +{numberFormat(normaliseValue(session.tokensEarned))}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>

      {isRadarModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-[#1F2933]/60"
          onClick={closeRadarModal}
        >
          <div className="flex min-h-full items-center justify-center px-4 py-6">
            <div
              className="relative w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
              role="dialog"
              aria-modal="true"
              aria-labelledby={RADAR_MODAL_TITLE_ID}
              aria-describedby={RADAR_MODAL_DESC_ID}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeRadarModal}
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E5E5] text-[#4B5563] transition hover:border-[#A0E7E5] hover:text-[#0F766E]"
                aria-label="Close radar chart modal"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="m6 6 12 12" />
                  <path d="M6 18 18 6" />
                </svg>
              </button>
              <div className="space-y-6">
                <div className="pr-10">
                  <h2 id={RADAR_MODAL_TITLE_ID} className="text-xl font-semibold text-[#333333]">Lifetime radar</h2>
                  <p id={RADAR_MODAL_DESC_ID} className="mt-1 text-sm text-[#4B5563]">
                    Explore your topic-by-topic accuracy in greater detail. Keep practising to fill every axis.
                  </p>
                </div>
                <div className="flex justify-center overflow-x-auto">
                  <div className="w-full max-w-[720px]">
                    <RadarChart data={radarChartData} size={RADAR_MODAL_SIZE} labelMode="outside" labelMargin={42} />
                  </div>
                </div>
                {radarTopTopics.length > 0 && (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {radarTopTopics.map((topic) => (
                      <li key={`${topic.label}-modal`} className="rounded-2xl border border-[#E5E5E5] bg-[#F9F9F9] p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-[#333333]">{topic.label}</span>
                          <span className="text-xs text-[#9E9E9E]">
                            {numberFormat(topic.correct)}/{numberFormat(topic.attempted)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#9E9E9E]">
                          {numberFormat(topic.sessions)} session{topic.sessions === 1 ? '' : 's'}
                        </p>
                        <div className="mt-2 h-2 rounded-full bg-white">
                          <div
                            className="h-full rounded-full bg-[#1FADAD]"
                            style={{ width: `${Math.max(6, topic.accuracyPercent)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-[#9E9E9E]">{topic.accuracyPercent}% accuracy</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
