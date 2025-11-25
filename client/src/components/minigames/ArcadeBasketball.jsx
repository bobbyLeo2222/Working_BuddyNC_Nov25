import React, { useEffect, useRef, useState } from 'react';

const TARGET_CENTER = 0.5;
const SUCCESS_WINDOW = 0.18;
const MAX_ATTEMPTS = 15;
const SHOT_ANIMATION_MS = 600;

const formatPercent = (value) => `${Math.round(value * 100)}%`;

const ArcadeBasketball = () => {
  const [power, setPower] = useState(TARGET_CENTER);
  const [angle, setAngle] = useState(TARGET_CENTER);
  const [attempts, setAttempts] = useState(0);
  const [hits, setHits] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [shotState, setShotState] = useState({ active: false, success: false });

  const powerDirectionRef = useRef(1);
  const angleDirectionRef = useRef(-1);
  const shotTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isRunning) return undefined;
    const powerInterval = setInterval(() => {
      setPower((previous) => {
        let next = previous + 0.02 * powerDirectionRef.current;
        if (next >= 1) {
          next = 1;
          powerDirectionRef.current = -1;
        } else if (next <= 0) {
          next = 0;
          powerDirectionRef.current = 1;
        }
        return next;
      });
    }, 50);

    const angleInterval = setInterval(() => {
      setAngle((previous) => {
        let next = previous + 0.018 * angleDirectionRef.current;
        if (next >= 1) {
          next = 1;
          angleDirectionRef.current = -1;
        } else if (next <= 0) {
          next = 0;
          angleDirectionRef.current = 1;
        }
        return next;
      });
    }, 60);

    return () => {
      clearInterval(powerInterval);
      clearInterval(angleInterval);
    };
  }, [isRunning]);

  const resetGame = () => {
    setPower(TARGET_CENTER);
    setAngle(TARGET_CENTER);
    setAttempts(0);
    setHits(0);
    setFeedback(null);
    setIsRunning(true);
    setShotState({ active: false, success: false });
    if (shotTimeoutRef.current) {
      clearTimeout(shotTimeoutRef.current);
      shotTimeoutRef.current = null;
    }
  };

  useEffect(() => () => {
    if (shotTimeoutRef.current) {
      clearTimeout(shotTimeoutRef.current);
    }
  }, []);

  const triggerShotAnimation = (success) => {
    if (shotTimeoutRef.current) {
      clearTimeout(shotTimeoutRef.current);
    }
    setShotState({ active: true, success });
    shotTimeoutRef.current = setTimeout(() => {
      setShotState({ active: false, success: false });
      shotTimeoutRef.current = null;
    }, SHOT_ANIMATION_MS);
  };

  const handleShoot = () => {
    if (!isRunning) return;
    if (attempts >= MAX_ATTEMPTS) {
      setFeedback('Out of balls! Press restart to try again.');
      return;
    }
    const powerSuccess = Math.abs(power - TARGET_CENTER) <= SUCCESS_WINDOW;
    const angleSuccess = Math.abs(angle - TARGET_CENTER) <= SUCCESS_WINDOW;
    const success = powerSuccess && angleSuccess;

    setAttempts((prev) => prev + 1);
    triggerShotAnimation(success);
    if (success) {
      setHits((prev) => prev + 1);
      setFeedback('Swish! Perfect shot!');
    } else {
      const hints = [];
      if (!powerSuccess) {
        hints.push(power > TARGET_CENTER ? 'reduce power' : 'add more power');
      }
      if (!angleSuccess) {
        hints.push(angle > TARGET_CENTER ? 'lower your arc' : 'aim higher');
      }
      setFeedback(`Close! ${hints.join(' and ')}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">Shots made</p>
          <p className="text-2xl font-semibold text-[#333333]">{hits}/{MAX_ATTEMPTS}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetGame}
            className="rounded-full bg-[#FFD166] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#333333] shadow-sm transition hover:bg-[#F9B94E]"
          >
            {attempts === 0 ? 'Start' : 'Restart'}
          </button>
          <button
            type="button"
            onClick={() => setIsRunning((prev) => !prev)}
            className="rounded-full border border-[#FFD166] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#333333] transition hover:bg-[#FFF2CC]"
          >
            {isRunning ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-2xl border border-[#A0E7E5] bg-[#F0FFFB] px-4 py-3 text-sm text-[#0F766E]">
          {feedback}
        </div>
      )}

      <div className="relative mx-auto h-48 w-full max-w-xs overflow-hidden rounded-3xl border border-[#E5E5E5] bg-gradient-to-b from-[#FDF6E3] via-[#FFF9E6] to-[#FFE4E1] shadow-sm">
        <div className="absolute left-1/2 h-2 w-24 -translate-x-1/2 rounded-full bg-[#FF8FB6] shadow-md" style={{ top: '1.5rem' }} />
        <div
          className="absolute left-1/2 h-12 w-20 -translate-x-1/2 rounded-b-full border-2 border-t-0 border-[#FF8FB6] bg-white/70 backdrop-blur-sm"
          style={{ top: '1.75rem' }}
        />
        <div
          className="absolute left-1/2 h-10 w-16 -translate-x-1/2 border-t-2 border-dashed border-[#FF8FB6]/60"
          style={{ top: '3.3rem' }}
        />
        <div className="absolute bottom-0 left-1/2 h-6 w-40 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#FAD7A1]/60 to-transparent" />
        <div
          className={`absolute bottom-6 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full shadow-lg transition-transform duration-500 ease-out`}
          style={{
            transform: shotState.active ? 'translate(-50%, -140px)' : 'translate(-50%, 0)',
            backgroundColor: shotState.success ? '#FFB6C1' : '#FFD166',
          }}
        />
        {shotState.success && shotState.active && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 text-sm font-semibold text-[#FF6F91]">
            🏀 Nice shot!
          </div>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">Power</p>
          <div className="relative mt-4 h-32 rounded-full bg-[#F2F2F2]">
            <div
              className="absolute left-0 right-0 mx-auto h-6 w-12 rounded-full bg-[#FFD166] shadow-sm"
              style={{ bottom: `${power * 100}%`, transform: 'translateY(50%)' }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#9E9E9E]">
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#9E9E9E] text-center">Current: {formatPercent(power)}</p>
        </div>

        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">Angle</p>
          <div className="relative mt-4 h-32 rounded-full bg-[#F2F2F2]">
            <div
              className="absolute left-0 right-0 mx-auto h-6 w-12 rounded-full bg-[#A0E7E5] shadow-sm"
              style={{ bottom: `${angle * 100}%`, transform: 'translateY(50%)' }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#9E9E9E]">
              <span>High</span>
              <span>Sweet spot</span>
              <span>Low</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#9E9E9E] text-center">Current: {formatPercent(angle)}</p>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#FFB6C1] bg-[#FFF4F7] p-4 text-center">
          <p className="text-sm font-semibold text-[#333333]">Tap to shoot!</p>
          <button
            type="button"
            onClick={handleShoot}
            className="rounded-full bg-[#FFB6C1] px-6 py-2 text-sm font-semibold text-[#7A1120] shadow-sm transition hover:bg-[#FF8FB6]"
          >
            Shoot
          </button>
          <p className="text-xs text-[#9E9E9E]">Line up both gauges near the middle for a perfect swish.</p>
          <p className="text-xs text-[#9E9E9E]">Attempts left: {Math.max(0, MAX_ATTEMPTS - attempts)}</p>
        </div>
      </div>
    </div>
  );
};

export default ArcadeBasketball;
