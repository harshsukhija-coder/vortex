import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

const photos = [
  {
    src: '/cafe_overview.png',
    title: 'The Full Arena',
    tag: 'OVERVIEW',
    desc: 'Every PS5 station, every couch — one stunning view of the full Vortex lounge.',
    accent: '#00f0ff',
    wide: true,
  },
  {
    src: '/cafe_wall_left.png',
    title: 'Zone A — Left Wall',
    tag: '2 × PS5',
    desc: 'Two 65" 4K setups on the left wall with plush black couches.',
    accent: '#bf61ff',
    wide: false,
  },
  {
    src: '/cafe_wall_right.png',
    title: 'Zone B — Right Wall',
    tag: '2 × PS5',
    desc: 'Mirror layout on the right — two more PS5 stations with recliner couches.',
    accent: '#00f0ff',
    wide: false,
  },
  {
    src: '/cafe_big_screen.png',
    title: 'The Main Stage',
    tag: 'BIG SCREEN',
    desc: 'Our centrepiece: massive projection screen with a PS5 on a glowing pedestal.',
    accent: '#bf61ff',
    wide: true,
  },
];

// ─── Single photo card ────────────────────────────────────────────────────────
const PhotoCard = ({ photo, index }: { photo: (typeof photos)[0]; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [hovered, setHovered] = useState(false);

  const accentRgb = photo.accent === '#00f0ff' ? '0,240,255' : '191,97,255';

  return (
    <motion.div
      ref={ref}
      className="cafe-photo-card"
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.75,
        delay: index * 0.13,
        ease: [0.22, 1, 0.36, 1],
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        gridColumn: photo.wide ? 'span 2' : 'span 1',
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        aspectRatio: photo.wide ? '21/9' : '4/3',
        border: `1px solid rgba(${accentRgb},${hovered ? 0.55 : 0.18})`,
        boxShadow: hovered
          ? `0 0 0 1px rgba(${accentRgb},0.18), 0 0 50px rgba(${accentRgb},0.18), 0 16px 60px rgba(0,0,0,0.6)`
          : '0 8px 40px rgba(0,0,0,0.5)',
        transition: 'border-color 0.35s ease, box-shadow 0.35s ease',
        background: '#0a0a1a',
      }}
    >
      {/* ── Image with zoom ── */}
      <motion.img
        src={photo.src}
        alt={photo.title}
        animate={{ scale: hovered ? 1.08 : 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      {/* ── Dark gradient base ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(4,4,20,0.96) 0%, rgba(4,4,20,0.45) 40%, transparent 100%)',
          zIndex: 1,
          transition: 'opacity 0.35s ease',
          opacity: hovered ? 1 : 0.85,
        }}
      />

      {/* ── Top shimmer on hover ── */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: `linear-gradient(to bottom, rgba(${accentRgb},0.12) 0%, transparent 100%)`,
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Corner accents ── */}
      {hovered && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              width: 28,
              height: 28,
              borderTop: `2px solid ${photo.accent}`,
              borderLeft: `2px solid ${photo.accent}`,
              borderRadius: '4px 0 0 0',
              zIndex: 5,
              boxShadow: `-2px -2px 10px rgba(${accentRgb},0.6)`,
              transition: 'all 0.3s ease',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              right: 14,
              width: 28,
              height: 28,
              borderBottom: `2px solid ${photo.accent}`,
              borderRight: `2px solid ${photo.accent}`,
              borderRadius: '0 0 4px 0',
              zIndex: 5,
              boxShadow: `2px 2px 10px rgba(${accentRgb},0.6)`,
            }}
          />
        </>
      )}

      {/* ── Tag pill ── */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0.7, scale: hovered ? 1 : 0.95 }}
        transition={{ duration: 0.25 }}
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 4,
          background: `rgba(${accentRgb},0.15)`,
          border: `1px solid rgba(${accentRgb},0.45)`,
          borderRadius: 6,
          padding: '3px 10px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: photo.accent,
          textShadow: `0 0 8px ${photo.accent}`,
          backdropFilter: 'blur(6px)',
        }}
      >
        {photo.tag}
      </motion.div>

      {/* ── Bottom info area ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px 20px 20px',
          zIndex: 4,
        }}
      >
        {/* Description — slides in on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.28 }}
              style={{
                fontSize: '0.82rem',
                color: 'rgba(255,255,255,0.72)',
                lineHeight: 1.55,
                marginBottom: 8,
              }}
            >
              {photo.desc}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Title */}
        <motion.h3
          animate={{ y: hovered ? 0 : 4, color: hovered ? photo.accent : '#ffffff' }}
          transition={{ duration: 0.3 }}
          style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            margin: 0,
            letterSpacing: '0.02em',
            textShadow: hovered ? `0 0 14px rgba(${accentRgb},0.7)` : '0 2px 10px rgba(0,0,0,0.8)',
            transition: 'color 0.3s ease, text-shadow 0.3s ease',
          }}
        >
          {photo.title}
        </motion.h3>

        {/* Animated underline */}
        <motion.div
          animate={{ scaleX: hovered ? 1 : 0 }}
          transition={{ duration: 0.35 }}
          style={{
            height: 2,
            background: `linear-gradient(90deg, ${photo.accent}, transparent)`,
            borderRadius: 2,
            marginTop: 6,
            transformOrigin: 'left',
          }}
        />
      </div>
    </motion.div>
  );
};

// ─── Gallery section ──────────────────────────────────────────────────────────
const CafeGallery = () => {
  const headingRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headingRef, { once: true, margin: '-60px' });

  return (
    <section
      id="gallery"
      style={{
        width: '100%',
        padding: '100px 24px 80px',
        background: 'linear-gradient(180deg,#050510 0%,#080820 55%,#050510 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle grid bg */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(0,240,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,0.025) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }}
      />

      {/* ── Section header ── */}
      <div
        ref={headingRef}
        className="mb-10 px-1 sm:mb-14"
        style={{
          textAlign: 'center',
          maxWidth: 640,
          marginLeft: 'auto',
          marginRight: 'auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{
            display: 'inline-block',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#00f0ff',
            textShadow: '0 0 10px #00f0ff',
            marginBottom: 14,
          }}
        >
          // &nbsp; Inside Vortex
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-3 text-[34px] font-black leading-[1.08] text-white xs:text-[42px] sm:text-[56px] md:text-[68px]"
        >
          The Arena,{' '}
          <span
            className="block sm:inline"
            style={{
              background: 'linear-gradient(135deg,#bf61ff,#00f0ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Captured.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.42)',
            letterSpacing: '0.06em',
            marginBottom: 24,
          }}
        >
          5 PS5 stations · 4 premium couches · 1 massive centrepiece screen
        </motion.p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{
            height: 2,
            width: 120,
            margin: '0 auto',
            background: 'linear-gradient(90deg,transparent,#bf61ff 40%,#00f0ff 60%,transparent)',
            transformOrigin: 'left',
          }}
        />
      </div>

      {/* ── Photo grid ── */}
      <div
        className="cafe-gallery-grid"
        style={{
          display: 'grid',
          gap: 18,
          maxWidth: 1100,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {photos.map((photo, i) => (
          <PhotoCard key={photo.title} photo={photo} index={i} />
        ))}
      </div>

      {/* ── CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.55, delay: 0.3 }}
        style={{ textAlign: 'center', marginTop: 52, position: 'relative', zIndex: 1 }}
      >
        <a href="#contact" className="btn-neon-primary">
          Book Your Session Now
        </a>
      </motion.div>
    </section>
  );
};

export default CafeGallery;
