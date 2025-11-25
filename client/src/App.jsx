import React, { useEffect, useMemo, useState } from 'react';
import HomePage from './pages/HomePage.jsx';
import LevelPage from './pages/LevelPage.jsx';
import SubjectPage from './pages/SubjectPage.jsx';
import PaperListPage from './pages/PaperListPage.jsx';
import ExamPlayer from './components/exam/ExamPlayer.jsx';
import PracticeMode from './components/PracticeMode.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { ProfileProvider } from './components/profile/ProfileContext.jsx';
import { useProfile } from './components/profile/useProfile.js';
import AvatarPreview from './components/avatars/AvatarPreview.jsx';
import { findAvatarById, findAccessoryById } from './data/avatarCatalog.js';
import AuthLayout from './components/auth/AuthLayout.jsx';
import { useAuth } from './components/auth/useAuth.js';
import MiniGamesPage from './pages/MiniGamesPage.jsx';
import AvatarMarketplacePage from './pages/AvatarMarketplacePage.jsx';
import papersApi from './api/papersApi.js';

const derivePracticeCategory = (question, section) => {
  const rawTopic = typeof question?.topic === 'string' ? question.topic : '';
  const rawSection = typeof section?.title === 'string' ? section.title : '';
  const topic = rawTopic.toLowerCase();
  const sectionTitle = rawSection.toLowerCase();

  if (sectionTitle.includes('spelling') || sectionTitle.includes('editing') || sectionTitle.includes('correction')) {
    return 'Language Editing';
  }

  if (
    sectionTitle.includes('writing') ||
    sectionTitle.includes('sentence synthesis') ||
    topic.includes('writing')
  ) {
    return 'Writing & Representing';
  }

  if (
    sectionTitle.includes('visual text') ||
    sectionTitle.includes('comprehension') ||
    sectionTitle.includes('reading') ||
    topic.includes('reading')
  ) {
    return 'Reading & Viewing';
  }

  if (
    sectionTitle.includes('cloze') ||
    sectionTitle.includes('fill in the blanks') ||
    sectionTitle.includes('vocabulary') ||
    topic.includes('vocabulary')
  ) {
    return 'Vocabulary';
  }

  if (topic.includes('grammar') || sectionTitle.includes('grammar')) {
    return 'Grammar';
  }

  const normalisedTopic = topic.trim();
  const mathTopicMap = {
    'numbers & algebra': 'Numbers & Algebra',
    'fractions & decimals': 'Fractions & Decimals',
    'ratio & percentage': 'Ratio & Percentage',
    'measurement & geometry': 'Measurement & Geometry',
    'geometry & measurement': 'Measurement & Geometry',
    'data & graphs': 'Data & Graphs',
    'problem solving': 'Problem Solving',
  };

  if (mathTopicMap[normalisedTopic]) {
    return mathTopicMap[normalisedTopic];
  }

  if (normalisedTopic.includes('ratio') || normalisedTopic.includes('percent')) {
    return 'Ratio & Percentage';
  }

  if (normalisedTopic.includes('fraction') || normalisedTopic.includes('decimal')) {
    return 'Fractions & Decimals';
  }

  if (
    normalisedTopic.includes('geometry') ||
    normalisedTopic.includes('measurement') ||
    normalisedTopic.includes('angle') ||
    normalisedTopic.includes('area') ||
    normalisedTopic.includes('perimeter') ||
    normalisedTopic.includes('volume')
  ) {
    return 'Measurement & Geometry';
  }

  if (normalisedTopic.includes('data') || normalisedTopic.includes('graph') || normalisedTopic.includes('chart')) {
    return 'Data & Graphs';
  }

  if (normalisedTopic.includes('number') || normalisedTopic.includes('algebra') || normalisedTopic.includes('pattern')) {
    return 'Numbers & Algebra';
  }

  return 'Exam Skills';
};

const SUPPORTED_PRACTICE_QUESTION_TYPES = new Set(['mcq', 'dropdown', 'text_input', 'textarea']);

const TokenDebugButton = () => {
  const { addTokens } = useProfile();
  return (
    <button
      type="button"
      onClick={() => addTokens(100)}
      title="Developer shortcut to add 100 Buddy tokens"
      className="rounded-full border border-[#A0E7E5] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2563EB] transition hover:bg-[#A0E7E5]/20"
    >
      +100 Tokens
    </button>
  );
};

const NavAvatarBadge = () => {
  const { profile } = useProfile();
  const avatar = findAvatarById(profile?.equippedAvatarId);
  const accessory = findAccessoryById(profile?.equippedAccessoryId);
  return (
    <div className="flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-white/80 px-2 py-1 text-left shadow-sm">
      <AvatarPreview avatar={avatar} accessory={accessory} size={52} />
      <div className="pr-2 text-[11px] leading-tight text-[#4B5563]">
        <p className="font-semibold uppercase tracking-[0.22em] text-[#1F2933]">Buddy Avatar</p>
        <p>{avatar?.title}</p>
        <p className="text-[#9E9E9E]">{accessory ? accessory.title : 'No accessory'}</p>
      </div>
    </div>
  );
};

export default function App() {
  const { isAuthenticated, user, logout, pendingEmail } = useAuth();
  const profileScope = user?.id || user?.email || 'guest';
  const [level, setLevel] = useState(null);
  const [subject, setSubject] = useState(null);
  const [paper, setPaper] = useState(null);
  const [exam, setExam] = useState(null);
  const [isLoadingPaper, setIsLoadingPaper] = useState(false);
  const [paperError, setPaperError] = useState(null);
  const [paperSummaries, setPaperSummaries] = useState([]);
  const [isLoadingPaperIndex, setIsLoadingPaperIndex] = useState(false);
  const [paperIndexError, setPaperIndexError] = useState(null);
  const [activeView, setActiveView] = useState('home');
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [isLoadingPractice, setIsLoadingPractice] = useState(false);
  const [practiceError, setPracticeError] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [practiceLevel, setPracticeLevel] = useState(null);
  const [practiceSubject, setPracticeSubject] = useState(null);

  const clearPracticeSessionState = () => {
    setPracticeQuestions([]);
    setPracticeError(null);
    setIsLoadingPractice(false);
  };

  const resetPracticeFlow = () => {
    clearPracticeSessionState();
    setPracticeLevel(null);
    setPracticeSubject(null);
  };

  const availablePaperIds = useMemo(() => {
    if (!Array.isArray(paperSummaries)) {
      return new Set();
    }

    const identifiers = paperSummaries
      .filter((summary) => {
        if (!summary || typeof summary !== 'object') return false;
        if (summary.questionCount === undefined || summary.questionCount === null) return true;
        return summary.questionCount > 0;
      })
      .map((summary) => summary.id ?? summary.paperId)
      .filter(Boolean);

    return new Set(identifiers);
  }, [paperSummaries]);

  useEffect(() => {
    let cancelled = false;

    const loadPaperIndex = async () => {
      setIsLoadingPaperIndex(true);
      setPaperIndexError(null);
      try {
        const response = await papersApi.list();
        if (cancelled) return;
        const summaries = Array.isArray(response?.papers) ? response.papers : [];
        setPaperSummaries(summaries);
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load paper index', error);
        setPaperSummaries([]);
        setPaperIndexError(error.message || 'Unable to load papers right now.');
      } finally {
        if (!cancelled) {
          setIsLoadingPaperIndex(false);
        }
      }
    };

    loadPaperIndex();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!paper) {
      setExam(null);
      setPaperError(null);
      setIsLoadingPaper(false);
      return;
    }

    let cancelled = false;
    setIsLoadingPaper(true);
    setPaperError(null);

    papersApi
      .get(paper)
      .then((response) => {
        if (cancelled) return;
        const loadedExam = response?.exam ?? null;
        setExam(loadedExam);
        if (!loadedExam) {
          setPaperError('Unable to load this paper right now.');
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to load paper', error);
        setExam(null);
        setPaperError(error.message || 'Unable to load this paper right now.');
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingPaper(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [paper]);

  const handleSelectLevel = (selectedLevel) => {
    setLevel(selectedLevel);
    setSubject(null);
    setPaper(null);
    setActiveView('subjects');
  };

  const handleSelectSubject = (selectedSubject) => {
    setSubject(selectedSubject);
    setPaper(null);
    setActiveView('papers');
  };

  const handleSelectPaper = (selectedPaper) => {
    setPaper(selectedPaper);
    setActiveView('exam');
  };

  const goHome = () => {
    resetPracticeFlow();
    setLevel(null);
    setSubject(null);
    setPaper(null);
    setActiveView('home');
  };

  const handleStartPractice = () => {
    resetPracticeFlow();
    setLevel(null);
    setSubject(null);
    setPaper(null);
    setActiveView('practice-levels');
  };

  const initialisePracticeSession = async (selectedLevel, selectedSubject) => {
    if (!selectedLevel || !selectedSubject) {
      setPracticeError('Please choose a level and subject to start practice.');
      setActiveView('practice-levels');
      return;
    }

    setPracticeLevel(selectedLevel);
    setPracticeSubject(selectedSubject);
    setLevel(null);
    setSubject(null);
    setPaper(null);
    setPracticeQuestions([]);
    setPracticeError(null);
    setIsLoadingPractice(true);
    setActiveView('practice');

    try {
      const response = await papersApi.list({
        includeContent: true,
        level: selectedLevel,
        subject: selectedSubject,
      });
      const papersWithContent = Array.isArray(response?.papers) ? response.papers : [];

      const practicePool = papersWithContent
        .filter((paperSummary) => Array.isArray(paperSummary?.sections))
        .flatMap((paperSummary) => {
          const examId = paperSummary.id ?? paperSummary.paperId;
          const sections = Array.isArray(paperSummary.sections) ? paperSummary.sections : [];
          const examTitle = paperSummary.title ?? paperSummary.metadata?.title ?? examId;

          return sections.flatMap((section, sectionIndex) => {
            const questions = Array.isArray(section?.questions) ? section.questions : [];
            const practiceCandidates = questions.filter((question) =>
              SUPPORTED_PRACTICE_QUESTION_TYPES.has(question?.type)
            );

            const sectionBlankMetadata = practiceCandidates
              .filter(
                (candidate) =>
                  candidate?.type === 'text_input' && typeof candidate?.original === 'string' && candidate.original.trim().length > 0
              )
              .map((candidate) => ({
                id: candidate.id,
                original: candidate.original,
              }));

            return practiceCandidates.map((question) => {
              const category = derivePracticeCategory(question, section);
              const baseOptions = Array.isArray(question.options)
                ? [...question.options]
                : undefined;
              const derivedOptions =
                !baseOptions && question?.type === 'dropdown' && Array.isArray(section.wordBank)
                  ? section.wordBank
                      .map((entry) => {
                        const match = typeof entry === 'string' ? entry.match(/\)\s*(.*)$/) : null;
                        if (match && match[1]) {
                          return match[1].trim();
                        }
                        return typeof entry === 'string' ? entry.replace(/\(|\)/g, '').trim() : null;
                      })
                      .filter(Boolean)
                  : undefined;

              const displayPrompt = typeof question.question === 'string' && question.question.trim().length > 0
                ? question.question
                : `Fill in blank (${question.id}) in the passage below.`;

              const providedPrompt = typeof question.prompt === 'string' && question.prompt.trim().length > 0
                ? question.prompt.trim()
                : undefined;

              const aiPrompt = typeof question.question === 'string' && question.question.trim().length > 0
                ? question.question
                : [
                    `Fill in blank (${question.id}) in this passage:`,
                    typeof section.passage === 'string' ? section.passage : ''
                  ]
                    .filter(Boolean)
                    .join('\n');

              const passageContent = (() => {
                if (typeof question.passage === 'string' && question.passage.trim().length > 0) {
                  return question.passage;
                }
                if (typeof section.passage === 'string') {
                  return section.passage;
                }
                return undefined;
              })();

              return {
                id: `${examId}-${sectionIndex}-${question.id}`,
                originalId: question.id,
                type: question.type,
                prompt: displayPrompt,
                providedPrompt,
                aiPrompt,
                options: baseOptions ?? derivedOptions,
                answer: question.answer,
                original: question.original,
                topic: category,
                category,
                originalTopic: question.topic,
                sectionTitle: section.title,
                sectionInstructions: section.instructions,
                passage: passageContent,
                sectionBlanks: sectionBlankMetadata,
                wordBank: section.wordBank,
                examTitle,
                examId,
                isVisual: Boolean(section.isVisual),
                hint: question.hint,
                explanation: question.explanation,
              };
            });
          });
        });

      if (practicePool.length === 0) {
        setPracticeError('No practice questions available yet for this selection.');
        setPracticeQuestions([]);
      } else {
        const shuffled = [...practicePool];
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setPracticeQuestions(shuffled);
      }
    } catch (error) {
      console.error('Failed to initialise practice mode', error);
      setPracticeError('Unable to start practice right now. Please try again later.');
      setPracticeQuestions([]);
    } finally {
      setIsLoadingPractice(false);
    }
  };

  const handleSelectPracticeLevel = (selectedLevel) => {
    clearPracticeSessionState();
    setPracticeLevel(selectedLevel);
    setPracticeSubject(null);
    setActiveView('practice-subjects');
  };

  const handleSelectPracticeSubject = (selectedSubject) => {
    if (!practiceLevel) {
      setActiveView('practice-levels');
      return;
    }
    clearPracticeSessionState();
    initialisePracticeSession(practiceLevel, selectedSubject);
  };

  const handleOpenPastPapers = () => {
    resetPracticeFlow();
    setLevel(null);
    setSubject(null);
    setPaper(null);
    setActiveView('levels');
  };

  const handleExitPractice = () => {
    clearPracticeSessionState();
    if (practiceLevel) {
      setActiveView('practice-subjects');
    } else {
      setActiveView('home');
    }
  };

  const handleBack = () => {
    if (activeView === 'practice') {
      handleExitPractice();
      return;
    }

    if (activeView === 'practice-subjects') {
      setPracticeSubject(null);
      setActiveView('practice-levels');
      return;
    }

    if (activeView === 'practice-levels') {
      resetPracticeFlow();
      setActiveView('home');
      return;
    }

    if (activeView === 'exam') {
      setPaper(null);
      setActiveView('papers');
      return;
    }

    if (activeView === 'papers') {
      setPaper(null);
      setActiveView('subjects');
      return;
    }

    if (activeView === 'subjects') {
      setSubject(null);
      setActiveView('levels');
      return;
    }

    if (activeView === 'levels') {
      setLevel(null);
      setActiveView('home');
      return;
    }

    setActiveView('home');
  };

  useEffect(() => {
    if (pendingEmail) {
      setAuthModalMode('verify');
      setIsAuthModalOpen(true);
    }
  }, [pendingEmail]);

  useEffect(() => {
    if (isAuthenticated && isAuthModalOpen) {
      setIsAuthModalOpen(false);
    }
  }, [isAuthenticated, isAuthModalOpen]);

  let currentView;

  if (activeView === 'practice') {
    if (isLoadingPractice) {
      currentView = (
        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 text-center shadow-sm sm:p-10">
          <p className="text-[#9E9E9E]">Preparing your practice session...</p>
        </div>
      );
    } else if (practiceError) {
      currentView = (
        <div className="rounded-3xl border border-[#FFB6C1]/60 bg-white p-6 text-center shadow-sm sm:p-10">
          <p className="text-[#FF6F91] font-medium">{practiceError}</p>
          <button
            type="button"
            onClick={handleExitPractice}
            className="mt-6 rounded-full bg-[#A0E7E5] px-6 py-2 text-sm font-semibold text-[#333333] shadow-sm transition hover:bg-[#7BD8D5]"
          >
            Back
          </button>
        </div>
      );
    } else {
      currentView = (
        <PracticeMode
          level={practiceLevel}
          subject={practiceSubject}
          questions={practiceQuestions}
          onExit={handleExitPractice}
        />
      );
    }
  } else if (activeView === 'practice-subjects') {
    if (!practiceLevel) {
      currentView = (
        <LevelPage
          onSelectLevel={handleSelectPracticeLevel}
          title="Practice · Level"
          subtitle="Pick a level to start practising."
        />
      );
    } else {
      currentView = (
        <SubjectPage
          level={practiceLevel}
          onSelectSubject={handleSelectPracticeSubject}
          onBack={handleBack}
        />
      );
    }
  } else if (activeView === 'practice-levels') {
    currentView = (
      <LevelPage
        onSelectLevel={handleSelectPracticeLevel}
        title="Practice · Level"
        subtitle="Pick a level to start practising."
      />
    );
  } else if (activeView === 'exam') {
    if (paperError) {
      currentView = (
        <div className="rounded-3xl border border-[#FFB6C1]/60 bg-white p-6 text-center shadow-sm sm:p-10">
          <p className="text-[#FF6F91] font-medium">{paperError}</p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-6 rounded-full bg-[#A0E7E5] px-6 py-2 text-sm font-semibold text-[#333333] shadow-sm transition hover:bg-[#7BD8D5]"
          >
            Back
          </button>
        </div>
      );
    } else if (isLoadingPaper || !exam) {
      currentView = (
        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 text-center shadow-sm sm:p-10">
          <p className="text-[#9E9E9E]">Loading paper...</p>
        </div>
      );
    } else {
      currentView = (
        <ExamPlayer
          exam={exam}
          onBack={handleBack}
          paperId={paper}
          level={level}
          subject={subject}
        />
      );
    }
  } else if (activeView === 'papers') {
    if (!subject) {
      currentView = <SubjectPage level={level} onSelectSubject={handleSelectSubject} onBack={handleBack} />;
    } else if (isLoadingPaperIndex) {
      currentView = (
        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-6 text-center shadow-sm sm:p-10">
          <p className="text-[#9E9E9E]">Loading papers...</p>
        </div>
      );
    } else if (paperIndexError) {
      currentView = (
        <div className="rounded-3xl border border-[#FFB6C1]/60 bg-white p-6 text-center shadow-sm sm:p-10">
          <p className="text-[#FF6F91] font-medium">{paperIndexError}</p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-6 rounded-full bg-[#A0E7E5] px-6 py-2 text-sm font-semibold text-[#333333] shadow-sm transition hover:bg-[#7BD8D5]"
          >
            Back
          </button>
        </div>
      );
    } else {
      const papersToShow = paperSummaries
        .filter((paperSummary) => paperSummary.level === level && paperSummary.subject === subject)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return a.school.localeCompare(b.school);
        });

      currentView = (
        <PaperListPage
          level={level}
          subject={subject}
          papers={papersToShow}
          onSelectPaper={handleSelectPaper}
          onBack={handleBack}
          availablePaperIds={availablePaperIds}
        />
      );
    }
  } else if (activeView === 'subjects') {
    currentView = <SubjectPage level={level} onSelectSubject={handleSelectSubject} onBack={handleBack} />;
  } else if (activeView === 'levels') {
    currentView = <LevelPage onSelectLevel={handleSelectLevel} />;
  } else if (activeView === 'dashboard') {
    currentView = <DashboardPage onBack={() => setActiveView('home')} />;
  } else if (activeView === 'mini-games') {
    currentView = <MiniGamesPage onBack={goHome} />;
  } else if (activeView === 'avatar-market') {
    currentView = <AvatarMarketplacePage onBack={goHome} />;
  } else {
    currentView = (
      <HomePage
        onOpenDashboard={() => setActiveView('dashboard')}
        onStartPractice={handleStartPractice}
        onOpenPastPapers={handleOpenPastPapers}
        onOpenMiniGames={() => {
          setActiveView('mini-games');
        }}
        onOpenAvatarMarket={() => {
          setActiveView('avatar-market');
        }}
        isAuthenticated={isAuthenticated}
        user={user}
      />
    );
  }

  return (
    <ProfileProvider scope={profileScope}>
      <div className="min-h-screen bg-[#F2F2F2] font-sans text-[#333333]">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:px-8">
          <nav className="mb-8 flex flex-col gap-3 rounded-3xl border border-[#E5E5E5] bg-white/95 p-4 shadow-sm backdrop-blur sm:mb-10 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-3">
            <button
              type="button"
              onClick={goHome}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#333333] transition hover:bg-[#7BD8D5]/30 sm:w-auto"
            >
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[#A0E7E5]/60 bg-white">
                <img
                  src="/buddync-logo.png"
                  alt="BuddyNC logo"
                  className="h-full w-full object-contain"
                />
              </span>
              BuddyNC
            </button>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <NavAvatarBadge />
              {isAuthenticated ? (
                <div className="flex flex-col items-center gap-3 text-sm sm:flex-row sm:text-left">
                  <div className="text-center sm:text-right">
                    <p className="font-semibold text-[#333333]">{user?.name || user?.email}</p>
                    <p className="text-xs text-[#9E9E9E]">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full rounded-full bg-[#333333] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#4D4D4D] sm:w-auto"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-[#333333] sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('login');
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full rounded-full border border-[#A0E7E5] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#333333] transition hover:bg-[#7BD8D5]/30 sm:w-auto"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('register');
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full rounded-full bg-[#A0E7E5] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#333333] shadow-sm transition hover:bg-[#7BD8D5] sm:w-auto"
                  >
                    Join free
                  </button>
                </div>
              )}
            </div>
          </nav>
          {currentView}
          <footer className="mt-14 flex flex-col items-center gap-3 text-center text-xs sm:flex-row sm:justify-between sm:text-left">
            <p className="text-[#4B5563]">Copyright © 2025 Siloam Technologies Pte. Ltd. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4 text-[#2563EB]">
              <a href="/terms-of-use.html" className="transition hover:underline">Terms of Use</a>
              <a href="/privacy-policy.html" className="transition hover:underline">Privacy Policy</a>
              <TokenDebugButton />
            </div>
          </footer>
        </div>
        <AuthLayout
          isOpen={isAuthModalOpen}
          initialView={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    </ProfileProvider>
  );
}
