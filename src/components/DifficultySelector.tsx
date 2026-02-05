import { cn } from '@/lib/utils';

type Difficulty = 'easy' | 'normal' | 'hard';

interface DifficultySelectorProps {
  selected: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
}

const difficulties: { key: Difficulty; label: string; size: string }[] = [
  { key: 'easy', label: 'Easy', size: '5×5' },
  { key: 'normal', label: 'Normal', size: '8×8' },
  { key: 'hard', label: 'Hard', size: '9×9' },
];

export function DifficultySelector({ selected, onSelect }: DifficultySelectorProps) {
  return (
    <div className="flex gap-3 w-full max-w-md">
      {difficulties.map(({ key, label, size }) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={cn(
            'flex-1 py-4 px-3 rounded-xl border-2 transition-all duration-200',
            'flex flex-col items-center gap-1',
            selected === key
              ? 'border-primary bg-primary/10 shadow-glow'
              : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
          )}
        >
          <span className={cn(
            'font-semibold text-lg',
            selected === key ? 'text-primary' : 'text-foreground'
          )}>
            {label}
          </span>
          <span className="text-sm text-muted-foreground">{size}</span>
        </button>
      ))}
    </div>
  );
}

export type { Difficulty };
