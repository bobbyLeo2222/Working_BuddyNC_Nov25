import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const COLUMNS = 10;
const ROWS = 20;
const DROP_INTERVAL_MS = 800;

const SHAPES = {
  I: {
    color: '#00C9A7',
    matrix: [
      [1, 1, 1, 1],
    ],
  },
  L: {
    color: '#FF8A5B',
    matrix: [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
  },
  J: {
    color: '#3F88C5',
    matrix: [
      [0, 1],
      [0, 1],
      [1, 1],
    ],
  },
  O: {
    color: '#FFD166',
    matrix: [
      [1, 1],
      [1, 1],
    ],
  },
  S: {
    color: '#6EE7B7',
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
    ],
  },
  Z: {
    color: '#F87171',
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
    ],
  },
  T: {
    color: '#C084FC',
    matrix: [
      [1, 1, 1],
      [0, 1, 0],
    ],
  },
};

const SHAPE_KEYS = Object.keys(SHAPES);

const createEmptyBoard = () => Array.from({ length: ROWS }, () => Array(COLUMNS).fill(null));

const rotateMatrix = (matrix) => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      rotated[col][rows - 1 - row] = matrix[row][col];
    }
  }
  return rotated;
};

const randomShape = () => {
  const key = SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
  const definition = SHAPES[key];
  return {
    key,
    color: definition.color,
    matrix: definition.matrix.map((row) => [...row]),
  };
};

const TetrisGame = () => {
  const [board, setBoard] = useState(createEmptyBoard);
  const [activePiece, setActivePiece] = useState(() => randomShape());
  const [position, setPosition] = useState({ row: 0, col: 3 });
  const [nextPiece, setNextPiece] = useState(() => randomShape());
  const [score, setScore] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const dropRef = useRef(null);

  const resetGame = () => {
    setBoard(createEmptyBoard());
    const firstPiece = randomShape();
    setActivePiece(firstPiece);
    setPosition({ row: 0, col: Math.floor((COLUMNS - firstPiece.matrix[0].length) / 2) });
    setNextPiece(randomShape());
    setScore(0);
    setIsRunning(true);
    setIsGameOver(false);
  };

  const canPlace = useCallback((matrix, targetRow, targetCol) => {
    for (let row = 0; row < matrix.length; row += 1) {
      for (let col = 0; col < matrix[row].length; col += 1) {
        if (!matrix[row][col]) continue;
        const r = targetRow + row;
        const c = targetCol + col;
        if (r < 0 || r >= ROWS || c < 0 || c >= COLUMNS) return false;
        if (board[r][c]) return false;
      }
    }
    return true;
  }, [board]);

  const mergePiece = useCallback((matrix, color, targetRow, targetCol) => {
    setBoard((previousBoard) => {
      const nextBoard = previousBoard.map((row) => [...row]);
      matrix.forEach((matrixRow, rIndex) => {
        matrixRow.forEach((value, cIndex) => {
          if (!value) return;
          const row = targetRow + rIndex;
          const col = targetCol + cIndex;
          if (row >= 0 && row < ROWS && col >= 0 && col < COLUMNS) {
            nextBoard[row][col] = color;
          }
        });
      });
      return nextBoard;
    });
  }, []);

  const clearLines = useCallback(() => {
    setBoard((previousBoard) => {
      const survivingRows = previousBoard.filter((row) => row.some((cell) => cell === null));
      const cleared = ROWS - survivingRows.length;
      if (cleared === 0) {
        return previousBoard;
      }
      setScore((current) => current + cleared * 100);
      const emptyRows = Array.from({ length: cleared }, () => Array(COLUMNS).fill(null));
      return [...emptyRows, ...survivingRows];
    });
  }, []);

  const spawnNextPiece = useCallback((incoming) => {
    const piece = incoming ?? nextPiece;
    const startCol = Math.floor((COLUMNS - piece.matrix[0].length) / 2);
    if (!canPlace(piece.matrix, 0, startCol)) {
      setIsGameOver(true);
      setIsRunning(false);
      return;
    }
    setActivePiece(piece);
    setPosition({ row: 0, col: startCol });
    setNextPiece(randomShape());
  }, [canPlace, nextPiece]);

  const dropStep = useCallback(() => {
    setPosition((currentPosition) => {
      const nextRow = currentPosition.row + 1;
      if (canPlace(activePiece.matrix, nextRow, currentPosition.col)) {
        return { ...currentPosition, row: nextRow };
      }

      mergePiece(activePiece.matrix, activePiece.color, currentPosition.row, currentPosition.col);
      clearLines();
      spawnNextPiece();
      return currentPosition;
    });
  }, [activePiece, canPlace, clearLines, mergePiece, spawnNextPiece]);

  useEffect(() => {
    if (!isRunning || isGameOver) return undefined;
    dropRef.current = setInterval(() => {
      dropStep();
    }, DROP_INTERVAL_MS);
    return () => clearInterval(dropRef.current);
  }, [isRunning, dropStep, isGameOver]);

  const handleKeyDown = useCallback((event) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
    }
    if (!isRunning) return;
    if (event.key === 'ArrowLeft') {
      setPosition((currentPosition) => {
        const targetCol = currentPosition.col - 1;
        return canPlace(activePiece.matrix, currentPosition.row, targetCol)
          ? { ...currentPosition, col: targetCol }
          : currentPosition;
      });
    } else if (event.key === 'ArrowRight') {
      setPosition((currentPosition) => {
        const targetCol = currentPosition.col + 1;
        return canPlace(activePiece.matrix, currentPosition.row, targetCol)
          ? { ...currentPosition, col: targetCol }
          : currentPosition;
      });
    } else if (event.key === 'ArrowDown') {
      dropStep();
    } else if (event.key === 'ArrowUp') {
      setActivePiece((currentPiece) => {
        const rotated = rotateMatrix(currentPiece.matrix);
        if (canPlace(rotated, position.row, position.col)) {
          return { ...currentPiece, matrix: rotated };
        }
        return currentPiece;
      });
    } else if (event.key === ' ') {
      event.preventDefault();
      setPosition((currentPosition) => {
        let nextRow = currentPosition.row;
        while (canPlace(activePiece.matrix, nextRow + 1, currentPosition.col)) {
          nextRow += 1;
        }
        mergePiece(activePiece.matrix, activePiece.color, nextRow, currentPosition.col);
        clearLines();
        spawnNextPiece();
        return { ...currentPosition, row: nextRow };
      });
    }
  }, [activePiece, canPlace, clearLines, dropStep, mergePiece, position.col, position.row, spawnNextPiece, isRunning]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const boardWithActivePiece = useMemo(() => {
    const preview = board.map((row) => [...row]);
    activePiece.matrix.forEach((matrixRow, rIndex) => {
      matrixRow.forEach((value, cIndex) => {
        if (!value) return;
        const row = position.row + rIndex;
        const col = position.col + cIndex;
        if (row >= 0 && row < ROWS && col >= 0 && col < COLUMNS) {
          preview[row][col] = activePiece.color;
        }
      });
    });
    return preview;
  }, [board, activePiece, position.row, position.col]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
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
            {isGameOver ? 'Play again' : board.every((row) => row.every((cell) => cell === null)) ? 'Start' : 'Restart'}
          </button>
          <button
            type="button"
            onClick={() => setIsRunning((prev) => !prev)}
            disabled={isGameOver}
            className="rounded-full border border-[#A0E7E5] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#333333] transition hover:bg-[#A0E7E5]/20 disabled:opacity-60"
          >
            {isRunning ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {isGameOver && (
        <div className="rounded-2xl border border-[#FFB6C1] bg-[#FFF4F7] px-4 py-3 text-sm text-[#7A1120]">
          Game over! Your pieces reached the top.
        </div>
      )}

      <div className="flex flex-wrap gap-6">
        <div
          className="grid gap-[2px] rounded-2xl border border-[#E5E5E5] bg-[#F2F2F2] p-3"
          style={{ gridTemplateColumns: `repeat(${COLUMNS}, 1fr)` }}
        >
          {boardWithActivePiece.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="h-5 w-5 sm:h-6 sm:w-6 rounded-sm border border-[#E5E5E5]"
                style={{ backgroundColor: cell || '#FFFFFF' }}
              />
            ))
          )}
        </div>
        <div className="min-w-[120px] space-y-3 rounded-2xl border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-[#333333]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">Next piece</p>
          <div
            className="inline-grid gap-[4px] rounded-lg border border-[#E5E5E5] bg-[#F8FAFC] p-3"
            style={{ gridTemplateColumns: `repeat(${nextPiece.matrix[0].length}, 1fr)` }}
          >
            {nextPiece.matrix.map((row, rowIndex) =>
              row.map((value, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="h-4 w-4 rounded-sm"
                  style={{ backgroundColor: value ? nextPiece.color : '#FFFFFF' }}
                />
              ))
            )}
          </div>
          <div className="space-y-1 text-xs text-[#9E9E9E]">
            <p>← → move</p>
            <p>↑ rotate</p>
            <p>↓ soft drop</p>
            <p>Space hard drop</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TetrisGame;
