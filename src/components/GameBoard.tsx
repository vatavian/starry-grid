import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { getColorStyle } from '@/lib/gameColors';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Star, X, Undo2 } from 'lucide-react';
import { useDragToX } from '@/hooks/useDragToX';

type SquareState = 'empty' | 'x' | 'star';

interface GameBoardProps {
  board: number[][];
  N: number;
  onWin: () => void;
  clearSignal: number;
  mode: 'playing' | 'customize';
  selectedColor?: number;
  onBoardChange?: (board: number[][]) => void;
}

// Key for a star position -> list of cells it auto-X'd
type AutoXMap = Record<string, [number, number][]>;

export function GameBoard({
  board,
  N,
  onWin,
  clearSignal,
  mode,
  selectedColor = 1,
  onBoardChange,
}: GameBoardProps) {
  const [states, setStates] = useState<SquareState[][]>(() =>
    Array.from({ length: N }, () => Array(N).fill('empty'))
  );
  const [hasWon, setHasWon] = useState(false);
  const [autoX, setAutoX] = useState(true);
  const [autoXMap, setAutoXMap] = useState<AutoXMap>({});
  const undoStack = useRef<{ states: SquareState[][]; autoXMap: AutoXMap }[]>([]);

  const resetBoard = useCallback(() => {
    setStates(Array.from({ length: N }, () => Array(N).fill('empty')));
    setHasWon(false);
    setAutoXMap({});
    undoStack.current = [];
  }, [N]);

  useEffect(() => {
    resetBoard();
  }, [clearSignal, resetBoard]);

  useEffect(() => {
    if (mode === 'customize') {
      resetBoard();
    }
  }, [mode, resetBoard]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const saveSnapshot = () => {
    undoStack.current.push({
      states: states.map(r => [...r]),
      autoXMap: { ...autoXMap },
    });
  };

  const handleUndo = () => {
    const snapshot = undoStack.current.pop();
    if (!snapshot) return;
    setStates(snapshot.states);
    setAutoXMap(snapshot.autoXMap);
  };

  const { handlePointerDown, handlePointerMove, handlePointerUp, shouldSuppressClick } =
    useDragToX({ N, states, setStates, hasWon, onDragStart: saveSnapshot });

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

    const rows = new Set(stars.map(([r]) => r));
    const cols = new Set(stars.map(([, c]) => c));
    if (rows.size !== N || cols.size !== N) return false;

    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const [r1, c1] = stars[i];
        const [r2, c2] = stars[j];
        if (Math.abs(r1 - r2) === 1 && Math.abs(c1 - c2) === 1) return false;
      }
    }

    return true;
  }, [N, board]);

  const getAutoXTargets = useCallback((row: number, col: number, currentStates: SquareState[][]): [number, number][] => {
    const targets: [number, number][] = [];
    const current = board[row][col];
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (board[r][c] === current && (r !== row || c !== col) && currentStates[r][c] === 'empty')
          targets.push([r, c]); // Same color

    for (let i = 0; i < N; i++) {
      // Same row
      if (i !== col && currentStates[row][i] === 'empty') {
        targets.push([row, i]);
      }
      // Same column
      if (i !== row && currentStates[i][col] === 'empty') {
        targets.push([i, col]);
      }
    }
    // Diagonal adjacents
    for (const dr of [-1, 1]) {
      for (const dc of [-1, 1]) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N && currentStates[nr][nc] === 'empty') {
          targets.push([nr, nc]);
        }
      }
    }
    return targets;
  }, [N]);

  const starKey = (r: number, c: number) => `${r},${c}`;

  const handleClick = (row: number, col: number) => {
    if (mode === 'customize') {
      if (!onBoardChange) return;
      const nextBoard = board.map((boardRow) => [...boardRow]);
      nextBoard[row][col] = selectedColor;
      onBoardChange(nextBoard);
      return;
    }

    if (hasWon) return;
    if (shouldSuppressClick()) return;

    saveSnapshot();

    setStates(prev => {
      const newStates = prev.map(r => [...r]);
      const current = newStates[row][col];

      if (current === 'empty') {
        newStates[row][col] = 'x';
      } else if (current === 'x') {
        newStates[row][col] = 'star';

        if (autoX) {
          const targets = getAutoXTargets(row, col, newStates);
          for (const [tr, tc] of targets) {
            newStates[tr][tc] = 'x';
          }
          setAutoXMap(prev => ({ ...prev, [starKey(row, col)]: targets }));
        }
      } else {
        // Removing a star — revert its auto-X'd cells
        newStates[row][col] = 'empty';
        const key = starKey(row, col);
        setAutoXMap(prev => {
          const targets = prev[key];
          if (targets) {
            for (const [tr, tc] of targets) {
              // Only revert if still an X (user might have changed it)
              if (newStates[tr][tc] === 'x') {
                newStates[tr][tc] = 'empty';
              }
            }
            const next = { ...prev };
            delete next[key];
            return next;
          }
          return prev;
        });
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
    if (mode === 'customize') {
      if (!onBoardChange) return;
      const current = board[row][col];
      let nextColor = Math.floor(Math.random() * N) + 1;
      if (N > 1) {
        while (nextColor === current) {
          nextColor = Math.floor(Math.random() * N) + 1;
        }
      }
      const nextBoard = board.map((boardRow) => [...boardRow]);
      nextBoard[row][col] = nextColor;
      onBoardChange(nextBoard);
      return;
    }

    if (hasWon) return;

    saveSnapshot();

    setStates(prev => {
      const newStates = prev.map(r => [...r]);
      const current = newStates[row][col];
      newStates[row][col] = 'empty';

      // If clearing a star, revert its auto-X'd cells
      if (current === 'star') {
        const key = starKey(row, col);
        setAutoXMap(prevMap => {
          const targets = prevMap[key];
          if (targets) {
            for (const [tr, tc] of targets) {
              if (newStates[tr][tc] === 'x') {
                newStates[tr][tc] = 'empty';
              }
            }
            const next = { ...prevMap };
            delete next[key];
            return next;
          }
          return prevMap;
        });
      }

      return newStates;
    });
  };

  const cellSize = `calc((min(100vw, 100vh) - 4rem) / ${N})`;
  const { conflictKeys, conflictMessages } = useMemo(() => {
    const stars: { r: number; c: number; color: number }[] = [];
    const rowMap = new Map<number, { r: number; c: number }[]>();
    const colMap = new Map<number, { r: number; c: number }[]>();
    const colorMap = new Map<number, { r: number; c: number }[]>();

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (states[r][c] === 'star') {
          const color = board[r][c];
          stars.push({ r, c, color });
          rowMap.set(r, [...(rowMap.get(r) ?? []), { r, c }]);
          colMap.set(c, [...(colMap.get(c) ?? []), { r, c }]);
          colorMap.set(color, [...(colorMap.get(color) ?? []), { r, c }]);
        }
      }
    }

    const conflicts = new Set<string>();
    const messages = new Set<string>();

    const addGroupedConflicts = (label: string, map: Map<number, { r: number; c: number }[]>, formatKey: (key: number) => string) => {
      for (const [key, positions] of map.entries()) {
        if (positions.length > 1) {
          positions.forEach(({ r, c }) => conflicts.add(starKey(r, c)));
          messages.add(`${label} ${formatKey(key)} has multiple stars.`);
        }
      }
    };

    addGroupedConflicts('Row', rowMap, key => `${key + 1}`);
    addGroupedConflicts('Column', colMap, key => `${key + 1}`);
    addGroupedConflicts('Color', colorMap, key => `${key + 1}`);

    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const a = stars[i];
        const b = stars[j];
        if (Math.abs(a.r - b.r) === 1 && Math.abs(a.c - b.c) === 1) {
          conflicts.add(starKey(a.r, a.c));
          conflicts.add(starKey(b.r, b.c));
          messages.add(
            `Diagonal neighbors at (${a.r + 1}, ${a.c + 1}) and (${b.r + 1}, ${b.c + 1}).`
          );
        }
      }
    }

    return { conflictKeys: conflicts, conflictMessages: Array.from(messages) };
  }, [N, board, states]);

  return (
    <div className="flex flex-col items-end gap-2 w-fit mx-auto">
      {mode === 'playing' && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleUndo}
            disabled={hasWon || undoStack.current.length === 0}
            className="h-8 w-8"
            aria-label="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Checkbox
            id="auto-x"
            checked={autoX}
            onCheckedChange={(checked) => setAutoX(checked === true)}
          />
          <Label htmlFor="auto-x" className="text-muted-foreground text-sm cursor-pointer select-none">
            Auto-X
          </Label>
        </div>
      )}
      <div 
        className="grid gap-0 game-board-shadow"
        style={{ 
          gridTemplateColumns: `repeat(${N}, ${cellSize})`,
          gridTemplateRows: `repeat(${N}, ${cellSize})`,
          touchAction: 'none',
        }}
        onPointerMove={mode === 'playing' ? handlePointerMove : undefined}
        onPointerUp={mode === 'playing' ? handlePointerUp : undefined}
    >
      {board.map((row, r) =>
        row.map((colorNum, c) => {
          const color = getColorStyle(colorNum);
          const state = states[r][c];
          const isConflict = state === 'star' && conflictKeys.has(starKey(r, c));
          
          // Determine border styles
          const topBorder = r === 0 || board[r - 1][c] !== colorNum;
          const leftBorder = c === 0 || board[r][c - 1] !== colorNum;
          const rightBorder = c === N - 1 || board[r][c + 1] !== colorNum;
          const bottomBorder = r === N - 1 || board[r + 1][c] !== colorNum;

          return (
            <button
              key={`${r}-${c}`}
              data-cell
              data-row={r}
              data-col={c}
              onClick={() => handleClick(r, c)}
              onContextMenu={(e) => handleRightClick(e, r, c)}
              onPointerDown={mode === 'playing' ? (e) => handlePointerDown(r, c, e) : undefined}
              className="relative flex items-center justify-center transition-transform active:scale-95"
              style={{
                backgroundColor: color.bg,
                borderTop: topBorder ? '2px solid black' : `2px solid ${color.dark}`,
                borderLeft: leftBorder ? '2px solid black' : `2px solid ${color.dark}`,
                borderRight: rightBorder ? '2px solid black' : `2px solid ${color.dark}`,
                borderBottom: bottomBorder ? '2px solid black' : `2px solid ${color.dark}`,
              }}
            >
              {mode === 'playing' && state === 'x' && (
                <X className="w-1/2 h-1/2 text-muted-foreground stroke-[3]" />
              )}
              {mode === 'playing' && state === 'star' && (
                <Star
                  className={
                    isConflict
                      ? "w-1/2 h-1/2 text-red-500 fill-red-500 drop-shadow-glow"
                      : "w-1/2 h-1/2 text-white fill-white drop-shadow-glow"
                  }
                />
              )}
            </button>
          );
        })
      )}
      </div>
      {mode === 'playing' && (
        <div className="min-h-[2.5rem] text-sm text-red-500" aria-live="polite">
          {conflictMessages.length > 0 && (
            <ul className="space-y-1 text-right">
              {conflictMessages.map(message => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
