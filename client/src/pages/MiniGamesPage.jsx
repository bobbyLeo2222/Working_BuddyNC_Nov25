import React, { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { useProfile } from '../components/profile/useProfile.js';
import { useAuth } from '../components/auth/useAuth.js';
import SnakeGame from '../components/minigames/SnakeGame.jsx';
import TetrisGame from '../components/minigames/TetrisGame.jsx';
import ArcadeBasketball from '../components/minigames/ArcadeBasketball.jsx';
import SequenceRecallGame from '../components/minigames/SequenceRecallGame.jsx';
import HangmanQuestGame from '../components/minigames/HangmanQuestGame.jsx';
import ReactionDashGame from '../components/minigames/ReactionDashGame.jsx';

const GAME_UNLOCK_COST = 30;

const gamesCatalog = [
  {
    id: 'snake',
    title: 'Pixel Snake',
    cost: GAME_UNLOCK_COST,
    description: 'Classic snake with a Buddy twist. Keep collecting bites to grow your streak!',
    accent: '#A0E7E5',
  },
  {
    id: 'tetris',
    title: 'Tetris Stack',
    cost: GAME_UNLOCK_COST,
    description: 'Drop, rotate, and clear lines. Shape strategy builds sharper thinking.',
    accent: '#FFB6C1',
  },
  {
    id: 'basketball',
    title: 'Arcade Hoops',
    cost: GAME_UNLOCK_COST,
    description: 'Aim for the sweet spot to sink shots. A quick break that still rewards focus.',
    accent: '#FFD166',
  },
  {
    id: 'sequence-recall',
    title: 'Sequence Recall',
    cost: GAME_UNLOCK_COST,
    description: 'Watch the pattern light up, then tap the tiles in order. Every round stretches your short-term memory.',
    accent: '#FBE7C6',
  },
  {
    id: 'hangman-quest',
    title: 'Hangman Quest',
    cost: GAME_UNLOCK_COST,
    description: 'Guess the secret word before your chances run out. A classic twist for vocabulary mastery.',
    accent: '#C7F9CC',
  },
  {
    id: 'reaction-dash',
    title: 'Reaction Dash',
    cost: GAME_UNLOCK_COST,
    description: 'Tap the flashing tile in time. A reflex workout to keep your brain alert.',
    accent: '#FFCF99',
  },
];

const gameComponents = {
  snake: SnakeGame,
  tetris: TetrisGame,
  basketball: ArcadeBasketball,
  'sequence-recall': SequenceRecallGame,
  'hangman-quest': HangmanQuestGame,
  'reaction-dash': ReactionDashGame,
};

const MiniGamesPage = ({ onBack }) => {
  const { isAuthenticated } = useAuth();
  const { profile, unlockGame } = useProfile();

  if (!isAuthenticated) {
    return (
      <div className="space-y-8">
        <PageHeader title="Mini Game Sessions" onBack={onBack} />
        <section className="rounded-3xl border border-[#E5E5E5] bg-white p-6 text-center text-[#9E9E9E] sm:p-10">
          Sign in to play games.
        </section>
      </div>
    );
  }

  const walletTokens = profile?.walletTokens ?? 0;
  const unlockedGames = profile?.unlockedGames ?? [];
  const [activeGameId, setActiveGameId] = useState(unlockedGames[0] ?? null);
  const [feedback, setFeedback] = useState(null);

  const activeGameConfig = useMemo(
    () => gamesCatalog.find((game) => game.id === activeGameId) || null,
    [activeGameId]
  );

  const handleUnlock = (game) => {
    const success = unlockGame(game.id, game.cost);
    if (success) {
      setFeedback({ type: 'success', message: `Unlocked ${game.title}! Have fun.` });
      setActiveGameId(game.id);
    } else {
      setFeedback({ type: 'error', message: `Need ${game.cost} tokens to unlock ${game.title}. Keep practising to earn more!` });
    }
  };

  const renderActiveGame = () => {
    if (!activeGameConfig) {
      return (
        <div className="rounded-3xl border border-dashed border-[#E5E5E5] bg-white p-6 text-center text-[#9E9E9E] sm:p-10">
          Unlock a game to start playing.
        </div>
      );
    }
    const Component = gameComponents[activeGameConfig.id];
    if (!Component) return null;
    return (
      <div className="rounded-[28px] border border-[#E5E5E5] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#333333]">{activeGameConfig.title}</h2>
          <p className="text-sm text-[#9E9E9E]">{activeGameConfig.description}</p>
        </div>
        <Component />
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Mini Game Sessions" onBack={onBack} />

      <section className="rounded-[32px] border border-[#E5E5E5] bg-gradient-to-br from-[#A0E7E5] via-[#F9F7FF] to-[#FFB6C1] px-6 py-9 shadow-xl sm:px-8 sm:py-10">
        <div className="flex flex-col items-center gap-6 text-center text-[#1F2933] sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:text-left">
          <div className="max-w-xl space-y-3 sm:space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#1F2933]/60">BuddyNC Arcade</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Unlock play that powers learning</h1>
            <p className="text-sm text-[#1F2933]/70 sm:text-base">
              Spend a few tokens to unlock mindful mini games. They’re quick brain breaks that keep your focus sharp between revision sessions.
            </p>
            <p className="text-sm font-semibold text-[#1F2933] sm:text-base">Wallet tokens: {walletTokens}</p>
          </div>
          <div className="rounded-3xl border border-white/60 bg-white/70 px-5 py-4 text-sm text-[#1F2933] shadow-sm backdrop-blur-sm sm:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">How it works</p>
            <ul className="mt-3 space-y-2 text-sm text-[#4B5563]">
              <li>1. Use practice to earn Buddy tokens.</li>
              <li>2. Spend 30 tokens once to unlock each game.</li>
              <li>3. Return anytime for instant play.</li>
            </ul>
          </div>
        </div>
      </section>

      {feedback && (
        <div
          className={`rounded-3xl border px-4 py-3 text-sm ${feedback.type === 'success'
            ? 'border-[#A0E7E5] bg-[#F0FFFB] text-[#0F766E]'
            : 'border-[#FFB6C1] bg-[#FFF4F7] text-[#7A1120]'}`}
        >
          {feedback.message}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {gamesCatalog.map((game) => {
          const unlocked = unlockedGames.includes(game.id);
          return (
            <article key={game.id} className="relative overflow-hidden rounded-3xl border border-[#E5E5E5] bg-white p-5 shadow-sm sm:p-6">
              <span
                className="absolute -right-16 -top-14 h-32 w-32 rounded-full opacity-50"
                style={{ backgroundColor: `${game.accent}33` }}
                aria-hidden
              />
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-[#333333]">{game.title}</h2>
                <p className="text-sm text-[#9E9E9E]">{game.description}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">
                  {unlocked ? 'Unlocked' : `Unlock · ${game.cost} tokens`}
                </p>
                <div className="flex gap-2">
                  {!unlocked && (
                    <button
                      type="button"
                      onClick={() => handleUnlock(game)}
                      className="flex-1 rounded-full bg-[#333333] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#4D4D4D]"
                    >
                      Unlock
                    </button>
                  )}
                  {unlocked && (
                    <button
                      type="button"
                      onClick={() => setActiveGameId(game.id)}
                      className={`flex-1 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${activeGameId === game.id
                        ? 'bg-[#A0E7E5] text-[#333333]'
                        : 'border border-[#A0E7E5] text-[#333333] hover:bg-[#A0E7E5]/20'}`}
                    >
                      {activeGameId === game.id ? 'Playing' : 'Play'}
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {renderActiveGame()}
    </div>
  );
};

export default MiniGamesPage;
