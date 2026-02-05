interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>Generating board...</span>
        <span>{current} / {total}</span>
      </div>
      <div className="h-4 bg-muted rounded-full overflow-hidden border border-border">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-100 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
