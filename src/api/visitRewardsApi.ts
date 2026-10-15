const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const BASE_PATH = '/api/visit-rewards';

export interface VisitProgress {
  requiredVisits: number;
  windowDays: number;
  codeValidityDays: number;
  approvedVisits: number;
  visitsRemaining: number;
  pendingVisits: number;
  hasActiveRewardCode: boolean;
  /** Present on /status; number of coupons that are currently ACTIVE. */
  activeCoupons?: number;
}

export type RewardState = 'NO_VISITS' | 'IN_PROGRESS' | 'REWARD_UNLOCKED';
export type CouponStatus = 'ACTIVE' | 'REDEEMED' | 'EXPIRED';

export interface Coupon {
  code: string;
  status: CouponStatus;
  createdAt: string;
  expiresAt: string;
  redeemedAt: string | null;
  /** Only a number while the coupon is ACTIVE. */
  expiresInHours: number | null;
}

export interface VisitStatus {
  state: RewardState;
  message: string;
  progress: VisitProgress;
  /** Newest first, at most 10. */
  coupons: Coupon[];
}

export interface MarkedVisit {
  id: number;
  phoneNumber: string;
  name: string;
  dateOfVisit: string;
  isApproved: boolean;
}

export interface MarkVisitResponse {
  success: boolean;
  message: string;
  visit: MarkedVisit;
  progress: VisitProgress;
}

interface StatusResponse extends VisitStatus {
  success: boolean;
}

interface ValidationDetails {
  properties?: Record<string, { errors?: string[] }>;
}

export class VisitRewardsError extends Error {
  readonly status: number;
  readonly fieldErrors: Partial<Record<'phoneNumber' | 'phone' | 'name', string>>;

  constructor(
    status: number,
    message: string,
    fieldErrors: Partial<Record<'phoneNumber' | 'phone' | 'name', string>> = {}
  ) {
    super(message);
    this.name = 'VisitRewardsError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${BASE_PATH}${path}`, init);
  } catch {
    throw new VisitRewardsError(0, 'Could not reach the server. Please check your connection.');
  }

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
    details?: ValidationDetails;
  };

  if (!response.ok) {
    const fieldErrors: VisitRewardsError['fieldErrors'] = {};
    const props = payload.details?.properties ?? {};
    (['phoneNumber', 'phone', 'name'] as const).forEach(key => {
      const first = props[key]?.errors?.[0];
      if (first) fieldErrors[key] = first;
    });

    throw new VisitRewardsError(
      response.status,
      payload.error ?? payload.message ?? `Request failed (${response.status})`,
      fieldErrors
    );
  }

  return payload as T;
};

export const getVisitStatus = async (phone: string): Promise<VisitStatus> => {
  const res = await request<StatusResponse>(`/status?${new URLSearchParams({ phone })}`);
  return {
    state: res.state,
    message: res.message,
    progress: res.progress,
    coupons: res.coupons ?? [],
  };
};

export const markVisit = (phoneNumber: string, name: string) =>
  request<MarkVisitResponse>('/visits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, name }),
  });

/**
 * Normalises any common Indian phone spelling (+91…, 0…, spaces, dashes) to a
 * 10-digit mobile number. Returns null when it is not a valid mobile number.
 */
export const normalizeIndianPhone = (input: string): string | null => {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
};
