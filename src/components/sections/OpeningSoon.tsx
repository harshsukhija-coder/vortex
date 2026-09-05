import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Helper for Web Audio synth drone
class AmbientSynthDrone {
  private ctx: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;

  start() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.value = 180; // warm low-pass

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 2.5); // smooth fade-in

      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      // Low minor chord tones (C2, G2, C3, Eb3) for a sci-fi atmospheric drone
      const frequencies = [65.41, 98.00, 130.81, 155.56];
      
      frequencies.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = freq;
        
        // LFO to modulate pitch slightly for dynamic chorus effect
        const lfo = this.ctx!.createOscillator();
        lfo.frequency.value = 0.15 + Math.random() * 0.1;
        
        const lfoGain = this.ctx!.createGain();
        lfoGain.gain.value = 8; // pitch detuning depth

        lfo.connect(lfoGain);
        lfoGain.connect(osc.detune);
        
        osc.connect(this.filterNode!);
        osc.start();
        lfo.start();
        
        this.oscillators.push(osc);
      });
    } catch (e) {
      console.warn("AudioContext failed to load:", e);
    }
  }

  stop() {
    if (this.ctx) {
      try {
        this.gainNode?.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        setTimeout(() => {
          this.oscillators.forEach((osc) => {
            try { osc.stop(); } catch (e) {}
          });
          this.oscillators = [];
          this.ctx?.close();
          this.ctx = null;
        }, 600);
      } catch (e) {
        this.ctx = null;
      }
    }
  }
}

const OpeningSoon = () => {
  // Target Launch Date: October 15, 2026
  const targetDate = new Date("2026-10-15T18:00:00+05:30").getTime();
  
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [soundOn, setSoundOn] = useState(false);
  const droneRef = useRef<AmbientSynthDrone | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    zone: "PC Gaming Zone",
  });
  const [submitted, setSubmitted] = useState(false);

  // Initialize synth drone ref
  useEffect(() => {
    droneRef.current = new AmbientSynthDrone();
    return () => {
      droneRef.current?.stop();
    };
  }, []);

  // Audio Toggle
  const handleSoundToggle = () => {
    if (!droneRef.current) return;
    if (soundOn) {
      droneRef.current.stop();
      setSoundOn(false);
    } else {
      droneRef.current.start();
      setSoundOn(true);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) return;
    
    // Simulate API registration
    setSubmitted(true);
    setTimeout(() => {
      setForm({ name: "", email: "", phone: "", zone: "PC Gaming Zone" });
    }, 2000);
  };

  return (
    <div className="relative min-h-screen bg-primary flex flex-col justify-between overflow-hidden text-white font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Immersive background grids & lights */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(26,21,44,0.7),rgba(10,10,12,1))] z-0" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/20 blur-[120px] rounded-full" />
      
      {/* Decorative vertical lines */}
      <div className="absolute top-0 bottom-0 left-[10%] w-[1px] bg-gradient-to-b from-transparent via-purple-500/10 to-transparent pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-[10%] w-[1px] bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-[20px] font-black tracking-widest text-white uppercase neon-text-purple">
            VORTEX <span className="text-cyan-400">CLUB</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSoundToggle}
            className="flex items-center gap-2 bg-tertiary hover:bg-black-200 border border-secondary/20 hover:border-cyan-500/50 text-[13px] font-semibold tracking-wide uppercase px-4 py-2 rounded-full cursor-pointer transition-all duration-300 shadow-md"
          >
            {soundOn ? "🔊 Ambience Active" : "🔇 Enable Ambience"}
          </button>
          <Link
            to="/"
            className="text-[13px] font-semibold tracking-wide uppercase hover:text-cyan-400 border-b border-transparent hover:border-cyan-400 py-1 transition-all duration-300"
          >
            Lounge Hub
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col items-center flex-grow justify-center gap-12">
        
        {/* Intro */}
        <div className="text-center flex flex-col items-center">
          <span className="text-cyan-400 font-bold uppercase tracking-[0.25em] text-[13px] sm:text-[15px] mb-3 neon-text-blue">
            AHMEDABAD VENUE LAUNCHING SOON
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-6 uppercase leading-none">
            VORTEX GAMING <br />
            <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
              IS UNLEASHING
            </span>
          </h1>
          <p className="text-secondary max-w-xl text-[15px] sm:text-[17px] leading-relaxed">
            Get ready for Ahmedabad's grandest gaming sanctuary. High-end computing rigs, epic console arenas, and virtual reality sims await.
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="flex justify-center gap-4 sm:gap-6 bg-tertiary/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md shadow-2xl max-w-2xl w-full">
          {[
            { label: "DAYS", val: timeLeft.days },
            { label: "HOURS", val: timeLeft.hours },
            { label: "MINS", val: timeLeft.minutes },
            { label: "SECS", val: timeLeft.seconds },
          ].map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div className="text-3xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight text-white mb-2 select-all neon-text-blue">
                {String(item.val).padStart(2, "0")}
              </div>
              <div className="text-[10px] sm:text-[12px] font-bold text-secondary tracking-widest uppercase">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Pre-Registration Area */}
        <div className="bg-tertiary/70 border border-purple-500/20 p-8 rounded-3xl backdrop-blur-md shadow-2xl max-w-lg w-full relative">
          
          <div className="absolute top-[-1px] left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
          
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="form-container"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h3 className="text-[20px] font-bold text-white mb-2 tracking-wide uppercase">
                  Secure Pre-Launch Invite
                </h3>
                <p className="text-secondary text-[13px] mb-6">
                  Pre-register to receive double hours on your first top-up and exclusive invites to our opening Valorant tournament.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="text-[11px] font-bold tracking-wider uppercase text-secondary block mb-1.5">
                      Gamer Tag / Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NeoGamer"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="bg-black-200 border border-secondary/20 rounded-xl px-4 py-3 w-full text-white text-[14px] focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold tracking-wider uppercase text-secondary block mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="bg-black-200 border border-secondary/20 rounded-xl px-4 py-3 w-full text-white text-[14px] focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold tracking-wider uppercase text-secondary block mb-1.5">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="10 digit number"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="bg-black-200 border border-secondary/20 rounded-xl px-4 py-3 w-full text-white text-[14px] focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold tracking-wider uppercase text-secondary block mb-1.5">
                      Preferred Gaming Zone
                    </label>
                    <select
                      value={form.zone}
                      onChange={(e) => setForm({ ...form, zone: e.target.value })}
                      className="bg-black-200 border border-secondary/20 rounded-xl px-4 py-3 w-full text-white text-[14px] focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                    >
                      <option>PC Gaming Zone</option>
                      <option>PS5 Console Arena</option>
                      <option>VR Simulator Hub</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-[14px] uppercase tracking-widest py-3.5 px-6 rounded-xl mt-4 cursor-pointer transition-all duration-300 shadow-lg shadow-purple-500/20 active:scale-95"
                  >
                    Request Invite Code
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success-container"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-6"
              >
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500 mb-6">
                  <svg
                    className="w-8 h-8 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-[22px] font-bold text-white mb-2 uppercase tracking-wide">
                  Registration Successful!
                </h3>
                <p className="text-cyan-400 font-bold text-[14px] mb-4">
                  Welcome to the Vortex Vanguard, {form.name || "Gamer"}!
                </p>
                <p className="text-secondary text-[13px] leading-relaxed max-w-sm">
                  We've reserved your opening pass. An email confirmation has been sent to <span className="text-white">{form.email}</span>. We'll text your tournament invite code to <span className="text-white">{form.phone}</span> closer to launch!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 text-center border-t border-white/5 text-[12px] text-secondary">
        &copy; 2026 Vortex Gaming Cafe Ahmedabad. All rights reserved. Opening soon near SG Highway, Ahmedabad.
      </footer>
    </div>
  );
};

export default OpeningSoon;
