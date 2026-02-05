import { createSeededRandom } from './seededRandom';

export type BoardGeneratorCallback = (numColored: number, total: number) => void;

export function generateBoard(
  N: number,
  seed: string,
  onProgress: BoardGeneratorCallback
): number[][] {
  const random = createSeededRandom(seed);
  let board: number[][] = [];
  let numColoredSquares = 0;
  const total = N * N;
  const maxAttempts = total * 10;

  // Helper to check if a position conflicts with existing colored squares
  const hasConflict = (row: number, col: number): boolean => {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (board[r][c] !== 0) {
          // Same row or column
          if (r === row || c === col) return true;
          // Diagonally adjacent
          if (Math.abs(r - row) === 1 && Math.abs(c - col) === 1) return true;
        }
      }
    }
    return false;
  };
  // Helper to get colors of adjacent squares
  const neighborColors = (row: number, col: number): number[] => {
    const colors: number[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < N && nc >= 0 && nc < N && board[nr][nc] !== 0) {
        colors.push(board[nr][nc]);
      }
    }
    return colors;
  };

  for (let phase1Attempt = 0; phase1Attempt < maxAttempts; phase1Attempt++) {
    // Phase 1: Place one of each color (1 to N)
    numColoredSquares = 0;
    board = Array.from({ length: N }, () => Array(N).fill(0));
    for (let color = 1; color <= N; color++) {
      let colorAttempt = 0;
      while (colorAttempt < maxAttempts) {
        const row = Math.floor(random() * N);
        const col = Math.floor(random() * N);
        
        if (board[row][col] === 0 && !hasConflict(row, col)) {
          board[row][col] = color;
          numColoredSquares++;
          console.log(`Key color ${color} placed at row ${row}, col ${col}`);
          onProgress(numColoredSquares, total);
          break;
        }
        colorAttempt++;
      }
      
      // If we couldn't find a valid spot, restart board generation
      if (colorAttempt >= maxAttempts) {
        break;
      }
    }
    if (numColoredSquares === N) {
      break;
    }
  }
  if (numColoredSquares < N) {
    throw new Error('Failed to place one of each color');
  }

  // Phase 2: Fill remaining squares

  let attempts = 0;
  const maxFillAttempts = maxAttempts * N;
  while (numColoredSquares < total && attempts < maxFillAttempts) {
    const row = Math.floor(random() * N);
    const col = Math.floor(random() * N);
    if (board[row][col] === 0) {
      const neighbors = neighborColors(row, col);
      if (neighbors.length > 0) {
        const chosenColor = neighbors[Math.floor(random() * neighbors.length)];
        board[row][col] = chosenColor;
        numColoredSquares++;
        onProgress(numColoredSquares, total);
      }
    }
    attempts++;
  }
  if (numColoredSquares < total) {
    throw new Error('Failed to fill all squares');
  }
  return board;
}
