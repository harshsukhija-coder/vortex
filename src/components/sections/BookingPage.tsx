import { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ApiError,
  apiRequest,
  createTentativeBooking,
  getApiErrorMessage,
  getAvailability,
  lockSlot,
  login,
  reviewBooking,
} from '../../api/bookingApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Setup {
  id: number;
  setupConfigurationId?: number;
  name: string;
  tagline?: string;
  description: string;
  pricePerHour?: number;
  singlePlayerPrice?: number;
  multiplayerPrice?: number;
  chargePerPersonPerHour?: number;
  consoleType?: string;
  consoleCount?: number;
  otherNecessaries?: {
    audio?: string;
    seating?: string;
    headphones?: string;
    screenSize?: string;
    screenBrand?: string;
    controllersPerConsole?: number;
  };
  isActive: boolean;
  games: Game[];
  image?: string;
  img?: string;
  images?: string[];
  instances?: SetupInstance[];
}

interface Game {
  id: number;
  name: string;
  price: number;
  images: string[];
  gameplays: string[];
  isActive: boolean;
}

interface SetupInstance {
  id: number;
  name?: string;
  isActive?: boolean;
  image?: string;
  images?: string[];
}

type SetupConfiguration = Omit<Setup, 'id' | 'setupConfigurationId' | 'instances'> & {
  setupConfigurationId: number;
};

interface EvaluationOffer {
  id: number;
  name: string;
  eligible: boolean;
  discount: number;
  reason: string;
}

interface AppliedPromo {
  id: number;
  name: string;
  discount: number;
}

interface AvailablePromo {
  id: number;
  name: string;
  reason: string;
}

interface BookingSummary {
  date: string;
  startTime: string; // e.g. "10:00 AM"
  endTime: string; // e.g. "12:00 PM"
  noOfHours: number;
  playersCount: number;
  zoneName: string;
  gamesList: string[];
  durationHours?: number; // alias for noOfHours, may be absent
  priceCalculationText: string;
  originalAmount: number;
  discountApplied: number;
  totalAmount: number;
  appliedPromotions: AppliedPromo[];
  availablePromotions: AvailablePromo[];
}

interface OfferDetail {
  id: number;
  offerId: number;
  condObj: string;
  cond: string;
  condValue: string;
  offerObj: string;
  offerValue: string;
}

interface Offer {
  id: number;
  name: string;
  isActive: boolean;
  fromTime: string | null;
  toTime: string | null;
  offerType: 'EXCLUSIVE' | 'INCLUSIVE';
  details: OfferDetail[];
}

interface TentativeBooking {
  id: number;
  amountCharged?: number;
}

interface AvailabilitySlot {
  startTime: string;
  available: boolean;
}

interface ActiveLock {
  token: string;
  selectionKey: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeSetups = (setups: Setup[]): Setup[] =>
  setups.flatMap(setup => {
    if (!setup.instances?.length) {
      return [
        {
          ...setup,
          setupConfigurationId: setup.setupConfigurationId ?? setup.id,
        },
      ];
    }

    return setup.instances
      .filter(instance => instance.isActive !== false)
      .map(instance => ({
        ...setup,
        ...instance,
        id: instance.id,
        setupConfigurationId: setup.id,
        name: instance.name
          ? `${setup.name} · ${instance.name}`
          : `${setup.name} · Station ${instance.id}`,
        image: instance.image ?? setup.image,
        images: instance.images ?? setup.images,
        instances: undefined,
      }));
  });

const normalizeSetupConfigurations = (configurations: SetupConfiguration[]): Setup[] =>
  configurations
    .filter(configuration => configuration.isActive)
    .map(configuration => ({
      ...configuration,
      id: configuration.setupConfigurationId,
      setupConfigurationId: configuration.setupConfigurationId,
    }));

const getSetupRate = (setup: Setup, playersCount: number): number =>
  playersCount > 1
    ? setup.multiplayerPrice ?? setup.chargePerPersonPerHour ?? setup.pricePerHour ?? 0
    : setup.singlePlayerPrice ?? setup.chargePerPersonPerHour ?? setup.pricePerHour ?? 0;

const normalizeAvailability = (payload: unknown): AvailabilitySlot[] => {
  if (!isRecord(payload)) return [];

  const data = isRecord(payload.data) ? payload.data : payload;
  const candidate = data.availableSlots ?? data.slots;
  const tentativeIntervals = data.tentativeIntervals;

  const slots = Array.isArray(candidate)
    ? candidate.flatMap((slot): AvailabilitySlot[] => {
        if (typeof slot === 'string') {
          return [{ startTime: slot, available: true }];
        }
        if (!isRecord(slot)) return [];

        const startTime = slot.startTime ?? slot.time;
        if (typeof startTime !== 'string') return [];

        const status = typeof slot.status === 'string' ? slot.status.toUpperCase() : '';
        const available =
          typeof slot.available === 'boolean'
            ? slot.available
            : typeof slot.isAvailable === 'boolean'
              ? slot.isAvailable
              : status
                ? status === 'AVAILABLE'
                : true;

        return [{ startTime, available }];
      })
    : [];

  const tentativeStarts = new Set(
    Array.isArray(tentativeIntervals)
      ? tentativeIntervals.flatMap(interval =>
          isRecord(interval) && typeof interval.startTime === 'string' ? [interval.startTime] : []
        )
      : []
  );

  return [
    ...slots.map(slot =>
      tentativeStarts.has(slot.startTime) ? { ...slot, available: false } : slot
    ),
    ...[...tentativeStarts]
      .filter(startTime => !slots.some(slot => slot.startTime === startTime))
      .map(startTime => ({ startTime, available: false })),
  ];
};

const getZoneVisuals = (setup: Setup) => {
  const isPremium =
    setup.name.toLowerCase().includes('big') || setup.name.toLowerCase().includes('premium');
  if (isPremium) {
    return {
      icon: '🏟️',
      badge: 'Premium',
      badgeColor: '#FFD700',
      img: '/cafe_big_screen.png',
    };
  }
  return {
    icon: '🎮',
    badge: 'Standard',
    badgeColor: '#00f0ff',
    img: '/cafe_wall_left.png',
  };
};

const getSetupImage = (setup: Setup) => {
  if (setup.image) return setup.image;
  if (setup.img) return setup.img;
  if (setup.images && setup.images.length > 0) return setup.images[0];
  return getZoneVisuals(setup).img;
};

const getGameImage = (name: string, serverImages?: string[]) => {
  if (serverImages && serverImages.length > 0) {
    return serverImages[0];
  }
  const norm = (name || '').toLowerCase();
  if (norm.includes('fc') || norm.includes('fifa')) {
    return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop';
  }
  if (norm.includes('spider')) {
    return 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop';
  }
  if (norm.includes('god of war') || norm.includes('gow')) {
    return 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=600&auto=format&fit=crop';
  }
  if (norm.includes('tekken')) {
    return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop';
  }
  if (norm.includes('gt7') || norm.includes('gran turismo') || norm.includes('racing')) {
    return 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop';
  }
  if (norm.includes('kombat') || norm.includes('mk')) {
    return 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?q=80&w=600&auto=format&fit=crop';
  }
  if (norm.includes('gta') || norm.includes('grand theft auto')) {
    return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop';
  }
  return 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600&auto=format&fit=crop';
};

const getGameMeta = (name: string) => {
  const norm = (name || '').toLowerCase();
  if (norm.includes('fc')) return { emoji: '', genre: 'Sports' };
  if (norm.includes('wwe')) return { emoji: '', genre: 'Fighting' };
  if (norm.includes('cricket')) return { emoji: '', genre: 'Sports' };
  if (norm.includes('tekken')) return { emoji: '', genre: 'Fighting' };
  if (norm.includes('gta')) return { emoji: '', genre: 'Action' };
  if (norm.includes('uncharted')) return { emoji: '', genre: 'Adventure' };
  if (norm.includes('kombat') || norm.includes('mk')) return { emoji: '', genre: 'Fighting' };
  return { emoji: '', genre: 'Action' };
};

const STEPS = [
  'Console Zone',
  'Date & Time',
  'Party Size',
  'Select Game',
  'Offers Available',
  'Confirm',
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const getDates = () => {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const fmtFull = (d: Date) =>
  d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatLocalDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getEndTime = (startTime: string, noOfHours: number): string => {
  const match = startTime.match(/^(\d{1,2}):(\d{2})\s+(AM|PM)$/i);
  if (!match) return startTime;

  let hours = Number(match[1]) % 12;
  const minutes = Number(match[2]);
  if (match[3].toUpperCase() === 'PM') hours += 12;

  const end = new Date(2000, 0, 1, hours + noOfHours, minutes);
  return end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// ─── Progress bar ──────────────────────────────────────────────────────────────
const ProgressBar = ({ step }: { step: number }) => (
  <div
    className="progress-bar-container"
    style={{ width: '100%', maxWidth: 700, margin: '0 auto 40px' }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
      }}
    >
      {/* connector line */}
      <div
        style={{
          position: 'absolute',
          top: 18,
          left: '5%',
          right: '5%',
          height: 2,
          background: 'rgba(255,255,255,0.08)',
          zIndex: 0,
        }}
      />
      <motion.div
        style={{
          position: 'absolute',
          top: 18,
          left: '5%',
          height: 2,
          background: 'linear-gradient(90deg,#915EFF,#00f0ff)',
          zIndex: 0,
          transformOrigin: 'left',
        }}
        animate={{ width: `${(step / (STEPS.length - 1)) * 90}%` }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
      {STEPS.map((label, i) => (
        <div
          key={label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 1,
            flex: 1,
          }}
        >
          <motion.div
            animate={{
              scale: i === step ? 1.2 : 1,
            }}
            transition={{ duration: 0.4 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 800,
              color: '#fff',
              background:
                i <= step ? 'linear-gradient(135deg,#915EFF,#00f0ff)' : 'rgba(255,255,255,0.06)',
              boxShadow: i <= step ? '0 0 16px rgba(0,240,255,0.6)' : 'none',
              border: i <= step ? 'none' : '1px solid rgba(255,255,255,0.15)',
              transition: 'background 0.4s ease, box-shadow 0.4s ease, border 0.4s ease',
            }}
          >
            {i < step ? '✓' : i + 1}
          </motion.div>
          <span
            className="step-label"
            style={{
              fontSize: '0.6rem',
              marginTop: 6,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: i === step ? '#00f0ff' : 'rgba(255,255,255,0.35)',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// ─── Step wrapper animation ────────────────────────────────────────────────────
const StepWrap = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 28, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.97 }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

// ─── Section title ─────────────────────────────────────────────────────────────
const StepTitle = ({ icon, title, sub }: { icon: string; title: string; sub: string }) => (
  <div className="step-title-wrap" style={{ marginBottom: 28, textAlign: 'center' }}>
    <div
      className="step-title-tag"
      style={{
        display: 'inline-block',
        fontSize: '0.72rem',
        fontWeight: 800,
        color: '#00f0ff',
        background: 'rgba(0,240,255,0.06)',
        border: '1px solid rgba(0,240,255,0.25)',
        padding: '6px 16px',
        borderRadius: 100,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        marginBottom: 12,
        boxShadow: '0 0 15px rgba(0,240,255,0.1)',
      }}
    >
      {icon}
    </div>
    <h2
      style={{
        fontSize: 'clamp(1.5rem,3vw,2rem)',
        fontWeight: 900,
        color: '#fff',
        marginBottom: 6,
      }}
    >
      {title}
    </h2>
    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>{sub}</p>
  </div>
);

// ─── Neon card shell ───────────────────────────────────────────────────────────
const Card = ({
  children,
  selected,
  accent = '#00f0ff',
  onClick,
  style = {},
}: {
  children: React.ReactNode;
  selected?: boolean;
  accent?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}) => {
  const [hov, setHov] = useState(false);
  const active = selected || hov;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 16,
        border: `1.5px solid ${active ? accent : 'rgba(255,255,255,0.1)'}`,
        background: selected
          ? `rgba(${
              accent === '#00f0ff' ? '0,240,255' : accent === '#FFD700' ? '255,215,0' : '145,94,255'
            },0.08)`
          : 'rgba(255,255,255,0.03)',
        boxShadow: active
          ? `0 0 24px rgba(${
              accent === '#00f0ff' ? '0,240,255' : '145,94,255'
            },0.2), inset 0 0 20px rgba(${accent === '#00f0ff' ? '0,240,255' : '145,94,255'},0.04)`
          : 'none',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.28s ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ─── STEP 1: Console Zone ──────────────────────────────────────────────────────
const Step1 = ({
  setups,
  zone,
  setZone,
  loadingSetups,
}: {
  setups: Setup[];
  zone: string;
  setZone: (z: string) => void;
  loadingSetups: boolean;
}) => {
  return (
    <StepWrap>
      <StepTitle
        icon="Step 01 / 06"
        title="Choose Your Zone"
        sub="Pick a console station — each zone has its own vibe and rate"
      />
      {loadingSetups ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
          <div className="spinner" style={{ marginBottom: '12px' }}>
            Loading Zones...
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {setups.map(s => {
            const vis = getZoneVisuals(s);
            const isSel = zone === String(s.id);
            const imgPath = getSetupImage(s);
            return (
              <motion.div
                key={s.id}
                onClick={() => setZone(String(s.id))}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="responsive-setup-card"
                style={{
                  cursor: 'pointer',
                  display: 'grid',
                  gridTemplateColumns: '112px minmax(0, 1fr) 170px',
                  alignItems: 'center',
                  gap: 18,
                  padding: 18,
                  borderRadius: 18,
                  position: 'relative',
                  border: `2px solid ${isSel ? vis.badgeColor : 'rgba(255,255,255,0.1)'}`,
                  background: isSel
                    ? `rgba(${vis.badgeColor === '#00f0ff' ? '0,240,255' : '255,215,0'},0.07)`
                    : 'rgba(255,255,255,0.03)',
                  boxShadow: isSel
                    ? `0 0 28px rgba(${
                        vis.badgeColor === '#00f0ff' ? '0,240,255' : '255,215,0'
                      },0.25)`
                    : 'none',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.28s ease',
                }}
              >
                {/* Preview thumb */}
                <div
                  className="responsive-setup-thumb"
                  style={{
                    width: 112,
                    height: 96,
                    borderRadius: 12,
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: `1px solid rgba(255,255,255,0.12)`,
                  }}
                >
                  <img
                    src={imgPath}
                    alt={s.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                      {s.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        color: vis.badgeColor,
                        border: `1px solid ${vis.badgeColor}`,
                        borderRadius: 6,
                        padding: '2px 8px',
                        textShadow: `0 0 6px ${vis.badgeColor}`,
                      }}
                    >
                      {vis.badge}
                    </span>
                  </div>
                  {s.tagline && (
                    <div
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: vis.badgeColor,
                        marginBottom: 6,
                      }}
                    >
                      {s.tagline}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'rgba(255,255,255,0.45)',
                      lineHeight: 1.35,
                    }}
                  >
                    {s.description}
                  </div>

                  {/* Spec Badge Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {s.consoleType && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.6)',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 6,
                          padding: '2px 8px',
                        }}
                      >
                        Console: {s.consoleCount ?? 1}x {s.consoleType}
                      </span>
                    )}
                    {s.otherNecessaries?.screenSize && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.6)',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 6,
                          padding: '2px 8px',
                        }}
                      >
                        Display: {s.otherNecessaries.screenSize}{' '}
                        {s.otherNecessaries.screenBrand ?? ''}
                      </span>
                    )}
                    {s.otherNecessaries?.audio && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.6)',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 6,
                          padding: '2px 8px',
                        }}
                      >
                        Audio: {s.otherNecessaries.audio}
                      </span>
                    )}
                    {s.otherNecessaries?.headphones && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.6)',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 6,
                          padding: '2px 8px',
                        }}
                      >
                        Audio Gear: {s.otherNecessaries.headphones}
                      </span>
                    )}
                    {s.otherNecessaries?.seating && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.6)',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 6,
                          padding: '2px 8px',
                        }}
                      >
                        Seating: {s.otherNecessaries.seating}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div
                  className="responsive-setup-price"
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                      color: 'rgba(255,255,255,0.45)',
                      fontSize: '0.68rem',
                    }}
                  >
                    <span>1 player</span>
                    <strong style={{ color: vis.badgeColor, fontSize: '1rem' }}>
                      ₹{getSetupRate(s, 1)}
                      <small style={{ fontSize: '0.55rem', fontWeight: 600 }}>/hr</small>
                    </strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px solid rgba(255,255,255,0.07)',
                      fontSize: '0.68rem',
                      color: 'rgba(255,255,255,0.35)',
                    }}
                  >
                    <span>2+ players</span>
                    <strong style={{ color: vis.badgeColor, fontSize: '1rem' }}>
                      ₹{getSetupRate(s, 2)}
                      <small style={{ fontSize: '0.55rem', fontWeight: 600 }}>/hr</small>
                    </strong>
                  </div>
                  <div
                    style={{
                      marginTop: 7,
                      fontSize: '0.55rem',
                      color: 'rgba(255,255,255,0.3)',
                      textAlign: 'right',
                    }}
                  >
                    price per player
                  </div>
                </div>

                {/* Selected check */}
                {isSel && (
                  <div
                    className="responsive-setup-check"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'linear-gradient(135deg,#915EFF,#00f0ff)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      color: '#fff',
                      fontWeight: 800,
                    }}
                  >
                    ✓
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </StepWrap>
  );
};

// ─── STEP 2: Date & Time ───────────────────────────────────────────────────────
const Step2 = ({
  selectedDate,
  setSelectedDate,
  startTime,
  setStartTime,
  noOfHours,
  setNoOfHours,
  availability,
  loadingAvailability,
  availabilityError,
  onRetryAvailability,
}: {
  selectedDate: Date | null;
  setSelectedDate: (d: Date) => void;
  startTime: string;
  setStartTime: (t: string) => void;
  noOfHours: number;
  setNoOfHours: (h: number) => void;
  availability: AvailabilitySlot[];
  loadingAvailability: boolean;
  availabilityError: string | null;
  onRetryAvailability: () => void;
}) => {
  const dates = getDates();
  const START_TIMES = [
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
    '5:00 PM',
    '6:00 PM',
    '7:00 PM',
    '8:00 PM',
    '9:00 PM',
    '10:00 PM',
  ];
  const DURATIONS = [1, 2, 3, 4];

  return (
    <StepWrap>
      <StepTitle
        icon="Step 02 / 06"
        title="Pick Date & Time"
        sub="Select your booking date, start time, and duration"
      />

      {/* Date scroller */}
      <div
        className="no-scrollbar"
        style={{ overflowX: 'auto', paddingBottom: 12, marginBottom: 24 }}
      >
        <div style={{ display: 'flex', gap: 10, minWidth: 'max-content' }}>
          {dates.map((d, i) => {
            const isSel = selectedDate?.toDateString() === d.toDateString();
            const isToday = i === 0;
            return (
              <motion.div
                key={i}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(d)}
                style={{
                  cursor: 'pointer',
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: `1.5px solid ${isSel ? '#915EFF' : 'rgba(255,255,255,0.1)'}`,
                  background: isSel ? 'rgba(145,94,255,0.18)' : 'rgba(255,255,255,0.03)',
                  boxShadow: isSel ? '0 0 20px rgba(145,94,255,0.4)' : 'none',
                  textAlign: 'center',
                  minWidth: 72,
                  transition: 'all 0.25s ease',
                }}
              >
                <div
                  style={{
                    fontSize: '0.6rem',
                    letterSpacing: '0.1em',
                    color: isSel ? '#00f0ff' : 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  {isToday
                    ? 'TODAY'
                    : d.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: isSel ? '#fff' : 'rgba(255,255,255,0.75)',
                    lineHeight: 1,
                  }}
                >
                  {d.getDate()}
                </div>
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  {d.toLocaleDateString('en-IN', { month: 'short' })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <>
          {/* Start Time Section */}
          <div style={{ marginBottom: 24 }}>
            <h3
              style={{
                fontSize: '0.85rem',
                color: '#00f0ff',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 12,
              }}
            >
              Select Start Time
            </h3>
            {loadingAvailability && (
              <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                Checking live availability...
              </div>
            )}
            {availabilityError && (
              <div style={{ color: '#ff6b6b', marginBottom: 12 }}>
                {availabilityError}{' '}
                <button
                  type="button"
                  onClick={onRetryAvailability}
                  style={{ color: '#00f0ff', background: 'none', border: 0, cursor: 'pointer' }}
                >
                  Retry
                </button>
              </div>
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(95px,1fr))',
                gap: 8,
              }}
            >
              {START_TIMES.map(t => {
                const isSel = startTime === t;
                const slot = availability.find(availableSlot => availableSlot.startTime === t);
                const isUnavailable =
                  loadingAvailability ||
                  Boolean(availabilityError) ||
                  (availability.length > 0 && !slot?.available);
                return (
                  <motion.div
                    key={t}
                    whileHover={!isUnavailable ? { y: -2 } : {}}
                    whileTap={!isUnavailable ? { scale: 0.96 } : {}}
                    onClick={() => !isUnavailable && setStartTime(t)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 12,
                      textAlign: 'center',
                      cursor: isUnavailable ? 'not-allowed' : 'pointer',
                      border: `1.5px solid ${isSel ? '#00f0ff' : 'rgba(255,255,255,0.12)'}`,
                      background: isSel ? 'rgba(0,240,255,0.14)' : 'rgba(255,255,255,0.04)',
                      boxShadow: isSel ? '0 0 16px rgba(0,240,255,0.35)' : 'none',
                      opacity: isUnavailable ? 0.35 : 1,
                      transition: 'all 0.22s ease',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: isSel ? '#00f0ff' : 'rgba(255,255,255,0.8)',
                      }}
                    >
                      {t}
                    </div>
                    <div
                      style={{ fontSize: '0.58rem', marginTop: 3, color: 'rgba(255,255,255,0.45)' }}
                    >
                      {isUnavailable && !loadingAvailability ? 'Unavailable' : 'Available'}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Duration Section */}
          <div style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontSize: '0.85rem',
                color: '#915EFF',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 12,
              }}
            >
              Select Duration
            </h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DURATIONS.map(h => {
                const isSel = noOfHours === h;
                return (
                  <motion.div
                    key={h}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setNoOfHours(h)}
                    style={{
                      flex: '1 1 80px',
                      padding: '12px 8px',
                      borderRadius: 12,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: `1.5px solid ${isSel ? '#915EFF' : 'rgba(255,255,255,0.12)'}`,
                      background: isSel ? 'rgba(145,94,255,0.18)' : 'rgba(255,255,255,0.04)',
                      boxShadow: isSel ? '0 0 16px rgba(145,94,255,0.35)' : 'none',
                      transition: 'all 0.22s ease',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: isSel ? '#fff' : 'rgba(255,255,255,0.8)',
                      }}
                    >
                      {h} {h === 1 ? 'Hour' : 'Hours'}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}
      {!selectedDate && (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 0',
            color: 'rgba(255,255,255,0.3)',
            fontSize: '0.9rem',
          }}
        >
          Select a date to configure your session
        </div>
      )}
    </StepWrap>
  );
};

// ─── STEP 3: Party Size ────────────────────────────────────────────────────────
const Step3 = ({
  people,
  setPeople,
  rate,
}: {
  people: number;
  setPeople: (n: number) => void;
  rate: number;
}) => (
  <StepWrap>
    <StepTitle icon="Step 03 / 06" title="How Many Players?" sub="Max 4 players per booking" />

    <div
      className="responsive-players-row"
      style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 40 }}
    >
      {[1, 2, 3, 4].map(n => (
        <motion.div
          key={n}
          onClick={() => setPeople(n)}
          whileHover={{ y: -4, scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="responsive-player-card"
          style={{
            cursor: 'pointer',
            width: 100,
            padding: '24px 0',
            borderRadius: 20,
            textAlign: 'center',
            border: `2px solid ${people === n ? '#915EFF' : 'rgba(255,255,255,0.1)'}`,
            background: people === n ? 'rgba(145,94,255,0.18)' : 'rgba(255,255,255,0.03)',
            boxShadow: people === n ? '0 0 28px rgba(145,94,255,0.45)' : 'none',
            transition: 'all 0.28s ease',
          }}
        >
          <div
            className="responsive-player-card-val"
            style={{
              fontSize: '2.2rem',
              fontWeight: 900,
              color: people === n ? '#00f0ff' : 'rgba(255,255,255,0.35)',
              marginBottom: 2,
              textShadow: people === n ? '0 0 16px rgba(0,240,255,0.4)' : 'none',
              userSelect: 'none',
            }}
          >
            {n}P
          </div>
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: people === n ? '#00f0ff' : 'rgba(255,255,255,0.4)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {n === 1 ? 'Solo' : n === 2 ? 'Duo' : n === 3 ? 'Trio' : 'Squad'}
          </div>
        </motion.div>
      ))}
    </div>

    {/* Per-person breakdown hint */}
    <Card style={{ padding: '18px 24px', maxWidth: 400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem' }}>Hourly Rate</span>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>₹{rate} / player</span>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '12px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem' }}>
          Players selected
        </span>
        <span style={{ color: '#00f0ff', fontWeight: 800, fontSize: '1.1rem' }}>
          {people} {people === 1 ? 'person' : 'people'}
        </span>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '12px 0' }} />
      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
        Pricing is per-person per hour — GST billed at confirmation step
      </div>
    </Card>
  </StepWrap>
);

// ─── STEP 4: Game Selection ────────────────────────────────────────────────────
const Step4 = ({
  selectedGameIds,
  onToggleGame,
  games,
  loadingGames,
  searchQuery,
  setSearchQuery,
}: {
  selectedGameIds: number[];
  onToggleGame: (gameId: number) => void;
  games: Game[];
  loadingGames: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) => (
  <StepWrap>
    <StepTitle
      icon="Step 04 / 06"
      title="Pick Your Games"
      sub="Select one or more pre-installed games for your session"
    />

    {/* Search Input */}
    <div style={{ maxWidth: 400, margin: '0 auto 24px', position: 'relative' }}>
      <input
        type="text"
        placeholder="Search active games... (e.g. fc, kombat)"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 12,
          border: '1.5px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.05)',
          color: '#fff',
          fontSize: '0.9rem',
          outline: 'none',
          transition: 'border-color 0.2s ease',
        }}
        onFocus={e => (e.target.style.borderColor = '#915EFF')}
        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
      />
    </div>

    {loadingGames ? (
      <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
        Finding catalog games...
      </div>
    ) : games.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
        No games found matching "{searchQuery}"
      </div>
    ) : (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(128px,1fr))',
          gap: 12,
        }}
      >
        {games.map(g => {
          const meta = getGameMeta(g.name);
          const isSel = selectedGameIds.includes(g.id);
          const gameImg = getGameImage(g.name, g.images);
          return (
            <motion.div
              key={g.id}
              onClick={() => onToggleGame(g.id)}
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              style={{
                cursor: 'pointer',
                padding: '12px',
                borderRadius: 16,
                border: `1.5px solid ${isSel ? '#915EFF' : 'rgba(255,255,255,0.1)'}`,
                background: isSel ? 'rgba(145,94,255,0.18)' : 'rgba(255,255,255,0.04)',
                boxShadow: isSel ? '0 0 20px rgba(145,94,255,0.4)' : 'none',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {/* Game image cover */}
              <div
                style={{
                  width: '100%',
                  height: 100,
                  borderRadius: 10,
                  overflow: 'hidden',
                  marginBottom: 10,
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <img
                  src={gameImg}
                  alt={g.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: isSel ? '#fff' : 'rgba(255,255,255,0.85)',
                  lineHeight: 1.25,
                  marginBottom: 6,
                  minHeight: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {g.name}
              </div>
              <div
                style={{
                  display: 'inline-block',
                  fontSize: '0.58rem',
                  letterSpacing: '0.12em',
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontWeight: 600,
                  color: isSel ? '#00f0ff' : 'rgba(255,255,255,0.35)',
                  border: `1px solid ${isSel ? 'rgba(0,240,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {meta.genre}
              </div>
            </motion.div>
          );
        })}
      </div>
    )}
  </StepWrap>
);

// ─── STEP 5: Offers Available ──────────────────────────────────────────────────
const OffersAvailableStep = ({
  offers,
  loading,
  error,
  onRetry,
  selectedIds,
  onToggleOffer,
  getOfferType,
}: {
  offers: EvaluationOffer[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  selectedIds: number[];
  onToggleOffer: (off: EvaluationOffer) => void;
  getOfferType: (id: number) => 'EXCLUSIVE' | 'INCLUSIVE';
}) => (
  <StepWrap>
    <StepTitle
      icon="Step 05 / 06"
      title="Offers Available"
      sub="Select promotions to apply to your booking"
    />
    {loading ? (
      <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
        Evaluating active lounge deals...
      </div>
    ) : error ? (
      <div style={{ textAlign: 'center', padding: '30px' }}>
        <div style={{ color: '#ff6b6b', marginBottom: 12 }}>{error}</div>
        <button
          onClick={onRetry}
          style={{
            background: '#915EFF',
            border: 'none',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          🔄 Retry Evaluation
        </button>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {offers.map(off => {
          const isElig = off.eligible;
          const isSel = selectedIds.includes(off.id);
          const type = getOfferType(off.id);

          return (
            <motion.div
              key={off.id}
              onClick={() => isElig && onToggleOffer(off)}
              whileHover={isElig ? { y: -2, scale: 1.01 } : {}}
              whileTap={isElig ? { scale: 0.99 } : {}}
              style={{
                padding: '18px 20px',
                borderRadius: 18,
                cursor: isElig ? 'pointer' : 'not-allowed',
                border: `1.5px solid ${
                  isSel ? '#00f0ff' : isElig ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'
                }`,
                background: isSel
                  ? 'rgba(0,240,255,0.08)'
                  : isElig
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(255,255,255,0.01)',
                boxShadow: isSel ? '0 0 24px rgba(0,240,255,0.2)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                transition: 'all 0.25s ease',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: isElig ? '#fff' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {off.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.58rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      color: type === 'EXCLUSIVE' ? '#ff007f' : '#00f0ff',
                      border: `1px solid ${
                        type === 'EXCLUSIVE' ? 'rgba(255,0,127,0.3)' : 'rgba(0,240,255,0.3)'
                      }`,
                      borderRadius: 6,
                      padding: '2px 6px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {type}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: isSel
                      ? '#00f0ff'
                      : isElig
                        ? 'rgba(255,255,255,0.6)'
                        : 'rgba(255,255,255,0.35)',
                    fontWeight: 500,
                  }}
                >
                  {isElig ? `Save ₹${off.discount}!` : `Locked: ${off.reason}`}
                </div>
              </div>

              {isElig ? (
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: `2px solid ${isSel ? '#00f0ff' : 'rgba(255,255,255,0.3)'}`,
                    background: isSel ? '#00f0ff' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#050510',
                    fontSize: 12,
                    fontWeight: 900,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isSel && '✓'}
                </div>
              ) : (
                <span
                  style={{
                    fontSize: '0.58rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    padding: '4px 8px',
                    borderRadius: 6,
                    color: 'rgba(255,255,255,0.25)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    textTransform: 'uppercase',
                  }}
                >
                  Locked
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    )}
  </StepWrap>
);

// ─── STEP 6: Confirm ───────────────────────────────────────────────────────────
const Step6Confirm = ({
  summary,
  loadingSummary,
  summaryError,
  phoneNumber,
  setPhoneNumber,
  onConfirm,
  isBooking,
  bookingError,
}: {
  summary: BookingSummary | null;
  loadingSummary: boolean;
  summaryError: string | null;
  phoneNumber: string;
  setPhoneNumber: (p: string) => void;
  onConfirm: () => void;
  isBooking: boolean;
  bookingError: string | null;
}) => {
  if (loadingSummary) {
    return (
      <StepWrap>
        <StepTitle
          icon="Step 06 / 06"
          title="Confirm Booking"
          sub="Preparing your dynamic session invoice..."
        />
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
          Retrieving summary details...
        </div>
      </StepWrap>
    );
  }

  if (summaryError || !summary) {
    return (
      <StepWrap>
        <StepTitle
          icon="Step 06 / 06"
          title="Confirm Booking"
          sub="Review session details and provide mobile to book"
        />
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <div style={{ color: '#ff6b6b', marginBottom: 12 }}>
            {summaryError || 'Could not retrieve booking summary review.'}
          </div>
        </div>
      </StepWrap>
    );
  }

  const formattedSlots = `${summary.startTime} – ${summary.endTime}`;
  const gamesStr = summary.gamesList.join(', ') || '-';

  const rows = [
    { label: 'Date', val: summary.date },
    { label: 'Time Slot(s)', val: formattedSlots },
    {
      label: 'Players',
      val: `${summary.playersCount} ${summary.playersCount === 1 ? 'person' : 'people'}`,
    },
    { label: 'Zone Setup', val: summary.zoneName },
    { label: 'Selected Game', val: gamesStr },
    {
      label: 'Duration',
      val: (() => {
        const h = summary.durationHours ?? summary.noOfHours;
        return `${h} ${h === 1 ? 'Hour' : 'Hours'}`;
      })(),
    },
  ];

  // Basic check for a 10-digit number
  const isPhoneValid = /^[0-9]{10}$/.test(phoneNumber);

  return (
    <StepWrap>
      <StepTitle
        icon="Step 06 / 06"
        title="Confirm Booking"
        sub="Review session details and provide mobile to book"
      />

      {bookingError && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'rgba(255, 60, 60, 0.16)',
            border: '1px solid rgba(255, 60, 60, 0.4)',
            color: '#ff6b6b',
            fontSize: '0.85rem',
            marginBottom: '20px',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          {bookingError}
        </div>
      )}

      {/* Summary card */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '24px',
          marginBottom: 20,
          backdropFilter: 'blur(12px)',
        }}
      >
        {rows.map(({ label, val }, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '10px 0',
              borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
          >
            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>{label}</span>
            <span
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#fff',
                textAlign: 'right',
                maxWidth: '55%',
              }}
            >
              {val}
            </span>
          </div>
        ))}
      </div>

      {/* Applied Promotions */}
      {summary.appliedPromotions.length > 0 && (
        <div
          style={{
            background: 'rgba(0,240,255,0.03)',
            border: '1px solid rgba(0,240,255,0.2)',
            borderRadius: 20,
            padding: '20px 24px',
            marginBottom: 20,
          }}
        >
          <h4
            style={{
              fontSize: '0.78rem',
              color: '#00f0ff',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 12,
            }}
          >
            Applied Promotions
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {summary.appliedPromotions.map(off => (
              <div
                key={off.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(0,240,255,0.25)',
                  background: 'rgba(0,240,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                  {off.name}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#00f0ff' }}>
                  -₹{off.discount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available but locked/unselected promotions */}
      {summary.availablePromotions.length > 0 && (
        <div
          style={{
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20,
            padding: '20px 24px',
            marginBottom: 20,
          }}
        >
          <h4
            style={{
              fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 12,
            }}
          >
            Other Available Deals
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {summary.availablePromotions.map(off => (
              <div
                key={off.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.05)',
                  background: 'rgba(255,255,255,0.01)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}
                >
                  {off.name}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)' }}>
                  {off.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Form */}
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '20px 24px',
          marginBottom: 20,
        }}
      >
        <label
          style={{
            display: 'block',
            fontSize: '0.78rem',
            color: '#00f0ff',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}
        >
          Customer Phone Number (Required)
        </label>
        <input
          type="tel"
          maxLength={10}
          placeholder="e.g. 9876543210 (10 digits)"
          value={phoneNumber}
          onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 12,
            border: '1.5px solid rgba(255,255,255,0.15)',
            background: 'rgba(0,0,0,0.25)',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
            outline: 'none',
            letterSpacing: '0.08em',
          }}
        />
        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
          We will use this phone number to search or link your gaming profiles at the desk.
        </p>
      </div>

      {/* Price breakdown */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(145,94,255,0.3)',
          borderRadius: 20,
          padding: '20px 24px',
          marginBottom: 28,
          boxShadow: '0 0 30px rgba(145,94,255,0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
            {summary.priceCalculationText}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
            ₹{summary.originalAmount}
          </span>
        </div>
        {summary.discountApplied > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8rem', color: '#00f0ff' }}>Discount Applied</span>
            <span style={{ fontSize: '0.85rem', color: '#00f0ff', fontWeight: 600 }}>
              -₹{summary.discountApplied}
            </span>
          </div>
        )}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>Total</span>
          <span
            style={{
              fontSize: '1.6rem',
              fontWeight: 900,
              color: '#00f0ff',
              userSelect: 'none',
              textShadow: '0 0 12px rgba(0,240,255,0.35)',
            }}
          >
            ₹{summary.totalAmount}
          </span>
        </div>
      </div>

      {/* Confirm button */}
      <motion.button
        onClick={onConfirm}
        disabled={!isPhoneValid || isBooking}
        whileHover={
          isPhoneValid && !isBooking
            ? { scale: 1.03, boxShadow: '0 0 50px rgba(145,94,255,0.7)' }
            : {}
        }
        whileTap={isPhoneValid && !isBooking ? { scale: 0.97 } : {}}
        style={{
          width: '100%',
          padding: '18px',
          borderRadius: 16,
          border: 'none',
          cursor: isPhoneValid && !isBooking ? 'pointer' : 'not-allowed',
          background: isPhoneValid && !isBooking ? '#915EFF' : 'rgba(255,255,255,0.06)',
          color: isPhoneValid && !isBooking ? '#fff' : 'rgba(255,255,255,0.25)',
          fontSize: '1.05rem',
          fontWeight: 800,
          letterSpacing: '0.05em',
          boxShadow: isPhoneValid && !isBooking ? '0 0 28px rgba(145,94,255,0.5)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        {isBooking ? 'Holding Session...' : `Create Tentative Booking (₹${summary.totalAmount})`}
      </motion.button>
    </StepWrap>
  );
};

// ─── Main booking page ─────────────────────────────────────────────────────────
const BookingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // APIs data states
  const [setups, setSetups] = useState<Setup[]>([]);
  const [loadingSetups, setLoadingSetups] = useState(true);

  const [games, setGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [offers, setOffers] = useState<Offer[]>([]);

  // Customer booking selection states
  const [selectedDate, setSelectedDate] = useState<Date | null>(getDates()[0]);
  const [startTime, setStartTime] = useState('10:00 AM');
  const [noOfHours, setNoOfHours] = useState(1);
  const [people, setPeople] = useState(2);
  const [zone, setZone] = useState(''); // setupId
  const [selectedGameIds, setSelectedGameIds] = useState<number[]>([]);

  // final checkout states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Offers evaluation states (Step 5)
  const [evaluationOffers, setEvaluationOffers] = useState<EvaluationOffer[]>([]);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [selectedOfferIds, setSelectedOfferIds] = useState<number[]>([]);

  // Review Summary states (Step 6)
  const [summary, setSummary] = useState<BookingSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [activeLock, setActiveLock] = useState<ActiveLock | null>(null);
  const [isLocking, setIsLocking] = useState(false);

  // Fetch offers on load
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const data = await apiRequest<{ success?: boolean; offers?: Offer[] }>('/api/offers');
        if (data.success && data.offers) {
          setOffers(data.offers);
        }
      } catch (e) {
        console.error('Failed to fetch offers', e);
      }
    };
    fetchOffers();
  }, []);

  // 1. Fetch setups on load
  useEffect(() => {
    const fetchSetups = async () => {
      setLoadingSetups(true);
      try {
        const data = await apiRequest<{
          success?: boolean;
          setupConfigurations?: SetupConfiguration[];
          setups?: Setup[];
        }>('/api/setups');
        if (data.success) {
          const normalizedSetups = data.setupConfigurations
            ? normalizeSetupConfigurations(data.setupConfigurations)
            : normalizeSetups(data.setups ?? []);
          setSetups(normalizedSetups);
          if (normalizedSetups.length > 0) {
            setZone(String(normalizedSetups[0].id));
          }
        }
      } catch (e) {
        console.error('Failed to fetch setups', e);
      } finally {
        setLoadingSetups(false);
      }
    };
    fetchSetups();
  }, []);

  // 3. Fetch games (debounced)
  useEffect(() => {
    const fetchGames = async () => {
      if (!zone) return;

      setLoadingGames(true);
      try {
        const params = new URLSearchParams({
          setupConfigurationId: zone,
        });
        if (searchQuery) params.set('q', searchQuery);

        const url = `/api/games?${params}`;
        const data = await apiRequest<{ success?: boolean; games?: Game[] }>(url);
        if (data.success && data.games) {
          setGames(data.games);
          if (data.games.length > 0) {
            setSelectedGameIds(currentIds =>
              currentIds.length > 0 ? currentIds : [data.games![0].id]
            );
          }
        }
      } catch (e) {
        console.error('Failed to fetch games', e);
      } finally {
        setLoadingGames(false);
      }
    };

    const timer = setTimeout(
      () => {
        fetchGames();
      },
      searchQuery ? 300 : 0
    );

    return () => clearTimeout(timer);
  }, [searchQuery, zone]);

  useEffect(() => {
    setSelectedGameIds([]);
  }, [zone]);

  const fetchAvailability = useCallback(async () => {
    if (!selectedDate || !zone) return;

    setLoadingAvailability(true);
    setAvailabilityError(null);
    try {
      const payload = await getAvailability(formatLocalDate(selectedDate), Number(zone));
      const slots = normalizeAvailability(payload);
      setAvailability(slots);

      setStartTime(currentStartTime =>
        slots.length > 0 &&
        !slots.some(slot => slot.startTime === currentStartTime && slot.available)
          ? ''
          : currentStartTime
      );
    } catch (error) {
      setAvailability([]);
      setAvailabilityError(getApiErrorMessage(error, 'Could not load live availability.'));
    } finally {
      setLoadingAvailability(false);
    }
  }, [selectedDate, zone]);

  useEffect(() => {
    void fetchAvailability();
  }, [fetchAvailability]);

  useEffect(() => {
    setActiveLock(null);
  }, [zone, selectedDate, startTime, noOfHours]);

  // 4. Fetch evaluation offers on entering step 4 (index 4 - Offers Available)
  const fetchEvaluation = useCallback(async () => {
    setLoadingEvaluation(true);
    setEvaluationError(null);
    try {
      const payload = {
        setupId: Number(zone),
        count: people,
        date: selectedDate ? formatLocalDate(selectedDate) : '',
        startTime: startTime,
        noOfHours: noOfHours,
        gameIds: selectedGameIds,
      };
      const data = await apiRequest<{
        success?: boolean;
        offers?: EvaluationOffer[];
        message?: string;
      }>('/api/offers/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (data.success && data.offers) {
        setEvaluationOffers(data.offers);

        // Auto pre-select eligible offers
        const eligibleOffers = data.offers.filter(offer => offer.eligible);
        if (eligibleOffers.length > 0) {
          const firstExclusive = eligibleOffers.find(offer => {
            const type = offers.find(availableOffer => availableOffer.id === offer.id)?.offerType;
            return type === 'EXCLUSIVE';
          });
          if (firstExclusive) {
            // Pre-select exclusive if it exists
            setSelectedOfferIds([firstExclusive.id]);
          } else {
            // Otherwise pre-select all stackable inclusive ones
            const inclusiveIds = eligibleOffers.map(offer => offer.id);
            setSelectedOfferIds(inclusiveIds);
          }
        } else {
          setSelectedOfferIds([]);
        }
      } else {
        setEvaluationError(data.message || 'Failed to retrieve offer evaluation.');
      }
    } catch (e) {
      setEvaluationError('Failed to connect to offers evaluation service.');
    } finally {
      setLoadingEvaluation(false);
    }
  }, [selectedGameIds, zone, people, selectedDate, startTime, noOfHours, offers]);

  useEffect(() => {
    if (step === 4 && zone && selectedDate && startTime && noOfHours > 0) {
      void fetchEvaluation();
    }
  }, [step, zone, selectedDate, startTime, noOfHours, fetchEvaluation]);

  // 5. Fetch booking summary review on entering step 5 (index 5 - Confirm)
  const fetchReview = useCallback(async () => {
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const payload = {
        setupConfigurationId: Number(zone),
        playersCount: people,
        date: selectedDate ? formatLocalDate(selectedDate) : '',
        startTime,
        noOfHours,
        gameIds: selectedGameIds,
        appliedOfferIds: selectedOfferIds,
      };
      const data = await reviewBooking<BookingSummary>(payload);
      if (data.success && data.summary) {
        setSummary({
          ...data.summary,
          date: data.summary.date ?? fmtFull(selectedDate!),
          startTime: data.summary.startTime ?? startTime,
          endTime: data.summary.endTime ?? getEndTime(startTime, noOfHours),
          noOfHours: data.summary.noOfHours ?? noOfHours,
          playersCount: data.summary.playersCount ?? people,
        });
      } else {
        setSummaryError(data.message || 'Failed to retrieve booking review summary.');
      }
    } catch (e) {
      setSummaryError('Failed to connect to review service.');
    } finally {
      setLoadingSummary(false);
    }
  }, [selectedGameIds, zone, people, selectedDate, startTime, noOfHours, selectedOfferIds]);

  useEffect(() => {
    if (step === 5 && zone && selectedDate && startTime && noOfHours > 0) {
      void fetchReview();
    }
  }, [step, zone, selectedDate, startTime, noOfHours, fetchReview]);

  // Scroll to top on step transitions
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const canNext = [
    !!zone, // Step 1: Console Zone selected
    selectedDate && !!startTime && noOfHours > 0 && !loadingAvailability && !availabilityError,
    people > 0 && people <= 4, // Step 3: Party size selected
    selectedGameIds.length > 0, // Step 4: Games selected
    !loadingEvaluation && !isLocking, // Step 5: Offers Available loaded
    true, // Step 6: Confirm review
  ];

  const handleToggleGame = (gameId: number) => {
    setSelectedGameIds(currentIds =>
      currentIds.includes(gameId) ? currentIds.filter(id => id !== gameId) : [...currentIds, gameId]
    );
  };

  const handleToggleOffer = (off: EvaluationOffer) => {
    if (!off.eligible) return;

    const matchedOffer = offers.find(o => o.id === off.id);
    const offerType = matchedOffer ? matchedOffer.offerType : 'EXCLUSIVE';

    setSelectedOfferIds(prev => {
      const isCurrentlySelected = prev.includes(off.id);

      if (isCurrentlySelected) {
        return prev.filter(id => id !== off.id);
      }

      if (offerType === 'EXCLUSIVE') {
        // EXCLUSIVE clears everything else
        return [off.id];
      } else {
        // INCLUSIVE clears any EXCLUSIVE offer
        const withoutExclusive = prev.filter(id => {
          const type = offers.find(o => o.id === id)?.offerType;
          return type !== 'EXCLUSIVE';
        });
        return [...withoutExclusive, off.id];
      }
    });
  };

  const getOfferType = (offerId: number) => {
    const matched = offers.find(o => o.id === offerId);
    return matched ? matched.offerType : 'EXCLUSIVE';
  };

  const getSelectionKey = () =>
    `${zone}:${selectedDate ? formatLocalDate(selectedDate) : ''}:${startTime}:${noOfHours}`;

  const getAccessToken = async () => {
    if (apiToken) return apiToken;

    const token = await login();
    setApiToken(token);
    return token;
  };

  const acquireLock = async () => {
    if (!selectedDate || !zone || !startTime || noOfHours <= 0) {
      throw new Error('Complete the setup, date, start time, and duration.');
    }

    const selectionKey = getSelectionKey();
    if (activeLock?.selectionKey === selectionKey) {
      return activeLock;
    }

    const token = await getAccessToken();
    const lockToken = crypto.randomUUID();
    const response = await lockSlot(
      {
        setupConfigurationId: Number(zone),
        date: formatLocalDate(selectedDate),
        startTime,
        noOfHours,
      },
      lockToken,
      token
    );

    if (response.success === false) {
      throw new Error(response.message ?? 'Could not lock this slot.');
    }

    const lock = { token: lockToken, selectionKey };
    setActiveLock(lock);
    return lock;
  };

  const nextStep = async () => {
    if (step >= STEPS.length - 1) return;

    if (step === 4) {
      setIsLocking(true);
      setEvaluationError(null);
      try {
        await acquireLock();
      } catch (error) {
        setEvaluationError(
          getApiErrorMessage(error, 'Could not lock this slot. Refresh availability and try again.')
        );
        if (error instanceof ApiError && error.status === 409) {
          void fetchAvailability();
        }
        return;
      } finally {
        setIsLocking(false);
      }
    }

    setStep(currentStep => currentStep + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleConfirm = async () => {
    if (!selectedDate || !startTime || noOfHours <= 0 || !phoneNumber) return;
    setIsBooking(true);
    setBookingError(null);
    try {
      const zoneData = setups.find(s => String(s.id) === zone);
      const selectedGames = games.filter(game => selectedGameIds.includes(game.id));
      await acquireLock();
      const token = await getAccessToken();
      const tentativeResponse = await createTentativeBooking<TentativeBooking>(
        {
          setupConfigurationId: zoneData?.setupConfigurationId ?? Number(zone),
          phoneNumber,
          count: people,
          date: formatLocalDate(selectedDate),
          startTime,
          noOfHours,
        },
        token
      );

      if (!tentativeResponse.booking) {
        throw new Error(tentativeResponse.message ?? 'The tentative booking was not created.');
      }

      setActiveLock(null);
      const bookingId = tentativeResponse.booking.id;
      const amount = summary?.totalAmount ?? tentativeResponse.booking.amountCharged ?? 0;
      const gameMeta = selectedGames[0] ? getGameMeta(selectedGames[0].name) : { emoji: '🎮' };
      const slotStr = summary
        ? `${summary.startTime} – ${summary.endTime}`
        : `${startTime} (${noOfHours} ${noOfHours === 1 ? 'hr' : 'hrs'})`;
      const dateStr = summary?.date ?? (selectedDate ? fmtFull(selectedDate) : '');

      navigate('/booking-confirmed', {
        state: {
          status: 'TENTATIVE',
          bookingId: `VTX-${bookingId}`,
          date: dateStr,
          slot: slotStr,
          people,
          zone: summary?.zoneName ?? (zoneData ? zoneData.name : 'Vortex Console'),
          zoneSubtitle: zoneData?.description ?? 'Ahmedabad Gaming Station',
          game: selectedGames.map(game => game.name).join(', ') || 'Custom Game',
          gameEmoji: gameMeta.emoji,
          total: amount,
          receipt: summary,
          phoneNumber,
        },
      });
    } catch (error) {
      setBookingError(
        getApiErrorMessage(error, 'Server connection failed. Could not place booking.')
      );
      if (error instanceof ApiError && error.status === 409) {
        void fetchAvailability();
      }
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050510',
        position: 'relative',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Background image with overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          backgroundImage: 'url(/booking_bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.12,
          pointerEvents: 'none',
        }}
      />

      {/* Radial glow */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(145,94,255,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Nav bar */}
      <div className="nav-bar-container">
        <div className="nav-bar-inner">
          <button onClick={() => navigate('/')} className="nav-back-btn">
            ← <span>Back</span>
          </button>
          <div className="nav-title">
            <span style={{ color: '#915EFF' }}>Vortex</span>
            <span className="nav-title-full"> · Book a Slot</span>
          </div>
          <div className="nav-step-badge">
            {step + 1} / {STEPS.length}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="booking-content-wrap"
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '48px 20px 80px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <ProgressBar step={step} />

        <AnimatePresence mode="wait">
          <div key={step}>
            {step === 0 && (
              <Step1 setups={setups} zone={zone} setZone={setZone} loadingSetups={loadingSetups} />
            )}
            {step === 1 && (
              <Step2
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                startTime={startTime}
                setStartTime={setStartTime}
                noOfHours={noOfHours}
                setNoOfHours={setNoOfHours}
                availability={availability}
                loadingAvailability={loadingAvailability}
                availabilityError={availabilityError}
                onRetryAvailability={fetchAvailability}
              />
            )}
            {step === 2 && (
              <Step3
                people={people}
                setPeople={setPeople}
                rate={(() => {
                  const s = setups.find(s => String(s.id) === zone);
                  return s ? getSetupRate(s, people) : 150;
                })()}
              />
            )}
            {step === 3 && (
              <Step4
                selectedGameIds={selectedGameIds}
                onToggleGame={handleToggleGame}
                games={games}
                loadingGames={loadingGames}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            )}
            {step === 4 && (
              <OffersAvailableStep
                offers={evaluationOffers}
                loading={loadingEvaluation}
                error={evaluationError}
                onRetry={fetchEvaluation}
                selectedIds={selectedOfferIds}
                onToggleOffer={handleToggleOffer}
                getOfferType={getOfferType}
              />
            )}
            {step === 5 && (
              <Step6Confirm
                summary={summary}
                loadingSummary={loadingSummary}
                summaryError={summaryError}
                phoneNumber={phoneNumber}
                setPhoneNumber={setPhoneNumber}
                onConfirm={handleConfirm}
                isBooking={isBooking}
                bookingError={bookingError}
              />
            )}
          </div>
        </AnimatePresence>

        {/* Bottom nav buttons */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            marginTop: 36,
            justifyContent: step === 0 ? 'flex-end' : 'space-between',
          }}
        >
          {step > 0 && (
            <motion.button
              onClick={prevStep}
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '14px 28px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 700,
                backdropFilter: 'blur(8px)',
              }}
            >
              ← Previous
            </motion.button>
          )}
          {step < STEPS.length - 1 && (
            <motion.button
              onClick={() => void nextStep()}
              disabled={!canNext[step]}
              whileHover={canNext[step] ? { x: 2, boxShadow: '0 0 30px rgba(145,94,255,0.6)' } : {}}
              whileTap={canNext[step] ? { scale: 0.97 } : {}}
              style={{
                padding: '14px 32px',
                borderRadius: 12,
                border: 'none',
                background: canNext[step] ? '#915EFF' : 'rgba(255,255,255,0.06)',
                color: canNext[step] ? '#fff' : 'rgba(255,255,255,0.25)',
                cursor: canNext[step] ? 'pointer' : 'not-allowed',
                fontSize: '0.95rem',
                fontWeight: 800,
                boxShadow: canNext[step] ? '0 0 20px rgba(145,94,255,0.4)' : 'none',
                transition: 'all 0.25s ease',
                marginLeft: 'auto',
              }}
            >
              {isLocking
                ? 'Locking Slot...'
                : step === STEPS.length - 2
                  ? 'Review Booking →'
                  : 'Continue →'}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
