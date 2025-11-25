import React, { useCallback, useEffect, useRef, useState } from 'react';

const GRID_SIZE = 9;
const GAME_DURATION = 30;
const SWITCH_INTERVAL = 650;

const ReactionDashGame = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [activeIndex, setActiveIndex] = useState(() => Math.floor(Math.random() * GRID_SIZE));
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [streak, setStreak] = useState(0);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);

  const resetGame = useCallback(() => {
    setScore(0);
    setMisses(0);
    setStreak(0);
    setActiveIndex(Math.floor(Math.random() * GRID_SIZE));
    setTimeLeft(GAME_DURATION);
    setIsRunning(true);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      return undefined;
    }

    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        let next = Math.floor(Math.random() * GRID_SIZE);
        while (next === prev) {
          next = Math.floor(Math.random() * GRID_SIZE);
        }
        return next;
      });
    }, SWITCH_INTERVAL);

    timerRef.current = setInterval(() => {
      setTimeLeft((previous) => {
        const next = previous - 1;
        if (next <= 0) {
          clearInterval(intervalRef.current);
          clearInterval(timerRef.current);
          setIsRunning(false);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleHit = (index) => {
    if (!isRunning || timeLeft <= 0) return;
    if (index === activeIndex) {
      setScore((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      setActiveIndex(Math.floor(Math.random() * GRID_SIZE));
    } else {
      setMisses((prev) => prev + 1);
      setStreak(0);
    }
  };

  const motivationText = () => {
    if (!isRunning) return 'Quick reflexes win! Hit start and tap the glowing tile.';
    if (timeLeft <= 0) return 'Great hustle! Ready for another round?';
    if (streak >= 8) return 'Lightning reflexes! You’re unstoppable.';
    if (streak >= 4) return 'Awesome streak—keep the focus!';
    return 'Tap the tile as soon as it lights up!';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">Score</p>
          <p className="text-2xl font-semibold text-[#333333]">{score}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetGame}
            className="rounded-full bg-[#FFD166] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#333333] shadow-sm transition hover:bg-[#F9B94E]"
          >
            {isRunning ? 'Restart' : 'Start'}
          </button>
          <span className="rounded-full border border-[#E5E5E5] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#333333]">
            {timeLeft}s
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E5E5] bg-white px-5 py-4 shadow-sm">
        <p className="text-sm font-semibold text-[#333333]">{motivationText()}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#9E9E9E]">
          <span className="rounded-full bg-[#A0E7E5]/20 px-3 py-1 text-[#0F766E]">Streak {streak}</span>
          <span className="rounded-full bg-[#FFD6E8]/40 px-3 py-1 text-[#7A1120]">Misses {misses}</span>
        </div>
      </div>

      <div
        className="grid gap-3 rounded-3xl border border-[#E5E5E5] bg-[#F9FAFB] p-4 shadow-sm"
        style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
      >
        {Array.from({ length: GRID_SIZE }, (_, index) => {
          const isActive = index === activeIndex && isRunning && timeLeft > 0;
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleHit(index)}
              className={`h-24 rounded-2xl border transition ${
                isActive
                  ? 'border-[#FFB6C1] bg-[#FFB6C1]/40 shadow-md animate-pulse'
                  : 'border-[#E5E5E5] bg-white hover:border-[#A0E7E5]/60'
              }`}
            >
              {isActive ? 'Tap!' : ''}
            </button>
          );
        })}
      </div>

      {!isRunning && (
        <div className="rounded-2xl border border-dashed border-[#E5E5E5] bg-white px-4 py-3 text-xs text-[#9E9E9E]">
          Tip: try using one hand for speed and the other for accuracy.
        </div>
      )}
    </div>
  );
};

export default ReactionDashGame;
