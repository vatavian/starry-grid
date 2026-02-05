import { createSeededRandom } from './seededRandom';

export type BoardGeneratorCallback = (numColored: number, total: number) => void;

export function generateBoard(
  N: number,
  seed: string,
  onProgress: BoardGeneratorCallback
): number[][] {
  const random = createSeededRandom(seed);
  const board: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
  let numColoredSquares = 0;
  const total = N * N;

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

  // Phase 1: Place one of each color (1 to N)
  for (let color = 1; color <= N; color++) {
    let attempts = 0;
    const maxAttempts = N * N * 10;
    
    while (attempts < maxAttempts) {
      const row = Math.floor(random() * N);
      const col = Math.floor(random() * N);
      
      if (board[row][col] === 0 && !hasConflict(row, col)) {
        board[row][col] = color;
        numColoredSquares++;
        console.log(`Color ${color} placed at row ${row}, col ${col}`);
        onProgress(numColoredSquares, total);
        break;
      }
      attempts++;
    }
    
    // Fallback: if we couldn't find a valid spot, just place it somewhere empty
    if (attempts >= maxAttempts) {
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (board[r][c] === 0) {
            board[r][c] = color;
            numColoredSquares++;
            console.log(`Color ${color} placed at row ${r}, col ${c} (fallback)`);
            onProgress(numColoredSquares, total);
            break;
          }
        }
        if (board.flat().filter(x => x === color).length > 0) break;
      }
    }
  }

  // Phase 2: Fill remaining squares
  const uncoloredPositions: [number, number][] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (board[r][c] === 0) {
        uncoloredPositions.push([r, c]);
      }
    }
  }

  // Shuffle uncolored positions
  for (let i = uncoloredPositions.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [uncoloredPositions[i], uncoloredPositions[j]] = [uncoloredPositions[j], uncoloredPositions[i]];
  }

  let attempts = 0;
  const maxTotalAttempts = N * N * N * 10;

  while (numColoredSquares < total && attempts < maxTotalAttempts) {
    // Pick a random uncolored square
    let foundSquare = false;
    
    for (const [row, col] of uncoloredPositions) {
      if (board[row][col] !== 0) continue;
      
      // Find adjacent colors
      const adjacentColors: number[] = [];
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      
      for (const [dr, dc] of directions) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N && board[nr][nc] !== 0) {
          adjacentColors.push(board[nr][nc]);
        }
      }
      
      if (adjacentColors.length > 0) {
        const chosenColor = adjacentColors[Math.floor(random() * adjacentColors.length)];
        board[row][col] = chosenColor;
        numColoredSquares++;
        onProgress(numColoredSquares, total);
        foundSquare = true;
        break;
      }
    }
    
    if (!foundSquare) {
      // If no square has adjacent colors, expand from existing colors
      for (const [row, col] of uncoloredPositions) {
        if (board[row][col] !== 0) continue;
        
        // Find nearest colored square and use its color
        let minDist = Infinity;
        let nearestColor = 1;
        
        for (let r = 0; r < N; r++) {
          for (let c = 0; c < N; c++) {
            if (board[r][c] !== 0) {
              const dist = Math.abs(r - row) + Math.abs(c - col);
              if (dist < minDist) {
                minDist = dist;
                nearestColor = board[r][c];
              }
            }
          }
        }
        
        board[row][col] = nearestColor;
        numColoredSquares++;
        onProgress(numColoredSquares, total);
        break;
      }
    }
    
    attempts++;
  }

  return board;
}
