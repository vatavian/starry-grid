import { useRef, useCallback } from 'react';

type SquareState = 'empty' | 'x' | 'star';

interface UseDragToXOptions {
  N: number;
  states: SquareState[][];
  setStates: React.Dispatch<React.SetStateAction<SquareState[][]>>;
  hasWon: boolean;
}

export function useDragToX({ N, states, setStates, hasWon }: UseDragToXOptions) {
  const isDragging = useRef(false);
  const didDrag = useRef(false);
  const draggedCells = useRef<Set<string>>(new Set());

  const cellKey = (r: number, c: number) => `${r},${c}`;

  const markCell = useCallback((r: number, c: number) => {
    const key = cellKey(r, c);
    if (draggedCells.current.has(key)) return;
    
    setStates(prev => {
      if (prev[r][c] !== 'empty') return prev;
      const next = prev.map(row => [...row]);
      next[r][c] = 'x';
      draggedCells.current.add(key);
      return next;
    });
  }, [setStates]);

  const getCellFromPoint = useCallback((x: number, y: number): [number, number] | null => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const cell = (el as HTMLElement).closest('[data-cell]');
    if (!cell) return null;
    const r = Number(cell.getAttribute('data-row'));
    const c = Number(cell.getAttribute('data-col'));
    if (isNaN(r) || isNaN(c)) return null;
    return [r, c];
  }, []);

  const handlePointerDown = useCallback((r: number, c: number, e: React.PointerEvent) => {
    if (hasWon) return;
    if (states[r][c] !== 'empty') return;

    isDragging.current = true;
    didDrag.current = true;
    draggedCells.current = new Set();

    // Capture pointer for move/up events
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    markCell(r, c);
  }, [hasWon, states, markCell]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;

    const pos = getCellFromPoint(e.clientX, e.clientY);
    if (!pos) return;
    const [r, c] = pos;

    if (!draggedCells.current.has(cellKey(r, c))) {
      didDrag.current = true;
      markCell(r, c);
    }
  }, [getCellFromPoint, markCell]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    draggedCells.current = new Set();
  }, []);

  // Returns true if a multi-cell drag just happened (to suppress click)
  const shouldSuppressClick = useCallback(() => {
    if (didDrag.current) {
      didDrag.current = false;
      return true;
    }
    return false;
  }, []);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    shouldSuppressClick,
  };
}
