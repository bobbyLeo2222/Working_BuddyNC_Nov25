import React, { useMemo, useState } from 'react';

const WORD_BANK = [
  'galaxy',
  'momentum',
  'curious',
  'adventure',
  'resilient',
  'bravery',
  'harmony',
  'invent',
  'journey',
  'pioneer',
  'quantum',
  'sparkle',
  'tenacity',
  'uplift',
  'vibrant',
  'wonder',
  'zealous',
];

const WORD_HINTS = {
  galaxy: 'A sprawling island of stars and dust in space.',
  momentum: 'The push that keeps something moving once it starts.',
  curious: 'Eager to learn or find out more.',
  adventure: 'An exciting or unusual experience.',
  resilient: 'Able to bounce back after setbacks.',
  bravery: 'Facing danger or difficulty with courage.',
  harmony: 'Different parts working together in a pleasing way.',
  invent: 'To create something brand-new.',
  journey: 'A trip taken from one place to another.',
  pioneer: 'A person who explores or tries something first.',
  quantum: 'A tiny packet of energy in physics.',
  sparkle: 'To shine with small, bright flashes.',
  tenacity: 'Sticking with something even when it is tough.',
  uplift: 'To raise someone higher or brighten their mood.',
  vibrant: 'Full of energy and color.',
  wonder: 'A feeling of amazement or admiration.',
  zealous: 'Showing great energy for a cause or goal.',
};

const getRandomWord = (exclude) => {
  const pool = WORD_BANK.filter((word) => word !== exclude);
  return pool[Math.floor(Math.random() * pool.length)] || WORD_BANK[0];
};

const MAX_LIVES = 7;
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const HangmanQuestGame = () => {
  const [secretWord, setSecretWord] = useState(() => getRandomWord());
  const [guessedLetters, setGuessedLetters] = useState(new Set());
  const [lives, setLives] = useState(MAX_LIVES);
  const [revealed, setRevealed] = useState(false);
  const [clueRevealed, setClueRevealed] = useState(false);

  const maskedWord = useMemo(() => {
    return secretWord
      .split('')
      .map((letter) => (guessedLetters.has(letter.toUpperCase()) ? letter.toUpperCase() : '_'))
      .join(' ');
  }, [secretWord, guessedLetters]);

  const incorrectCount = useMemo(() => {
    let incorrect = 0;
    guessedLetters.forEach((letter) => {
      if (!secretWord.toUpperCase().includes(letter)) {
        incorrect += 1;
      }
    });
    return incorrect;
  }, [guessedLetters, secretWord]);

  const gameStatus = useMemo(() => {
    const solved = secretWord.toUpperCase().split('').every((letter) => guessedLetters.has(letter));
    if (revealed) {
      return 'lost';
    }
    if (solved) {
      return 'won';
    }
    if (lives <= 0) {
      return 'lost';
    }
    return 'active';
  }, [secretWord, guessedLetters, lives, revealed]);

  const motivationMessage = useMemo(() => {
    if (gameStatus === 'won') return 'Legendary! You solved the quest word.';
    if (gameStatus === 'lost') return 'The quest resets—try again with a fresh word!';
    if (lives <= 2) return 'Careful! Only a few chances left.';
    if (incorrectCount === 0) return 'Start by scouting vowels or repeated letters.';
    if (guessedLetters.size >= 6) return 'Great progress! Think about patterns in endings.';
    return 'Guess letters to reveal the secret word. You have seven chances!';
  }, [gameStatus, lives, incorrectCount, guessedLetters.size]);

  const handleGuess = (letter) => {
    if (gameStatus !== 'active') return;
    if (guessedLetters.has(letter)) return;
    const upper = letter.toUpperCase();
    const updated = new Set(guessedLetters);
    updated.add(upper);
    setGuessedLetters(updated);
    if (!secretWord.toUpperCase().includes(upper)) {
      setLives((prev) => prev - 1);
    }
  };

  const revealWord = () => {
    setRevealed(true);
    setLives(0);
  };

  const startNewWord = () => {
    setSecretWord(getRandomWord(secretWord));
    setGuessedLetters(new Set());
    setLives(MAX_LIVES);
    setRevealed(false);
    setClueRevealed(false);
  };

  const clue = useMemo(() => {
    return WORD_HINTS[secretWord] || 'No clue for this word yet. Watch the letters!';
  }, [secretWord]);

  const hangmanStages = useMemo(() => {
    const stages = [
      '⚔️',
      '⚔️🛡️',
      '⚔️🛡️🤺',
      '⚔️🛡️🤺👣',
      '⚔️🛡️🤺👣✨',
      '⚔️🛡️🤺👣✨🔥',
      '⚔️🛡️🤺👣✨🔥🏆',
    ];
    const index = Math.min(MAX_LIVES - lives, stages.length - 1);
    return stages[index];
  }, [lives]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">Lives</p>
          <p className="text-2xl font-semibold text-[#333333]">{lives}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startNewWord}
            className="rounded-full bg-[#C7F9CC] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#0F766E] shadow-sm transition hover:bg-[#9AE6B4]"
          >
            {gameStatus === 'active' ? 'Reset word' : 'New quest'}
          </button>
          <button
            type="button"
            onClick={() => setClueRevealed(true)}
            disabled={clueRevealed || gameStatus !== 'active'}
            className="rounded-full border border-[#A0E7E5] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#0F766E] transition hover:bg-[#E0FCFF] disabled:opacity-50"
          >
            {clueRevealed ? 'Clue shown' : 'Need a clue?'}
          </button>
          <button
            type="button"
            onClick={revealWord}
            disabled={gameStatus !== 'active'}
            className="rounded-full border border-[#FFB6C1] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#FF6F91] transition hover:bg-[#FFF0F6] disabled:opacity-50"
          >
            Reveal
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E5E5] bg-white px-5 py-4 shadow-sm">
        <p className="text-sm font-semibold text-[#333333]">{motivationMessage}</p>
        {clueRevealed && (
          <p className="mt-3 rounded-xl bg-[#E0FCFF] px-4 py-2 text-sm font-semibold text-[#0F766E]">
            Clue: {clue}
          </p>
        )}
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-[#F9FAFB] px-6 py-4 text-2xl font-semibold tracking-[0.6em] text-[#333333]">
            {gameStatus === 'lost' || revealed ? secretWord.toUpperCase().split('').join(' ') : maskedWord}
          </div>
          <div className="text-2xl" aria-hidden>
            {hangmanStages}
          </div>
          {gameStatus === 'won' && !revealed && (
            <p className="rounded-full bg-[#A0E7E5]/30 px-4 py-1 text-sm font-semibold text-[#0F766E]">
              Victory! You guessed the word with {lives} lives left.
            </p>
          )}
          {gameStatus === 'lost' && (
            <p className="rounded-full bg-[#FFB6C1]/30 px-4 py-1 text-sm font-semibold text-[#7A1120]">
              The word was {secretWord.toUpperCase()}.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-9">
        {alphabet.map((letter) => {
          const isGuessed = guessedLetters.has(letter);
          const isCorrect = secretWord.toUpperCase().includes(letter);
          return (
            <button
              key={letter}
              type="button"
              onClick={() => handleGuess(letter)}
              disabled={gameStatus !== 'active' || isGuessed}
              className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                !isGuessed
                  ? 'border-[#E5E5E5] bg-white hover:border-[#A0E7E5]/60'
                  : isCorrect
                  ? 'border-[#C7F9CC] bg-[#C7F9CC]/50 text-[#0F766E]'
                  : 'border-[#FFB6C1] bg-[#FFB6C1]/40 text-[#7A1120]'
              } ${gameStatus !== 'active' ? 'opacity-70' : ''}`}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HangmanQuestGame;
