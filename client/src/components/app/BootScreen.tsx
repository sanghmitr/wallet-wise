import { Button } from '@/components/ui/Button';
import { MaterialIcon } from '@/components/ui/MaterialIcon';

type BootScreenVariant = 'loading' | 'waking-server' | 'error';

interface BootScreenProps {
  variant?: BootScreenVariant;
  errorMessage?: string | null;
  onRetry?: () => void | Promise<void>;
}

function getCopy(variant: BootScreenVariant) {
  if (variant === 'error') {
    return {
      title: 'Still setting things up',
      description: 'This is taking a little longer than expected.',
      progressWidth: '68%',
      badgeIcon: 'sync_problem',
    };
  }

  if (variant === 'waking-server') {
    return {
      title: 'Setting things up',
      description: 'Preparing your workspace. This can take a moment after inactivity.',
      progressWidth: '78%',
      badgeIcon: 'autorenew',
    };
  }

  return {
    title: 'Setting things up',
    description: 'Getting your workspace ready.',
    progressWidth: '46%',
    badgeIcon: 'hourglass_top',
  };
}

export function BootScreen({
  variant = 'loading',
  errorMessage,
  onRetry,
}: BootScreenProps) {
  const copy = getCopy(variant);

  return (
    <div className="relative min-h-screen overflow-hidden px-5 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="premium-grid absolute inset-0 opacity-50" />
        <div className="absolute left-[-10%] top-[-6rem] h-64 w-64 rounded-full bg-primary/18 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute right-[-10%] top-[14%] h-72 w-72 rounded-full bg-secondary/16 blur-3xl sm:h-96 sm:w-96" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <div className="w-full max-w-2xl rounded-[2.4rem] border border-outline-variant/70 bg-surface-container-lowest/88 p-6 shadow-ambient backdrop-blur-2xl sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-on-surface text-background">
              <MaterialIcon
                name="account_balance_wallet"
                filled
                className="text-[22px]"
              />
            </div>
            <p className="font-display text-xl font-medium tracking-[-0.03em] text-on-surface">
              Wallet Wise
            </p>
          </div>

          <div className="mt-8 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary">
              <MaterialIcon
                name={copy.badgeIcon}
                className={variant === 'waking-server' ? 'animate-spin text-[22px]' : 'text-[22px]'}
              />
            </div>
            <div>
              <h1 className="font-display text-[2rem] font-medium tracking-[-0.04em] text-on-surface sm:text-[2.5rem]">
                {copy.title}
              </h1>
              <p className="mt-3 text-base leading-7 text-on-surface-variant">
                {copy.description}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="h-3 overflow-hidden rounded-full bg-surface-container-high">
              <div
                className={`h-full rounded-full bg-primary transition-all duration-700 ${
                  variant === 'waking-server' ? 'animate-pulse' : ''
                }`}
                style={{ width: copy.progressWidth }}
              />
            </div>
            <p className="mt-3 text-sm text-on-surface-variant">
              {variant === 'error' ? 'Waiting for setup to finish.' : 'Setting up your workspace...'}
            </p>
          </div>

          {errorMessage ? (
            <div className="mt-5 rounded-[1.4rem] border border-error/20 bg-error/6 px-4 py-3 text-sm text-on-surface">
              {errorMessage}
            </div>
          ) : null}

          {variant === 'error' && onRetry ? (
            <Button className="mt-6 gap-2" onClick={() => void onRetry()}>
              <MaterialIcon name="refresh" className="text-[18px]" />
              Retry
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
