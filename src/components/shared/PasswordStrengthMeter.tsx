import { cn } from '@/lib/utils';

// Not in docs/design/COMPONENTS.md (flagged as a gap) — a small one-off meter
// for the admin "Nieuw wachtwoord" screen only, reusing existing tokens.
const SEGMENT_COUNT = 4;

const LABELS = ['Te kort', 'Zwak', 'Gemiddeld', 'Sterk', 'Sterk'];
const SEGMENT_COLOR = [
  'bg-destructive',
  'bg-destructive',
  'bg-warning-solid',
  'bg-success',
  'bg-success',
];
const LABEL_COLOR = [
  'text-destructive',
  'text-destructive',
  'text-warning-solid',
  'text-success',
  'text-success',
];

function scorePassword(password: string): number {
  let score = 0;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  return Math.min(score, SEGMENT_COUNT);
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const score = scorePassword(password);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex flex-1 gap-1">
        {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
          <div
            key={index}
            className={cn(
              'h-1 flex-1 rounded-full',
              index < score ? SEGMENT_COLOR[score] : 'bg-muted',
            )}
          />
        ))}
      </div>
      <span className={cn('text-small font-medium', LABEL_COLOR[score])}>{LABELS[score]}</span>
    </div>
  );
}
