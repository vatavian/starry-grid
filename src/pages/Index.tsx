import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DifficultySelector, Difficulty } from '@/components/DifficultySelector';
import { ProgressBar } from '@/components/ProgressBar';
import { GameBoard } from '@/components/GameBoard';
import { WinnerOverlay } from '@/components/WinnerOverlay';
import { generateBoard } from '@/lib/boardGenerator';
import { GAME_COLORS } from '@/lib/gameColors';
import { Hammer, Play } from 'lucide-react';

type GameState = 'menu' | 'generating' | 'playing' | 'won' | 'customize';

const difficultyToN: Record<Difficulty, number> = {
  easy: 5,
  normal: 8,
  hard: 9,
};

const seedLengthToDifficulty: Record<number, Difficulty> = {
  25: 'easy',
  64: 'normal',
  81: 'hard',
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
  const [selectedColor, setSelectedColor] = useState(1);
  const [savedBoards, setSavedBoards] = useState<{ name: string; seed: string }[]>([]);

  useEffect(() => {
    const entries: { name: string; seed: string }[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('board-')) continue;
      const value = localStorage.getItem(key);
      if (!value) continue;
      entries.push({ name: key.replace('board-', ''), seed: value });
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    setSavedBoards(entries);
  }, []);

  const customSeedSize = useMemo(() => {
    const trimmed = seed.trim();
    if (!/^\d+$/.test(trimmed)) return null;
    if (trimmed.length === 25) return 5;
    if (trimmed.length === 64) return 8;
    if (trimmed.length === 81) return 9;
    return null;
  }, [seed]);

  useEffect(() => {
    if (!customSeedSize) return;
    const matchingDifficulty = seedLengthToDifficulty[customSeedSize * customSeedSize];
    if (matchingDifficulty && matchingDifficulty !== difficulty) {
      setDifficulty(matchingDifficulty);
    }
  }, [customSeedSize, difficulty]);

  const updateUrlSeed = useCallback((nextSeed: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('seed', nextSeed);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, []);

  const createRandomBoard = useCallback((size: number) => {
    return Array.from({ length: size }, () =>
      Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1)
    );
  }, []);

  const startGame = useCallback(() => {
    const customSize = customSeedSize;
    const gridSize = customSize ?? difficultyToN[difficulty];
    setN(gridSize);
    setProgress({ current: 0, total: gridSize * gridSize });
    setGameState('generating');

    requestAnimationFrame(() => {
      const finalSeed = seed || Date.now().toString();

      if (customSize) {
        const digits = finalSeed.trim();
        const nextBoard = Array.from({ length: gridSize }, (_, row) =>
          Array.from({ length: gridSize }, (_, col) => Number(digits[row * gridSize + col]))
        );
        setBoard(nextBoard);
        setGameState('playing');
        updateUrlSeed(finalSeed);
        return;
      }

      const generatedBoard = generateBoard(gridSize, finalSeed, (current, total) => {
        setProgress({ current, total });
      });

      setBoard(generatedBoard);
      setGameState('playing');
      updateUrlSeed(finalSeed);
    });
  }, [customSeedSize, difficulty, seed, updateUrlSeed]);

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

  const handleCustomize = useCallback(() => {
    const gridSize = customSeedSize ?? difficultyToN[difficulty];
    setN(gridSize);
    if (!board || board.length !== gridSize) {
      setBoard(createRandomBoard(gridSize));
    }
    setSelectedColor(1);
    setGameState('customize');
    setClearSignal((value) => value + 1);
  }, [board, createRandomBoard, customSeedSize, difficulty]);

  const handlePlayCustom = useCallback(() => {
    setGameState('playing');
    if (board) {
      const digits = board.flat().join('');
      setSeed(digits);
      updateUrlSeed(digits);
    }
  }, [board, updateUrlSeed]);

  const handleSaveBoard = useCallback(() => {
    if (!board) return;
    const name = window.prompt('Name this board');
    if (!name) return;
    const key = `board-${name}`;
    const digits = board.flat().join('');
    localStorage.setItem(key, digits);
    setSavedBoards((prev) => {
      const next = prev.filter((item) => item.name !== name);
      next.push({ name, seed: digits });
      next.sort((a, b) => a.name.localeCompare(b.name));
      return next;
    });
  }, [board]);

  return (
    <div className="h-dvh overflow-hidden bg-background flex items-center justify-center p-4">
      {gameState === 'menu' && (
        <div className="flex flex-col items-center gap-8 w-full max-w-md animate-fade-in">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2 pb-2">
              Starry Grid
            </h1>
          </div>

          <DifficultySelector
            selected={difficulty}
            onSelect={setDifficulty}
            customSize={customSeedSize}
          />

          <div className="w-full space-y-2">
            <Label htmlFor="seed" className="text-muted-foreground">
              Seed (optional)
            </Label>
            {savedBoards.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="saved-seed" className="text-xs text-muted-foreground">
                  Saved boards
                </Label>
                <select
                  id="saved-seed"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) setSeed(e.target.value);
                  }}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Select a saved board...</option>
                  {savedBoards.map((boardOption) => (
                    <option key={boardOption.name} value={boardOption.seed}>
                      {boardOption.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
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

      {(gameState === 'playing' || gameState === 'won' || gameState === 'customize') && board && (
        <div className="flex max-h-full flex-col items-center gap-4 animate-fade-in">
          {gameState === 'customize' && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-wrap justify-center gap-2">
                {Object.entries(GAME_COLORS)
                  .slice(0, N)
                  .map(([key, color]) => {
                    const colorId = Number(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedColor(colorId)}
                        className={`h-10 w-10 rounded-full border-2 transition-all ${
                          selectedColor === colorId ? 'border-white shadow-glow' : 'border-black/40'
                        }`}
                        style={{ backgroundColor: color.bg }}
                        aria-label={`Select ${color.name}`}
                      />
                    );
                  })}
              </div>
              <div className="text-xs text-muted-foreground">
                Click to paint. Right click for a random different color.
              </div>
            </div>
          )}
          <GameBoard
            board={board}
            N={N}
            onWin={handleWin}
            clearSignal={clearSignal}
            mode={gameState === 'customize' ? 'customize' : 'playing'}
            selectedColor={selectedColor}
            onBoardChange={(nextBoard) => setBoard(nextBoard)}
          />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="ghost"
              onClick={handleNewGame}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Back to Menu
            </Button>
            {gameState !== 'customize' && (
              <Button variant="outline" onClick={handleClear}>
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              onClick={gameState === 'customize' ? handlePlayCustom : handleCustomize}
              className="gap-2"
            >
              {gameState === 'customize' ? (
                <>
                  <Play className="w-4 h-4" />
                  Play
                </>
              ) : (
                <>
                  <Hammer className="w-4 h-4" />
                  Customize
                </>
              )}
            </Button>
            {gameState === 'customize' && (
              <Button onClick={handleSaveBoard}>
                Save
              </Button>
            )}
          </div>
        </div>
      )}

      {gameState === 'won' && (
        <WinnerOverlay onNewGame={handleNewGame} onShare={handleShare} />
      )}
    </div>
  );
}
