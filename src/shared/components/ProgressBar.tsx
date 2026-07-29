import { toFiniteNumber } from '@/shared/utils/format';

interface ProgressBarProps {
  progress: number | string | null | undefined;
  color?: string;
  height?: number;
}

export function ProgressBar({ progress, color = 'var(--color-brand-500)', height = 6 }: ProgressBarProps) {
  const clamped = Math.min(Math.max(toFiniteNumber(progress), 0), 100);
  return (
    <div className="progress-bar" style={{ height }}>
      <div
        className="progress-bar__fill"
        style={{
          width: `${clamped}%`,
          backgroundColor: clamped >= 100 ? 'var(--color-success)' : color,
        }}
      />
    </div>
  );
}
