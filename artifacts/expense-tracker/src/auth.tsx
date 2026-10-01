import { useState, type ReactNode } from 'react';
import {
  ClerkProvider,
  SignIn,
  SignUp,
  UserProfile,
  useUser,
} from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck, Wallet } from 'lucide-react';
import { Link, useLocation } from 'wouter';

export const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
export const GUEST_MODE_KEY = 'little-ledger-guest-mode-v1';
export const REMEMBER_PREFERENCE_KEY = 'little-ledger-remember-preference-v1';
export const REMEMBERED_AUTH_KEY = 'little-ledger-remembered-auth-v1';
export const TAB_AUTH_KEY = 'little-ledger-tab-auth-v1';

const clerkPublishableKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#347d68',
    colorForeground: '#24483c',
    colorMutedForeground: '#819087',
    colorDanger: '#b8584b',
    colorBackground: '#fffdf8',
    colorInput: '#fffdf8',
    colorInputForeground: '#315548',
    colorNeutral: '#dce5dc',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '1rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fffdf8] rounded-[24px] w-[440px] max-w-full overflow-hidden shadow-2xl',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'font-display text-[#24483c] font-bold',
    headerSubtitle: 'text-[#819087]',
    socialButtonsBlockButtonText: 'text-[#355a4d] font-semibold',
    formFieldLabel: 'text-[#62796d] font-medium',
    footerActionLink: 'text-[#347d68] font-semibold',
    footerActionText: 'text-[#819087]',
    dividerText: 'text-[#87968c]',
    identityPreviewEditButton: 'text-[#347d68]',
    formFieldSuccessText: 'text-[#347d68]',
    alertText: 'text-[#b8584b]',
    logoBox: 'rounded-2xl',
    logoImage: 'rounded-xl',
    socialButtonsBlockButton: 'border-[#dce5dc] !bg-white',
    formButtonPrimary: 'bg-[#347d68] hover:bg-[#2d705d] text-white font-semibold',
    formFieldInput: 'rounded-xl border-[#dce5dc] !bg-white text-[#315548]',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-[#e6ebe3]',
    alert: 'bg-[#fae9e4] border-[#f0d3ca]',
    otpCodeFieldInput: 'rounded-xl border-[#dce5dc] !bg-white text-[#315548]',
    formFieldRow: 'gap-2',
    main: 'p-0',
  },
};

if (!clerkPublishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY. Configure Clerk Auth for this app.');
}

function stripBase(path: string) {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

export function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle: 'Sign in to access your personal ledger',
          },
        },
        signUp: {
          start: {
            title: 'Create your account',
            subtitle: 'Keep your money details private to your account',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      {children}
    </ClerkProvider>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dce9dc] text-[#347d68]">
        <Wallet size={21} strokeWidth={1.8} />
      </span>
      <span>
        <span className="block font-display text-[19px] font-extrabold tracking-[-.045em] text-[#24483c]">little ledger<span className="text-[#d78967]">.</span></span>
        {!compact && <span className="block text-[10px] font-medium tracking-[.12em] text-[#819087]">YOUR MONEY, IN PERSPECTIVE</span>}
      </span>
    </Link>
  );
}

export function AuthLanding() {
  const [, setLocation] = useLocation();

  function continueAsGuest() {
    localStorage.setItem(GUEST_MODE_KEY, 'true');
    setLocation('/dashboard');
  }

  return (
    <main className="money-page grid min-h-[100dvh] place-items-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-5xl">
        <header className="mb-10 flex items-center justify-between">
          <Brand />
          <div className="hidden items-center gap-2 rounded-full border border-[#dce5dc] bg-[#fbfaf5]/75 px-3 py-2 text-xs font-medium text-[#63796d] sm:flex">
            <LockKeyhole size={14} className="text-[#5b9a76]" /> Private account access
          </div>
        </header>
        <section className="glass-card grid overflow-hidden rounded-[30px] md:grid-cols-[1.05fr_.95fr]">
          <div className="flex flex-col justify-center px-6 py-9 sm:px-10 sm:py-12">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.13em] text-[#789086]"><span className="h-px w-5 bg-[#a3b8a8]" />A calmer view of money</div>
            <h1 className="max-w-lg font-display text-4xl font-bold leading-[1.08] tracking-[-.06em] text-[#24483c] sm:text-5xl">Your money, <span className="text-[#d78967]">in perspective.</span></h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#71857a]">Track everyday spending, understand monthly patterns, and keep your personal ledger tied to your account.</p>
            <div className="mt-7 flex items-center gap-3 rounded-2xl border border-[#e2e9df] bg-white/45 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e7eee4] text-[#347d68]"><ShieldCheck size={19} /></span>
              <div><p className="text-sm font-semibold text-[#355a4d]">Protected sign-in</p><p className="mt-0.5 text-xs leading-5 text-[#819087]">Optional authenticator security is managed with your account.</p></div>
            </div>
          </div>
          <div className="border-t border-[#e4e9e1] bg-[#f6f6ef]/75 p-6 sm:p-9 md:border-l md:border-t-0">
            <div className="mb-6">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">Welcome to little ledger</p>
              <h2 className="font-display text-2xl font-bold tracking-[-.04em] text-[#294d40]">Choose how to continue</h2>
            </div>
            <div className="space-y-3">
              <Link href="/sign-in" className="flex h-12 items-center justify-between rounded-xl bg-[#347d68] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2d705d]">
                <span>Log in</span><ArrowRight size={16} />
              </Link>
              <Link href="/sign-up" className="flex h-12 items-center justify-between rounded-xl border border-[#cbdace] bg-white/75 px-4 text-sm font-semibold text-[#355a4d] transition hover:bg-[#edf2e9]">
                <span>Create account</span><ArrowRight size={16} />
              </Link>
              <div className="relative py-2 text-center text-[11px] font-medium text-[#9aa69d]"><span className="bg-[#f6f6ef] px-3">OR TRY IT FIRST</span><span className="absolute left-0 right-0 top-1/2 -z-10 h-px bg-[#e1e8df]" /></div>
              <button type="button" onClick={continueAsGuest} className="flex h-12 w-full items-center justify-center rounded-xl border border-[#dce5dc] bg-white/45 px-4 text-sm font-semibold text-[#537364] transition hover:bg-white/80">Continue as guest</button>
            </div>
            <p className="mt-5 text-center text-[11px] leading-5 text-[#8a9990]">Guest entries stay separate from signed-in account data and remain on this device.</p>
          </div>
        </section>
        <p className="mt-5 text-center text-[11px] text-[#93a097]">Little Ledger · BDT personal finance</p>
      </div>
    </main>
  );
}

function RememberMeControl({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="mb-4 flex cursor-pointer items-center gap-2.5 text-xs font-medium text-[#62796d]">
      <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#347d68]" />
      Remember me on this device
    </label>
  );
}

function AuthRouteFrame({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const isSignIn = mode === 'sign-in';
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem(REMEMBER_PREFERENCE_KEY) !== 'false');

  function updateRemember(value: boolean) {
    setRememberMe(value);
    localStorage.setItem(REMEMBER_PREFERENCE_KEY, String(value));
  }

  const redirectUrl = `${basePath}/dashboard?auth=complete&remember=${rememberMe ? '1' : '0'}`;

  return (
    <main className="money-page flex min-h-[100dvh] flex-col px-4 py-6 sm:px-6">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Brand compact />
        <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#628675] hover:bg-[#edf2e9]"><ArrowLeft size={14} />Back</Link>
      </header>
      <div className="mx-auto my-auto w-full max-w-[460px] py-8">
        <div className="glass-card rounded-[28px] p-5 sm:p-8">
          <div className="mb-5 flex rounded-xl border border-[#dce5dc] bg-[#f3f4ed]/80 p-1">
            <Link href="/sign-in" aria-current={isSignIn ? 'page' : undefined} className={`flex h-9 flex-1 items-center justify-center rounded-lg text-xs font-semibold transition ${isSignIn ? 'bg-white text-[#315548] shadow-sm' : 'text-[#819087] hover:text-[#355a4d]'}`}>Log In</Link>
            <Link href="/sign-up" aria-current={!isSignIn ? 'page' : undefined} className={`flex h-9 flex-1 items-center justify-center rounded-lg text-xs font-semibold transition ${!isSignIn ? 'bg-white text-[#315548] shadow-sm' : 'text-[#819087] hover:text-[#355a4d]'}`}>Create Account</Link>
          </div>
          <RememberMeControl value={rememberMe} onChange={updateRemember} />
          {isSignIn
            ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} forceRedirectUrl={redirectUrl} />
            : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} forceRedirectUrl={redirectUrl} />}
        </div>
        <p className="mt-4 text-center text-[11px] leading-5 text-[#8a9990]">Your password and authenticator codes are handled by secure account sign-in, not stored in the ledger.</p>
      </div>
    </main>
  );
}

export function SignInPage() {
  return <AuthRouteFrame mode="sign-in" />;
}

export function SignUpPage() {
  return <AuthRouteFrame mode="sign-up" />;
}

export function AccountSecurityPage({ onBack }: { onBack: () => void }) {
  const { user } = useUser();
  const twoFactorEnabled = Boolean(user?.twoFactorEnabled);

  return (
    <main className="money-page min-h-[100dvh] px-4 pb-10 pt-5 sm:px-7">
      <div className="mx-auto max-w-[1100px]">
        <header className="mb-7 flex items-center justify-between gap-4">
          <Brand compact />
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#628675] hover:bg-[#edf2e9]"><ArrowLeft size={14} />Back to ledger</button>
        </header>
        <section className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">Your account</p><h1 className="font-display text-3xl font-bold tracking-[-.05em] text-[#24483c]">Security &amp; 2FA settings</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#71857a]">Manage your account’s sign-in methods. Authenticator enrollment and six-digit login challenges are handled by Clerk.</p></div>
          <span data-testid="badge-two-factor-status" className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${twoFactorEnabled ? 'bg-[#e1eee2] text-[#39795e]' : 'bg-[#f3f1e8] text-[#7b816f]'}`}>
            <span className={`h-2 w-2 rounded-full ${twoFactorEnabled ? 'bg-[#5b9a76]' : 'bg-[#b3a46d]'}`} />
            {twoFactorEnabled ? '2FA enabled' : '2FA not enabled'}
          </span>
        </section>
        <section className="glass-card overflow-hidden rounded-[26px] p-4 sm:p-7">
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#e4e9e1] bg-white/45 p-4">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#347d68]" />
            <div><p className="text-sm font-semibold text-[#355a4d]">Authenticator setup</p><p className="mt-1 text-xs leading-5 text-[#819087]">Open the Security section below to enable or disable two-factor authentication. Clerk provides the unique QR code, setup key, verification step, and login challenge.</p></div>
          </div>
          <UserProfile routing="path" path={`${basePath}/account`} />
        </section>
      </div>
    </main>
  );
}