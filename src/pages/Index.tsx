import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DifficultySelector, Difficulty } from '@/components/DifficultySelector';
import { ProgressBar } from '@/components/ProgressBar';
import { GameBoard } from '@/components/GameBoard';
import { WinnerOverlay } from '@/components/WinnerOverlay';
import { generateBoard } from '@/lib/boardGenerator';
import { Play } from 'lucide-react';

type GameState = 'menu' | 'generating' | 'playing' | 'won';

const difficultyToN: Record<Difficulty, number> = {
  easy: 5,
  normal: 8,
  hard: 9,
};

export default function Index() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const urlParams = new URLSearchParams(window.location.search);
  const [seed, setSeed] = useState(urlParams.get('seed') || Date.now().toString());
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [board, setBoard] = useState<number[][] | null>(null);
  const [N, setN] = useState(8);
  const [clearSignal, setClearSignal] = useState(0);

  const startGame = useCallback(() => {
    const gridSize = difficultyToN[difficulty];
    setN(gridSize);
    setProgress({ current: 0, total: gridSize * gridSize });
    setGameState('generating');

    // Use requestAnimationFrame to allow the UI to update
    requestAnimationFrame(() => {
      const finalSeed = seed || Date.now().toString();
      
      // Generate board with progress callback
      const generatedBoard = generateBoard(gridSize, finalSeed, (current, total) => {
        setProgress({ current, total });
      });
      
      setBoard(generatedBoard);
      setGameState('playing');
    });
  }, [difficulty, seed]);

  const handleWin = useCallback(() => {
    setGameState('won');
  }, []);

  const handleShare = useCallback(async () => {
    try {
      await navigator.share({
        title: 'Starry Grid',
        text: `I won a ${N}×${N} Starry Grid!`,
        url: window.location.href,
      });
    } catch {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`I won a ${N}×${N} Starry Grid! ${window.location.href}`);
    }
  }, [N]);

  const handleNewGame = useCallback(() => {
    setGameState('menu');
    setBoard(null);
    setSeed('');
  }, []);

  const handleClear = useCallback(() => {
    setClearSignal((value) => value + 1);
    setGameState('playing');
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {gameState === 'menu' && (
        <div className="flex flex-col items-center gap-8 w-full max-w-md animate-fade-in">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
              Starry Grid
            </h1>
            <p className="text-muted-foreground">
              Place stars so each color, row, and column has exactly one and none are diagonally adjacent
            </p>
          </div>

          <DifficultySelector selected={difficulty} onSelect={setDifficulty} />

          <div className="w-full space-y-2">
            <Label htmlFor="seed" className="text-muted-foreground">
              Seed (optional)
            </Label>
            <Input
              id="seed"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Enter a seed for reproducible puzzles"
              className="bg-card border-border"
            />
          </div>

          <Button
            size="lg"
            onClick={startGame}
            className="w-full py-6 text-lg font-semibold gap-2"
          >
            <Play className="w-5 h-5" />
            Start Game
          </Button>
        </div>
      )}

      {gameState === 'generating' && (
        <div className="flex flex-col items-center gap-8 w-full animate-fade-in">
          <h2 className="text-2xl font-semibold text-foreground">
            Creating your puzzle...
          </h2>
          <ProgressBar current={progress.current} total={progress.total} />
        </div>
      )}

      {(gameState === 'playing' || gameState === 'won') && board && (
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <GameBoard board={board} N={N} onWin={handleWin} clearSignal={clearSignal} />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleNewGame}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Back to Menu
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {gameState === 'won' && (
        <WinnerOverlay onNewGame={handleNewGame} onShare={handleShare} />
      )}
    </div>
  );
}
