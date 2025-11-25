import PerformanceSession from '../models/PerformanceSession.js';

const MAX_SESSION_HISTORY = 200;

const normaliseNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric;
  }
  return fallback;
};

const clampAccuracy = (value) => {
  const numeric = normaliseNumber(value, 0);
  if (numeric < 0) return 0;
  if (numeric > 100) return 100;
  return Math.round(numeric * 10) / 10;
};

const sanitiseTopics = (topics) => {
  if (!Array.isArray(topics)) return [];
  return topics
    .map((topic) => {
      if (!topic) return null;
      const label = typeof topic.label === 'string' ? topic.label.trim() : '';
      const attempted = Math.max(0, Math.round(normaliseNumber(topic.attempted, 0)));
      const correct = Math.max(0, Math.round(normaliseNumber(topic.correct, 0)));
      const accuracy = attempted > 0 ? clampAccuracy((correct / attempted) * 100) : clampAccuracy(topic.accuracy);
      if (!label && attempted === 0 && correct === 0) {
        return null;
      }
      return {
        label: label || 'General',
        attempted,
        correct,
        accuracy,
      };
    })
    .filter(Boolean);
};

const buildSessionSummary = (session) => {
  if (!session) return null;

  const base = typeof session.toObject === 'function' ? session.toObject() : session;

  return {
    id: base._id ? base._id.toString() : undefined,
    sessionType: base.sessionType,
    title: base.title,
    paperId: base.paperId,
    paperTitle: base.paperTitle,
    level: base.level,
    subject: base.subject,
    totalQuestions: normaliseNumber(base.totalQuestions, 0),
    correct: normaliseNumber(base.correct, 0),
    incorrect: normaliseNumber(base.incorrect, 0),
    accuracy: clampAccuracy(base.accuracy),
    durationSeconds: normaliseNumber(base.durationSeconds, 0),
    tokensEarned: normaliseNumber(base.tokensEarned, 0),
    tokensSpent: normaliseNumber(base.tokensSpent, 0),
    streak: normaliseNumber(base.streak, 0),
    bestStreak: normaliseNumber(base.bestStreak, 0),
    startedAt: base.startedAt ? new Date(base.startedAt) : null,
    completedAt: base.completedAt ? new Date(base.completedAt) : null,
    topics: sanitiseTopics(base.topics),
  };
};

export const recordSession = async (req, res, next) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const {
      sessionType,
      title,
      paperId,
      paperTitle,
      level,
      subject,
      totalQuestions,
      correct,
      incorrect,
      accuracy,
      durationSeconds,
      tokensEarned,
      tokensSpent,
      streak,
      bestStreak,
      startedAt,
      completedAt,
      topics,
      metadata,
    } = req.body || {};

    if (!sessionType || !['practice', 'paper'].includes(sessionType)) {
      return res.status(400).json({ message: 'Invalid session type.' });
    }

    const now = new Date();
    const parsedTotalQuestions = Math.max(0, Math.round(normaliseNumber(totalQuestions, 0)));
    const parsedCorrect = Math.max(0, Math.round(normaliseNumber(correct, 0)));
    const parsedIncorrect = Math.max(0, Math.round(
      normaliseNumber(typeof incorrect === 'number' ? incorrect : parsedTotalQuestions - parsedCorrect, 0)
    ));

    const computedAccuracy = parsedTotalQuestions > 0
      ? clampAccuracy((parsedCorrect / parsedTotalQuestions) * 100)
      : clampAccuracy(accuracy);

    const record = new PerformanceSession({
      user: user._id,
      sessionType,
      title: typeof title === 'string' && title.trim() ? title.trim() : sessionType === 'practice' ? 'Practice Session' : 'Past Paper Attempt',
      paperId: typeof paperId === 'string' && paperId.trim() ? paperId.trim() : null,
      paperTitle: typeof paperTitle === 'string' && paperTitle.trim() ? paperTitle.trim() : null,
      level: typeof level === 'string' && level.trim() ? level.trim() : null,
      subject: typeof subject === 'string' && subject.trim() ? subject.trim() : null,
      totalQuestions: parsedTotalQuestions,
      correct: parsedCorrect,
      incorrect: parsedIncorrect,
      accuracy: computedAccuracy,
      durationSeconds: Math.max(0, Math.round(normaliseNumber(durationSeconds, 0))),
      tokensEarned: Math.max(0, Math.round(normaliseNumber(tokensEarned, 0))),
      tokensSpent: Math.max(0, Math.round(normaliseNumber(tokensSpent, 0))),
      streak: Math.max(0, Math.round(normaliseNumber(streak, 0))),
      bestStreak: Math.max(0, Math.round(normaliseNumber(bestStreak, 0))),
      startedAt: startedAt ? new Date(startedAt) : now,
      completedAt: completedAt ? new Date(completedAt) : now,
      topics: sanitiseTopics(topics),
      metadata: metadata && typeof metadata === 'object' ? metadata : null,
    });

    await record.save();

    const totalSessions = await PerformanceSession.countDocuments({ user: user._id });
    if (totalSessions > MAX_SESSION_HISTORY) {
      const excess = totalSessions - MAX_SESSION_HISTORY;
      if (excess > 0) {
        const oldest = await PerformanceSession.find({ user: user._id })
          .sort({ completedAt: 1, createdAt: 1 })
          .limit(excess)
          .select('_id')
          .lean()
          .exec();
        const idsToRemove = oldest.map((entry) => entry._id);
        if (idsToRemove.length > 0) {
          await PerformanceSession.deleteMany({ _id: { $in: idsToRemove } });
        }
      }
    }

    return res.status(201).json({
      message: 'Session recorded successfully.',
      session: buildSessionSummary(record),
    });
  } catch (error) {
    return next(error);
  }
};

export const getSummary = async (req, res, next) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const sessions = await PerformanceSession.find({ user: user._id })
      .sort({ completedAt: -1, createdAt: -1 })
      .lean()
      .exec();

    const totals = {
      totalSessions: 0,
      practiceSessions: 0,
      paperAttempts: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      totalDurationSeconds: 0,
      totalTokensEarned: 0,
      totalTokensSpent: 0,
    };

    const cumulativeByType = {
      practice: {
        count: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        totalDurationSeconds: 0,
        totalTokensEarned: 0,
        totalTokensSpent: 0,
      },
      paper: {
        count: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        totalDurationSeconds: 0,
        totalTokensEarned: 0,
        totalTokensSpent: 0,
      },
    };

    const subjectMap = new Map();
    const practiceTopicMap = new Map();

    sessions.forEach((session) => {
      const summary = buildSessionSummary(session);
      if (!summary) return;
      totals.totalSessions += 1;
      totals.totalQuestions += summary.totalQuestions;
      totals.totalCorrect += summary.correct;
      totals.totalIncorrect += summary.incorrect;
      totals.totalDurationSeconds += summary.durationSeconds;
      totals.totalTokensEarned += summary.tokensEarned;
      totals.totalTokensSpent += summary.tokensSpent;

      const bucket = cumulativeByType[summary.sessionType];
      if (bucket) {
        bucket.count += 1;
        bucket.totalQuestions += summary.totalQuestions;
        bucket.totalCorrect += summary.correct;
        bucket.totalDurationSeconds += summary.durationSeconds;
        bucket.totalTokensEarned += summary.tokensEarned;
        bucket.totalTokensSpent += summary.tokensSpent;
      }

      if (summary.sessionType === 'practice') {
        totals.practiceSessions += 1;
      } else if (summary.sessionType === 'paper') {
        totals.paperAttempts += 1;
      }

      if (summary.subject) {
        const key = summary.subject.toLowerCase();
        const existing = subjectMap.get(key) || {
          subject: summary.subject,
          attempts: 0,
          totalQuestions: 0,
          totalCorrect: 0,
        };
        existing.attempts += 1;
        existing.totalQuestions += summary.totalQuestions;
        existing.totalCorrect += summary.correct;
        subjectMap.set(key, existing);
      }

      if (summary.sessionType === 'practice' && Array.isArray(summary.topics)) {
        summary.topics.forEach((topic) => {
          if (!topic) return;
          const attempted = normaliseNumber(topic.attempted, 0);
          const correct = normaliseNumber(topic.correct, 0);
          if (attempted <= 0 && correct <= 0) return;

          const label = typeof topic.label === 'string' && topic.label.trim()
            ? topic.label.trim()
            : 'General';
          const key = label.toLowerCase();
          const existing = practiceTopicMap.get(key) || {
            label,
            attempted: 0,
            correct: 0,
            sessions: 0,
          };
          const attemptedIncrement = Math.max(0, attempted);
          const correctIncrement = Math.max(0, correct);
          existing.attempted += attemptedIncrement;
          existing.correct += correctIncrement;
          if (attemptedIncrement > 0 || correctIncrement > 0) {
            existing.sessions += 1;
          }
          practiceTopicMap.set(key, existing);
        });
      }
    });

    const averageAccuracy = totals.totalQuestions > 0
      ? Math.round((totals.totalCorrect / totals.totalQuestions) * 1000) / 10
      : 0;

    const sessionsSummaries = sessions.map((session) => buildSessionSummary(session));

    return res.json({
      totals: {
        ...totals,
        averageAccuracy,
      },
      cumulativeByType: {
        practice: {
          ...cumulativeByType.practice,
          averageAccuracy: cumulativeByType.practice.totalQuestions > 0
            ? Math.round((cumulativeByType.practice.totalCorrect / cumulativeByType.practice.totalQuestions) * 1000) / 10
            : 0,
        },
        paper: {
          ...cumulativeByType.paper,
          averageAccuracy: cumulativeByType.paper.totalQuestions > 0
            ? Math.round((cumulativeByType.paper.totalCorrect / cumulativeByType.paper.totalQuestions) * 1000) / 10
            : 0,
        },
      },
      subjectStats: Array.from(subjectMap.values()).map((entry) => ({
        ...entry,
        averageAccuracy: entry.totalQuestions > 0
          ? Math.round((entry.totalCorrect / entry.totalQuestions) * 1000) / 10
          : 0,
      })),
      practiceTopicStats: Array.from(practiceTopicMap.values())
        .map((entry) => ({
          ...entry,
          accuracy: entry.attempted > 0
            ? Math.round((entry.correct / entry.attempted) * 1000) / 10
            : 0,
        }))
        .sort((a, b) => {
          if (b.attempted !== a.attempted) {
            return b.attempted - a.attempted;
          }
          return a.label.localeCompare(b.label);
        }),
      sessions: sessionsSummaries,
    });
  } catch (error) {
    return next(error);
  }
};
