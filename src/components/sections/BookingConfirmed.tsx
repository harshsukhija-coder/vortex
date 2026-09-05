import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';

// ─── Confetti canvas ──────────────────────────────────────────────────────────
const Confetti = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rot: number;
      rotV: number;
      shape: 'rect' | 'circle';
      opacity: number;
    };

    const COLORS = ['#915EFF', '#00f0ff', '#FFD700', '#ff61d2', '#00ff88', '#ff6b35', '#4ecdc4'];

    const particles: Particle[] = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 3 + 1.5,
      size: Math.random() * 8 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.15,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      opacity: 1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotV;
        p.vy += 0.04; // gravity
        if (p.y > canvas.height * 0.7) p.opacity -= 0.015;
        if (p.opacity <= 0) return;
        alive = true;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      if (alive) animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        width: '100%',
        height: '100%',
      }}
    />
  );
};

// ─── Glowing ring check ────────────────────────────────────────────────────────
const CheckCircle = ({ tentative }: { tentative: boolean }) => (
  <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto 32px' }}>
    {/* Outer pulse rings */}
    {[1, 2, 3].map(i => (
      <motion.div
        key={i}
        initial={{ scale: 0.6, opacity: 0.8 }}
        animate={{ scale: 1.8 + i * 0.3, opacity: 0 }}
        transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2px solid #00f0ff',
        }}
      />
    ))}
    {/* Main circle */}
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
      style={{
        width: 130,
        height: 130,
        borderRadius: '50%',
        background: 'linear-gradient(135deg,#6d28d9,#915EFF,#00c8d4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 60px rgba(0,240,255,0.5), 0 0 120px rgba(145,94,255,0.3)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <motion.span
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
        style={{ fontSize: 56, lineHeight: 1 }}
      >
        {tentative ? '⌛' : '✓'}
      </motion.span>
    </motion.div>
  </div>
);

// ─── Detail row ───────────────────────────────────────────────────────────────
const Row = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '12px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}
  >
    <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.42)', flexShrink: 0 }}>
      {label}
    </span>
    <span
      style={{
        fontSize: '0.9rem',
        fontWeight: 700,
        textAlign: 'right',
        maxWidth: '60%',
        color: accent ?? '#fff',
      }}
    >
      {value}
    </span>
  </div>
);

// Helper to generate a base64 background radial gradient matching the website lounge style
const getBackgroundGradientBase64 = (): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1130;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Fill base background color
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, 800, 1130);

    // Radial glow at top center (matching radial-gradient from website)
    const radialGlow = ctx.createRadialGradient(400, 0, 50, 400, 0, 600);
    radialGlow.addColorStop(0, 'rgba(145, 94, 255, 0.28)'); // Glowing purple accent
    radialGlow.addColorStop(0.5, 'rgba(0, 240, 255, 0.06)'); // Cyan highlight
    radialGlow.addColorStop(1, 'rgba(5, 5, 16, 0)'); // Fading to base dark
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, 800, 1130);

    // Soft bottom right radial glow
    const bottomGlow = ctx.createRadialGradient(800, 1130, 20, 800, 1130, 450);
    bottomGlow.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
    bottomGlow.addColorStop(1, 'rgba(5, 5, 16, 0)');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, 0, 800, 1130);

    return canvas.toDataURL('image/jpeg', 0.95);
  }
  return '';
};

// Clean unicode characters like Rupee symbol or multiplication sign that break standard PDF encoding
const cleanUnicode = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/₹/g, 'INR ')
    .replace(/×/g, 'x')
    .replace(/–/g, '-') // Replace en-dash with hyphen
    .replace(/—/g, '-') // Replace em-dash with hyphen
    .replace(
      /[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g,
      ''
    ); // Strip emojis
};

// Helper to fetch and generate base64 QR code image using a public API
const getQRCodeBase64 = (text: string): Promise<string> => {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      text
    )}&color=00f0ff&bgcolor=0c1826`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve('');
      }
    };
    img.onerror = () => {
      resolve('');
    };
  });
};

// ─── Main page ────────────────────────────────────────────────────────────────
const BookingConfirmed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state as {
    status?: 'TENTATIVE' | 'CONFIRMED';
    bookingId: string;
    date: string;
    slot: string;
    people: number;
    zone: string;
    zoneSubtitle: string;
    game: string;
    gameEmoji: string;
    total: number;
    receipt?: any;
    phoneNumber?: string;
  } | null;

  // Guard — if navigated directly with no state, redirect home
  if (!booking) return <Navigate to="/" replace />;
  const isTentative = booking.status === 'TENTATIVE';

  const handleDownloadPDF = async () => {
    if (!booking) return;
    try {
      const qrBase64 = await getQRCodeBase64(booking.bookingId);
      const bgBase64 = getBackgroundGradientBase64();

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // 1. Draw dynamic radial gradient background
      if (bgBase64) {
        doc.addImage(bgBase64, 'JPEG', 0, 0, 210, 297);
      } else {
        doc.setFillColor(5, 5, 16);
        doc.rect(0, 0, 210, 297, 'F');
      }

      // Glowing neon visual accents
      // Draw neon purple-cyan double line header separator
      doc.setLineWidth(0.6);
      doc.setDrawColor(145, 94, 255);
      doc.line(15, 33, 195, 33);
      doc.setDrawColor(0, 240, 255);
      doc.line(15, 34, 195, 34);

      // Title & Brand using text width measurement for perfect inline alignment
      doc.setTextColor('#915EFF');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('VORTEX', 15, 25);
      const vortexWidth = doc.getTextWidth('VORTEX ');

      doc.setTextColor('#00f0ff');
      doc.text('GAMING LOUNGE', 15 + vortexWidth, 25);

      doc.setTextColor('#a3b3d4');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('AHMEDABAD PREMIER GAMING STATION', 15, 30);

      // Invoice info title
      doc.setFontSize(11);
      doc.setTextColor('#00f0ff');
      doc.setFont('helvetica', 'bold');
      doc.text(
        isTentative ? 'TENTATIVE BOOKING ACKNOWLEDGEMENT' : 'BOOKING CONFIRMATION RECEIPT',
        15,
        45
      );

      doc.setTextColor('#ffffff');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Booking ID: ${booking.bookingId}`, 15, 51);
      doc.text(`Phone Number: ${booking.phoneNumber || 'N/A'}`, 15, 57);

      // Left Session Info box (Futuristic container styled box)
      doc.setFillColor(18, 18, 38);
      doc.setDrawColor(145, 94, 255);
      doc.setLineWidth(0.3);
      doc.roundedRect(15, 66, 120, 58, 3, 3, 'FD');

      doc.setTextColor('#915EFF');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('Session Details', 20, 73);

      doc.setTextColor('#a3b3d4');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const keys = ['Date:', 'Time Slots:', 'Zone:', 'Game:', 'Players Count:', 'Duration:'];
      keys.forEach((key, idx) => {
        doc.text(key, 20, 81 + idx * 6.5);
      });

      doc.setTextColor('#ffffff');
      doc.setFont('helvetica', 'bold');
      doc.text(cleanUnicode(booking.date), 48, 81);
      doc.text(cleanUnicode(booking.slot), 48, 87);
      doc.text(cleanUnicode(booking.zone), 48, 93.5);
      doc.text(cleanUnicode(booking.game), 48, 100);
      doc.text(`${booking.people} ${booking.people === 1 ? 'player' : 'players'}`, 48, 106.5);
      doc.text(`${booking.receipt?.durationHours || 1} Hour(s)`, 48, 113);

      // Right QR Code box
      doc.setFillColor(12, 24, 38);
      doc.setDrawColor(0, 240, 255);
      doc.roundedRect(145, 66, 50, 58, 3, 3, 'FD');

      if (qrBase64) {
        doc.addImage(qrBase64, 'PNG', 152.5, 71, 35, 35);
      }

      doc.setTextColor('#00f0ff');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('SCAN QR AT DESK', 170, 113, { align: 'center' });
      doc.setTextColor('#a3b3d4');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('To verify reservation', 170, 117, { align: 'center' });

      // Pricing Breakdown Box (Rebuilt as a grid-based alternating table)
      const promoList = booking.receipt?.appliedPromotions || [];
      const tableHeaderHeight = 8;
      const tableRowHeight = 9;
      const tableTotalHeight = 10;
      const tableHeight =
        tableHeaderHeight + tableRowHeight + promoList.length * tableRowHeight + tableTotalHeight;

      // Draw table background grid panels
      // Header fill
      doc.setFillColor(25, 25, 50);
      doc.rect(15, 134, 180, tableHeaderHeight, 'F');

      // Row 1 (Booking base session)
      doc.setFillColor(18, 18, 38);
      doc.rect(15, 134 + tableHeaderHeight, 180, tableRowHeight, 'F');

      // Row(s) (Promotions)
      promoList.forEach((_: any, idx: number) => {
        const promoFillY = 134 + tableHeaderHeight + tableRowHeight + idx * tableRowHeight;
        doc.setFillColor(15, 15, 35);
        doc.rect(15, promoFillY, 180, tableRowHeight, 'F');
      });

      // Total Row fill
      const totalRowY =
        134 + tableHeaderHeight + tableRowHeight + promoList.length * tableRowHeight;
      doc.setFillColor(25, 25, 50);
      doc.rect(15, totalRowY, 180, tableTotalHeight, 'F');

      // Outer table border outline
      doc.setLineWidth(0.3);
      doc.setDrawColor(145, 94, 255);
      doc.rect(15, 134, 180, tableHeight, 'D');

      // Column Header Texts
      doc.setTextColor('#915EFF');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('Item Description', 20, 139.5);
      doc.text('Rate Breakdown', 95, 139.5);
      doc.text('Amount Charged', 190, 139.5, { align: 'right' });

      // Base Session Charges Row Texts
      doc.setTextColor('#ffffff');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const row1Y = 134 + tableHeaderHeight + 5.5;
      doc.text('Lounge Console Station Session', 20, row1Y);
      doc.text(
        cleanUnicode(booking.receipt?.priceCalculationText || `INR ${booking.total}`),
        95,
        row1Y
      );
      doc.text(`INR ${booking.receipt?.originalAmount || booking.total}`, 190, row1Y, {
        align: 'right',
      });

      // Promo Row Texts
      if (promoList.length > 0) {
        doc.setTextColor('#00f0ff');
        promoList.forEach((promo: any, idx: number) => {
          const promoY = 134 + tableHeaderHeight + tableRowHeight + idx * tableRowHeight + 5.5;
          let promoName = `[OFFER] ${cleanUnicode(promo.name)}`;
          const maxW = 145; // Max allowed width in mm (spanning across columns 1 & 2)
          if (doc.getTextWidth(promoName) > maxW) {
            while (doc.getTextWidth(promoName + '...') > maxW && promoName.length > 5) {
              promoName = promoName.slice(0, -1);
            }
            promoName += '...';
          }
          doc.text(promoName, 20, promoY);
          doc.text(`-INR ${promo.discount}`, 190, promoY, { align: 'right' });
        });
      }

      // Total Row Texts
      doc.setTextColor('#00f0ff');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      const totalTextY = totalRowY + 6.5;
      doc.text(
        isTentative ? 'ESTIMATED TOTAL (PENDING CONFIRMATION)' : 'TOTAL PAYABLE (INCL. GST)',
        20,
        totalTextY
      );
      doc.setFontSize(11);
      doc.text(`INR ${booking.total}`, 190, totalTextY, { align: 'right' });

      // Instructions Box (Relative spacing below table)
      const instructionsY = 134 + tableHeight + 10;
      doc.setFillColor(10, 10, 20);
      doc.setDrawColor(50, 50, 70);
      doc.roundedRect(15, instructionsY, 180, 20, 3, 3, 'FD');
      doc.setTextColor('#a3b3d4');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(
        'Please reach the venue 10 minutes prior to your booking. Carry this receipt on your device.',
        20,
        instructionsY + 7.5
      );
      doc.text(
        'Rescheduling or cancellations must be done through WhatsApp support at +91 98765 43210.',
        20,
        instructionsY + 13.5
      );

      // Footer
      doc.setTextColor('#4b5366');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('VORTEX ARENA', 105, 268, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('www.vortexgaming.in | play@vortexgaming.in', 105, 274, { align: 'center' });

      const filename = `Vortex-${isTentative ? 'Tentative-' : ''}Booking-${booking.bookingId}.pdf`;
      doc.save(filename);
    } catch (e) {
      console.error('PDF generation failed:', e);
    }
  };

  const handleSendWhatsApp = () => {
    if (!booking) return;
    const phoneNum = booking.phoneNumber || '9988776655';
    const textMsg = `*Vortex Gaming Cafe Ahmedabad*
    
⚡ *BOOKING CONFIRMED*
*Booking ID:* ${booking.bookingId}
*Date:* ${booking.date}
*Slots:* ${booking.slot}
*Players:* ${booking.people}
*Zone:* ${booking.zone}
*Game:* ${booking.game}
*Total Paid:* ₹${booking.total}

_Receipt PDF has been downloaded locally. Present Booking ID at front desk._`;

    const cleanPhone = phoneNum.replace(/\D/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const waLink = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(
      textMsg
    )}`;
    window.open(waLink, '_blank');
  };

  const handleAddCalendar = () => {
    // Build a basic Google Calendar link
    const title = encodeURIComponent(`Vortex Gaming — ${booking.zone}`);
    const details = encodeURIComponent(
      `Game: ${booking.game}\nPlayers: ${booking.people}\nBooking ID: ${booking.bookingId}`
    );
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
    window.open(url, '_blank');
  };

  const rows = [
    { label: 'Date', value: booking.date },
    { label: 'Time Slot', value: booking.slot },
    { label: 'Players', value: `${booking.people} ${booking.people === 1 ? 'person' : 'people'}` },
    { label: 'Zone', value: `${booking.zone} (${booking.zoneSubtitle})` },
    { label: 'Game', value: booking.game },
    {
      label: 'Duration',
      value: (() => {
        const h = booking.receipt?.noOfHours ?? booking.receipt?.durationHours ?? 1;
        return `${h} ${h === 1 ? 'Hour' : 'Hours'}`;
      })(),
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050510',
        fontFamily: "'Poppins', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow blobs */}
      <div
        style={{
          position: 'fixed',
          top: '-10%',
          left: '-10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(145,94,255,0.18) 0%,transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-10%',
          right: '-10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(0,240,255,0.14) 0%,transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Confetti */}
      {!isTentative && <Confetti />}

      {/* Nav */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'rgba(5,5,16,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '14px 16px',
        }}
      >
        <div
          style={{
            maxWidth: 600,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Back Button */}
          <motion.button
            onClick={() => navigate('/book')}
            whileHover={{ x: -2, background: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: '8px 12px',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 700,
              transition: 'all 0.2s ease',
            }}
          >
            <span>←</span> <span>Back</span>
          </motion.button>

          {/* Title */}
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', display: 'block' }}>
              <span style={{ color: '#915EFF' }}>Vortex</span> ·{' '}
              {isTentative ? 'Pending' : 'Success'}
            </span>
          </div>

          {/* Spacer to balance back button */}
          <div style={{ width: 68 }} />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: 600,
          margin: '0 auto',
          padding: '52px 20px 80px',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {/* ── Check mark ── */}
        <CheckCircle tentative={isTentative} />

        {/* ── Headline ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 36 }}
        >
          <h1
            style={{
              fontSize: 'clamp(1.8rem,5vw,2.6rem)',
              fontWeight: 900,
              color: '#fff',
              marginBottom: 10,
              lineHeight: 1.15,
            }}
          >
            {isTentative ? 'Booking held, ' : "You're all set, "}
            <span
              style={{
                background: 'linear-gradient(135deg,#915EFF,#00f0ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Player 1!
            </span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Your slot at{' '}
            <strong style={{ color: 'rgba(255,255,255,0.75)' }}>
              Vortex Gaming Cafe, Ahmedabad
            </strong>{' '}
            {isTentative ? 'is tentatively held.' : 'is confirmed.'}
            <br />
            {isTentative
              ? 'The cafe team must confirm it before your session is final.'
              : 'Show your Booking ID at the front desk.'}
          </p>
        </motion.div>

        {/* ── Booking ID card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.55 }}
          style={{
            background: 'linear-gradient(135deg,rgba(145,94,255,0.14),rgba(0,240,255,0.08))',
            border: '1px solid rgba(0,240,255,0.35)',
            borderRadius: 20,
            padding: '24px',
            textAlign: 'center',
            marginBottom: 22,
            boxShadow: '0 0 40px rgba(0,240,255,0.12), 0 0 80px rgba(145,94,255,0.1)',
          }}
        >
          <div
            style={{
              fontSize: '0.68rem',
              letterSpacing: '0.22em',
              color: '#00f0ff',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {isTentative ? 'Tentative Booking ID' : 'Booking ID'}
          </div>
          <div
            style={{
              fontSize: 'clamp(1.6rem,5vw,2.4rem)',
              fontWeight: 900,
              letterSpacing: '0.12em',
              color: '#fff',
              textShadow: '0 0 20px rgba(0,240,255,0.6)',
            }}
          >
            {booking.bookingId}
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: '0.72rem',
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.06em',
            }}
          >
            Vortex Gaming Cafe · Ahmedabad
          </div>
        </motion.div>

        {/* ── Booking details ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.55 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 20,
            padding: '20px 24px',
            marginBottom: 22,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              color: 'rgba(255,255,255,0.35)',
              marginBottom: 14,
              textTransform: 'uppercase',
            }}
          >
            Session Details
          </div>
          {rows.map(r => (
            <Row key={r.label} label={r.label} value={r.value} />
          ))}

          {/* Total */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 16,
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
              {isTentative ? 'Estimated Total' : 'Total Paid'}
            </span>
            <span
              style={{
                fontSize: '1.5rem',
                fontWeight: 900,
                background: 'linear-gradient(135deg,#915EFF,#00f0ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ₹{booking.total}
            </span>
          </div>
        </motion.div>

        {/* ── Action buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {/* Download booking PDF */}
          <motion.button
            onClick={handleDownloadPDF}
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0,240,255,0.4)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 14,
              border: '1.5px solid rgba(0,240,255,0.4)',
              background: 'rgba(0,240,255,0.07)',
              color: '#00f0ff',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              boxShadow: '0 0 16px rgba(0,240,255,0.1)',
              transition: 'all 0.25s ease',
            }}
          >
            {isTentative ? 'Download Tentative Booking PDF' : 'Download Receipt PDF'}
          </motion.button>

          {!isTentative && (
            <>
              {/* Send to WhatsApp */}
              <motion.button
                onClick={handleSendWhatsApp}
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0,255,136,0.4)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 14,
                  border: '1.5px solid rgba(0,255,136,0.4)',
                  background: 'rgba(0,255,136,0.07)',
                  color: '#00ff88',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  boxShadow: '0 0 16px rgba(0,255,136,0.1)',
                  transition: 'all 0.25s ease',
                }}
              >
                Send Receipt to WhatsApp
              </motion.button>

              {/* Add to calendar */}
              <motion.button
                onClick={handleAddCalendar}
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0,240,255,0.4)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 14,
                  border: '1.5px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  transition: 'all 0.25s ease',
                }}
              >
                Add to Google Calendar
              </motion.button>
            </>
          )}

          {/* Book another */}
          <motion.button
            onClick={() => navigate('/book')}
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(145,94,255,0.5)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 14,
              border: 'none',
              background: 'linear-gradient(135deg,#6d28d9,#915EFF)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              boxShadow: '0 0 20px rgba(145,94,255,0.4)',
              transition: 'all 0.25s ease',
            }}
          >
            Book Another Session
          </motion.button>

          {/* Go home */}
          <motion.button
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: '0.88rem',
              fontWeight: 600,
              transition: 'all 0.25s ease',
            }}
          >
            ← Back to Home
          </motion.button>
        </motion.div>

        {/* ── Footer note ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={{
            textAlign: 'center',
            fontSize: '0.72rem',
            color: 'rgba(255,255,255,0.22)',
            marginTop: 32,
            lineHeight: 1.7,
          }}
        >
          Questions? WhatsApp us at{' '}
          <span style={{ color: 'rgba(0,240,255,0.5)' }}>+91 98765 43210</span>
          <br />
          or email <span style={{ color: 'rgba(0,240,255,0.5)' }}>play@vortexgaming.in</span>
        </motion.p>
      </div>
    </div>
  );
};

export default BookingConfirmed;
