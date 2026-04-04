import { Button } from '@/components/ui/Button';
import { MaterialIcon } from '@/components/ui/MaterialIcon';

interface AuthGateProps {
  bootstrapError: string | null;
  onGoogleSignIn: () => Promise<void>;
  onContinueAsGuest: () => Promise<void>;
}

export function AuthGate({
  bootstrapError,
  onGoogleSignIn,
  onContinueAsGuest,
}: AuthGateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-[2rem] bg-surface-container-lowest/85 p-8 shadow-ambient backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary">
            <MaterialIcon
              name="account_balance_wallet"
              filled
              className="text-[24px]"
            />
          </div>
          <div>
            <p className="text-xl font-black tracking-tight text-on-surface">
              Wallet Wise
            </p>
            <p className="text-sm text-on-surface-variant">
              Sign in to sync your ledger
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-[1.75rem] bg-surface-container-low p-5">
          <p className="text-sm leading-6 text-on-surface">
            Use Google for your primary account, or continue as a guest for a
            local-first test flow.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Button
            className="w-full gap-3 py-4 text-base"
            onClick={() => void onGoogleSignIn()}
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-lowest text-[13px] font-bold text-[#4285F4]">
              G
            </span>
            Continue with Google
          </Button>

          <Button
            variant="secondary"
            className="w-full py-4 text-base"
            onClick={() => void onContinueAsGuest()}
          >
            Continue as Guest
          </Button>
        </div>

        <p className="mt-6 text-xs leading-5 text-on-surface-variant">
          For Google login to work, enable Google in Firebase Authentication and
          add your local domain to Authorized domains.
        </p>

        {bootstrapError ? (
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-surface-container-low p-4 text-xs text-error">
            {bootstrapError}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
