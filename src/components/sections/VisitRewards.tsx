import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';

import Navbar from '../layout/Navbar';
import StarsCanvas from '../canvas/Stars';
import {
  Coupon,
  RewardState,
  VisitProgress,
  VisitRewardsError,
  VisitStatus,
  getVisitStatus,
  markVisit,
  normalizeIndianPhone,
} from '../../api/visitRewardsApi';

// ─── Small helpers ────────────────────────────────────────────────────────────
const REQUIRED_FALLBACK = 7;

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  }
};

/** Formats typed/pasted input as a 10-digit Indian mobile: "98765 43210". */
const formatPhoneInput = (raw: string) => {
  let digits = raw.replace(/\D/g, '');
  if (/^\s*\+91/.test(raw)) digits = digits.slice(2);
  else if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  return digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
};

const CountUp = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.4,
      ease: 'easeOut',
      onUpdate: v => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);

  return <>{display}</>;
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const GiftIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 7H7.5a2.5 2.5 0 110-5C11 2 12 7 12 7zm0 0h4.5a2.5 2.5 0 100-5C13 2 12 7 12 7z"
    />
  </svg>
);

const CheckIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const CopyIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path strokeLinecap="round" d="M5 15V6a2 2 0 012-2h9" />
  </svg>
);

const Spinner = () => (
  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
);

// ─── Progress ring ────────────────────────────────────────────────────────────
const ProgressRing = ({ progress }: { progress: VisitProgress }) => {
  const size = 220;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const required = progress.requiredVisits || REQUIRED_FALLBACK;

  const approvedFraction = Math.min(progress.approvedVisits / required, 1);
  const withPendingFraction = Math.min(
    (progress.approvedVisits + progress.pendingVisits) / required,
    1
  );

  return (
    <div className="relative mx-auto h-[190px] w-[190px] sm:h-[220px] sm:w-[220px]">
      <div className="absolute inset-6 rounded-full bg-purple-500/10 blur-2xl" />
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90 overflow-visible">
        <defs>
          <linearGradient id="vr-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#915EFF" />
            <stop offset="100%" stopColor="#00f0ff" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        {/* Pending (awaiting approval) arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(251,191,36,0.45)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - withPendingFraction) }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
        />
        {/* Approved arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#vr-ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - approvedFraction) }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 0 8px rgba(145,94,255,0.7))' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-baseline gap-1">
          <span className="bg-gradient-to-br from-white to-cyan-300 bg-clip-text text-5xl font-black text-transparent sm:text-6xl">
            <CountUp value={progress.approvedVisits} />
          </span>
          <span className="text-xl font-bold text-secondary sm:text-2xl">/ {required}</span>
        </div>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-secondary sm:text-xs">
          visits · last {progress.windowDays} days
        </span>
      </div>
    </div>
  );
};

// ─── Stamp row ────────────────────────────────────────────────────────────────
const Stamps = ({ progress }: { progress: VisitProgress }) => {
  const required = progress.requiredVisits || REQUIRED_FALLBACK;

  return (
    <div
      className="mx-auto mt-6 grid max-w-md gap-1.5 sm:mt-8 sm:gap-3"
      style={{ gridTemplateColumns: `repeat(${required}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: required }, (_, i) => {
        const isApproved = i < progress.approvedVisits;
        const isPending = !isApproved && i < progress.approvedVisits + progress.pendingVisits;
        const isLast = i === required - 1;

        return (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.5 + i * 0.12 }}
            className="relative"
            title={isApproved ? 'Approved visit' : isPending ? 'Awaiting approval' : 'Not yet'}
          >
            <div
              className={`flex aspect-square w-full items-center justify-center rounded-full border text-xs font-bold sm:text-sm ${
                isApproved
                  ? 'border-transparent bg-gradient-to-br from-[#915EFF] to-cyan-400 text-white shadow-[0_0_14px_rgba(145,94,255,0.6)]'
                  : isPending
                  ? 'border-dashed border-amber-400/70 bg-amber-400/10 text-amber-300'
                  : isLast
                  ? 'border-fuchsia-400/40 bg-fuchsia-500/5 text-fuchsia-300/80'
                  : 'border-white/10 bg-white/[0.03] text-white/30'
              }`}
            >
              {isApproved ? (
                <CheckIcon className="h-1/2 w-1/2" />
              ) : isLast ? (
                <GiftIcon className="h-1/2 w-1/2" />
              ) : (
                i + 1
              )}
            </div>
            {isPending && (
              <span className="absolute inset-0 animate-ping rounded-full border border-amber-400/50" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

// ─── Coupons ──────────────────────────────────────────────────────────────────
const SPARKS = Array.from({ length: 14 }, (_, i) => i);

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

const formatTimeLeft = (hours: number | null) => {
  if (hours === null) return '';
  if (hours >= 48) return `${Math.floor(hours / 24)} days left`;
  if (hours >= 24) return '1 day left';
  if (hours >= 1) return `${hours}h left`;
  return 'Expires within the hour';
};

const ActiveCouponCard = ({
  coupon,
  index,
  celebrate,
}: {
  coupon: Coupon;
  index: number;
  celebrate: boolean;
}) => {
  const [copied, setCopied] = useState(false);
  const urgent = coupon.expiresInHours !== null && coupon.expiresInHours < 24;

  const handleCopy = async () => {
    if (await copyToClipboard(coupon.code)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2 + index * 0.15, duration: 0.6, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl border border-amber-300/30 bg-gradient-to-br from-amber-400/15 via-fuchsia-500/10 to-purple-600/15 p-5 sm:p-6"
    >
      {celebrate &&
        index === 0 &&
        SPARKS.map(i => {
          const angle = (i / SPARKS.length) * Math.PI * 2;
          return (
            <motion.span
              key={i}
              className="absolute left-1/2 top-10 h-1.5 w-1.5 rounded-full bg-amber-300"
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{
                x: Math.cos(angle) * 140,
                y: Math.sin(angle) * 90,
                opacity: [0, 1, 0],
              }}
              transition={{ delay: 0.6, duration: 1.2, ease: 'easeOut' }}
            />
          );
        })}

      {/* ticket notches */}
      <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-primary" />
      <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-primary" />

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
          <GiftIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-300">
            Coupon active
          </p>
          <h3 className="text-lg font-bold text-white">Your next visit is FREE</h3>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-dashed border-amber-300/50 bg-black/30 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <span className="select-all break-all text-center font-mono text-2xl font-bold tracking-[0.12em] text-white sm:text-left">
          {coupon.code}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-400/20 px-4 text-sm font-semibold text-amber-200 transition active:scale-95 hover:bg-amber-400/30 sm:h-10"
        >
          {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon />}
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${
            urgent ? 'bg-rose-500/15 text-rose-300' : 'bg-white/10 text-white/80'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${urgent ? 'animate-pulse bg-rose-300' : 'bg-emerald-300'}`} />
          {formatTimeLeft(coupon.expiresInHours)}
        </span>
        <span className="text-white/50">Valid till {formatDateTime(coupon.expiresAt)}</span>
      </div>

      <p className="mt-3 text-xs text-secondary">Show this code to our staff to redeem your free visit.</p>
    </motion.div>
  );
};

const historyChip: Record<'REDEEMED' | 'EXPIRED', string> = {
  REDEEMED: 'bg-emerald-400/15 text-emerald-300',
  EXPIRED: 'bg-white/10 text-white/50',
};

const CouponHistory = ({ coupons }: { coupons: Coupon[] }) => {
  const [open, setOpen] = useState(false);
  if (coupons.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex h-12 w-full items-center justify-between px-4 text-sm font-semibold text-white/80"
      >
        <span>Past coupons ({coupons.length})</span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="h-4 w-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {coupons.map(c => (
              <li
                key={c.code}
                className="flex items-center justify-between gap-3 border-t border-white/5 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-semibold tracking-wider text-white/80">
                    {c.code}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/40">
                    {c.status === 'REDEEMED' && c.redeemedAt
                      ? `Redeemed ${formatDateTime(c.redeemedAt)}`
                      : `Expired ${formatDateTime(c.expiresAt)}`}
                  </p>
                </div>
                {c.status !== 'ACTIVE' && (
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${historyChip[c.status]}`}
                  >
                    {c.status}
                  </span>
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Result panel ─────────────────────────────────────────────────────────────
const stateChip: Record<RewardState, { label: string; className: string; dot: string }> = {
  NO_VISITS: {
    label: 'Not started',
    className: 'border-white/15 bg-white/5 text-white/70',
    dot: 'bg-white/40',
  },
  IN_PROGRESS: {
    label: 'In progress',
    className: 'border-purple-400/40 bg-purple-500/10 text-purple-200',
    dot: 'bg-purple-300',
  },
  REWARD_UNLOCKED: {
    label: 'Reward unlocked',
    className: 'border-amber-300/50 bg-amber-400/10 text-amber-200',
    dot: 'animate-pulse bg-amber-300',
  },
};

const ResultPanel = ({
  status,
  name,
  justMarked,
}: {
  status: VisitStatus;
  name: string;
  justMarked: boolean;
}) => {
  const { progress, state, coupons } = status;
  const required = progress.requiredVisits || REQUIRED_FALLBACK;
  const activeCoupons = coupons.filter(c => c.status === 'ACTIVE');
  const pastCoupons = coupons.filter(c => c.status !== 'ACTIVE');
  const hasActive = activeCoupons.length > 0;
  const chip = stateChip[state];
  const total = progress.approvedVisits + progress.pendingVisits;
  const seventhPending = justMarked && !hasActive && total >= required;

  return (
    <div>
      <div className="mb-5 flex flex-col items-center gap-2">
        {name && (
          <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-secondary">
            Hi <span className="font-semibold text-white">{name}</span> 👋
          </motion.p>
        )}
        <motion.span
          key={state}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${chip.className}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${chip.dot}`} />
          {chip.label}
        </motion.span>
      </div>

      {/* Active coupons first: it's what the user came for. */}
      {hasActive && (
        <div className="mb-8 space-y-4">
          {activeCoupons.map((c, i) => (
            <ActiveCouponCard key={c.code} coupon={c} index={i} celebrate />
          ))}
        </div>
      )}

      {hasActive && (
        <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
          Progress to your next reward
        </p>
      )}

      <ProgressRing progress={progress} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="mt-5 text-center"
      >
        <p
          className={`text-base ${
            state === 'REWARD_UNLOCKED' ? 'font-semibold text-amber-300' : 'text-white'
          }`}
        >
          {status.message}
        </p>

        {progress.pendingVisits > 0 && (
          <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
            {progress.pendingVisits} awaiting staff approval
          </p>
        )}
      </motion.div>

      {seventhPending && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="mt-6 rounded-2xl border border-amber-300/30 bg-gradient-to-br from-amber-400/15 to-purple-600/15 p-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
              <GiftIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-300">
                Almost there
              </p>
              <h3 className="text-base font-bold text-white">That's visit {required}!</h3>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-secondary">
            Once our staff approves today's visit, your free-visit coupon appears here. It stays
            valid for {progress.codeValidityDays} days.
          </p>
        </motion.div>
      )}

      <Stamps progress={progress} />

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-white/50">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-gradient-to-br from-[#915EFF] to-cyan-400" />
          Approved
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full border border-dashed border-amber-400" />
          Awaiting approval
        </span>
      </div>

      <CouponHistory coupons={pastCoupons} />
    </div>
  );
};

// ─── Placeholder (desktop only, before first lookup) ──────────────────────────
const EmptyPanel = () => (
  <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]"
    >
      <span className="absolute inset-0 animate-ping rounded-full border border-purple-400/20" />
      <GiftIcon className="h-12 w-12 text-purple-300" />
    </motion.div>
    <h3 className="text-xl font-bold text-white">Your progress shows up here</h3>
    <p className="mt-2 max-w-xs text-sm text-secondary">
      Enter your number to see how close you are to a free visit.
    </p>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
type Notice = { type: 'success' | 'info' | 'error'; text: string };
type Tab = 'check' | 'mark';

const noticeStyles: Record<Notice['type'], string> = {
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  info: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
  error: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
};

const inputClass =
  'h-14 w-full rounded-xl border bg-white/[0.04] px-4 text-base text-white placeholder-white/30 outline-none transition focus:bg-white/[0.07] focus:ring-2';

const NoticeBanner = ({ notice, className = '' }: { notice: Notice | null; className?: string }) => (
  <AnimatePresence>
    {notice && (
      <motion.div
        key={notice.text}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={`overflow-hidden ${className}`}
        role="status"
      >
        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${noticeStyles[notice.type]}`}>
          {notice.text}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const VisitRewards = () => {
  const [tab, setTab] = useState<Tab>('check');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<VisitStatus | null>(null);
  const [resultKey, setResultKey] = useState(0);
  const [justMarked, setJustMarked] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [shownName, setShownName] = useState('');
  const [lookedUpPhone, setLookedUpPhone] = useState<string | null>(null);
  const [markedFor, setMarkedFor] = useState<string | null>(null);
  // On small screens we show either the form or the result, never both.
  const [view, setView] = useState<'form' | 'result'>('form');

  const required = status?.progress.requiredVisits ?? REQUIRED_FALLBACK;
  const windowDays = status?.progress.windowDays ?? 30;

  // Bring the user to the top of the newly shown view on phones.
  useEffect(() => {
    if (window.innerWidth < 1024) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view, resultKey]);

  const showStatus = (next: VisitStatus, marked: boolean, normalizedPhone: string) => {
    setStatus(next);
    setJustMarked(marked);
    setShownName(name.trim());
    setLookedUpPhone(normalizedPhone);
    setResultKey(k => k + 1);
    setView('result');
  };

  const getPhone = (): string | null => {
    const normalized = normalizeIndianPhone(phone);
    if (!normalized) {
      setErrors(e => ({ ...e, phone: 'Enter a valid 10-digit mobile number' }));
      return null;
    }
    return normalized;
  };

  const handleCheck = async () => {
    setNotice(null);
    setErrors({});
    const normalized = getPhone();
    if (!normalized) return;

    setLoading(true);
    try {
      showStatus(await getVisitStatus(normalized), false, normalized);
    } catch (err) {
      const e = err as VisitRewardsError;
      setErrors({ phone: e.fieldErrors?.phone });
      setNotice({ type: 'error', text: e.message || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleMark = async () => {
    setNotice(null);
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Please enter your name';
    const normalized = normalizeIndianPhone(phone);
    if (!normalized) nextErrors.phone = 'Enter a valid 10-digit mobile number';
    setErrors(nextErrors);

    if (nextErrors.name || !normalized) {
      // Can't mark without both fields — take the user back to the form.
      setTab('mark');
      setView('form');
      return;
    }

    setLoading(true);
    try {
      const res = await markVisit(normalized, name.trim());
      setMarkedFor(normalized);
      // Re-fetch so we also get the overall state and any coupons.
      let next: VisitStatus;
      try {
        next = await getVisitStatus(normalized);
      } catch {
        next = {
          state: 'IN_PROGRESS',
          message: res.message,
          progress: res.progress,
          coupons: [],
        };
      }
      showStatus(next, true, normalized);
      setNotice({ type: 'success', text: res.message });
    } catch (err) {
      const e = err as VisitRewardsError;
      if (e.status === 409) {
        // Already claimed today — still show their current progress.
        setMarkedFor(normalized);
        setNotice({ type: 'info', text: e.message });
        try {
          showStatus(await getVisitStatus(normalized), false, normalized);
        } catch {
          /* progress is a nice-to-have here */
        }
      } else {
        setErrors({ name: e.fieldErrors?.name, phone: e.fieldErrors?.phoneNumber });
        setNotice({ type: 'error', text: e.message || 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    void (tab === 'check' ? handleCheck() : handleMark());
  };

  const backToForm = () => {
    setNotice(null);
    setView('form');
  };

  const steps = useMemo(
    () => [
      {
        title: 'Mark your visit',
        text: 'Enter your name and number each day you play.',
      },
      {
        title: 'Staff approves',
        text: 'A visit counts once our team approves it.',
      },
      {
        title: `${required} visits = free visit`,
        text: `${required} approved visits in ${windowDays} days and your next visit is free.`,
      },
    ],
    [required, windowDays]
  );

  const fieldBorder = (hasError?: string) =>
    hasError
      ? 'border-rose-400/60 focus:ring-rose-400/30'
      : 'border-white/10 focus:border-purple-400/60 focus:ring-purple-400/20';

  const needsMarkButton = lookedUpPhone !== null && markedFor !== lookedUpPhone;

  return (
    <div className="relative z-0 min-h-screen overflow-hidden bg-primary">
      <Navbar />

      {/* ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-24 -z-[1] h-[320px] w-[420px] -translate-x-1/2 rounded-full bg-purple-600/20 blur-[100px] sm:h-[420px] sm:w-[720px] sm:blur-[120px]" />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-10 sm:pb-20 sm:pt-32">
        {/* Hero — compact on phones so the form is visible straight away */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className={`mx-auto max-w-3xl text-center ${
            view === 'result' ? 'hidden lg:block' : ''
          }`}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-200 sm:px-4 sm:py-1.5 sm:text-xs sm:tracking-[0.25em]">
            <GiftIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Vortex Rewards
          </span>
          <h1 className="mt-3 text-[28px] font-black leading-tight text-white sm:mt-5 sm:text-6xl">
            Play {required} times,{' '}
            <span className="block bg-gradient-to-r from-[#915EFF] via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent sm:inline">
              next one's free
            </span>
          </h1>
          <p className="mt-2 text-sm text-secondary sm:mt-4 sm:text-lg">
            {required} visits in {windowDays} days = a free visit.
          </p>
        </motion.div>

        {/* Main grid */}
        <div className="mt-6 grid gap-6 sm:mt-12 sm:gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            noValidate
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-card backdrop-blur-xl sm:p-8 ${
              view === 'result' ? 'hidden lg:block' : ''
            }`}
          >
            {/* Segmented control: one clear action at a time */}
            <div
              role="tablist"
              aria-label="What would you like to do?"
              className="relative grid grid-cols-2 rounded-2xl bg-black/30 p-1"
            >
              {(
                [
                  ['check', 'My progress'],
                  ['mark', "Mark today's visit"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => {
                    setTab(id);
                    setNotice(null);
                    setErrors({});
                  }}
                  className={`relative h-11 rounded-xl text-sm font-semibold transition-colors ${
                    tab === id ? 'text-white' : 'text-white/50'
                  }`}
                >
                  {tab === id && (
                    <motion.span
                      layoutId="vr-tab-pill"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#915EFF] to-cyan-500 shadow-lg shadow-purple-500/30"
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              ))}
            </div>

            <p className="mt-4 text-sm text-secondary">
              {tab === 'check'
                ? 'See how many visits you have and how close you are to a free one.'
                : "Playing today? Check in and we'll add it to your visits."}
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="vr-phone" className="mb-2 block text-sm font-medium text-white/80">
                  Phone number
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 border-r border-white/10 pr-3 text-base font-semibold text-secondary">
                    +91
                  </span>
                  <input
                    id="vr-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    enterKeyHint={tab === 'check' ? 'go' : 'next'}
                    value={phone}
                    onChange={e => {
                      setPhone(formatPhoneInput(e.target.value));
                      setErrors(er => ({ ...er, phone: undefined }));
                    }}
                    placeholder="98765 43210"
                    className={`${inputClass} pl-[4.5rem] tracking-wide ${fieldBorder(errors.phone)}`}
                  />
                </div>
                {errors.phone && <p className="mt-1.5 text-sm text-rose-300">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="vr-name" className="mb-2 block text-sm font-medium text-white/80">
                  Name{' '}
                  {tab === 'check' && <span className="font-normal text-white/40">(optional)</span>}
                </label>
                <input
                  id="vr-name"
                  type="text"
                  autoComplete="name"
                  autoCapitalize="words"
                  enterKeyHint="go"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    setErrors(er => ({ ...er, name: undefined }));
                  }}
                  placeholder="Rahul Sharma"
                  className={`${inputClass} ${fieldBorder(errors.name)}`}
                />
                {errors.name && <p className="mt-1.5 text-sm text-rose-300">{errors.name}</p>}
              </div>
            </div>

            <NoticeBanner notice={notice} />

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#915EFF] to-cyan-500 text-base font-semibold text-white shadow-lg shadow-purple-500/30 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Spinner />}
              {loading ? 'Please wait…' : tab === 'check' ? 'Check my visits' : "Mark today's visit"}
            </motion.button>

            {tab === 'mark' && (
              <p className="mt-3 text-center text-xs text-white/40">
                Today's date is added automatically. Each visit counts after staff approval.
              </p>
            )}
          </motion.form>

          {/* Results */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            aria-live="polite"
            className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 shadow-card backdrop-blur-xl sm:p-8 ${
              view === 'form' ? 'hidden lg:block' : ''
            }`}
          >
            {/* Phone-only top bar: always an obvious way back */}
            {view === 'result' && lookedUpPhone && (
              <div className="-mx-1 mb-4 flex items-center justify-between lg:hidden">
                <button
                  type="button"
                  onClick={backToForm}
                  className="flex h-10 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] pl-3 pr-4 text-sm font-medium text-white/80 active:scale-95"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Change
                </button>
                <span className="text-sm font-medium tracking-wide text-secondary">
                  +91 {lookedUpPhone.slice(0, 5)} {lookedUpPhone.slice(5)}
                </span>
              </div>
            )}

            <NoticeBanner notice={notice} className="-mt-1 mb-2 lg:hidden" />

            <AnimatePresence mode="wait">
              {status ? (
                <motion.div
                  key={resultKey}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <ResultPanel status={status} name={shownName} justMarked={justMarked} />
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <EmptyPanel />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Phone-only primary action, right where the thumb is */}
            {view === 'result' && needsMarkButton && (
              <motion.button
                type="button"
                onClick={handleMark}
                disabled={loading}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                whileTap={{ scale: 0.98 }}
                className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#915EFF] to-cyan-500 text-base font-semibold text-white shadow-lg shadow-purple-500/30 disabled:opacity-60 lg:hidden"
              >
                {loading && <Spinner />}
                Mark today's visit
              </motion.button>
            )}
          </motion.section>
        </div>

        {/* How it works — compact list on phones */}
        <div
          className={`mt-10 grid gap-3 sm:mt-16 sm:gap-5 md:grid-cols-3 ${
            view === 'result' ? 'hidden lg:grid' : ''
          }`}
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur sm:block sm:p-6"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#915EFF] to-cyan-400 text-sm font-black text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="text-base font-bold text-white sm:mt-4 sm:text-lg">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-secondary">{step.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <StarsCanvas />
    </div>
  );
};

export default VisitRewards;
