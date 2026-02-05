import { Button } from '@/components/ui/button';
import { Share2, RotateCcw } from 'lucide-react';

interface WinnerOverlayProps {
  onNewGame: () => void;
  onShare: () => void;
}

export function WinnerOverlay({ onNewGame, onShare }: WinnerOverlayProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center animate-winner-entrance">
        <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-shimmer bg-[length:200%_auto] mb-8">
          Winner!
        </h1>
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={onShare}
            className="gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={onNewGame}
            className="gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            New Game
          </Button>
        </div>
      </div>
    </div>
  );
}
