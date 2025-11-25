import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const BOARD_SIZE = 20;
const INITIAL_SPEED_MS = 180;

const directionVectors = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const randomPosition = () => ({
  x: Math.floor(Math.random() * BOARD_SIZE),
  y: Math.floor(Math.random() * BOARD_SIZE),
});

const SnakeGame = () => {
  const [snake, setSnake] = useState(() => [{ x: 10, y: 10 }]);
  const [food, setFood] = useState(() => randomPosition());
  const [direction, setDirection] = useState(directionVectors.ArrowRight);
  const [directionKey, setDirectionKey] = useState('ArrowRight');
  const [isRunning, setIsRunning] = useState(false);
  const [hasLost, setHasLost] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED_MS);

  const directionRef = useRef(direction);
  const pendingDirectionRef = useRef(direction);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const handleKeyDown = useCallback((event) => {
    const nextVector = directionVectors[event.key];
    if (!nextVector) return;

    const { x, y } = directionRef.current;
    if (x + nextVector.x === 0 && y + nextVector.y === 0) {
      return;
    }
    pendingDirectionRef.current = nextVector;
    setDirectionKey(event.key);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(randomPosition());
    setDirection(directionVectors.ArrowRight);
    setDirectionKey('ArrowRight');
    setIsRunning(true);
    setHasLost(false);
    setScore(0);
    setSpeed(INITIAL_SPEED_MS);
  };

  const advanceSnake = () => {
    setSnake((currentSnake) => {
      const currentDirection = pendingDirectionRef.current;
      setDirection(currentDirection);
      const newHead = {
        x: (currentSnake[0].x + currentDirection.x + BOARD_SIZE) % BOARD_SIZE,
        y: (currentSnake[0].y + currentDirection.y + BOARD_SIZE) % BOARD_SIZE,
      };

      const intersectsBody = currentSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y);
      if (intersectsBody) {
        setHasLost(true);
        setIsRunning(false);
        return currentSnake;
      }

      const newSnake = [newHead, ...currentSnake];
      const ateFood = newHead.x === food.x && newHead.y === food.y;

      if (ateFood) {
        setScore((prev) => prev + 1);
        setFood(() => {
          let nextFood = randomPosition();
          while (newSnake.some((segment) => segment.x === nextFood.x && segment.y === nextFood.y)) {
            nextFood = randomPosition();
          }
          return nextFood;
        });
        setSpeed((previous) => Math.max(80, previous - 8));
        return newSnake;
      }

      newSnake.pop();
      return newSnake;
    });
  };

  useEffect(() => {
    if (!isRunning || hasLost) return undefined;
    const intervalId = setInterval(advanceSnake, speed);
    return () => clearInterval(intervalId);
  }, [isRunning, hasLost, speed, directionKey]);

  const boardCells = useMemo(() => {
    const cells = new Array(BOARD_SIZE).fill(null).map((_, rowIndex) => {
      return new Array(BOARD_SIZE).fill(null).map((__, colIndex) => {
        const isSnake = snake.some((segment) => segment.x === colIndex && segment.y === rowIndex);
        const isHead = snake[0]?.x === colIndex && snake[0]?.y === rowIndex;
        const isFood = food.x === colIndex && food.y === rowIndex;
        let cellClass = 'h-5 w-5 sm:h-6 sm:w-6 rounded-sm border border-[#E5E5E5] bg-white';
        if (isSnake) {
          cellClass = `h-5 w-5 sm:h-6 sm:w-6 rounded-sm border border-[#E5E5E5] ${isHead ? 'bg-[#FFB6C1]' : 'bg-[#A0E7E5]'}`;
        }
        if (isFood) {
          cellClass = 'h-5 w-5 sm:h-6 sm:w-6 rounded-sm border border-[#E5E5E5] bg-[#FFD166]';
        }
        return <div key={`${rowIndex}-${colIndex}`} className={cellClass} />;
      });
    });
    return cells;
  }, [snake, food]);

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
            className="rounded-full bg-[#A0E7E5] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#333333] shadow-sm transition hover:bg-[#7BD8D5]"
          >
            {hasLost ? 'Try again' : snake.length === 1 ? 'Start' : 'Restart'}
          </button>
          <button
            type="button"
            onClick={() => setIsRunning((prev) => !prev)}
            disabled={hasLost && !isRunning}
            className="rounded-full border border-[#A0E7E5] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#333333] transition hover:bg-[#A0E7E5]/20 disabled:opacity-60"
          >
            {isRunning ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>
      {hasLost && (
        <div className="rounded-2xl border border-[#FFB6C1] bg-[#FFF4F7] px-4 py-3 text-sm text-[#7A1120]">
          You bumped into yourself! Click “Try again” to restart.
        </div>
      )}
      <div
        className="grid gap-[2px] rounded-2xl border border-[#E5E5E5] bg-[#F2F2F2] p-3"
        style={{ width: 'fit-content', gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}
      >
        {boardCells.flat()}
      </div>
      <p className="text-xs text-[#9E9E9E]">Use arrow keys to move. Eat the golden bites to grow!</p>
    </div>
  );
};

export default SnakeGame;
