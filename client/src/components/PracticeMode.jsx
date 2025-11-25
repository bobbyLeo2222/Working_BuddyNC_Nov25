import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PageHeader from './PageHeader.jsx';
import { fetchHint, fetchExplanation } from '../utils/geminiClient.js';
import RadarChart from './RadarChart.jsx';
import { useProfile } from './profile/useProfile.js';
import { useAuth } from './auth/useAuth.js';
import performanceApi from './performance/performanceApi.js';
import MathText from './MathText.jsx';

const normaliseAnswer = (value) => {
  if (value === null || value === undefined) return '';
  return value.toString().trim().toLowerCase();
};

const choiceQuestionTypes = new Set(['mcq', 'dropdown']);

const genericHintPhrases = new Set([
  'Look at the surrounding words to decide which grammatical form fits.',
  'Use context clues to choose the option whose meaning matches the sentence.',
  'Revisit the relevant part of the passage to locate the detail being asked about.',
  'Rewrite the idea without changing its meaning, paying attention to the given starting words.',
  'Pause to consider what the question is really testing before choosing your answer.',
]);

const topicHintGenerators = {
  Grammar: () =>
    [
      'Check the helper words right before and after the blank to decide the tense, pronoun, or verb form that keeps the sentence correct.',
      "For example, when you meet a phrase like 'has ___ the work', you must supply a past participle such as 'completed' or 'finished'.",
    ].join(' '),
  Vocabulary: () =>
    [
      'Underline the context clues around the blank - do they describe a feeling, an action, or a quality - and match an option that fits that clue.',
      "For instance, if the text says 'Although it was raining, the children stayed ___', the contrast hints at a positive mood word like 'cheerful'.",
    ].join(' '),
  'Reading & Viewing': () =>
    [
      'Highlight the keywords from the question, then scan the passage for the same or similar phrases so you can quote the exact evidence.',
      "If the question asks for 'the reason the trip was cancelled', reread the sentence before and after that phrase in the text to confirm the stated reason.",
    ].join(' '),
  'Writing & Representing': () =>
    [
      'Keep the original idea but reshape it so it flows naturally with the opening words you are told to use.',
      "For example, turn 'It was raining but they played' into 'Despite the rain, they continued playing' so the meaning stays the same while the structure follows the prompt.",
    ].join(' '),
};

const defaultHintGenerator = () =>
  [
    'Reread the sentence around the blank to spot clue words like linking verbs, contrast markers, or descriptive phrases before choosing an answer.',
    "For a phrase such as 'has ___ the task' or 'even though it was ___', let those helper words guide which form or meaning fits best.",
  ].join(' ');

const normaliseTopicLabel = (value) => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim().toLowerCase();
  }
  return 'general';
};

const clamp01 = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
};

const deriveTopicWeights = (topicLabels, lifetimeStatsMap, sessionStatsMap) => {
  if (!Array.isArray(topicLabels) || topicLabels.length === 0) {
    return {};
  }

  return topicLabels.reduce((accumulator, label) => {
    const key = normaliseTopicLabel(label);
    const lifetimeStats = lifetimeStatsMap?.[key];
    const sessionStats = sessionStatsMap?.[key];

    const lifetimeAccuracy =
      lifetimeStats && lifetimeStats.attempted > 0
        ? clamp01(lifetimeStats.correct / lifetimeStats.attempted)
        : null;
    const sessionAccuracy =
      sessionStats && sessionStats.attempted > 0
        ? clamp01(sessionStats.correct / sessionStats.attempted)
        : null;

    let weight = 1; // neutral baseline

    if (lifetimeAccuracy !== null) {
      weight += (1 - lifetimeAccuracy) * 1.25;
    } else {
      weight += 0.5;
    }

    if (sessionAccuracy !== null) {
      weight += (1 - sessionAccuracy) * 1.75;
    }

    accumulator[key] = weight;
    return accumulator;
  }, {});
};

const buildTopicCycle = (topicKeys, topicWeights) => {
  if (!Array.isArray(topicKeys) || topicKeys.length === 0) {
    return [];
  }

  const cycle = [];

  topicKeys.forEach((topicKey) => {
    const rawWeight = topicWeights?.[topicKey] ?? 1;
    const repeats = Math.max(1, Math.min(5, Math.round(rawWeight * 1.2)));
    for (let i = 0; i < repeats; i += 1) {
      cycle.push(topicKey);
    }
  });

  for (let i = cycle.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cycle[i], cycle[j]] = [cycle[j], cycle[i]];
  }

  return cycle;
};

const orderEntriesByTopicWeights = (entries, topicWeights) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return [];
  }

  const buckets = new Map();
  entries.forEach((entry) => {
    if (!entry) return;
    const list = buckets.get(entry.topicKey);
    if (list) {
      list.push(entry);
    } else {
      buckets.set(entry.topicKey, [entry]);
    }
  });

  const topicCycle = buildTopicCycle(Array.from(buckets.keys()), topicWeights);
  if (topicCycle.length === 0) {
    return entries.slice();
  }

  const workingBuckets = new Map(
    Array.from(buckets.entries()).map(([key, list]) => [key, list.slice()])
  );

  const ordered = [];
  let pointer = 0;

  while (ordered.length < entries.length) {
    let selectedKey = null;
    let attempts = 0;

    while (attempts < topicCycle.length) {
      const candidateKey = topicCycle[pointer % topicCycle.length];
      pointer += 1;
      attempts += 1;
      const bucket = workingBuckets.get(candidateKey);
      if (bucket && bucket.length > 0) {
        selectedKey = candidateKey;
        break;
      }
    }

    if (!selectedKey) {
      break;
    }

    const bucket = workingBuckets.get(selectedKey);
    if (!bucket || bucket.length === 0) {
      continue;
    }

    const entry = bucket.shift();
    ordered.push(entry);

    if (bucket.length === 0) {
      workingBuckets.delete(selectedKey);
    }
  }

  workingBuckets.forEach((bucket) => {
    ordered.push(...bucket);
  });

  return ordered;
};

const buildBaseQuestionEntries = (questions, topicWeights) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return [];
  }

  const rawEntries = questions.map((question, index) => {
    if (!question) {
      return null;
    }

    const topicLabel =
      question.category || question.topic || question.sectionTitle || 'General';

    return {
      originIndex: index,
      topicKey: normaliseTopicLabel(topicLabel),
      topicLabel,
      question,
    };
  }).filter(Boolean);

  return orderEntriesByTopicWeights(rawEntries, topicWeights);
};

const rebalanceUpcomingOriginalQuestions = (sessionQuestions, currentIndex, topicWeights) => {
  if (!Array.isArray(sessionQuestions) || sessionQuestions.length === 0) {
    return sessionQuestions;
  }

  if (currentIndex >= sessionQuestions.length - 1) {
    return sessionQuestions;
  }

  const prefix = sessionQuestions.slice(0, currentIndex + 1);
  const upcoming = sessionQuestions.slice(currentIndex + 1);

  const originalEntries = [];
  upcoming.forEach((entry) => {
    if (!entry?.isRetry) {
      originalEntries.push(entry);
    }
  });

  if (originalEntries.length === 0) {
    return sessionQuestions;
  }

  const reorderedOriginals = orderEntriesByTopicWeights(originalEntries, topicWeights);

  if (reorderedOriginals.length === 0) {
    return sessionQuestions;
  }

  let originalPointer = 0;
  let changed = false;

  const mergedUpcoming = upcoming.map((entry) => {
    if (entry.isRetry) {
      return entry;
    }
    const nextEntry = reorderedOriginals[originalPointer];
    if (entry !== nextEntry) {
      changed = true;
    }
    originalPointer += 1;
    return nextEntry;
  });

  if (!changed) {
    return sessionQuestions;
  }

  return [...prefix, ...mergedUpcoming];
};

const buildTopicHint = (question) => {
  if (!question) {
    return null;
  }

  const topicKey = question.category || question.topic || question.sectionTitle || 'General';
  const builder = topicHintGenerators[topicKey];

  if (typeof builder === 'function') {
    return builder(question);
  }

  if (typeof builder === 'string') {
    return builder;
  }

  return defaultHintGenerator(question);
};

const getStaticHint = (question) => {
  if (!question) return null;
  const existing = typeof question.hint === 'string' ? question.hint.trim() : '';

  if (existing) {
    if (!genericHintPhrases.has(existing)) {
      return existing;
    }
    return buildTopicHint(question);
  }

  return null;
};

const OptionGridIcon = ({ crossed = [], ...props }) => {
  const positions = [
    { cx: 6, cy: 7 },
    { cx: 18, cy: 7 },
    { cx: 6, cy: 17 },
    { cx: 18, cy: 17 },
  ];

  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {positions.map(({ cx, cy }, index) => (
        <g key={`${cx}-${cy}`}>
          <circle
            cx={cx}
            cy={cy}
            r={2.4}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          />
          {crossed.includes(index) && (
            <g stroke="currentColor" strokeLinecap="round" strokeWidth={1.5}>
              <line x1={cx - 1.6} y1={cy - 1.6} x2={cx + 1.6} y2={cy + 1.6} />
              <line x1={cx + 1.6} y1={cy - 1.6} x2={cx - 1.6} y2={cy + 1.6} />
            </g>
          )}
        </g>
      ))}
    </svg>
  );
};

const IconHint = (props) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path
      d="M12 2.75a6.25 6.25 0 0 0-3.66 11.37c.27.19.43.5.43.83v1.05c0 .41.33.75.74.75h5c.41 0 .74-.34.74-.75v-1.05c0-.33.16-.64.43-.83A6.25 6.25 0 0 0 12 2.75Z"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 17.5h4M10.75 20.25h2.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </svg>
);

const IconFiftyFifty = (props) => (
  <OptionGridIcon crossed={[1, 2]} {...props} />
);

const IconSeventyFiveTwentyFive = (props) => (
  <OptionGridIcon crossed={[3]} {...props} />
);

const IconStopSession = (props) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
    />
    <rect
      x="8.25"
      y="8.25"
      width="7.5"
      height="7.5"
      rx="1.4"
      fill="currentColor"
    />
  </svg>
);

const IconToken = (props) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="url(#tokenGradient)"
      stroke="currentColor"
      strokeWidth={1.4}
    />
    <path
      d="M8.5 13.9c.6 1.3 2 2.1 3.5 2.1 1.9 0 3.5-1.3 3.5-3 0-1.5-1.3-2.5-3.5-2.5-.9 0-1.4-.4-1.4-1s.5-1 1.4-1c.9 0 1.6.3 2.1.9l1.3-1.1c-.7-.9-1.9-1.4-3.4-1.4-1.8 0-3.2 1.1-3.2 2.6 0 1.7 1.2 2.6 3.3 2.6 1.3 0 1.9.5 1.9 1.1 0 .7-.7 1.2-1.9 1.2-1.1 0-1.9-.5-2.2-1.2l-1.4.8Z"
      fill="currentColor"
    />
    <defs>
      <radialGradient id="tokenGradient" cx="0.3" cy="0.3" r="0.9">
        <stop offset="0" stopColor="currentColor" stopOpacity="0.3" />
        <stop offset="1" stopColor="currentColor" stopOpacity="0.05" />
      </radialGradient>
    </defs>
  </svg>
);

const IconQuestionBadge = (props) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <rect
      x="4.5"
      y="3.5"
      width="15"
      height="17"
      rx="2.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    />
    <path
      d="M10.25 9.4c.2-1.17 1.16-1.9 2.33-1.9 1.23 0 2.22.83 2.22 1.98 0 1.31-1 1.77-1.69 2.26-.56.39-.83.71-.83 1.36v.32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <circle cx="12" cy="16.5" r="0.9" fill="currentColor" />
  </svg>
);

const IconTarget = (props) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    />
    <circle
      cx="12"
      cy="12"
      r="5.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const IconClock = (props) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    />
    <path
      d="M12 7.5v4.3l2.25 1.65"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconFlame = (props) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path
      d="M13.5 3.5c.5 2.1-.4 3.6-1.6 4.9-1.2 1.4-2.4 2.7-1.9 4.5.4 1.6 2 2.9 3.7 2.9 2.2 0 3.8-1.7 3.8-4 0-3.1-2.6-5.1-4-8.3Z"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 13c-.7 1-.9 1.9-.6 2.7.3.8 1.1 1.3 1.9 1.3 1.4 0 2.4-1.1 2.4-2.5 0-1.5-1-2.4-2.1-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconCheckCircle = (props) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    />
    <path
      d="m8.6 12 2.2 2.3 4.6-4.9"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const isAnswerCorrect = (question, userAnswer) => {
  if (!question) return false;
  const expected = question.answer;

  if (Array.isArray(expected)) {
    return expected.some((answerOption) => normaliseAnswer(answerOption) === normaliseAnswer(userAnswer));
  }

  if (typeof expected === 'string') {
    return normaliseAnswer(expected) === normaliseAnswer(userAnswer);
  }

  return false;
};

const formatDuration = (milliseconds) => {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return '0s';
  }

  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
};

const TOKEN_MILESTONE_TIERS = [
  {
    id: 'bronze',
    label: 'Bronze Milestone',
    threshold: 50,
    icon: '🥉',
    gradient: 'from-[#b45309]/80 via-[#d97706]/80 to-[#fbbf24]/80',
    colors: ['#f97316', '#fb923c', '#facc15', '#f97316', '#fb923c'],
    blurb: 'You hit 50 tokens this run! Bronze unlocked.',
  },
  {
    id: 'silver',
    label: 'Silver Milestone',
    threshold: 100,
    icon: '🥈',
    gradient: 'from-[#4b5563]/80 via-[#9ca3af]/80 to-[#d1d5db]/80',
    colors: ['#9ca3af', '#d1d5db', '#e5e7eb', '#6b7280', '#9ca3af'],
    blurb: '100 tokens! Silver streak shining bright.',
  },
  {
    id: 'gold',
    label: 'Gold Milestone',
    threshold: 200,
    icon: '🥇',
    gradient: 'from-[#ca8a04]/85 via-[#eab308]/80 to-[#facc15]/85',
    colors: ['#facc15', '#fde047', '#fbbf24', '#f59e0b', '#fbbf24'],
    blurb: 'Gold milestone achieved. You’re on fire!',
  },
];

const BASE_QUESTION_TOKEN_REWARD = 2;

const STREAK_BONUSES = [
  {
    threshold: 3,
    bonus: 3,
    label: 'Combo Spark',
    message: 'Combo x3! +3 streak bonus',
    celebrationKey: null,
  },
  {
    threshold: 5,
    bonus: 6,
    label: 'High Five Heat',
    message: 'Streak x5! +6 super bonus',
    celebrationKey: 'streak-5',
  },
  {
    threshold: 8,
    bonus: 10,
    label: 'Octo Overdrive',
    message: 'Streak x8! +10 mega bonus',
    celebrationKey: 'streak-8',
  },
  {
    threshold: 10,
    bonus: 15,
    label: 'Perfect Ten Blaze',
    message: 'Streak x10! +15 apex bonus',
    celebrationKey: 'streak-10',
  },
];

const STREAK_LOOP_BONUS = {
  interval: 3,
  bonus: 4,
  label: 'Combo Momentum',
  message: 'Combo momentum! +4 streak bonus',
  celebrationKey: null,
};

const SPEED_BONUSES = [
  {
    thresholdMs: 5000,
    bonus: 3,
    label: 'Lightning Quick',
    message: 'Answered under 5s! +3 speed bonus',
    celebrationKey: 'speed-lightning',
  },
  {
    thresholdMs: 8000,
    bonus: 2,
    label: 'Rapid Resolve',
    message: 'Answered under 8s! +2 speed bonus',
    celebrationKey: null,
  },
  {
    thresholdMs: 11000,
    bonus: 1,
    label: 'Quick Thinker',
    message: 'Answered under 11s! +1 speed bonus',
    celebrationKey: null,
  },
];

const resolveStreakBonus = (streak) => {
  if (!Number.isFinite(streak) || streak <= 0) {
    return null;
  }
  const directMatch = STREAK_BONUSES.find((config) => config.threshold === streak);
  if (directMatch) {
    return directMatch;
  }
  const highestDefined = STREAK_BONUSES[STREAK_BONUSES.length - 1]?.threshold ?? 0;
  if (streak > highestDefined && STREAK_LOOP_BONUS.interval > 0 && streak % STREAK_LOOP_BONUS.interval === 0) {
    return {
      ...STREAK_LOOP_BONUS,
      threshold: streak,
    };
  }
  return null;
};

const resolveSpeedBonus = (durationMs) => {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return null;
  }
  return SPEED_BONUSES.find((config) => durationMs <= config.thresholdMs) || null;
};

const getNextStreakTarget = (streak) => {
  return STREAK_BONUSES.find((config) => config.threshold > streak) || null;
};

const getPreviousThresholdBefore = (threshold) => {
  let previous = 0;
  for (let index = 0; index < STREAK_BONUSES.length; index += 1) {
    const config = STREAK_BONUSES[index];
    if (config.threshold >= threshold) {
      break;
    }
    previous = config.threshold;
  }
  return previous;
};

const ACHIEVEMENT_CELEBRATIONS = {
  'streak-5': {
    icon: '🚀',
    title: 'Combo x5',
    blurb: 'Five-question streak! High Five Heat unlocked.',
    gradient: 'from-[#fb7185]/85 via-[#f97316]/85 to-[#facc15]/85',
    colors: ['#fb7185', '#f97316', '#fbbf24', '#fde68a', '#f472b6'],
  },
  'streak-8': {
    icon: '🌈',
    title: 'Combo x8',
    blurb: 'Octo Overdrive activated. Eight correct in a row!',
    gradient: 'from-[#22d3ee]/85 via-[#a855f7]/85 to-[#f59e0b]/85',
    colors: ['#22d3ee', '#0ea5e9', '#a855f7', '#f59e0b', '#fb7185'],
  },
  'streak-10': {
    icon: '🎉',
    title: 'Combo x10',
    blurb: 'Perfect Ten Blaze! Double digits achieved.',
    gradient: 'from-[#34d399]/85 via-[#10b981]/85 to-[#fde047]/85',
    colors: ['#34d399', '#10b981', '#22c55e', '#fde047', '#fbbf24'],
  },
  'speed-lightning': {
    icon: '⚡️',
    title: 'Lightning Quick',
    blurb: 'Answered in under five seconds! Lightning bonus earned.',
    gradient: 'from-[#38bdf8]/85 via-[#6366f1]/85 to-[#ec4899]/85',
    colors: ['#38bdf8', '#0ea5e9', '#6366f1', '#ec4899', '#f472b6'],
  },
};

const ACHIEVEMENT_DISPLAY_DURATION = 2800;

const formatAverageTime = (milliseconds) => {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return '–';
  }
  const seconds = milliseconds / 1000;
  if (seconds < 10) {
    return `${seconds.toFixed(1)}s`;
  }
  return formatDuration(milliseconds);
};

const RESULTS_RADAR_PREVIEW_SIZE = 320;
const RESULTS_RADAR_MODAL_SIZE = 660;
const RESULTS_RADAR_MODAL_TITLE_ID = 'practice-results-lifetime-radar-title';
const RESULTS_RADAR_MODAL_DESC_ID = 'practice-results-lifetime-radar-description';

const numberFormat = (value) => (Number.isFinite(value) ? value.toLocaleString('en-SG') : '0');

const CONFETTI_STYLE_ID = 'practice-mode-confetti-styles';

const ensureConfettiStyles = () => {
  if (typeof document === 'undefined') {
    return;
  }
  if (document.getElementById(CONFETTI_STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = CONFETTI_STYLE_ID;
  style.textContent = `
    @keyframes practice-confetti-fall {
      0% {
        transform: translate3d(var(--x-start, 0), -20%, 0) rotate(0deg);
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      100% {
        transform: translate3d(var(--x-end, 0), 210%, 0) rotate(var(--rotation, 360deg));
        opacity: 0;
      }
    }

    .practice-confetti-piece {
      position: absolute;
      width: 8px;
      height: 14px;
      border-radius: 2px;
      opacity: 0;
      animation-name: practice-confetti-fall;
      animation-timing-function: cubic-bezier(0.36, 0, 0.66, -0.56);
      animation-fill-mode: forwards;
    }
  `;
  document.head.appendChild(style);
};

const mulberry32 = (seed) => {
  let t = seed + 0x6D2B79F5;
  return () => {
    t |= 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const buildConfettiPieces = (colors, seed) => {
  const random = mulberry32(Math.floor(seed) || 1);
  return Array.from({ length: 18 }).map((_, index) => {
    const baseColor = colors[index % colors.length] || '#f97316';
    const left = 10 + random() * 80;
    const delay = random() * 180;
    const duration = 1200 + random() * 800;
    const xStart = (random() - 0.5) * 40;
    const xEnd = (random() - 0.5) * 120;
    const rotation = random() * 720;
    return {
      id: `confetti-${index}`,
      color: baseColor,
      left,
      delay,
      duration,
      xStart,
      xEnd,
      rotation,
    };
  });
};

const ConfettiBurst = React.memo(({ colors, seed }) => {
  const pieces = useMemo(() => buildConfettiPieces(colors, seed), [colors, seed]);
  return (
    <div className="pointer-events-none absolute inset-x-0 -top-2 flex h-28 w-36 items-start justify-center overflow-visible">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="practice-confetti-piece"
          style={{
            backgroundColor: piece.color,
            top: '-10%',
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}ms`,
            animationDuration: `${piece.duration}ms`,
            '--x-start': `${piece.xStart}px`,
            '--x-end': `${piece.xEnd}px`,
            '--rotation': `${piece.rotation}deg`,
          }}
        />
      ))}
    </div>
  );
});

const PracticeMode = ({ questions, onExit, level, subject }) => {
  const practiceContextLabel = useMemo(() => {
    if (level && subject) {
      return `${level} ${subject}`;
    }
    if (level) {
      return level;
    }
    if (subject) {
      return subject;
    }
    return null;
  }, [level, subject]);

  const practiceSessionTitle = practiceContextLabel
    ? `Practice Session · ${practiceContextLabel}`
    : 'Practice Session';

  const practiceSummaryTitle = practiceContextLabel
    ? `Practice Summary · ${practiceContextLabel}`
    : 'Practice Summary';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [inputError, setInputError] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const topicKeys = useMemo(() => {
    if (!Array.isArray(questions) || questions.length === 0) {
      return ['General'];
    }

    const keys = new Set();
    questions.forEach((question) => {
      if (!question) return;
      const key = question.category || question.topic || question.sectionTitle || 'General';
      keys.add(key);
    });

    return keys.size > 0 ? Array.from(keys) : ['General'];
  }, [questions]);

  const createInitialTopicStats = () =>
    topicKeys.reduce((accumulator, key) => {
      accumulator[key] = { correct: 0, attempted: 0 };
      return accumulator;
    }, {});

  const [topicStats, setTopicStats] = useState(() => createInitialTopicStats());
  const [lifetimeTopicStats, setLifetimeTopicStats] = useState({});
  const [isLifetimeLoading, setIsLifetimeLoading] = useState(false);
  const [lifetimeError, setLifetimeError] = useState(null);
  const [includeSessionInLifetime, setIncludeSessionInLifetime] = useState(true);
  const [hint, setHint] = useState(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [hintError, setHintError] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);
  const [explanationError, setExplanationError] = useState(null);
  const [isTopicPanelOpen, setIsTopicPanelOpen] = useState(false);
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
  const [showQuestionMeta, setShowQuestionMeta] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [usedFiftyFifty, setUsedFiftyFifty] = useState(false);
  const [usedSeventyFiveTwentyFive, setUsedSeventyFiveTwentyFive] = useState(false);
  const [usedAssistanceType, setUsedAssistanceType] = useState(null);
  const [isStopConfirmOpen, setIsStopConfirmOpen] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(() => Date.now());
  const [sessionEndTime, setSessionEndTime] = useState(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [hintsUsedCount, setHintsUsedCount] = useState(0);
  const [fiftyFiftyCount, setFiftyFiftyCount] = useState(0);
  const [seventyFiveCount, setSeventyFiveCount] = useState(0);
  const [questionDurations, setQuestionDurations] = useState([]);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isLifetimeRadarModalOpen, setIsLifetimeRadarModalOpen] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [tokensSpent, setTokensSpent] = useState(0);
  const [tokenCelebration, setTokenCelebration] = useState(null);
  const [milestoneCelebration, setMilestoneCelebration] = useState(null);
  const [achievementCelebration, setAchievementCelebration] = useState(null);
  const [streakConfetti, setStreakConfetti] = useState(null);
  const milestoneCelebrationTimeoutRef = useRef(null);
  const achievementCelebrationTimeoutRef = useRef(null);
  const streakConfettiTimeoutRef = useRef(null);
  const unlockedMilestonesRef = useRef(new Set());
  const audioContextRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);
  const questionStartRef = useRef(Date.now());
  const walletCreditedRef = useRef(false);
  const sessionPersistedRef = useRef(false);
  const tokenCelebrationTimeoutRef = useRef(null);
  const sessionQuestionIdRef = useRef(0);
  const { addTokens, profile } = useProfile();
  const { token, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    ensureConfettiStyles();
    unlockedMilestonesRef.current.clear();
    return () => {
      if (streakConfettiTimeoutRef.current) {
        clearTimeout(streakConfettiTimeoutRef.current);
        streakConfettiTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (currentStreak !== 10) {
      return;
    }
    const config = ACHIEVEMENT_CELEBRATIONS['streak-10'];
    if (!config) {
      return;
    }

    const baseSeed = Date.now();
    const seeds = [baseSeed, baseSeed + 97, baseSeed + 191];
    setStreakConfetti({
      id: `streak-confetti-${baseSeed}`,
      seeds,
    });

    if (streakConfettiTimeoutRef.current) {
      clearTimeout(streakConfettiTimeoutRef.current);
    }
    streakConfettiTimeoutRef.current = setTimeout(() => {
      setStreakConfetti(null);
      streakConfettiTimeoutRef.current = null;
    }, 3200);
  }, [currentStreak]);

  const createSessionInstance = useCallback((entry, overrides = {}) => {
    if (!entry) return null;
    sessionQuestionIdRef.current += 1;
    return {
      originIndex: entry.originIndex,
      topicKey: entry.topicKey,
      topicLabel: entry.topicLabel,
      question: entry.question,
      instanceId: `session-${sessionQuestionIdRef.current}`,
      isRetry: false,
      retrySource: null,
      ...overrides,
    };
  }, []);

  const sessionStatsByTopic = useMemo(
    () =>
      Object.entries(topicStats).reduce((accumulator, [label, stats]) => {
        const key = normaliseTopicLabel(label);
        const attempted = Math.max(0, stats?.attempted || 0);
        const correct = Math.max(0, stats?.correct || 0);
        accumulator[key] = { attempted, correct };
        return accumulator;
      }, {}),
    [topicStats]
  );

  const topicWeights = useMemo(
    () => deriveTopicWeights(topicKeys, lifetimeTopicStats, sessionStatsByTopic),
    [topicKeys, lifetimeTopicStats, sessionStatsByTopic]
  );

  const baseQuestionCount = Array.isArray(questions) ? questions.length : 0;

  const baseQuestionEntries = useMemo(
    () => buildBaseQuestionEntries(questions, topicWeights),
    [questions, topicWeights]
  );

  const [sessionQuestions, setSessionQuestions] = useState(() => {
    sessionQuestionIdRef.current = 0;
    return baseQuestionEntries
      .map((entry) => createSessionInstance(entry, { isRetry: false }))
      .filter(Boolean);
  });

  const totalQuestions = sessionQuestions.length;
  const currentQuestionEntry = sessionQuestions[currentIndex] ?? null;
  const currentQuestion = currentQuestionEntry?.question ?? null;
  const currentQuestionKey =
    currentQuestionEntry?.instanceId ||
    (currentQuestion?.id ? `question-${currentQuestion.id}` : `index-${currentIndex}`);
  const categoryLabel =
    currentQuestionEntry?.topicLabel ||
    currentQuestion?.category ||
    currentQuestion?.topic ||
    currentQuestion?.sectionTitle ||
    'General';
  const originalTopicLabel =
    currentQuestion?.originalTopic && currentQuestion.originalTopic !== categoryLabel
      ? currentQuestion.originalTopic
      : null;

  const topicBreakdown = useMemo(
    () =>
      topicKeys.map((key) => {
        const stats = topicStats[key] || { correct: 0, attempted: 0 };
        const attempted = stats.attempted || 0;
        const correct = stats.correct || 0;
        const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
        return {
          label: key,
          attempted,
          correct,
          accuracy,
        };
      }),
    [topicKeys, topicStats]
  );

  const lifetimeTopicList = useMemo(
    () => Object.values(lifetimeTopicStats || {}),
    [lifetimeTopicStats]
  );

  const combinedTopicLabels = useMemo(() => {
    const labelMap = new Map();
    lifetimeTopicList.forEach((topic) => {
      if (!topic) return;
      const label =
        typeof topic.label === 'string' && topic.label.trim()
          ? topic.label.trim()
          : 'General';
      const key = normaliseTopicLabel(label);
      if (!labelMap.has(key)) {
        labelMap.set(key, label);
      }
    });

    topicKeys.forEach((label) => {
      const key = normaliseTopicLabel(label);
      if (!labelMap.has(key)) {
        labelMap.set(key, label);
      }
    });

    if (labelMap.size === 0) {
      labelMap.set('general', 'General');
    }

    return Array.from(labelMap.values());
  }, [lifetimeTopicList, topicKeys]);

  const sessionTopicLookup = useMemo(() => {
    const lookup = {};
    topicBreakdown.forEach((topic) => {
      const key = normaliseTopicLabel(topic.label);
      lookup[key] = {
        attempted: topic.attempted,
        correct: topic.correct,
      };
    });
    return lookup;
  }, [topicBreakdown]);

  const combinedTopicBreakdown = useMemo(
    () =>
      combinedTopicLabels.map((label) => {
        const key = normaliseTopicLabel(label);
        const lifetime = lifetimeTopicStats[key] || {
          label,
          attempted: 0,
          correct: 0,
          sessions: 0,
        };
        const sessionSource = sessionTopicLookup[key] || { attempted: 0, correct: 0 };
        const sessionAttemptedRaw = Math.max(0, sessionSource.attempted || 0);
        const sessionCorrectRaw = Math.max(0, sessionSource.correct || 0);
        const lifetimeAttempted = Math.max(0, lifetime.attempted || 0);
        const lifetimeCorrect = Math.max(0, lifetime.correct || 0);
        const totalAttempted =
          lifetimeAttempted + (includeSessionInLifetime ? sessionAttemptedRaw : 0);
        const totalCorrect =
          lifetimeCorrect + (includeSessionInLifetime ? sessionCorrectRaw : 0);
        const accuracy =
          totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

        return {
          label: lifetime.label || label,
          attempted: totalAttempted,
          correct: totalCorrect,
          accuracy,
          sessionAttempted: sessionAttemptedRaw,
          sessionCorrect: sessionCorrectRaw,
          lifetimeAttempted,
          lifetimeCorrect,
          sessions: Math.max(0, lifetime.sessions || 0),
        };
      }),
    [combinedTopicLabels, includeSessionInLifetime, lifetimeTopicStats, sessionTopicLookup]
  );

  const radarData = useMemo(
    () =>
      combinedTopicBreakdown.map((topic) => ({
        label: topic.label,
        value: topic.correct,
        total: Math.max(topic.attempted, topic.correct),
      })),
    [combinedTopicBreakdown]
  );

  const hasLifetimeRadarData = useMemo(
    () => radarData.some((topic) => Number.isFinite(topic.total) && topic.total > 0),
    [radarData]
  );

  const attemptedTopics = useMemo(
    () => topicBreakdown.filter((topic) => topic.attempted > 0),
    [topicBreakdown]
  );

  const strongestTopic = useMemo(
    () =>
      attemptedTopics.reduce(
        (best, topic) => (best === null || topic.accuracy > best.accuracy ? topic : best),
        null
      ),
    [attemptedTopics]
  );

  const needsAttentionTopic = useMemo(
    () =>
      attemptedTopics.reduce(
        (worst, topic) => (worst === null || topic.accuracy < worst.accuracy ? topic : worst),
        null
      ),
    [attemptedTopics]
  );

  const lifetimeRadarTopTopics = useMemo(() => {
    return combinedTopicBreakdown
      .filter((topic) => topic.attempted > 0)
      .map((topic) => {
        const accuracyPercent = Number.isFinite(topic.accuracy) ? Math.max(0, Math.min(100, topic.accuracy)) : 0;
        return {
          label: topic.label,
          attempted: Math.max(0, topic.attempted),
          correct: Math.max(0, topic.correct),
          sessions: Math.max(0, topic.sessions || 0),
          accuracyPercent,
        };
      })
      .sort((a, b) => {
        if (b.accuracyPercent !== a.accuracyPercent) {
          return b.accuracyPercent - a.accuracyPercent;
        }
        if (b.attempted !== a.attempted) {
          return b.attempted - a.attempted;
        }
        return a.label.localeCompare(b.label);
      })
      .slice(0, 4);
  }, [combinedTopicBreakdown]);

  const openLifetimeRadarModal = () => {
    if (!hasLifetimeRadarData) {
      return;
    }
    setIsLifetimeRadarModalOpen(true);
  };

  const closeLifetimeRadarModal = () => {
    setIsLifetimeRadarModalOpen(false);
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLifetimeTopicStats({});
      setLifetimeError(null);
      setIsLifetimeLoading(false);
      setIncludeSessionInLifetime(true);
      return;
    }

    let isCancelled = false;
    setIsLifetimeLoading(true);

    const fetchLifetimeStats = async () => {
      try {
        const summary = await performanceApi.fetchSummary({ token });
        if (isCancelled) {
          return;
        }

        const statsArray = Array.isArray(summary?.practiceTopicStats)
          ? summary.practiceTopicStats
          : [];

        const nextMap = statsArray.reduce((accumulator, entry) => {
          if (!entry) return accumulator;
          const label =
            typeof entry.label === 'string' && entry.label.trim()
              ? entry.label.trim()
              : 'General';
          const key = normaliseTopicLabel(label);
          const attempted = Number.isFinite(entry.attempted) ? entry.attempted : 0;
          const correct = Number.isFinite(entry.correct) ? entry.correct : 0;
          const sessions = Number.isFinite(entry.sessions) ? entry.sessions : 0;

          accumulator[key] = {
            label,
            attempted: Math.max(0, attempted),
            correct: Math.max(0, correct),
            sessions: Math.max(0, sessions),
          };
          return accumulator;
        }, {});

        setLifetimeTopicStats(nextMap);
        setLifetimeError(null);
        setIncludeSessionInLifetime(true);
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to fetch lifetime practice stats', error);
          setLifetimeTopicStats({});
          setIncludeSessionInLifetime(true);
          if (error?.status === 401 || error?.status === 403) {
            logout();
            setLifetimeError(null);
          } else {
            setLifetimeError(error);
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLifetimeLoading(false);
        }
      }
    };

    fetchLifetimeStats();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, token, logout]);

  useEffect(() => {
    if (!isSessionComplete) {
      setIsLifetimeRadarModalOpen(false);
    }
  }, [isSessionComplete]);

  useEffect(() => {
    if (!hasLifetimeRadarData) {
      setIsLifetimeRadarModalOpen(false);
    }
  }, [hasLifetimeRadarData]);

  useEffect(() => {
    if (!isLifetimeRadarModalOpen) {
      return undefined;
    }
    if (typeof document === 'undefined') {
      return undefined;
    }
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isLifetimeRadarModalOpen]);

  useEffect(() => {
    if (!isLifetimeRadarModalOpen) {
      return undefined;
    }
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsLifetimeRadarModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLifetimeRadarModalOpen]);

  useEffect(() => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }

    setUserAnswer('');
    setInputError(null);
    setIsAnswered(false);
    setIsCorrect(null);
    setHint(null);
    setHintError(null);
    setIsHintLoading(false);
    setExplanation(null);
    setExplanationError(null);
    setIsExplanationLoading(false);
    setShowQuestionMeta(false);
    setEliminatedOptions([]);
    setUsedFiftyFifty(false);
    setUsedSeventyFiveTwentyFive(false);
    setUsedAssistanceType(null);
    setTokenCelebration(null);
    questionStartRef.current = Date.now();
  }, [currentQuestionKey]);

  useEffect(() => () => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }

    if (tokenCelebrationTimeoutRef.current) {
      clearTimeout(tokenCelebrationTimeoutRef.current);
      tokenCelebrationTimeoutRef.current = null;
    }

    if (achievementCelebrationTimeoutRef.current) {
      clearTimeout(achievementCelebrationTimeoutRef.current);
      achievementCelebrationTimeoutRef.current = null;
    }

    if (milestoneCelebrationTimeoutRef.current) {
      clearTimeout(milestoneCelebrationTimeoutRef.current);
      milestoneCelebrationTimeoutRef.current = null;
    }

    if (audioContextRef.current && typeof audioContextRef.current.close === 'function') {
      const context = audioContextRef.current;
      context.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const playFeedbackTone = (type) => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    const context = audioContextRef.current;
    if (context.state === 'suspended') {
      context.resume();
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type === 'correct' ? 'sine' : 'square';
    oscillator.frequency.setValueAtTime(type === 'correct' ? 880 : 220, context.currentTime);

    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(type === 'correct' ? 0.25 : 0.3, context.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.5);
  };

  const triggerTokenCelebration = (delta, { variant, message } = {}) => {
    if (!delta) {
      return;
    }

    const resolvedVariant = variant || (delta > 0 ? 'gain' : 'loss');
    const resolvedMessage = message ||
      (delta > 0
        ? `+${delta} tokens earned`
        : `-${Math.abs(delta)} tokens`);

    if (tokenCelebrationTimeoutRef.current) {
      clearTimeout(tokenCelebrationTimeoutRef.current);
      tokenCelebrationTimeoutRef.current = null;
    }

    setTokenCelebration({
      id: Date.now(),
      delta,
      variant: resolvedVariant,
      message: resolvedMessage,
    });

    tokenCelebrationTimeoutRef.current = setTimeout(() => {
      setTokenCelebration(null);
      tokenCelebrationTimeoutRef.current = null;
    }, 1600);
  };

  const triggerAchievementCelebration = (key, context = {}) => {
    if (!key) {
      return;
    }

    const config = ACHIEVEMENT_CELEBRATIONS[key];
    if (!config) {
      return;
    }

    if (achievementCelebrationTimeoutRef.current) {
      clearTimeout(achievementCelebrationTimeoutRef.current);
      achievementCelebrationTimeoutRef.current = null;
    }

    setAchievementCelebration({
      id: `${key}-${Date.now()}`,
      key,
      seed: Date.now() + Math.random() * 1000,
      message: context.message || config.blurb,
      bonus:
        Number.isFinite(context.bonus) && context.bonus > 0 ? Math.round(context.bonus) : null,
      streak: context.streak ?? null,
      durationMs: context.durationMs ?? null,
      totalReward: context.totalReward ?? null,
    });

    achievementCelebrationTimeoutRef.current = setTimeout(() => {
      setAchievementCelebration(null);
      achievementCelebrationTimeoutRef.current = null;
    }, ACHIEVEMENT_DISPLAY_DURATION);
  };

  const celebrateMilestone = (tier, balance) => {
    if (!tier) {
      return;
    }
    if (milestoneCelebrationTimeoutRef.current) {
      clearTimeout(milestoneCelebrationTimeoutRef.current);
      milestoneCelebrationTimeoutRef.current = null;
    }
    setMilestoneCelebration({
      id: `${tier.id}-${Date.now()}`,
      tier,
      balance,
      seed: Date.now() + Math.random() * 1000,
    });
    milestoneCelebrationTimeoutRef.current = setTimeout(() => {
      setMilestoneCelebration(null);
      milestoneCelebrationTimeoutRef.current = null;
    }, 2600);
  };

  const checkTokenMilestones = (previousBalance, nextBalance) => {
    if (nextBalance <= previousBalance) {
      return;
    }
    const unlocked = TOKEN_MILESTONE_TIERS.filter(
      (tier) =>
        previousBalance < tier.threshold &&
        nextBalance >= tier.threshold &&
        !unlockedMilestonesRef.current.has(tier.id)
    );
    if (unlocked.length === 0) {
      return;
    }
    unlocked.forEach((tier) => unlockedMilestonesRef.current.add(tier.id));
    const highestTier = unlocked[unlocked.length - 1];
    celebrateMilestone(highestTier, nextBalance);
  };

  const adjustTokenBalance = (delta) => {
    setTokenBalance((previous) => {
      const safePrevious = previous < 0 ? 0 : previous;
      const tentative = safePrevious + delta;
      const next = tentative < 0 ? 0 : tentative;
      if (next > safePrevious) {
        checkTokenMilestones(safePrevious, next);
      }
      return next;
    });
  };

  const scheduleQuestionRetry = (entry) => {
    if (!entry) {
      return;
    }

    setSessionQuestions((previous) => {
      const retryInstance = createSessionInstance(entry, {
        isRetry: true,
        retrySource: entry.instanceId,
      });

      if (!retryInstance) {
        return previous;
      }

      const targetIndex = Math.min(previous.length, currentIndex + 8);
      const next = [...previous];
      next.splice(targetIndex, 0, retryInstance);
      return next;
    });
  };

  useEffect(() => {
    if (questionsAnswered > 0) {
      return;
    }
    sessionQuestionIdRef.current = 0;
    setSessionQuestions(
      baseQuestionEntries
        .map((entry) => createSessionInstance(entry, { isRetry: false }))
        .filter(Boolean)
    );
    setCurrentIndex(0);
  }, [baseQuestionEntries, questionsAnswered, createSessionInstance]);

  useEffect(() => {
    setTopicStats(createInitialTopicStats());
  }, [topicKeys]);

  useEffect(() => {
    if (questionsAnswered === 0) {
      return;
    }
    setSessionQuestions((previous) =>
      rebalanceUpcomingOriginalQuestions(previous, currentIndex, topicWeights)
    );
  }, [topicWeights, questionsAnswered, currentIndex]);

  useEffect(() => {
    setSessionStartTime(Date.now());
    setSessionEndTime(null);
    setQuestionsAnswered(0);
    setHintsUsedCount(0);
    setFiftyFiftyCount(0);
    setSeventyFiveCount(0);
    setQuestionDurations([]);
    setIsSessionComplete(false);
    setIsStopConfirmOpen(false);
    setCurrentStreak(0);
    setBestStreak(0);
    setTokenBalance(0);
    setTokensEarned(0);
    setTokensSpent(0);
    setTokenCelebration(null);
    setMilestoneCelebration(null);
    setUsedAssistanceType(null);
    walletCreditedRef.current = false;
    sessionPersistedRef.current = false;
    if (milestoneCelebrationTimeoutRef.current) {
      clearTimeout(milestoneCelebrationTimeoutRef.current);
      milestoneCelebrationTimeoutRef.current = null;
    }
    unlockedMilestonesRef.current.clear();
    questionStartRef.current = Date.now();
    setCorrectCount(0);
    setCurrentIndex(0);
  }, [questions]);

  useEffect(() => {
    if (!isSessionComplete) {
      sessionPersistedRef.current = false;
      setIncludeSessionInLifetime(true);
    }
  }, [isSessionComplete]);

  useEffect(() => {
    if (!isSessionComplete) return;
    if (sessionPersistedRef.current) return;
    if (!isAuthenticated || !token) return;
    if (questionsAnswered <= 0) return;

    const sessionCompletionTimestamp = sessionEndTime ?? Date.now();
    const sessionDurationMs = Math.max(0, sessionCompletionTimestamp - sessionStartTime);
    const averageTimeMs = questionDurations.length > 0
      ? questionDurations.reduce((sum, value) => sum + value, 0) / questionDurations.length
      : 0;
    const fastestTimeMs = questionDurations.length > 0 ? Math.min(...questionDurations) : null;
    const slowestTimeMs = questionDurations.length > 0 ? Math.max(...questionDurations) : null;
    const accuracyPercent = questionsAnswered > 0
      ? Math.round((correctCount / questionsAnswered) * 100)
      : 0;

    const payload = {
      sessionType: 'practice',
      title: practiceSessionTitle,
      totalQuestions: questionsAnswered,
      correct: correctCount,
      incorrect: Math.max(questionsAnswered - correctCount, 0),
      accuracy: accuracyPercent,
      durationSeconds: Math.round(sessionDurationMs / 1000),
      tokensEarned,
      tokensSpent,
      streak: currentStreak,
      bestStreak,
      startedAt: new Date(sessionStartTime).toISOString(),
      completedAt: new Date(sessionCompletionTimestamp).toISOString(),
      topics: topicBreakdown,
      metadata: {
        hintsUsed: hintsUsedCount,
        lifelines: {
          fiftyFifty: fiftyFiftyCount,
          seventyFive: seventyFiveCount,
        },
        averageTimeSeconds: averageTimeMs > 0 ? averageTimeMs / 1000 : 0,
        fastestTimeSeconds: typeof fastestTimeMs === 'number' ? fastestTimeMs / 1000 : null,
        slowestTimeSeconds: typeof slowestTimeMs === 'number' ? slowestTimeMs / 1000 : null,
        netTokens: tokenBalance,
        questionsPoolSize: baseQuestionCount,
      },
    };

    performanceApi
      .recordSession({ token, payload })
      .then((data) => {
        if (data?.session?.topics && Array.isArray(data.session.topics)) {
          setLifetimeTopicStats((previous) => {
            const next = { ...previous };
            data.session.topics.forEach((topic) => {
              if (!topic) return;
              const label =
                typeof topic.label === 'string' && topic.label.trim()
                  ? topic.label.trim()
                  : 'General';
              const key = normaliseTopicLabel(label);
              const attempted = Number.isFinite(topic.attempted) ? topic.attempted : 0;
              const correct = Number.isFinite(topic.correct) ? topic.correct : 0;
              if (!next[key]) {
                next[key] = {
                  label,
                  attempted: 0,
                  correct: 0,
                  sessions: 0,
                };
              }
              next[key] = {
                label: next[key].label || label,
                attempted: Math.max(0, next[key].attempted || 0) + Math.max(0, attempted),
                correct: Math.max(0, next[key].correct || 0) + Math.max(0, correct),
                sessions:
                  Math.max(0, next[key].sessions || 0) +
                  (attempted > 0 || correct > 0 ? 1 : 0),
              };
            });
            return next;
          });
          setIncludeSessionInLifetime(false);
        }
      })
      .catch((error) => {
        console.error('Failed to record practice session', error);
        if (error?.status === 401 || error?.status === 403) {
          logout();
        }
      });

    sessionPersistedRef.current = true;
  }, [
    isSessionComplete,
    isAuthenticated,
    token,
    questionsAnswered,
    correctCount,
    sessionEndTime,
    sessionStartTime,
    questionDurations,
    tokensEarned,
    tokensSpent,
    currentStreak,
    bestStreak,
    hintsUsedCount,
    fiftyFiftyCount,
    seventyFiveCount,
    tokenBalance,
    topicBreakdown,
    totalQuestions,
    logout,
  ]);

  const handleGetHint = async () => {
    if (!currentQuestion) return;

    if (usedAssistanceType && usedAssistanceType !== 'hint') {
      setHintError('You have already used another assist option for this question.');
      return;
    }

    if (usedAssistanceType === 'hint') {
      return;
    }

    setUsedAssistanceType('hint');

    setHintError(null);
    setHintsUsedCount((previous) => previous + 1);
    adjustTokenBalance(-1);
    setTokensSpent((previous) => previous + 1);
    triggerTokenCelebration(-1, {
      variant: 'spend',
      message: 'Hint unlocked (-1 token)',
    });

    const staticHint = getStaticHint(currentQuestion);
    if (staticHint) {
      setHint(staticHint);
      return;
    }

    setIsHintLoading(true);

    try {
      const hintText = await fetchHint({
        question: currentQuestion.aiPrompt || currentQuestion.prompt || currentQuestion.providedPrompt || 'Provide a helpful study hint.',
        options: currentQuestion.options,
        wordBank: currentQuestion.wordBank,
      });
      setHint(hintText);
    } catch (error) {
      console.error('Failed to fetch hint', error);
      setHintError(
        error?.message && typeof error.message === 'string'
          ? error.message
          : 'Unable to fetch a hint right now. Please try again later.'
      );
    } finally {
      setIsHintLoading(false);
    }
  };

  const getRemainingWrongOptions = () => {
    if (
      !currentQuestion ||
      !choiceQuestionTypes.has(currentQuestion.type) ||
      !Array.isArray(currentQuestion.options)
    ) {
      return [];
    }

    return currentQuestion.options.filter(
      (option) => !isAnswerCorrect(currentQuestion, option) && !eliminatedOptions.includes(option)
    );
  };

  const eliminateWrongOptions = (count) => {
    const remainingWrong = getRemainingWrongOptions();

    if (remainingWrong.length === 0) {
      return [];
    }

    const selections = [...remainingWrong];
    if (selections.length > count) {
      selections.sort(() => Math.random() - 0.5);
    }

    return selections.slice(0, Math.min(count, selections.length));
  };

  const handleFiftyFifty = () => {
    if (usedAssistanceType && usedAssistanceType !== 'fiftyFifty') {
      return;
    }

    if (usedFiftyFifty || isAnswered || usedAssistanceType === 'fiftyFifty') return;
    const remainingWrong = getRemainingWrongOptions();
    if (remainingWrong.length === 0) {
      return;
    }
    const totalOptions = Array.isArray(currentQuestion?.options) ? currentQuestion.options.length : 0;
    const removalTarget =
      totalOptions > 4
        ? Math.max(2, Math.ceil(remainingWrong.length / 2))
        : 2;
    const removals = eliminateWrongOptions(removalTarget);
    if (removals.length > 0) {
      setEliminatedOptions((previous) => [...previous, ...removals]);
    }
    setUsedFiftyFifty(true);
    setUsedAssistanceType('fiftyFifty');
    setFiftyFiftyCount((previous) => previous + 1);
    adjustTokenBalance(-1);
    setTokensSpent((previous) => previous + 1);
    triggerTokenCelebration(-1, {
      variant: 'spend',
      message: '50-50 lifeline (-1 token)',
    });
  };

  const handleSeventyFiveTwentyFive = () => {
    if (usedAssistanceType && usedAssistanceType !== 'seventyFiveTwentyFive') {
      return;
    }

    if (usedSeventyFiveTwentyFive || isAnswered || usedAssistanceType === 'seventyFiveTwentyFive') return;
    const remainingWrong = getRemainingWrongOptions();
    if (remainingWrong.length === 0) {
      return;
    }
    const totalOptions = Array.isArray(currentQuestion?.options) ? currentQuestion.options.length : 0;
    const removalTarget =
      totalOptions > 4
        ? Math.max(1, Math.ceil(remainingWrong.length / 4))
        : 1;
    const removals = eliminateWrongOptions(removalTarget);
    if (removals.length > 0) {
      setEliminatedOptions((previous) => [...previous, ...removals]);
    }
    setUsedSeventyFiveTwentyFive(true);
    setUsedAssistanceType('seventyFiveTwentyFive');
    setSeventyFiveCount((previous) => previous + 1);
    adjustTokenBalance(-1);
    setTokensSpent((previous) => previous + 1);
    triggerTokenCelebration(-1, {
      variant: 'spend',
      message: '75-25 lifeline (-1 token)',
    });
  };

  const submitAnswer = async (submittedAnswer) => {
    if (!currentQuestion || isAnswered) return;

    const now = Date.now();
    const questionStartedAt = questionStartRef.current || now;
    setQuestionDurations((previous) => [...previous, now - questionStartedAt]);
    setQuestionsAnswered((previous) => previous + 1);

    setUserAnswer(submittedAnswer);
    setInputError(null);

    const answeredCorrectly = isAnswerCorrect(currentQuestion, submittedAnswer);
    setIsAnswered(true);
    setIsCorrect(answeredCorrectly);
    if (answeredCorrectly) {
      setCorrectCount((prev) => prev + 1);
      const nextStreak = currentStreak + 1;
      const questionDuration = now - questionStartedAt;
      const baseReward = BASE_QUESTION_TOKEN_REWARD;
      const streakBonusConfig = resolveStreakBonus(nextStreak);
      const speedBonusConfig = resolveSpeedBonus(questionDuration);

      const summaryParts = [`+${baseReward} base`];
      let totalReward = baseReward;
      let celebrationVariant = 'gain';
      const momentousAchievements = [];

      if (streakBonusConfig) {
        totalReward += streakBonusConfig.bonus;
        summaryParts.push(`+${streakBonusConfig.bonus} ${streakBonusConfig.label}`);
        celebrationVariant = 'streak';
        if (streakBonusConfig.celebrationKey) {
          momentousAchievements.push({
            key: streakBonusConfig.celebrationKey,
            bonus: streakBonusConfig.bonus,
            message: streakBonusConfig.message,
            streak: nextStreak,
          });
        }
      }

      if (speedBonusConfig) {
        totalReward += speedBonusConfig.bonus;
        summaryParts.push(`+${speedBonusConfig.bonus} ${speedBonusConfig.label}`);
        if (speedBonusConfig.celebrationKey) {
          momentousAchievements.push({
            key: speedBonusConfig.celebrationKey,
            bonus: speedBonusConfig.bonus,
            message: speedBonusConfig.message,
            durationMs: questionDuration,
          });
        }
      }

      setCurrentStreak(nextStreak);
      setBestStreak((best) => (nextStreak > best ? nextStreak : best));
      adjustTokenBalance(totalReward);
      setTokensEarned((previous) => previous + totalReward);

      let celebrationMessage = `Correct! +${totalReward} tokens`;
      if (summaryParts.length > 1) {
        celebrationMessage = `Correct! ${summaryParts.join(' · ')} · +${totalReward} total`;
      }

      triggerTokenCelebration(totalReward, {
        variant: celebrationVariant,
        message: celebrationMessage,
      });

      if (momentousAchievements.length > 0) {
        momentousAchievements.forEach((achievement) => {
          triggerAchievementCelebration(achievement.key, {
            bonus: achievement.bonus,
            message: achievement.message,
            streak: achievement.streak,
            durationMs: achievement.durationMs,
            totalReward,
          });
        });
      }
    }
    if (!answeredCorrectly) {
      adjustTokenBalance(-2);
      setTokensSpent((previous) => previous + 2);
      setCurrentStreak(0);
      triggerTokenCelebration(-2, {
        variant: 'loss',
        message: 'Incorrect answer (-2 tokens)',
      });
      scheduleQuestionRetry(currentQuestionEntry);
    }

    const topicKey = categoryLabel;
    setTopicStats((previous) => {
      const next = { ...previous };
      const currentStats = next[topicKey] || { correct: 0, attempted: 0 };
      next[topicKey] = {
        correct: currentStats.correct + (answeredCorrectly ? 1 : 0),
        attempted: currentStats.attempted + 1,
      };
      return next;
    });

    playFeedbackTone(answeredCorrectly ? 'correct' : 'incorrect');

    if (answeredCorrectly) {
      setExplanation(null);
      setExplanationError(null);
      setIsExplanationLoading(false);
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      feedbackTimeoutRef.current = setTimeout(() => {
        feedbackTimeoutRef.current = null;
        moveToNextQuestion();
      }, 1000);
      return;
    }

    if (currentQuestion.explanation) {
      setExplanation(currentQuestion.explanation);
      setExplanationError(null);
      setIsExplanationLoading(false);
      return;
    }

    setIsExplanationLoading(true);
    setExplanationError(null);

    try {
      const explanationText = await fetchExplanation({
        question: currentQuestion.aiPrompt || currentQuestion.prompt || currentQuestion.providedPrompt || 'Explain this answer.',
        options: currentQuestion.options,
        answer: currentQuestion.answer,
      });
      setExplanation(explanationText);
    } catch (error) {
      console.error('Failed to fetch explanation', error);
      setExplanationError(
        error?.message && typeof error.message === 'string'
          ? error.message
          : 'Unable to fetch an explanation right now. Please try again later.'
      );
    } finally {
      setIsExplanationLoading(false);
    }
  };

  const handleAnswerSelection = (selectedOption) => {
    return submitAnswer(selectedOption);
  };

  const handleFreeResponseSubmit = () => {
    if (!currentQuestion || isAnswered) return;
    if (typeof userAnswer !== 'string' || userAnswer.trim().length === 0) {
      setInputError('Enter your answer before checking.');
      return;
    }
    const trimmed = userAnswer.trim();
    setUserAnswer(trimmed);
    return submitAnswer(trimmed);
  };

  const handleFormSubmit = (event) => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    if (!currentQuestion || isAnswered) return;
    if (currentQuestion.type === 'text_input' || currentQuestion.type === 'textarea') {
      return handleFreeResponseSubmit();
    }
  };

  const completeSession = () => {
    if (isSessionComplete) return;
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    setSessionEndTime(Date.now());
    setIsSessionComplete(true);
    setIsAnswered(false);
    setIsStopConfirmOpen(false);
    if (!walletCreditedRef.current) {
      const credit = Math.max(0, tokenBalance);
      if (credit > 0) {
        addTokens(credit);
      }
      walletCreditedRef.current = true;
    }
  };

  const moveToNextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      completeSession();
    }
  };

  const handleGoBack = () => {
    onExit();
  };

  const renderResponseInput = () => {
    if (!currentQuestion) return null;

    if (choiceQuestionTypes.has(currentQuestion.type) && Array.isArray(currentQuestion.options)) {
      const visibleOptions = currentQuestion.options.filter(
        (option) => !eliminatedOptions.includes(option)
      );

      return (
        <div className="space-y-3">
          {visibleOptions.map((option, index) => {
            const isSelected = userAnswer === option;
            const matchesCorrectAnswer = Array.isArray(currentQuestion.answer)
              ? currentQuestion.answer.some((answerOption) => normaliseAnswer(answerOption) === normaliseAnswer(option))
              : normaliseAnswer(currentQuestion.answer) === normaliseAnswer(option);

            let optionClasses =
              'w-full text-left rounded-2xl border border-[#E5E5E5] px-4 py-3 text-[#333333] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A0E7E5]/60';

            if (!isAnswered) {
              optionClasses += isSelected
                ? ' border-[#A0E7E5] bg-[#A0E7E5]/20'
                : ' hover:border-[#A0E7E5] hover:bg-[#A0E7E5]/15';
            } else {
              if (matchesCorrectAnswer) {
                optionClasses += ' border-[#34C759] bg-[#34C759]/15 text-[#0B6C2F] font-semibold';
              } else if (isSelected) {
                optionClasses += ' border-[#FF4D4F] bg-[#FF4D4F]/15 text-[#7A1120]';
              } else {
                optionClasses += ' text-[#9E9E9E]';
              }
              optionClasses += ' cursor-not-allowed';
            }

            return (
              <button
                key={`${option}-${index}`}
                type="button"
                onClick={() => handleAnswerSelection(option)}
                disabled={isAnswered}
                className={optionClasses}
              >
                <span className="block text-base font-medium">
                  ({index + 1}) <MathText text={option} />
                </span>
              </button>
            );
          })}
        </div>
      );
    }

    if (currentQuestion.type === 'text_input') {
      const value = typeof userAnswer === 'string' ? userAnswer : '';
      return (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-[#333333]" htmlFor="practice-text-input">
            Your answer
          </label>
          <input
            id="practice-text-input"
            type="text"
            value={value}
            onChange={(event) => {
              if (isAnswered) return;
              setUserAnswer(event.target.value);
              if (inputError) {
                setInputError(null);
              }
            }}
            disabled={isAnswered}
            className={`w-full rounded-2xl border px-4 py-3 text-base text-[#333333] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A0E7E5]/60 ${
              isAnswered ? 'border-[#E5E5E5] bg-[#F2F2F2] text-[#9E9E9E]' : 'border-[#E5E5E5]'
            }`}
            placeholder="Type your answer here"
            autoComplete="off"
          />
          {!isAnswered && (
            <p className="text-xs text-[#9E9E9E]">Press Enter or tap “Check answer” when you’re ready.</p>
          )}
          <button
            type="submit"
            disabled={isAnswered}
            className={`inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-4 focus:ring-[#A0E7E5]/60 ${
              isAnswered
                ? 'bg-[#E5E5E5] text-[#9E9E9E] cursor-not-allowed'
                : 'bg-[#333333] text-white hover:bg-[#4D4D4D]'
            }`}
          >
            Check answer
          </button>
        </div>
      );
    }

    if (currentQuestion.type === 'textarea') {
      const value = typeof userAnswer === 'string' ? userAnswer : '';
      return (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-[#333333]" htmlFor="practice-textarea">
            Rewrite your response
          </label>
          <textarea
            id="practice-textarea"
            value={value}
            onChange={(event) => {
              if (isAnswered) return;
              setUserAnswer(event.target.value);
              if (inputError) {
                setInputError(null);
              }
            }}
            disabled={isAnswered}
            rows={4}
            className={`w-full rounded-2xl border px-4 py-3 text-base leading-relaxed text-[#333333] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A0E7E5]/60 ${
              isAnswered ? 'border-[#E5E5E5] bg-[#F2F2F2] text-[#9E9E9E]' : 'border-[#E5E5E5]'
            }`}
            placeholder="Type your rewritten sentence here"
          />
          {!isAnswered && (
            <p className="text-xs text-[#9E9E9E]">Aim for the exact rewritten sentence, then check your answer.</p>
          )}
          <button
            type="submit"
            disabled={isAnswered}
            className={`inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-4 focus:ring-[#A0E7E5]/60 ${
              isAnswered
                ? 'bg-[#E5E5E5] text-[#9E9E9E] cursor-not-allowed'
                : 'bg-[#333333] text-white hover:bg-[#4D4D4D]'
            }`}
          >
            Check answer
          </button>
        </div>
      );
    }

    return null;
  };

  const renderWordBank = () => {
    if (!currentQuestion?.wordBank || currentQuestion.wordBank.length === 0) {
      return null;
    }

    return (
      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Word bank</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {currentQuestion.wordBank.map((entry, wordIndex) => (
            <span
              key={`${entry}-${wordIndex}`}
              className="rounded-full bg-[#A0E7E5]/15 px-3 py-1 text-sm text-[#333333]"
            >
              <MathText text={entry} />
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderPassage = () => {
    const passageText = currentQuestion?.passage;
    if (!passageText) {
      return null;
    }

    const blankMetadataList = Array.isArray(currentQuestion?.sectionBlanks)
      ? currentQuestion.sectionBlanks
      : [];
    const blankLookup = new Map();
    blankMetadataList.forEach((blank) => {
      if (!blank || typeof blank.original !== 'string') {
        return;
      }
      const key = blank.original.trim().toLowerCase();
      if (!key) {
        return;
      }
      if (!blankLookup.has(key)) {
        blankLookup.set(key, []);
      }
      blankLookup.get(key).push({ id: blank.id, original: blank.original });
    });

    const referenceContext = `${
      currentQuestion?.originalTopic || currentQuestion?.topic || ''
    } ${currentQuestion?.sectionTitle || ''}`.toLowerCase();
    const referenceLabel = referenceContext.includes('reading') || referenceContext.includes('visual')
      ? 'Reference article'
      : 'Reference text';

    const blankPattern = /\[([^[\]]+)\]/g;
    let lastIndex = 0;
    let matchIndex = 0;
    const passageNodes = [];
    let match;

    while ((match = blankPattern.exec(passageText)) !== null) {
      const preceding = passageText.slice(lastIndex, match.index);
      if (preceding) {
        passageNodes.push(
          <MathText key={`text-${match.index}-${matchIndex}`} text={preceding} />
        );
      }

      const rawWord = match[1];
      const normalisedWord = rawWord.trim().toLowerCase();
      const candidates = blankLookup.get(normalisedWord);
      let blankMeta = null;
      if (candidates && candidates.length > 0) {
        blankMeta = candidates.shift();
      } else if (blankMetadataList[matchIndex]) {
        blankMeta = blankMetadataList[matchIndex];
      }

      if (blankMeta) {
        const blankLabel =
          blankMeta.id !== undefined && blankMeta.id !== null ? blankMeta.id : matchIndex + 1;
        const isActiveBlank = blankMeta.id === currentQuestion.originalId;
        const numberBadgeClasses = isActiveBlank
          ? 'bg-[#1F2933] text-white border-[#1F2933]'
          : 'bg-[#E5E5E5] text-[#1F2933] border-[#D1D5DB]';
        passageNodes.push(
          <span
            key={`blank-${blankLabel}-${match.index}`}
            className={`align-middle inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold transition-all ${
              isActiveBlank
                ? 'border-[#A0E7E5] bg-[#E0F7F5] text-[#0F172A] shadow-[0_0_0_2px_rgba(160,231,229,0.35)]'
                : 'border-[#E5E5E5] bg-white text-[#374151]'
            }`}
            title={`Highlighted error for blank ${blankLabel.toString()}`}
          >
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold leading-none ${numberBadgeClasses}`}
              aria-hidden="true"
            >
              {blankLabel}
            </span>
            <span className="text-sm font-semibold text-[#111827]">
              <MathText text={rawWord} />
            </span>
          </span>
        );
      } else {
        passageNodes.push(
          <span
            key={`blank-unknown-${match.index}-${matchIndex}`}
            className="inline-flex items-center gap-1 rounded-md bg-[#FFD166]/30 px-2 py-0.5 text-sm font-medium text-[#333333]"
            title="Highlighted error"
          >
            <span className="text-xs font-semibold text-[#555555]">(?)</span>
            <span>
              <MathText text={rawWord} />
            </span>
          </span>
        );
      }

      lastIndex = blankPattern.lastIndex;
      matchIndex += 1;
    }

    const trailingText = passageText.slice(lastIndex);
    if (trailingText) {
      passageNodes.push(<MathText key="text-trailing" text={trailingText} />);
    }

    return (
      <section className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9E9E9E]">
          {referenceLabel}
        </p>
        <div className="mt-2 rounded-3xl border border-[#E5E5E5] bg-[#F2F2F2] px-5 py-4 text-left text-[#333333] shadow-inner whitespace-pre-line leading-relaxed">
          {passageNodes.length > 0 ? passageNodes : <MathText text={passageText} />}
        </div>
      </section>
    );
  };

  if (isSessionComplete) {
    const sessionDurationMs = Math.max(0, (sessionEndTime ?? Date.now()) - sessionStartTime);
    const accuracyPercent = questionsAnswered > 0 ? Math.round((correctCount / questionsAnswered) * 100) : 0;
    const incorrectCount = Math.max(questionsAnswered - correctCount, 0);
    const averageTimeMs = questionDurations.length > 0
      ? questionDurations.reduce((sum, value) => sum + value, 0) / questionDurations.length
      : 0;
    const fastestTimeMs = questionDurations.length > 0 ? Math.min(...questionDurations) : null;
    const slowestTimeMs = questionDurations.length > 0 ? Math.max(...questionDurations) : null;
    const lifelineTotal = fiftyFiftyCount + seventyFiveCount;
    const netTokens = tokenBalance;

    return (
      <div className="min-h-[60vh] w-full flex flex-col items-center px-4 md:px-6">
        <PageHeader title={practiceSummaryTitle} onBack={onExit} className="mb-2" />

        <div className="w-full max-w-5xl pb-8 md:pb-6 space-y-8">
          <section className="rounded-3xl border border-[#E5E5E5] bg-white p-8 shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#333333]">Session complete</p>
                <h2 className="mt-1 text-2xl font-semibold text-[#333333]">Your practice snapshot</h2>
                <p className="mt-2 text-sm text-[#9E9E9E]">
                  {questionsAnswered > 0
                    ? `You answered ${questionsAnswered} question${questionsAnswered === 1 ? '' : 's'} in ${formatDuration(sessionDurationMs)} with ${accuracyPercent}% accuracy.`
                    : 'You wrapped up before answering any questions this round.'}
                </p>
                <p className="mt-1 text-sm text-[#333333]">
                  {tokensEarned || tokensSpent
                    ? `Token haul: +${tokensEarned} earned · -${tokensSpent} spent`
                    : 'Token haul: no tokens exchanged this time.'}
                </p>
              </div>
              <div className="flex items-center gap-4 rounded-3xl border border-[#A0E7E5]/40 bg-[#A0E7E5]/20 px-6 py-4">
                <div className="text-4xl font-bold text-[#333333]">{accuracyPercent}%</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[#333333]">Accuracy</div>
              </div>
            </div>

            {attemptedTopics.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-[#9E9E9E]">
                {strongestTopic && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#A0E7E5]/20 px-3 py-1 text-[#333333]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path d="M10 2a.75.75 0 0 1 .6.3l1.9 2.5 3.1.6a.75.75 0 0 1 .4 1.2l-2.2 2.3.5 3.2a.75.75 0 0 1-1.1.8L10 12.7l-3.2 1.9a.75.75 0 0 1-1.1-.8l.5-3.2-2.2-2.3a.75.75 0 0 1 .4-1.2l3.1-.6 1.9-2.5A.75.75 0 0 1 10 2Z" />
                    </svg>
                    <span>
                      Strength: <span className="font-semibold">{strongestTopic.label}</span> · {strongestTopic.accuracy}%
                    </span>
                  </span>
                )}
                {attemptedTopics.length > 1 && needsAttentionTopic && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#FFB6C1]/20 px-3 py-1 text-[#333333]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path d="M10.45 3.18a.75.75 0 0 0-1.3 0l-6.5 11.5a.75.75 0 0 0 .65 1.12h13a.75.75 0 0 0 .66-1.12l-6.5-11.5Zm-.65 4.07a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5ZM10 14.5a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Z" />
                    </svg>
                    <span>
                      Growth area: <span className="font-semibold">{needsAttentionTopic.label}</span> · {needsAttentionTopic.accuracy}%
                    </span>
                  </span>
                )}
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-2xl border border-[#E5E5E5] bg-[#F2F2F2] px-4 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#333333]">
                    <IconQuestionBadge className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Questions answered</p>
                    <p className="text-lg font-semibold text-[#333333]">
                      {questionsAnswered}
                      <span className="ml-1 text-sm font-normal text-[#9E9E9E]">/ {totalQuestions}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5E5E5] bg-[#F2F2F2] px-4 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#333333]">
                    <IconCheckCircle className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Correct answers</p>
                    <p className="text-lg font-semibold text-[#333333]">{correctCount}</p>
                    <p className="text-xs text-[#9E9E9E]">Incorrect: {incorrectCount}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5E5E5] bg-[#F2F2F2] px-4 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#333333]">
                    <IconClock className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Time taken</p>
                    <p className="text-lg font-semibold text-[#333333]">{formatDuration(sessionDurationMs)}</p>
                    <p className="text-xs text-[#9E9E9E]">Avg / Qn: {formatAverageTime(averageTimeMs)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5E5E5] bg-[#F2F2F2] px-4 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#333333]">
                    <IconFlame className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Best streak</p>
                    <p className="text-lg font-semibold text-[#333333]">{bestStreak || 0}</p>
                    <p className="text-xs text-[#9E9E9E]">Longest correct run</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5E5E5] bg-[#F2F2F2] px-4 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#333333]">
                    <IconToken className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Token balance</p>
                    <p className="text-lg font-semibold text-[#333333]">{netTokens}</p>
                    <p className="text-xs text-[#9E9E9E]">Earned: {tokensEarned} · Spent: {tokensSpent}</p>
                    <p className="text-xs text-[#9E9E9E]">Wallet now: {profile.walletTokens}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-5">
            <div className="self-start rounded-3xl border border-[#A0E7E5]/40 bg-white p-6 shadow-lg lg:col-span-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#333333]">Lifetime topic radar</h3>
                  <p className="mt-1 text-sm text-[#9E9E9E]">Accumulated accuracy across all practice sessions, including this one.</p>
                  <div className="mt-2 space-y-1">
                    {isLifetimeLoading && <p className="text-xs text-[#9E9E9E]">Refreshing lifetime data…</p>}
                    {lifetimeError && !isLifetimeLoading && (
                      <p className="text-xs text-[#FF4D4F]">Unable to load past progress.</p>
                    )}
                  </div>
                </div>
                {hasLifetimeRadarData && !lifetimeError && (
                  <button
                    type="button"
                    onClick={openLifetimeRadarModal}
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
              <div className="mt-6">
                {lifetimeError ? (
                  <div className="rounded-2xl border border-dashed border-[#FFB6C1]/70 bg-[#FFF6F8] p-6 text-center text-sm text-[#7A1120]">
                    <p className="font-semibold">Unable to load your lifetime radar right now.</p>
                    <p className="mt-1 text-xs text-[#B2505B]">Try refreshing later or continue practising to rebuild your streak.</p>
                  </div>
                ) : hasLifetimeRadarData ? (
                  <button
                    type="button"
                    onClick={openLifetimeRadarModal}
                    className="group relative w-full overflow-hidden rounded-3xl border border-[#E5E5E5] bg-[#F9F9F9] p-6 transition hover:border-[#A0E7E5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A0E7E5]"
                    aria-label="Open lifetime topic radar in a larger view"
                  >
                    <div className="pointer-events-none flex justify-center">
                      <div className="w-full max-w-[360px]">
                        <RadarChart data={radarData} size={RESULTS_RADAR_PREVIEW_SIZE} labelMode="outside" labelMargin={24} />
                      </div>
                    </div>
                    <span className="pointer-events-none absolute bottom-4 right-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0F766E] opacity-0 transition group-hover:opacity-100">
                      Click to zoom
                    </span>
                  </button>
                ) : isLifetimeLoading ? (
                  <div className="rounded-2xl border border-dashed border-[#A0E7E5]/80 bg-[#F5FEFF] p-6 text-center text-sm text-[#1F2933]">
                    <p className="font-semibold">Loading lifetime practice data…</p>
                    <p className="mt-1 text-xs text-[#4B5563]">Hang tight while we sync your past sessions.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#A0E7E5] bg-[#F5FEFF] p-6 text-center text-sm text-[#1F2933]">
                    <p className="font-semibold">No lifetime history yet.</p>
                    <p className="mt-1 text-xs text-[#4B5563]">Complete a few practice sessions to unlock your topic radar.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-lg lg:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9E9E9E]">Lifetime topic progress</h3>
              <p className="mt-1 text-sm text-[#9E9E9E]">Totals across all recorded practice sessions.</p>
              {lifetimeError && (
                <p className="mt-4 text-xs text-[#FF4D4F]">Unable to load your past progress right now.</p>
              )}
              {!lifetimeError && (
                <ul className="mt-5 space-y-4">
                  {combinedTopicBreakdown.map((topic) => (
                    <li key={`lifetime-${topic.label}`}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-[#333333]">{topic.label}</span>
                        {topic.attempted > 0 ? (
                          <span className="text-xs text-[#9E9E9E]">
                            {topic.correct}/{topic.attempted} · {topic.accuracy}%
                          </span>
                        ) : (
                          <span className="text-xs text-[#9E9E9E]">No attempts yet</span>
                        )}
                      </div>
                      {topic.sessionAttempted > 0 && (
                        <p className="mt-1 text-xs text-[#9E9E9E]">
                          This session +{topic.sessionCorrect}/{topic.sessionAttempted}
                        </p>
                      )}
                      <div className="mt-2 h-2 rounded-full bg-[#F2F2F2]">
                        <div
                          className="h-full rounded-full bg-[#A0E7E5]/60 transition-all"
                          style={{
                            width: `${topic.attempted > 0 ? (topic.accuracy > 0 ? Math.max(6, topic.accuracy) : 0) : 0}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-lg lg:col-span-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9E9E9E]">This session breakdown</h3>
                  <p className="mt-1 text-sm text-[#9E9E9E]">Accuracy per topic in this practice run.</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-[#F5FEFF] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[#0F766E]">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#0F766E]" />
                  {`${correctCount}/${totalQuestions} correct`}
                </div>
              </div>
              <ul className="mt-5 grid gap-4 md:grid-cols-2">
                {topicBreakdown.map((topic) => (
                  <li key={topic.label} className="rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] p-4">
                    <div className="flex items-start justify-between text-sm">
                      <span className="font-semibold text-[#333333]">{topic.label}</span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#4B5563]">{topic.accuracy}%</span>
                    </div>
                    <p className="mt-1 text-xs text-[#9E9E9E]">
                      {topic.attempted > 0 ? `${topic.correct}/${topic.attempted} correct` : 'No attempts yet'}
                    </p>
                    <div className="mt-3 h-2 rounded-full bg-[#EAEAEA]">
                      <div
                        className="h-full rounded-full bg-[#A0E7E5]/60 transition-all"
                        style={{
                          width: `${topic.attempted > 0 ? (topic.accuracy > 0 ? Math.max(6, topic.accuracy) : 0) : 0}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-lg">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9E9E9E]">Learning aids</h3>
              <p className="mt-1 text-sm text-[#9E9E9E]">How often you leaned on BuddyNC for support.</p>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-[#A0E7E5]/20 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#333333]">
                      <IconHint className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#333333]">Hints used</p>
                      <p className="text-xs text-[#9E9E9E]">Guided nudges to get unstuck</p>
                    </div>
                  </div>
                  <span className="text-lg font-semibold text-[#333333]">{hintsUsedCount}</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-[#F2F2F2] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#333333]">
                      <IconFiftyFifty className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#333333]">50-50 lifelines</p>
                      <p className="text-xs text-[#9E9E9E]">Removed two tricky distractors</p>
                    </div>
                  </div>
                  <span className="text-lg font-semibold text-[#333333]">{fiftyFiftyCount}</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-[#F2F2F2] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#333333]">
                      <IconSeventyFiveTwentyFive className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#333333]">75-25 lifelines</p>
                      <p className="text-xs text-[#9E9E9E]">One gentle nudge towards the answer</p>
                    </div>
                  </div>
                  <span className="text-lg font-semibold text-[#333333]">{seventyFiveCount}</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-[#F2F2F2] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#333333]">
                      <IconStopSession className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#333333]">Total lifelines</p>
                      <p className="text-xs text-[#9E9E9E]">Combined 50-50 and 75-25 assists</p>
                    </div>
                  </div>
                  <span className="text-lg font-semibold text-[#333333]">{lifelineTotal}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-lg">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9E9E9E]">Pace insights</h3>
              <p className="mt-1 text-sm text-[#9E9E9E]">Understand how quickly you worked through each prompt.</p>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-[#F2F2F2] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#333333]">Average answer time</p>
                    <p className="text-xs text-[#9E9E9E]">Across all attempted questions</p>
                  </div>
                  <span className="text-lg font-semibold text-[#333333]">{formatAverageTime(averageTimeMs)}</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-[#F2F2F2] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#333333]">Fastest response</p>
                    <p className="text-xs text-[#9E9E9E]">Quickest correct or incorrect attempt</p>
                  </div>
                  <span className="text-lg font-semibold text-[#333333]">{fastestTimeMs !== null ? formatAverageTime(fastestTimeMs) : '–'}</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-[#F2F2F2] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#333333]">Slowest response</p>
                    <p className="text-xs text-[#9E9E9E]">Where you took the most time</p>
                  </div>
                  <span className="text-lg font-semibold text-[#333333]">{slowestTimeMs !== null ? formatAverageTime(slowestTimeMs) : '–'}</span>
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-white px-5 py-2 text-sm font-semibold text-[#9E9E9E] transition-colors hover:border-[#A0E7E5] hover:text-[#333333] focus:outline-none focus:ring-4 focus:ring-[#A0E7E5]/30"
            >
              <span aria-hidden>&larr;</span>
              <span>Close session</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSessionStartTime(Date.now());
                setSessionEndTime(null);
                setQuestionsAnswered(0);
                setHintsUsedCount(0);
                setFiftyFiftyCount(0);
                setSeventyFiveCount(0);
                setQuestionDurations([]);
                setCorrectCount(0);
                setCurrentIndex(0);
                setTopicStats(createInitialTopicStats());
                setUserAnswer('');
                setInputError(null);
                setIsAnswered(false);
                setIsCorrect(null);
                setIsHintLoading(false);
                setHint(null);
                setHintError(null);
                setIsExplanationLoading(false);
                setExplanation(null);
                setExplanationError(null);
                setEliminatedOptions([]);
                setUsedFiftyFifty(false);
                setUsedSeventyFiveTwentyFive(false);
                setUsedAssistanceType(null);
                setIsPerformanceOpen(false);
                setIsTopicPanelOpen(false);
                setShowQuestionMeta(false);
                setIsSessionComplete(false);
                setIsStopConfirmOpen(false);
                setCurrentStreak(0);
                setBestStreak(0);
                setTokenBalance(0);
                setTokensEarned(0);
                setTokensSpent(0);
                setTokenCelebration(null);
                setAchievementCelebration(null);
                setMilestoneCelebration(null);
                setStreakConfetti(null);
                if (achievementCelebrationTimeoutRef.current) {
                  clearTimeout(achievementCelebrationTimeoutRef.current);
                  achievementCelebrationTimeoutRef.current = null;
                }
                if (milestoneCelebrationTimeoutRef.current) {
                  clearTimeout(milestoneCelebrationTimeoutRef.current);
                  milestoneCelebrationTimeoutRef.current = null;
                }
                if (streakConfettiTimeoutRef.current) {
                  clearTimeout(streakConfettiTimeoutRef.current);
                  streakConfettiTimeoutRef.current = null;
                }
                unlockedMilestonesRef.current.clear();
                questionStartRef.current = Date.now();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#A0E7E5] px-5 py-2 text-sm font-semibold text-[#333333] shadow-sm transition-colors hover:bg-[#7BD8D5] focus:outline-none focus:ring-4 focus:ring-[#A0E7E5]/60"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M10 2a.75.75 0 0 1 .75.75v6.5h6.5a.75.75 0 0 1 0 1.5h-6.5v6.5a.75.75 0 0 1-1.5 0v-6.5h-6.5a.75.75 0 0 1 0-1.5h6.5v-6.5A.75.75 0 0 1 10 2Z" />
              </svg>
              <span>Practice again</span>
            </button>
          </div>
        </div>

        {isLifetimeRadarModalOpen && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-[#1F2933]/60"
            onClick={closeLifetimeRadarModal}
          >
            <div className="flex min-h-full items-center justify-center px-4 py-6">
              <div
                className="relative w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
                role="dialog"
                aria-modal="true"
                aria-labelledby={RESULTS_RADAR_MODAL_TITLE_ID}
                aria-describedby={RESULTS_RADAR_MODAL_DESC_ID}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={closeLifetimeRadarModal}
                  className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E5E5] text-[#4B5563] transition hover:border-[#A0E7E5] hover:text-[#0F766E]"
                  aria-label="Close lifetime radar"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="m6 6 12 12" />
                    <path d="M6 18 18 6" />
                  </svg>
                </button>
                <div className="space-y-6">
                  <div className="pr-10">
                    <h2 id={RESULTS_RADAR_MODAL_TITLE_ID} className="text-xl font-semibold text-[#333333]">Lifetime topic radar</h2>
                    <p id={RESULTS_RADAR_MODAL_DESC_ID} className="mt-1 text-sm text-[#4B5563]">
                      Explore your accuracy trends by topic. Keep adding practice rounds to strengthen every axis.
                    </p>
                  </div>
                  <div className="flex justify-center overflow-x-auto">
                    <div className="w-full max-w-[720px]">
                      <RadarChart data={radarData} size={RESULTS_RADAR_MODAL_SIZE} labelMode="outside" labelMargin={42} />
                    </div>
                  </div>
                  {lifetimeRadarTopTopics.length > 0 && (
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {lifetimeRadarTopTopics.map((topic) => (
                        <li key={`${topic.label}-modal`} className="rounded-2xl border border-[#E5E5E5] bg-[#F9F9F9] p-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-[#333333]">{topic.label}</span>
                            <span className="text-xs text-[#9E9E9E]">
                              {numberFormat(topic.correct)}/{numberFormat(topic.attempted)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#9E9E9E]">
                            {topic.sessions} session{topic.sessions === 1 ? '' : 's'}
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
  }

  if (totalQuestions === 0) {
    return (
      <div className="text-center">
        <PageHeader title={practiceSessionTitle} onBack={handleGoBack} />
        <div className="bg-white p-10 rounded-xl shadow-lg border border-[#E5E5E5]">
          <p className="text-[#9E9E9E]">No questions are available for practice right now.</p>
          <button
            type="button"
            onClick={handleGoBack}
            className="mt-6 rounded-full bg-[#A0E7E5] px-6 py-2 text-sm font-semibold text-[#333333] transition hover:bg-[#7BD8D5]"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const isChoiceQuestion =
    choiceQuestionTypes.has(currentQuestion?.type) && Array.isArray(currentQuestion?.options);
  const remainingWrongOptions = isChoiceQuestion
    ? currentQuestion.options.filter(
        (option) => !isAnswerCorrect(currentQuestion, option) && !eliminatedOptions.includes(option)
      )
    : [];

  const hintDisabled = isHintLoading || isAnswered || usedAssistanceType !== null;
  const fiftyFiftyDisabled =
    isAnswered ||
    usedFiftyFifty ||
    !isChoiceQuestion ||
    remainingWrongOptions.length < 2 ||
    (usedAssistanceType && usedAssistanceType !== 'fiftyFifty');
  const seventyFiveDisabled =
    isAnswered ||
    usedSeventyFiveTwentyFive ||
    !isChoiceQuestion ||
    remainingWrongOptions.length < 1 ||
    (usedAssistanceType && usedAssistanceType !== 'seventyFiveTwentyFive');

  const nextStreakTargetConfig = getNextStreakTarget(currentStreak);
  const highestStreakThreshold =
    STREAK_BONUSES[STREAK_BONUSES.length - 1]?.threshold ?? STREAK_LOOP_BONUS.interval ?? 3;
  let progressWithinWindow = 0;
  let requiredWithinWindow = Math.max(1, STREAK_LOOP_BONUS.interval || 3);

  if (currentStreak > 0) {
    if (nextStreakTargetConfig) {
      const windowStart = getPreviousThresholdBefore(nextStreakTargetConfig.threshold);
      progressWithinWindow = currentStreak - windowStart;
      requiredWithinWindow = Math.max(1, nextStreakTargetConfig.threshold - windowStart);
    } else {
      const windowStart = highestStreakThreshold;
      const loopInterval = Math.max(1, STREAK_LOOP_BONUS.interval || 3);
      const loopProgressRaw = currentStreak - windowStart;
      const loopProgress = loopInterval > 0 ? loopProgressRaw % loopInterval : 0;
      progressWithinWindow = loopProgress === 0 ? loopInterval : loopProgress;
      requiredWithinWindow = loopInterval;
    }
  }

  const streakFillCount =
    currentStreak > 0
      ? Math.max(0, Math.min(3, Math.ceil((progressWithinWindow / requiredWithinWindow) * 3)))
      : 0;
  const celebrationThemes = {
    gain: {
      className: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 text-white',
      icon: '✨',
    },
    streak: {
      className: 'bg-gradient-to-r from-orange-400 via-pink-500 to-rose-500 text-white',
      icon: '🔥',
    },
    spend: {
      className: 'bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-white',
      icon: '🪙',
    },
    loss: {
      className: 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 text-white',
      icon: '⚠️',
    },
  };

  return (
    <div className="relative min-h-[60vh] w-full flex flex-col items-center px-4 md:px-6">
      {streakConfetti && (() => {
        const config = ACHIEVEMENT_CELEBRATIONS['streak-10'];
        if (!config) {
          return null;
        }
        return (
          <div
            key={streakConfetti.id}
            className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-start overflow-hidden"
          >
            <div className="mt-6 flex w-full max-w-5xl justify-between px-2 sm:px-6 lg:px-10">
              {streakConfetti.seeds.map((seed, index) => (
                <div key={`streak-confetti-${index}`} className="relative h-32 w-24 sm:w-32 lg:w-40">
                  <ConfettiBurst colors={config.colors} seed={seed} />
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-3xl bg-[#0F172A]/80 px-6 py-3 text-center text-white shadow-[0_16px_32px_rgba(15,23,42,0.35)] ring-2 ring-white/20">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Streak 10</p>
              <p className="text-lg font-semibold">Perfect streak — keep going!</p>
            </div>
          </div>
        );
      })()}
      <PageHeader title={practiceSessionTitle} onBack={handleGoBack} className="mb-2" />

      <div className="w-full max-w-5xl flex-1 pb-16 md:pb-10">
        <div className="relative flex items-center text-sm text-[#9E9E9E] mb-4">
          <span>
            Question {currentIndex + 1} of {totalQuestions} · Correct so far: {correctCount}
          </span>
          <div className="ml-auto md:ml-0 md:absolute md:right-[-4.5rem] md:top-[-3rem] md:-translate-y-0 lg:right-[-5.5rem]">
            <div className="relative">
              <div className="inline-flex min-w-[200px] flex-col gap-1 rounded-3xl bg-gradient-to-r from-[#fb923c] via-[#facc15] to-[#34d399] px-4 py-2 text-white shadow-xl ring-2 ring-white/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                      <IconToken className="h-4 w-4 text-white" />
                    </span>
                    <span className="text-xl font-semibold leading-none tracking-wide">{tokenBalance}</span>
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">Tokens</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/70">Combo</span>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 3 }).map((_, index) => {
                      const isFilled = index < streakFillCount;
                      return (
                        <span
                          key={`combo-pip-${index}`}
                          className={`h-2.5 w-5 rounded-full border border-white/40 transition-all duration-300 ${
                            isFilled ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.75)]' : 'bg-white/20'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              {tokenCelebration && (() => {
                const theme = celebrationThemes[tokenCelebration.variant] || celebrationThemes.gain;
                return (
                  <div
                    key={tokenCelebration.id}
                    className={`absolute -top-12 right-0 inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 text-xs font-semibold shadow-[0_12px_28px_rgba(15,23,42,0.25)] ring-1 ring-white/30 backdrop-blur ${theme.className}`}
                    style={{ transform: 'translateY(-4px)', opacity: 0.97 }}
                  >
                    <span className="text-sm" aria-hidden>{theme.icon}</span>
                    <span className="whitespace-nowrap">{tokenCelebration.message}</span>
                  </div>
                );
              })()}
              {achievementCelebration && (() => {
                const { key, seed, id, message, bonus } = achievementCelebration;
                const config = ACHIEVEMENT_CELEBRATIONS[key];
                if (!config) {
                  return null;
                }
                return (
                  <div
                    key={id}
                    className="pointer-events-none absolute -top-52 left-1/2 z-10 flex w-[260px] -translate-x-1/2 flex-col items-center"
                  >
                    <div
                      className={`relative w-full overflow-visible rounded-3xl border border-white/40 bg-gradient-to-r px-5 py-4 text-center text-white shadow-[0_16px_32px_rgba(15,23,42,0.28)] ${config.gradient}`}
                    >
                      <ConfettiBurst colors={config.colors} seed={seed} />
                      <span className="text-2xl" aria-hidden>
                        {config.icon}
                      </span>
                      <p className="mt-1 text-sm font-semibold uppercase tracking-[0.3em]">{config.title}</p>
                      <p className="mt-1 text-xs text-white/90">{message || config.blurb}</p>
                      {bonus ? (
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
                          Bonus · +{bonus}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })()}
              {milestoneCelebration && (() => {
                const { tier, balance, seed, id } = milestoneCelebration;
                return (
                  <div
                    key={id}
                    className="pointer-events-none absolute -top-28 left-1/2 z-10 flex w-[260px] -translate-x-1/2 flex-col items-center"
                  >
                    <div
                      className={`relative w-full overflow-visible rounded-3xl border border-white/40 bg-gradient-to-r px-5 py-4 text-center text-white shadow-[0_18px_36px_rgba(15,23,42,0.35)] ${tier.gradient}`}
                    >
                      <ConfettiBurst colors={tier.colors} seed={seed} />
                      <span className="text-2xl" aria-hidden>
                        {tier.icon}
                      </span>
                      <p className="mt-1 text-sm font-semibold uppercase tracking-[0.3em]">{tier.label}</p>
                      <p className="mt-1 text-xs text-white/90">{tier.blurb}</p>
                      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
                        Balance · {balance}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="md:grid md:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] md:items-start md:gap-8">
          <div className="relative">
            <form
              onSubmit={handleFormSubmit}
              className="relative w-full bg-white border border-[#E5E5E5] shadow-xl rounded-3xl px-8 py-10 flex flex-col gap-6"
            >
              <button
                type="button"
                onClick={() => {
                  setIsTopicPanelOpen(true);
                  setIsPerformanceOpen(true);
                }}
                className="md:hidden absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#A0E7E5]/60 bg-white text-[#333333] shadow-sm transition-colors hover:border-[#FFB6C1] hover:text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#A0E7E5]/40"
                aria-label="Open topic performance"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M3.75 4.5a.75.75 0 0 1 .75-.75h5.25a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1-.75-.75V4.5ZM12 4.5a.75.75 0 0 1 .75-.75h6.75a.75.75 0 0 1 .75.75v6.75a.75.75 0 0 1-.75.75h-6.75a.75.75 0 0 1-.75-.75V4.5ZM3.75 13.5A.75.75 0 0 1 4.5 12.75h6.75a.75.75 0 0 1 .75.75v6.75a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1-.75-.75V13.5ZM15 13.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-.75.75h-3A.75.75 0 0 1 15 16.5v-3Z" />
                </svg>
              </button>

              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#333333] font-semibold">
                      <span>{categoryLabel}</span>
                      {originalTopicLabel && (
                        <span className="ml-2 font-normal text-[#9E9E9E] normal-case">({originalTopicLabel})</span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuestionMeta((prev) => !prev)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E5E5] bg-white text-[#9E9E9E] transition-colors hover:border-[#A0E7E5] hover:text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#A0E7E5]/60"
                    aria-expanded={showQuestionMeta}
                    aria-controls="practice-question-meta"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M6 3.75A2.25 2.25 0 0 1 8.25 1.5H11l4.5 4.5v9.75A2.25 2.25 0 0 1 13.25 18h-5A2.25 2.25 0 0 1 6 15.75V3.75Z" />
                      <path d="M11 1.5v3a1.5 1.5 0 0 0 1.5 1.5h3" />
                    </svg>
                    <span className="sr-only">Paper info</span>
                  </button>
                </div>

                {showQuestionMeta && (
                  <div
                    id="practice-question-meta"
                    className="mt-2 rounded-2xl border border-[#E5E5E5] bg-[#F2F2F2] px-3 py-2 text-xs text-[#9E9E9E]"
                  >
                    <p className="font-semibold text-[#333333]">{currentQuestion.sectionTitle}</p>
                    <p className="mt-0.5">{currentQuestion.examTitle}</p>
                    {originalTopicLabel && (
                      <p className="mt-0.5 text-[#666666]">Original topic: {originalTopicLabel}</p>
                    )}
                  </div>
                )}

                {currentQuestion.sectionInstructions && (
                  <p className="mt-3 text-sm leading-relaxed text-[#9E9E9E]">
                    <MathText text={currentQuestion.sectionInstructions} />
                  </p>
                )}

                {renderPassage()}

                <h2
                  className={`text-2xl font-semibold text-[#333333] ${
                    currentQuestion?.sectionInstructions || currentQuestion?.passage ? 'mt-6' : 'mt-2'
                  }`}
                >
                  <MathText text={currentQuestion.prompt} />
                </h2>
                {currentQuestion.providedPrompt && (
                  <p className="mt-2 text-sm text-[#9E9E9E]">
                    Use the prompt:{' '}
                    <span className="font-semibold text-[#C24141]">
                      <MathText text={currentQuestion.providedPrompt} />
                    </span>
                  </p>
                )}
              </div>

              {renderWordBank()}

              <div className="mt-4">
                {renderResponseInput()}
                {inputError && <p className="mt-2 text-sm text-[#FF4D4F]">{inputError}</p>}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleGetHint}
                  disabled={hintDisabled}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                    hintDisabled
                      ? 'border-[#E5E5E5] text-[#9E9E9E]'
                      : 'border-[#A0E7E5]/40 text-[#333333] hover:border-[#A0E7E5] hover:text-[#333333]'
                  }`}
                  title="Get a hint"
                  aria-label="Get a hint"
                >
                  {isHintLoading ? (
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-20"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                      />
                      <path
                        className="opacity-60"
                        d="M12 2a10 10 0 0 1 10 10"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                  ) : (
                    <IconHint className="h-4 w-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleFiftyFifty}
                  disabled={fiftyFiftyDisabled}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                    fiftyFiftyDisabled
                      ? 'border-[#E5E5E5] text-[#9E9E9E]'
                      : 'border-sky-200 text-sky-600 hover:border-sky-300 hover:text-sky-700'
                  }`}
                  title="Use 50-50 lifeline"
                  aria-label="Use 50-50 lifeline"
                >
                  <IconFiftyFifty className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleSeventyFiveTwentyFive}
                  disabled={seventyFiveDisabled}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                    seventyFiveDisabled
                      ? 'border-[#E5E5E5] text-[#9E9E9E]'
                      : 'border-violet-200 text-violet-600 hover:border-violet-300 hover:text-violet-700'
                  }`}
                  title="Use 75-25 lifeline"
                  aria-label="Use 75-25 lifeline"
                >
                  <IconSeventyFiveTwentyFive className="h-4 w-4" />
                </button>
              </div>

              {hint && (
                <div className="rounded-2xl border border-[#FFB6C1]/60 bg-[#FFB6C1]/20 px-4 py-3 text-sm text-[#333333]">
                  <strong className="block font-semibold">Hint:</strong>{' '}
                  <MathText text={hint} />
                </div>
              )}

              {hintError && (
                <p className="text-sm text-[#FF4D4F]">{hintError}</p>
              )}

              {isAnswered && (
                <div
                  className={`rounded-2xl border px-4 py-4 ${
                    isCorrect
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}
                >
                  <p className="text-lg font-semibold">
                    {isCorrect ? 'Great job! That’s correct.' : 'Not quite right this time.'}
                  </p>
                  {!isCorrect && (
                    <p className="mt-2 text-sm text-rose-600">
                      Correct answer:{' '}
                      <span className="font-semibold">
                        {Array.isArray(currentQuestion.answer)
                          ? currentQuestion.answer.map((answerOption, answerIndex) => (
                              <React.Fragment key={`answer-${answerIndex}`}>
                                <MathText text={answerOption} />
                                {answerIndex < currentQuestion.answer.length - 1 && <span>, </span>}
                              </React.Fragment>
                            ))
                          : <MathText text={currentQuestion.answer} />}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {isAnswered && !isCorrect && (
                <div className="rounded-2xl bg-[#A0E7E5]/15 border border-[#A0E7E5]/40 px-4 py-3 text-sm text-[#333333]">
                  {isExplanationLoading && <p>Loading explanation…</p>}
                  {explanationError && <p>{explanationError}</p>}
                  {!isExplanationLoading && !explanationError && explanation && (
                    <>
                      <strong className="block font-semibold">Explanation:</strong>
                      <p className="mt-1 whitespace-pre-line leading-relaxed">
                        <MathText text={explanation} />
                      </p>
                    </>
                  )}
                </div>
              )}

              {isAnswered && !isCorrect && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={moveToNextQuestion}
                    className="rounded-full bg-[#A0E7E5] px-6 py-2 text-sm font-semibold text-[#333333] shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#7BD8D5] focus:outline-none focus:ring-4 focus:ring-[#A0E7E5]/60"
                  >
                    {currentIndex === totalQuestions - 1 ? 'Finish session' : 'Next'}
                  </button>
                </div>
              )}
            </form>
          </div>

          {!isSessionComplete && (
            <div className="md:hidden mt-6">
              <button
                type="button"
                onClick={() => setIsStopConfirmOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#FFB6C1]/60 bg-[#FFB6C1]/20 text-[#FF4D4F] shadow-sm transition-colors hover:border-[#FF6F6F] hover:bg-[#FFB6C1]/30 focus:outline-none focus:ring-4 focus:ring-[#FFB6C1]/40"
                aria-label="Stop session"
              >
                <IconStopSession className="h-4 w-4" />
                <span className="sr-only">Stop session</span>
              </button>
            </div>
          )}

          <aside className="hidden md:block">
            <div className="sticky top-28 space-y-4 w-full md:w-[24rem]">
              <div className="w-full rounded-3xl border border-[#A0E7E5]/40 bg-white px-6 py-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[#333333]">Lifetime radar</h3>
                  <button
                    type="button"
                    onClick={() => setIsPerformanceOpen((prev) => !prev)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[#A0E7E5]/40 ${
                      isPerformanceOpen
                        ? 'border-[#A0E7E5] text-[#333333]'
                        : 'border-[#A0E7E5]/60 text-[#333333] hover:border-[#FFB6C1] hover:text-[#333333]'
                    }`}
                    aria-label="Toggle performance overview"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path d="M12 5.25a.75.75 0 0 1 .743.648l.007.102V11h5a.75.75 0 0 1 .743.648L18.5 11.75a.75.75 0 0 1-.648.743L17.75 12.5h-5v5a.75.75 0 0 1-1.493.102L11.25 17.5v-5h-5a.75.75 0 0 1-.102-1.493L6.25 10.997h5V6a.75.75 0 0 1 1.5 0Z" />
                    </svg>
                  </button>
                </div>
                <p className="mt-2 text-xs text-[#9E9E9E]">Accumulated accuracy by topic (includes this session).</p>
                {isLifetimeLoading && (
                  <p className="mt-1 text-xs text-[#9E9E9E]">Refreshing lifetime data…</p>
                )}
                {lifetimeError && !isLifetimeLoading && (
                  <p className="mt-1 text-xs text-[#FF4D4F]">Unable to load past progress.</p>
                )}
                <div className="mt-4 flex justify-center">
                  <RadarChart
                    data={radarData}
                    size={240}
                    labelMode="outside"
                    labelMargin={18}
                  />
                </div>
              </div>

              {isPerformanceOpen && (
                <div className="w-full rounded-3xl border border-[#E5E5E5] bg-white px-6 py-5 shadow-lg">
                  <h4 className="text-sm font-semibold text-[#333333]">Performance overview</h4>
                  <p className="mt-1 text-xs text-[#9E9E9E]">
                    Points accumulate with every correct answer.
                  </p>
                  <ul className="mt-4 space-y-2">
                    {topicKeys.map((key) => {
                      const stats = topicStats[key] || { correct: 0, attempted: 0 };
                      const attemptsLabel = stats.attempted === 1 ? 'attempt' : 'attempts';
                      return (
                        <li
                          key={key}
                          className="flex items-center justify-between rounded-2xl bg-[#A0E7E5]/20 px-4 py-2"
                        >
                          <span className="text-xs font-semibold uppercase tracking-wide text-[#333333]">{key}</span>
                          <span className="text-xs text-[#333333]">
                            {stats.correct} pts · {stats.attempted} {attemptsLabel}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {!isSessionComplete && (
                <div className="flex justify-end md:translate-x-6 lg:translate-x-8">
                  <button
                    type="button"
                    onClick={() => setIsStopConfirmOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#FFB6C1]/60 bg-[#FFB6C1]/20 text-[#FF4D4F] shadow-sm transition-colors hover:border-[#FF6F6F] hover:bg-[#FFB6C1]/30 focus:outline-none focus:ring-4 focus:ring-[#FFB6C1]/40"
                    aria-label="Stop session"
                  >
                    <IconStopSession className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </aside>
      </div>
    </div>

    {isStopConfirmOpen && !isSessionComplete && (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#F2F2F2]/90 px-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 pb-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsStopConfirmOpen(false)}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E5E5] text-[#9E9E9E] transition-colors hover:border-[#E5E5E5] hover:text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#A0E7E5]/40"
              aria-label="Close stop session dialog"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFB6C1]/20 text-[#FF4D4F]">
                <IconStopSession className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#333333]">Stop practice?</h3>
                <p className="mt-1 text-sm text-[#9E9E9E]">
                  You&apos;ll jump to your session results. You can always start a fresh round later.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={completeSession}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF4D4F] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#FF6F6F] focus:outline-none focus:ring-4 focus:ring-[#FFB6C1]/40"
              >
                <IconStopSession className="h-4 w-4" />
                <span>Stop and view results</span>
              </button>
              <button
                type="button"
                onClick={() => setIsStopConfirmOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-sm font-semibold text-[#9E9E9E] transition-colors hover:border-[#A0E7E5] hover:text-[#333333] focus:outline-none focus:ring-4 focus:ring-[#A0E7E5]/30"
              >
                Keep practising
              </button>
            </div>
          </div>
        </div>
      )}

      {isTopicPanelOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#F2F2F2]/90 px-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setIsTopicPanelOpen(false);
                setIsPerformanceOpen(false);
              }}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E5E5] text-[#9E9E9E] transition-colors hover:border-[#E5E5E5] hover:text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#A0E7E5]/40"
              aria-label="Close topic performance"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#333333]">Topic radar</h3>
            <div className="mt-4 flex justify-center">
              <RadarChart
                data={radarData}
                size={240}
                labelMode="outside"
                labelMargin={18}
              />
            </div>

            {isPerformanceOpen && (
              <>
                <h4 className="mt-6 text-sm font-semibold text-[#333333]">Performance overview</h4>
                <p className="mt-1 text-xs text-[#9E9E9E]">Points accumulate with every correct answer.</p>
                <ul className="mt-4 space-y-2">
                  {topicKeys.map((key) => {
                    const stats = topicStats[key] || { correct: 0, attempted: 0 };
                    const attemptsLabel = stats.attempted === 1 ? 'attempt' : 'attempts';
                    return (
                      <li
                        key={key}
                        className="flex items-center justify-between rounded-2xl bg-[#A0E7E5]/20 px-3 py-2"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wide text-[#333333]">{key}</span>
                        <span className="text-xs text-[#333333]">
                          {stats.correct} pts · {stats.attempted} {attemptsLabel}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
      </div>
    )}
  </div>
);
};

export default PracticeMode;
