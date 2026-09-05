import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import { styles } from '../../constants/styles';
import { config } from '../../constants/config';

// ── Typewriter hook ───────────────────────────────────────────────────────────
const useTypewriter = (words: string[], speed = 90, pause = 1800) => {
  const [displayed, setDisplayed] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIndex % words.length];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && charIndex <= current.length) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, charIndex));
        setCharIndex(c => c + 1);
      }, speed);
    } else if (!deleting && charIndex > current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIndex >= 0) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, charIndex));
        setCharIndex(c => c - 1);
      }, speed / 2);
    } else {
      setDeleting(false);
      setWordIndex(w => (w + 1) % words.length);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, deleting, wordIndex, words, speed, pause]);

  return displayed;
};

// ── Glitch text component ─────────────────────────────────────────────────────
const GlitchText = ({ text }: { text: string }) => (
  <span className="hero-glitch" data-text={text}>
    {text}
  </span>
);

// ── Floating particle canvas ──────────────────────────────────────────────────
const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      hue: number;
      life: number;
      maxLife: number;
    }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const spawn = () => {
      const hues = [260, 190, 290, 170, 320]; // purple, cyan, violet, teal, magenta
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(Math.random() * 1.0 + 0.3),
        size: Math.random() * 2.0 + 0.4,
        hue: hues[Math.floor(Math.random() * hues.length)],
        life: 0,
        maxLife: Math.random() * 220 + 100,
      });
    };

    const CONNECTION_DIST = 130;

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      if (frame % 5 === 0) spawn();

      // Draw constellation lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const lineAlpha = (1 - dist / CONNECTION_DIST) * 0.12;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `hsla(${(a.hue + b.hue) / 2}, 90%, 70%, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw particles on top
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const progress = p.life / p.maxLife;
        const alpha = progress < 0.2 ? progress / 0.2 : progress > 0.8 ? (1 - progress) / 0.2 : 1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 68%, ${alpha * 0.75})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${p.hue}, 100%, 65%)`;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (p.life >= p.maxLife) particles.splice(i, 1);
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

// ── Animated stat badge ───────────────────────────────────────────────────────
const StatBadge = ({ label, value, delay }: { label: string; value: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className="stat-badge"
  >
    <span className="stat-value">{value}</span>
    <span className="stat-label">{label}</span>
  </motion.div>
);

// ── Neon CTA button ───────────────────────────────────────────────────────────
const NeonButton = ({
  children,
  href,
  delay,
  primary = false,
}: {
  children: React.ReactNode;
  href: string;
  delay: number;
  primary?: boolean;
}) => (
  <motion.a
    href={href}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, delay }}
    className={primary ? 'btn-neon-primary' : 'btn-neon-secondary'}
  >
    {children}
  </motion.a>
);

// ── Main Hero ─────────────────────────────────────────────────────────────────
const Hero = () => {
  const rotatingWords = ['PS5 Arena', 'Esports Hub', 'Gaming Cafe', 'High-FPS LEDs'];
  const typed = useTypewriter(rotatingWords, 85, 2000);

  return (
    <section className="relative mx-auto h-screen w-full overflow-hidden flex flex-col justify-center">
      {/* Constellation particle canvas */}
      <ParticleCanvas />

      {/* Layer 1: perspective grid floor */}
      <div className="hero-grid" />

      {/* Layer 2: radial center spotlight */}
      <div className="hero-spotlight" />

      {/* Layer 3: subtle dot matrix */}
      <div className="hero-dots" />

      {/* Layer 4: chromatic glow orbs */}
      <div className="hero-blob hero-blob-purple" />
      <div className="hero-blob hero-blob-cyan" />
      <div className="hero-blob-magenta" />
      <div className="hero-blob-amber" />

      {/* Horizontal scan-line overlay */}
      <div className="hero-scanlines" />

      {/* Content */}
      <div
        className={`relative z-10 mx-auto max-w-6xl w-full ${styles.paddingX} flex flex-col items-start gap-6 pt-[90px] -mt-10 sm:-mt-16 md:-mt-24`}
      >
        {/* Top label */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <span className="hero-label-dot" />
          <span className="hero-label-text">AHMEDABAD'S #1 PS5 GAMING CAFE</span>
          <span className="hero-label-dot" />
        </motion.div>

        {/* Main heading */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="hero-hi-text"
          >
            Welcome to
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="hero-name"
          >
            <GlitchText text={config.hero.name} />
          </motion.h1>

          {/* Typewriter subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.35 }}
            className="hero-typewriter-wrap"
          >
            <span className="hero-typewriter-prefix">Your&nbsp;</span>
            <span className="hero-typewriter-text">
              {typed}
              <span className="hero-cursor">|</span>
            </span>
          </motion.div>
        </div>

        {/* Sub-paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.45 }}
          className="hero-subtext"
        >
          {config.hero.p[0]}
          <br className="hidden sm:block" />
          {config.hero.p[1]}
        </motion.p>

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 mt-1">
          <StatBadge value="20+" label="Capacity" delay={0.55} />
          <StatBadge value="5" label="PS5 Stations" delay={0.65} />
          <StatBadge value="4K" label="Led Series" delay={0.75} />
          <StatBadge value="20+" label="Latest Games" delay={0.85} />
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-4 mt-2">
          <NeonButton href="/book" delay={0.95} primary>
            {/* Lightning bolt — instant action */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                display: 'inline',
                verticalAlign: 'middle',
                marginRight: 8,
                marginBottom: 1,
              }}
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Book a Session
          </NeonButton>
          <NeonButton href="#games" delay={1.05}>
            {/* Four-square grid — game catalog */}
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                display: 'inline',
                verticalAlign: 'middle',
                marginRight: 8,
                marginBottom: 1,
              }}
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            View Game Library
          </NeonButton>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1 z-10 pointer-events-none">
        <span className="text-[10px] text-cyan-400/60 uppercase tracking-widest">Scroll</span>
        <a href="#gallery" className="pointer-events-auto">
          <div className="border-[#915EFF] flex h-[46px] w-[28px] items-start justify-center rounded-3xl border-2 p-2">
            <motion.div
              animate={{ y: [0, 14, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: 'loop' }}
              className="bg-[#915EFF] h-2.5 w-2.5 rounded-full"
            />
          </div>
        </a>
      </div>
    </section>
  );
};

export default Hero;
