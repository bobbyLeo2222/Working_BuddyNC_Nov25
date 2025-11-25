import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PageHeader from '../PageHeader.jsx';
import {
  getAutoGradedQuestions,
  getOpenEndedQuestions,
  getTotalAutoGradedQuestions
} from '../../utils/examHelpers.js';
import { VisualTextSection, PassageRenderer, MCQ, TextAreaQuestion } from './Exam.jsx';
import { fetchExplanation, gradeOpenEndedQuestion } from '../../utils/geminiClient.js';
import { useAuth } from '../auth/useAuth.js';
import performanceApi from '../performance/performanceApi.js';

const ExamPlayer = ({ exam, onBack, paperId, level, subject }) => {
  const [userAnswers, setUserAnswers] = useState({});

  const autoGradedQuestions = useMemo(() => getAutoGradedQuestions(exam), [exam]);
  const totalAutoGradedQuestions = useMemo(() => getTotalAutoGradedQuestions(exam), [exam]);
  const openEndedQuestions = useMemo(() => getOpenEndedQuestions(exam), [exam]);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [isMarking, setIsMarking] = useState(false);
  const [aiAssistance, setAiAssistance] = useState({});
  const { token, isAuthenticated } = useAuth();
  const sessionStartRef = useRef(Date.now());
  const hasPersistedRef = useRef(false);
  const resolvedPaperId = paperId || exam?.id || null;
  const resolvedLevel = level || exam?.level || exam?.metadata?.level || exam?.meta?.level || null;
  const resolvedSubject = subject || exam?.subject || exam?.metadata?.subject || exam?.meta?.subject || null;
  const examTitle = exam?.title || 'Past Paper Attempt';
  const questionMetadata = useMemo(() => {
    const map = new Map();
    exam?.sections?.forEach((section) => {
      const sharedMeta = {
        sectionTitle: section?.title,
        sectionInstructions: section?.instructions,
      };
      const passage = typeof section?.passage === 'string' ? section.passage.trim() : '';
      if (passage) {
        sharedMeta.passageSnippet =
          passage.length > 800 ? `${passage.slice(0, 800)}…` : passage;
      }
      if (Array.isArray(section?.wordBank) && section.wordBank.length > 0) {
        sharedMeta.wordBank = section.wordBank.slice();
      }
      section?.questions?.forEach((question) => {
        if (!question) return;
        map.set(question.id, { ...sharedMeta });
      });
    });
    return map;
  }, [exam]);

  useEffect(() => {
    sessionStartRef.current = Date.now();
    hasPersistedRef.current = false;
  }, [exam?.id, paperId]);

  const evaluateAutoScore = useCallback(
    (answersSnapshot) =>
      autoGradedQuestions.reduce((currentScore, question) => {
        const userAnswer = answersSnapshot[question.id];
        if (!userAnswer) return currentScore;

        const normalisedUserAnswer = typeof userAnswer === 'string' ? userAnswer.trim().toLowerCase() : userAnswer;
        const normalisedCorrectAnswer =
          typeof question.answer === 'string' ? question.answer.trim().toLowerCase() : question.answer;

        const isCorrect = question.type === 'text_input' || question.type === 'dropdown'
          ? normalisedUserAnswer === normalisedCorrectAnswer
          : userAnswer === question.answer;

        return isCorrect ? currentScore + 1 : currentScore;
      }, 0),
    [autoGradedQuestions]
  );

  const handleAnswer = (questionId, answer) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const score = useMemo(
    () => (submitted ? evaluateAutoScore(userAnswers) : 0),
    [submitted, userAnswers, evaluateAutoScore]
  );

  const markOpenEndedQuestions = useCallback(async (answersSnapshot) => {
    if (openEndedQuestions.length === 0) {
      return;
    }

    setIsMarking(true);
    const newFeedback = {};

    try {
      for (const question of openEndedQuestions) {
        try {
          const meta = questionMetadata.get(question.id) || {};
          const enrichedQuestion = { ...question, ...meta };
          const evaluation = await gradeOpenEndedQuestion(enrichedQuestion, answersSnapshot[question.id]);
          newFeedback[question.id] = evaluation;
        } catch (error) {
          console.error('Failed to grade question', question.id, error);
          newFeedback[question.id] = 'Unable to mark this answer right now. Please try again later.';
        }
      }
      setFeedback(newFeedback);
    } finally {
      setIsMarking(false);
    }
  }, [openEndedQuestions]);

  const getExplanation = async (question) => {
    const builtInExplanation = question.explanation;
    if (builtInExplanation) {
      setAiAssistance((current) => ({
        ...current,
        [question.id]: {
          ...current[question.id],
          explanation: builtInExplanation,
          error: undefined,
          isExplanationLoading: false,
        },
      }));
      return;
    }

    setAiAssistance((current) => ({
      ...current,
      [question.id]: {
        ...current[question.id],
        isExplanationLoading: true,
        error: undefined,
      },
    }));

    try {
      const explanation = await fetchExplanation(question);
      setAiAssistance((current) => ({
        ...current,
        [question.id]: {
          ...current[question.id],
          explanation,
        },
      }));
    } catch (error) {
      console.error('Failed to fetch AI explanation', question.id, error);
      setAiAssistance((current) => ({
        ...current,
        [question.id]: {
          ...current[question.id],
          error:
            error?.message && typeof error.message === 'string'
              ? error.message
              : 'Unable to reach the AI helper right now. Please try again later.',
        },
      }));
    } finally {
      setAiAssistance((current) => ({
        ...current,
        [question.id]: {
          ...current[question.id],
          isExplanationLoading: false,
        },
      }));
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
    const answersSnapshot = { ...userAnswers };
    const autoScore = evaluateAutoScore(answersSnapshot);
    await markOpenEndedQuestions(answersSnapshot);

    if (isAuthenticated && token && !hasPersistedRef.current) {
      const completionTimestamp = Date.now();
      const durationSeconds = Math.max(0, Math.round((completionTimestamp - sessionStartRef.current) / 1000));
      const accuracyPercent = totalAutoGradedQuestions > 0
        ? Math.round((autoScore / totalAutoGradedQuestions) * 100)
        : 0;

      const payload = {
        sessionType: 'paper',
        title: examTitle,
        paperId: resolvedPaperId,
        paperTitle: examTitle,
        level: resolvedLevel,
        subject: resolvedSubject,
        totalQuestions: totalAutoGradedQuestions,
        correct: autoScore,
        incorrect: Math.max(totalAutoGradedQuestions - autoScore, 0),
        accuracy: accuracyPercent,
        durationSeconds,
        tokensEarned: 0,
        tokensSpent: 0,
        startedAt: new Date(sessionStartRef.current).toISOString(),
        completedAt: new Date(completionTimestamp).toISOString(),
        topics: [],
        metadata: {
          attemptedQuestions: Object.keys(answersSnapshot).length,
          totalOpenEnded: openEndedQuestions.length,
          totalQuestionsIncludingOpenEnded: totalAutoGradedQuestions + openEndedQuestions.length,
          autoQuestions: totalAutoGradedQuestions,
          autoScore,
        },
      };

      performanceApi
        .recordSession({ token, payload })
        .catch((error) => {
          console.error('Failed to record past paper attempt', error);
        });

      hasPersistedRef.current = true;
    }
  };

  const handleReset = () => {
    setUserAnswers({});
    setSubmitted(false);
    setFeedback({});
    setAiAssistance({});
    sessionStartRef.current = Date.now();
    hasPersistedRef.current = false;
  };

  if (!exam) {
    return (
      <div>
        <PageHeader title="Paper unavailable" onBack={onBack} />
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-[#E5E5E5]">
          <p className="text-[#9E9E9E]">This paper is coming soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={exam?.title ?? "Exam"} onBack={onBack} />

      {exam?.booklet && (
        <div className="bg-[#A0E7E5]/20 border border-[#A0E7E5]/60 text-[#333333] px-4 py-2 rounded-lg mb-6 inline-block">
          <p className="text-sm font-semibold">{exam.booklet}</p>
        </div>
      )}

      {submitted && (
        <div className="bg-[#A0E7E5]/25 border-l-4 border-[#A0E7E5] text-[#333333] p-4 rounded-lg mb-8 shadow-sm">
          <p className="font-bold text-xl">Results</p>
          <p>
            You scored {score} out of {totalAutoGradedQuestions}{' '}
            ({totalAutoGradedQuestions > 0 ? Math.round((score / totalAutoGradedQuestions) * 100) : 0}%)
          </p>
        </div>
      )}

      <main className="rounded-xl border border-[#E5E5E5] bg-white p-4 shadow-lg sm:p-6 lg:p-8">
        {exam?.sections?.map((section, sectionIndex) => (
          <section key={sectionIndex} className="mb-8 border-b border-[#E5E5E5] pb-6 last:mb-0 last:border-b-0">
            <h2 className="mb-3 border-b-2 border-[#A0E7E5]/60 pb-2 text-lg font-semibold text-[#333333] sm:mb-4 sm:text-2xl">
              {section.title}
            </h2>
            <p className="mb-5 text-sm italic text-[#9E9E9E] sm:mb-6">{section.instructions}</p>

            {section.isVisual && <VisualTextSection section={section} />}

            {section.passage && !section.isVisual && (
              <div className="mb-6 rounded-lg border border-[#E5E5E5] bg-[#F2F2F2] p-4 sm:p-5">
                <PassageRenderer
                  passage={section.passage}
                  questions={section.questions}
                  userAnswers={userAnswers}
                  submitted={submitted}
                  onAnswer={handleAnswer}
                  wordBank={section.wordBank}
                  feedback={feedback}
                  isMarking={isMarking}
                />
              </div>
            )}

            {section.questions.map((question) => {
              switch (question.type) {
                case 'mcq':
                  return (
                    <MCQ
                      key={question.id}
                      q={question}
                      qNumber={question.id}
                      onAnswer={handleAnswer}
                      userAnswer={userAnswers[question.id]}
                      submitted={submitted}
                      getExplanation={getExplanation}
                      aiAssistance={aiAssistance}
                    />
                  );
                case 'textarea':
                case 'open_ended':
                  return (
                    <TextAreaQuestion
                      key={question.id}
                      q={question}
                      qNumber={question.id}
                      onAnswer={handleAnswer}
                      userAnswer={userAnswers[question.id]}
                      submitted={submitted}
                      feedback={feedback}
                      isMarking={isMarking}
                    />
                  );
                default:
                  return null;
              }
            })}
          </section>
        ))}
        <div className="mt-8 flex justify-center">
          {!submitted ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-full bg-[#A0E7E5] px-6 py-2 text-sm font-semibold text-[#333333] shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#7BD8D5] focus:outline-none focus:ring-4 focus:ring-[#A0E7E5]/60"
            >
              Submit &amp; Mark Paper
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full bg-[#A0E7E5] px-6 py-3 text-sm font-semibold text-[#333333] transition hover:bg-[#7BD8D5]"
            >
              Try Again
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExamPlayer;
