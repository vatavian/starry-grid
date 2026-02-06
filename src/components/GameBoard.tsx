import { useState, useEffect, useCallback } from 'react';
import { getColorStyle } from '@/lib/gameColors';
import { Star, X } from 'lucide-react';

type SquareState = 'empty' | 'x' | 'star';

interface GameBoardProps {
  board: number[][];
  N: number;
  onWin: () => void;
}

export function GameBoard({ board, N, onWin }: GameBoardProps) {
  const [states, setStates] = useState<SquareState[][]>(() =>
    Array.from({ length: N }, () => Array(N).fill('empty'))
  );
  const [hasWon, setHasWon] = useState(false);

  const checkWin = useCallback((newStates: SquareState[][]) => {
    const stars: [number, number][] = [];
    const colorsUsed = new Set<number>();

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (newStates[r][c] === 'star') {
          stars.push([r, c]);
          colorsUsed.add(board[r][c]);
        }
      }
    }

    if (stars.length !== N) return false;
    if (colorsUsed.size !== N) return false;

    // Check no two stars in same row or column
    const rows = new Set(stars.map(([r]) => r));
    const cols = new Set(stars.map(([, c]) => c));
    if (rows.size !== N || cols.size !== N) return false;

    // Check no diagonal adjacency
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const [r1, c1] = stars[i];
        const [r2, c2] = stars[j];
        if (Math.abs(r1 - r2) === 1 && Math.abs(c1 - c2) === 1) return false;
      }
    }

    return true;
  }, [N, board]);

  const handleClick = (row: number, col: number) => {
    if (hasWon) return;

    setStates(prev => {
      const newStates = prev.map(r => [...r]);
      const current = newStates[row][col];
      
      if (current === 'empty') {
        newStates[row][col] = 'x';
      } else if (current === 'x') {
        newStates[row][col] = 'star';
      } else {
        newStates[row][col] = 'empty';
      }

      if (newStates[row][col] === 'star' && checkWin(newStates)) {
        setHasWon(true);
        setTimeout(onWin, 100);
      }

      return newStates;
    });
  };

  const handleRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (hasWon) return;

    setStates(prev => {
      const newStates = prev.map(r => [...r]);
      newStates[row][col] = 'empty';
      return newStates;
    });
  };

  const cellSize = `calc((min(100vw, 100vh) - 4rem) / ${N})`;

  return (
    <div 
      className="grid gap-0 mx-auto game-board-shadow"
      style={{ 
        gridTemplateColumns: `repeat(${N}, ${cellSize})`,
        gridTemplateRows: `repeat(${N}, ${cellSize})`,
      }}
    >
      {board.map((row, r) =>
        row.map((colorNum, c) => {
          const color = getColorStyle(colorNum);
          const state = states[r][c];
          
          // Determine border styles
          const topBorder = r === 0 || board[r - 1][c] !== colorNum;
          const leftBorder = c === 0 || board[r][c - 1] !== colorNum;
          const rightBorder = c === N - 1 || board[r][c + 1] !== colorNum;
          const bottomBorder = r === N - 1 || board[r + 1][c] !== colorNum;

          return (
            <button
              key={`${r}-${c}`}
              onClick={() => handleClick(r, c)}
              onContextMenu={(e) => handleRightClick(e, r, c)}
              className="relative flex items-center justify-center transition-transform active:scale-95"
              style={{
                backgroundColor: color.bg,
                borderTop: topBorder ? '2px solid black' : `2px solid ${color.dark}`,
                borderLeft: leftBorder ? '2px solid black' : `2px solid ${color.dark}`,
                borderRight: rightBorder ? '2px solid black' : `2px solid ${color.dark}`,
                borderBottom: bottomBorder ? '2px solid black' : `2px solid ${color.dark}`,
              }}
            >
              {state === 'x' && (
                <X className="w-1/2 h-1/2 text-gray-700 stroke-[3]" />
              )}
              {state === 'star' && (
                <Star className="w-1/2 h-1/2 text-white fill-white drop-shadow-glow" />
              )}
            </button>
          );
        })
      )}
    </div>
  );
}
