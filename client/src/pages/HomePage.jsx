import React from 'react';
import { getMotivationalTip } from '../utils/motivationalTips.js';

const actionCards = ({ onOpenDashboard, onStartPractice, onOpenPastPapers, onOpenMiniGames, onOpenAvatarMarket }) => [
  {
    id: 'practice',
    title: 'Start Practise',
    blurb: 'Quick adaptive drills with instant feedback.',
    accent: '#A0E7E5',
    onClick: onStartPractice,
    icon: (
      <svg className="h-6 w-6 text-[#333333]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l5-5v3h4V7l5 5-5 5v-3h-4v3z" />
      </svg>
    )
  },
  {
    id: 'papers',
    title: 'Attempt Past Papers',
    blurb: 'Full prelim papers from trusted schools.',
    accent: '#FFB6C1',
    onClick: onOpenPastPapers,
    icon: (
      <svg className="h-6 w-6 text-[#333333]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 3h8l4 4v14H7z" />
        <path d="M15 3v5h5" />
        <path d="M10 13h6" />
        <path d="M10 17h4" />
      </svg>
    )
  },
  {
    id: 'dashboard',
    title: 'View Dashboard',
    blurb: 'Accuracy, sessions, and time in one snapshot.',
    accent: '#A0E7E5',
    onClick: onOpenDashboard,
    icon: (
      <svg className="h-6 w-6 text-[#333333]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 5h4v14H4z" />
        <path d="M10 10h4v9h-4z" />
        <path d="M16 7h4v12h-4z" />
      </svg>
    )
  },
  {
    id: 'mini-games',
    title: 'Mini Game Sessions',
    blurb: 'Spend tokens to unlock quick brain-boosting games.',
    accent: '#FFD166',
    onClick: onOpenMiniGames,
    icon: (
      <svg className="h-7 w-7 text-[#333333]" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="6" width="24" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="13" cy="14" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M21 11h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M21 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M11 22v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M21 22v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'avatar-market',
    title: 'Avatar Marketplace',
    blurb: 'Trade tokens for DiceBear avatars and accessories.',
    accent: '#B8B8FF',
    onClick: onOpenAvatarMarket,
    icon: (
      <svg className="h-6 w-6 text-[#333333]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16v10H4z" />
        <path d="M9 7v10" />
        <path d="M15 7v10" />
        <path d="M2 7h20" />
        <path d="M7 3h10l1 4H6z" />
      </svg>
    )
  }
];

const highlightTiles = [
  {
    id: 'question-first',
    title: 'Question first',
    description: 'Learn by doing. Answer the question first and I will help you along the way.',
    gradient: 'from-[#A0E7E5] via-[#CDEFFF] to-[#FFD6E8]',
    icon: (
      <svg className="h-6 w-6 text-[#1F2933]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3v4" strokeLinecap="round" />
        <path d="M12 17v4" strokeLinecap="round" />
        <path d="M3 12h4" strokeLinecap="round" />
        <path d="M17 12h4" strokeLinecap="round" />
        <path d="M7.5 7.5 10 10" strokeLinecap="round" />
        <path d="M14 14l2.5 2.5" strokeLinecap="round" />
        <path d="M14 10l2.5-2.5" strokeLinecap="round" />
        <path d="M7.5 16.5 10 14" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2.6" />
      </svg>
    )
  },
  {
    id: 'smart-algorithm',
    title: 'Smart algorithm',
    description: 'I adapt to your progress, guiding you with the right questions at the right time.',
    gradient: 'from-[#FCE68A] via-[#FFD6BA] to-[#FFB6C1]',
    icon: (
      <svg className="h-6 w-6 text-[#1F2933]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3 2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 15.9 6.2 18.6l.9-5.3-3.8-3.7 5.3-.8z" />
      </svg>
    )
  },
  {
    id: 'MOE syllabus',
    title: 'MOE syllabus',
    description: 'I cover the MOE syllabus, covering all key topics from primary to secondary levels.',
    gradient: 'from-[#D8F3FF] via-[#E7E6FF] to-[#FFE6F1]',
    icon: (
      <svg className="h-6 w-6 text-[#1F2933]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4c3.05 0 5.5 2.45 5.5 5.5S15.05 15 12 15 6.5 12.55 6.5 9.5 8.95 4 12 4Z" />
        <path d="M14.5 14.5a5.5 5.5 0 1 1-5 0" />
      </svg>
    )
  }
];

const HomePage = ({
  onOpenDashboard,
  onStartPractice,
  onOpenPastPapers,
  onOpenMiniGames,
  onOpenAvatarMarket,
  isAuthenticated,
  user
}) => {
  const cards = actionCards({ onOpenDashboard, onStartPractice, onOpenPastPapers, onOpenMiniGames, onOpenAvatarMarket });
  const today = new Date();
  const tipOfTheDay = getMotivationalTip(today);
  const firstName = user?.name ? user.name.split(' ')[0] : null;
  const greeting = isAuthenticated && firstName ? `Welcome back, ${firstName}` : isAuthenticated ? 'Welcome back' : 'Welcome';

  return (
    <div className="space-y-10 sm:space-y-12">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#FDE68A] via-[#F9F7F5] to-[#A0E7E5] px-6 py-10 shadow-lg sm:px-10 sm:py-12">
        <div className="absolute -right-20 -top-16 h-56 w-56 rounded-full bg-white/40 blur-[2px]" aria-hidden />
        <div className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-white/25 blur" aria-hidden />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-3 text-[#1F2933] sm:space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#1F2933]/60">BuddyNC</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{greeting}</h1>
            <p className="text-sm text-[#1F2933]/70 sm:text-base">
              I’m BuddyNC, your learning buddy. I'm here to journey with you through your learning adventures. Let's have fun and unlock your full potential together!
            </p>
          </div>
          <div className="flex max-w-md flex-col gap-3 rounded-3xl border border-white/45 bg-white/70 p-5 text-[#1F2933] shadow-md backdrop-blur-sm sm:gap-4 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#1F2933]/50">Daily Inspiration</p>
            <p className="text-base font-semibold leading-relaxed sm:text-lg">{tipOfTheDay}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={card.onClick}
            className="group relative flex flex-col justify-between rounded-3xl border border-[#E5E5E5] bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#A0E7E5]/30 md:h-44 md:p-6"
          >
            <span
              className="inline-flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: `${card.accent}33` }}
            >
              {card.icon}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[#333333]">{card.title}</h2>
              <p className="mt-2 text-sm text-[#9E9E9E] sm:text-base">{card.blurb}</p>
            </div>
          </button>
        ))}
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {highlightTiles.map((tile) => (
          <article
            key={tile.id}
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tile.gradient} p-5 text-[#1F2933] shadow-lg sm:p-6`}
          >
            <div className="absolute -right-10 top-8 h-24 w-24 rounded-full bg-white/40 blur" aria-hidden />
            <div className="absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-white/35 blur-md" aria-hidden />
            <div className="relative z-10 flex flex-col gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 shadow-sm">
                {tile.icon}
              </span>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{tile.title}</h3>
                <p className="text-sm text-[#1F2933]/70">{tile.description}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-5">
        <article className="rounded-3xl border border-[#E5E5E5] bg-white p-5 text-[#1F2933] shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold">What&apos;s inside</h3>
          <ul className="mt-5 space-y-3 text-sm text-[#4B5563] sm:text-base">
            <li className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#1F2933]/20 bg-[#1F2933]/5 text-base font-semibold text-[#1F2933]">1</span>
              Accurate self-marking for MCQs and open response.
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#1F2933]/20 bg-[#1F2933]/5 text-base font-semibold text-[#1F2933]">2</span>
              Earn Buddy tokens with every streak and unlock mini games.
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#1F2933]/20 bg-[#1F2933]/5 text-base font-semibold text-[#1F2933]">3</span>
              Dashboard summaries for sessions, time, and accuracy.
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
};

export default HomePage;
