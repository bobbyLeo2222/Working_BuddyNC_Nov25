import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const COLOR_STEPS = [
  { id: 'aqua', label: 'Aqua', tone: '#A0E7E5' },
  { id: 'rose', label: 'Rose', tone: '#FFB6C1' },
  { id: 'sun', label: 'Sunburst', tone: '#FFD166' },
  { id: 'mint', label: 'Mint', tone: '#C7F9CC' },
];

const pickNextStep = (previousStep = null) => {
  if (COLOR_STEPS.length === 0) return null;
  let candidate = COLOR_STEPS[Math.floor(Math.random() * COLOR_STEPS.length)].id;
  if (COLOR_STEPS.length === 1) return candidate;
  while (candidate === previousStep) {
    candidate = COLOR_STEPS[Math.floor(Math.random() * COLOR_STEPS.length)].id;
  }
  return candidate;
};

const SequenceRecallGame = () => {
  const [sequence, setSequence] = useState([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [bestRound, setBestRound] = useState(0);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Press Start to hear the first pattern.');
  const timeoutsRef = useRef([]);

  const clearQueuedTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((handle) => clearTimeout(handle));
    timeoutsRef.current = [];
  }, []);

  const queueTimeout = useCallback((callback, delay) => {
    const handle = setTimeout(() => {
      callback();
    }, delay);
    timeoutsRef.current.push(handle);
    return handle;
  }, []);

  useEffect(() => () => {
    clearQueuedTimeouts();
  }, [clearQueuedTimeouts]);

  const playSequence = useCallback((pattern) => {
    if (!pattern || pattern.length === 0) return;
    clearQueuedTimeouts();
    setIsShowingSequence(true);
    setPlayerIndex(0);
    setStatusMessage(pattern.length === 1 ? 'Memorise this tile.' : `Memorise ${pattern.length} steps.`);

    let delay = 400;
    pattern.forEach((step, index) => {
      queueTimeout(() => {
        setActiveStep(step);
        queueTimeout(() => setActiveStep(null), 320);
        if (index === pattern.length - 1) {
          queueTimeout(() => {
            setIsShowingSequence(false);
            setStatusMessage('Your turn! Tap the tiles in the same order.');
          }, 360);
        }
      }, delay);
      delay += 700;
    });
  }, [clearQueuedTimeouts, queueTimeout]);

  const startGame = useCallback(() => {
    clearQueuedTimeouts();
    const firstStep = pickNextStep();
    if (!firstStep) return;
    const initialSequence = [firstStep];
    setSequence(initialSequence);
    setCurrentRound(1);
    setBestRound((previousBest) => Math.max(previousBest, 1));
    setPlayerIndex(0);
    setStatusMessage('Memorise the pattern.');
    playSequence(initialSequence);
  }, [clearQueuedTimeouts, playSequence]);

  const replaySequence = useCallback(() => {
    if (isShowingSequence || sequence.length === 0) return;
    setStatusMessage('Watch closely. The pattern is repeating.');
    setPlayerIndex(0);
    playSequence(sequence);
  }, [isShowingSequence, sequence, playSequence]);

  const resetGame = useCallback(() => {
    clearQueuedTimeouts();
    setSequence([]);
    setPlayerIndex(0);
    setCurrentRound(0);
    setBestRound(0);
    setActiveStep(null);
    setIsShowingSequence(false);
    setStatusMessage('Press Start to hear the first pattern.');
  }, [clearQueuedTimeouts]);

  const extendSequence = useCallback(() => {
    setSequence((previous) => {
      const lastStep = previous[previous.length - 1] ?? null;
      const nextStep = pickNextStep(lastStep);
      const nextSequence = [...previous, nextStep];
      setCurrentRound(nextSequence.length);
      setBestRound((prevBest) => Math.max(prevBest, nextSequence.length));
      setPlayerIndex(0);
      playSequence(nextSequence);
      return nextSequence;
    });
  }, [playSequence]);

  const handleStepPress = (stepId) => {
    if (isShowingSequence || sequence.length === 0) return;
    setActiveStep(stepId);
    queueTimeout(() => setActiveStep(null), 220);

    const expectedStep = sequence[playerIndex];
    if (stepId !== expectedStep) {
      setStatusMessage('Not quite! Watch the pattern again and try to recall it.');
      setPlayerIndex(0);
      queueTimeout(() => playSequence(sequence.slice()), 750);
      return;
    }

    const nextIndex = playerIndex + 1;
    if (nextIndex === sequence.length) {
      setStatusMessage('Great recall! Adding a new step to the sequence.');
      setPlayerIndex(0);
      queueTimeout(() => {
        extendSequence();
      }, 700);
    } else {
      setPlayerIndex(nextIndex);
      setStatusMessage(`Nice! Step ${nextIndex}/${sequence.length}.`);
    }
  };

  const controls = useMemo(() => ([
    {
      id: 'start',
      label: sequence.length === 0 ? 'Start' : 'Restart',
      action: startGame,
      disabled: isShowingSequence,
    },
    {
      id: 'replay',
      label: 'Replay pattern',
      action: replaySequence,
      disabled: isShowingSequence || sequence.length === 0,
    },
    {
      id: 'reset',
      label: 'Reset game',
      action: resetGame,
      disabled: sequence.length === 0 && currentRound === 0,
    },
  ]), [currentRound, isShowingSequence, replaySequence, resetGame, sequence.length, startGame]);

  const gridColumns = useMemo(() => {
    if (COLOR_STEPS.length <= 2) return 'repeat(2, minmax(0, 1fr))';
    return 'repeat(4, minmax(0, 1fr))';
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#E5E5E5] bg-white px-6 py-4 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">Round</p>
          <p className="text-2xl font-semibold text-[#333333]">{currentRound === 0 ? '—' : currentRound}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">Best streak</p>
          <p className="text-2xl font-semibold text-[#333333]">{bestRound === 0 ? '—' : bestRound}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {controls.map((control) => (
            <button
              key={control.id}
              type="button"
              onClick={control.action}
              disabled={control.disabled}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                control.disabled
                  ? 'border border-[#E5E5E5] text-[#9E9E9E]'
                  : control.id === 'start'
                    ? 'bg-[#333333] text-white hover:bg-[#4D4D4D]'
                    : 'border border-[#A0E7E5] text-[#333333] hover:bg-[#A0E7E5]/20'
              }`}
            >
              {control.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#A0E7E5]/40 bg-[#F9FEFF] px-5 py-4 text-sm text-[#1F2933] shadow-sm">
        <p className="text-sm font-semibold text-[#0F766E]">How to play</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[#1F2933]/80 sm:text-sm">
          <li>Press start to watch a tile sequence light up.</li>
          <li>Tap the tiles in the same order to progress.</li>
          <li>Each round adds a new step. Keep going to set a streak!</li>
        </ul>
        <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold text-[#0F172A] sm:text-sm">
          {statusMessage}
        </p>
      </div>

      <div
        className="grid gap-4 rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-sm"
        style={{ gridTemplateColumns: gridColumns }}
      >
        {COLOR_STEPS.map((step) => {
          const isActive = activeStep === step.id;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => handleStepPress(step.id)}
              className={`flex h-28 flex-col items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-[#A0E7E5]/40 ${
                isActive
                  ? 'scale-[1.04] border-transparent text-[#0F172A] shadow-lg'
                  : 'border-[#E5E5E5] bg-[#F9FAFB] text-[#333333] hover:border-[#A0E7E5]/60'
              } ${isShowingSequence ? 'cursor-not-allowed opacity-70' : ''}`}
              style={{
                background: isActive ? step.tone : undefined,
                boxShadow: isActive ? `0 14px 30px -16px ${step.tone}` : undefined,
              }}
              disabled={isShowingSequence}
            >
              <span
                className="h-12 w-12 rounded-full"
                style={{ backgroundColor: step.tone }}
                aria-hidden
              />
              {step.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SequenceRecallGame;
