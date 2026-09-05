const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

interface ApiErrorPayload {
  message?: string;
  error?: string;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const payload = (await response.json().catch(() => ({}))) as T & ApiErrorPayload;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload.message ?? payload.error ?? `Request failed (${response.status})`
    );
  }

  return payload;
};

const jsonRequest = (body: object, token?: string): RequestInit => ({
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify(body),
});

export interface BookingSelection {
  setupConfigurationId: number;
  date: string;
  startTime: string;
  noOfHours: number;
}

export interface ReviewBookingRequest extends BookingSelection {
  playersCount: number;
  gameIds: number[];
  appliedOfferIds?: number[];
}

export interface TentativeBookingRequest {
  setupConfigurationId: number;
  phoneNumber: string;
  count: number;
  date: string;
  startTime: string;
  noOfHours: number;
}

export interface BookingApiResponse<T> {
  success?: boolean;
  message?: string;
  booking?: T;
  receipt?: T;
  summary?: T;
}

export const login = async (): Promise<string> => {
  const email = import.meta.env.VITE_BOOKING_API_EMAIL;
  const password = import.meta.env.VITE_BOOKING_API_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Booking API credentials are missing. Set VITE_BOOKING_API_EMAIL and VITE_BOOKING_API_PASSWORD.'
    );
  }

  const response = await apiRequest<{ token?: string; message?: string }>(
    '/api/login',
    jsonRequest({ email, password })
  );

  if (!response.token) {
    throw new Error(response.message ?? 'Login did not return an access token.');
  }

  return response.token;
};

export const getAvailability = (date: string, setupConfigurationId: number) =>
  apiRequest<unknown>(
    `/api/slots/available?${new URLSearchParams({
      date,
      setupConfigurationId: String(setupConfigurationId),
    })}`
  );

export const lockSlot = (selection: BookingSelection, lockToken: string, token: string) =>
  apiRequest<BookingApiResponse<never>>(
    '/api/slots/lock',
    jsonRequest({ ...selection, lockToken }, token)
  );

export const reviewBooking = <T>(request: ReviewBookingRequest) =>
  apiRequest<BookingApiResponse<T>>('/api/bookings/review', jsonRequest(request));

export const createTentativeBooking = <T>(request: TentativeBookingRequest, token: string) =>
  apiRequest<BookingApiResponse<T>>('/api/bookings/tentative', jsonRequest(request, token));

export const confirmTentativeBooking = <T>(
  bookingId: number,
  setupInstanceId: number,
  amount: number,
  token: string
) =>
  apiRequest<BookingApiResponse<T>>(
    `/api/bookings/tentative/${bookingId}/confirm`,
    jsonRequest({ setupInstanceId, cashAmount: amount, upiAmount: 0 }, token)
  );

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};
