import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const AUTO_HIDE_MS = 5000;
const LAUNCH_DATE = '19 Nov 2026';
const GTA6_IMAGE =
  'https://www.igrandtheftauto.com/content/images/large/gta-vi-key-3840x2160.jpg';

const LaunchToast = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    return () => window.clearTimeout(timer);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gta6-launch-title"
          className="fixed inset-0 z-[80] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            aria-label="Dismiss notification"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => setVisible(false)}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-cyan-400/30 bg-[#0b0a1a] shadow-[0_0_60px_rgba(145,94,255,0.45)]"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-purple-500/35 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-cyan-400/25 blur-3xl" />

            <div className="relative">
              <div className="relative h-44 overflow-hidden sm:h-52">
                <img
                  src={GTA6_IMAGE}
                  alt="Grand Theft Auto 6"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0a1a] via-[#0b0a1a]/45 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300 backdrop-blur">
                  Now at Vortex
                </span>
              </div>

              <div className="relative px-5 pb-5 pt-1 sm:px-6 sm:pb-6">
                <h3
                  id="gta6-launch-title"
                  className="text-xl font-black leading-tight text-white sm:text-2xl"
                >
                  GTA 6 launches {LAUNCH_DATE}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-secondary">
                  Available to play at Vortex Gaming Cafe. Book a PS5 session and be among the first.
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <Link
                    to="/book"
                    onClick={() => setVisible(false)}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#915EFF] to-cyan-500 text-sm font-bold text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110"
                  >
                    Book a slot
                  </Link>
                  <button
                    type="button"
                    onClick={() => setVisible(false)}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            <motion.span
              className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gradient-to-r from-[#915EFF] to-cyan-400"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: AUTO_HIDE_MS / 1000, ease: 'linear' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LaunchToast;
