import { motion } from "framer-motion";
import { SectionWrapper } from "../../hoc";
import { fadeIn } from "../../utils/motion";

interface ISpecCard {
  title: string;
  subtitle: string;
  borderColor: string;
  accentColor: string;
  specs: { label: string; value: string }[];
  stat: { name: string; value: string };
  icon: React.ReactNode;
}

const specsData: ISpecCard[] = [
  {
    title: "Pro PC Arena",
    subtitle: "Tournament-Grade Computing Rigs",
    borderColor: "hover:border-purple-500/50",
    accentColor: "text-purple-400",
    specs: [
      { label: "GPU", value: "NVIDIA RTX 4080 Super (Liquid Cooled)" },
      { label: "CPU", value: "Intel Core i9-14900KF (Up to 6.0 GHz)" },
      { label: "RAM", value: "32GB Corsair Dominator DDR5 6400MHz" },
      { label: "Display", value: "BenQ ZOWIE XL2566K (360Hz Refresh Rate)" },
      { label: "Gear", value: "Razer Huntsman V3 Pro + Logitech G Pro X Superlight 2" },
    ],
    stat: { name: "Target Framerate", value: "360+ FPS on Esports Titles" },
    icon: (
      <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "PS5 Pro Arena",
    subtitle: "Next-Gen Console Comfort Zone",
    borderColor: "hover:border-cyan-500/50",
    accentColor: "text-cyan-400",
    specs: [
      { label: "Console", value: "Sony PlayStation 5 Pro Edition" },
      { label: "Display", value: "LG C3 55\" 4K HDR OLED (120Hz Refresh)" },
      { label: "Controller", value: "DualSense Edge Wireless Controllers" },
      { label: "Comfort", value: "Secretlab TITAN Evo Premium Gaming Recliners" },
      { label: "Audio", value: "Sony Pulse 3D Wireless Spatial Audio Headsets" },
    ],
    stat: { name: "Display Quality", value: "4K HDR at locked 120Hz" },
    icon: (
      <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "VR Simulator Hub",
    subtitle: "Immersive Virtual Worlds",
    borderColor: "hover:border-pink-500/50",
    accentColor: "text-pink-400",
    specs: [
      { label: "Headset", value: "Meta Quest 3 + HTC Vive Pro 2 VR Kits" },
      { label: "Sensors", value: "SteamVR Base Stations 2.0 (Room-Scale Tracking)" },
      { label: "Controls", value: "Valve Index Controllers (Precise Finger Tracking)" },
      { label: "Simulator", value: "Next Level Racing GTtrack Haptic Motion Seats" },
      { label: "Sim Gear", value: "Fanatec Gran Turismo DD Pro Sim Racing Wheels" },
    ],
    stat: { name: "Haptic Motion Engine", value: "1:1 Real-Time Motion Feedback" },
    icon: (
      <svg className="w-8 h-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Vortex Network",
    subtitle: "High-Speed Network Infrastructure",
    borderColor: "hover:border-orange-500/50",
    accentColor: "text-orange-400",
    specs: [
      { label: "Bandwidth", value: "Dual 1Gbps Fiber Optic Leased Lines (Auto-Failover)" },
      { label: "Hardware", value: "Ubiquiti UniFi Enterprise Switchboards" },
      { label: "Caching", value: "Localized Game Storage Server (Immediate Steam Updates)" },
      { label: "Cabling", value: "Cat6A Shielded Cabling for zero electromagnetic noise" },
      { label: "Security", value: "Enterprise DDoS Firewall Protection" },
    ],
    stat: { name: "Average Ping", value: "Less than 4ms on Valorant / CS2" },
    icon: (
      <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

const SpecCard: React.FC<ISpecCard & { index: number }> = ({
  title,
  subtitle,
  borderColor,
  accentColor,
  specs,
  stat,
  icon,
  index,
}) => {
  return (
    <motion.div
      variants={fadeIn("up", "spring", index * 0.2, 0.75)}
      className={`bg-tertiary/60 border border-white/5 rounded-3xl p-6 flex flex-col justify-between flex-grow w-full md:w-[48%] lg:w-[48%] min-h-[350px] transition-all duration-300 ${borderColor} hover:shadow-2xl`}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-[22px] font-bold text-white tracking-wide uppercase">
              {title}
            </h3>
            <p className="text-secondary text-[12px] mt-1 italic">{subtitle}</p>
          </div>
          <div className="p-3 bg-black-200 rounded-2xl border border-white/5 shadow-inner">
            {icon}
          </div>
        </div>

        <ul className="space-y-2 mt-4 text-[14px]">
          {specs.map((item, idx) => (
            <li key={idx} className="flex justify-between items-start border-b border-white/5 pb-1.5 leading-relaxed">
              <span className="text-secondary font-semibold min-w-[70px] uppercase text-[11px] tracking-wider mt-0.5">
                {item.label}
              </span>
              <span className="text-white text-right max-w-[240px]">
                {item.value}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-secondary text-[11px] uppercase tracking-wider font-semibold">
          {stat.name}:
        </span>
        <span className={`font-bold font-mono text-[14px] ${accentColor}`}>
          {stat.value}
        </span>
      </div>
    </motion.div>
  );
};

const Tech = () => {
  return (
    <div>
      <div className="flex flex-col items-center text-center mb-16">
        <span className="sm:text-[18px] text-[14px] text-purple-400 uppercase tracking-widest font-bold neon-text-purple">
          Our Hardware Arsenal
        </span>
        <h2 className="text-white font-black md:text-[60px] sm:text-[50px] xs:text-[40px] text-[30px] mt-2">
          Lounge Specifications.
        </h2>
        <p className="text-secondary mt-4 max-w-3xl text-[17px] leading-[30px]">
          We set the benchmark for gaming lounge infrastructure in Ahmedabad. Check out the professional hardware and high-speed network setup engineered for absolute dominance.
        </p>
      </div>

      <div className="flex flex-wrap justify-between gap-6">
        {specsData.map((spec, index) => (
          <SpecCard key={index} index={index} {...spec} />
        ))}
      </div>
    </div>
  );
};

export default SectionWrapper(Tech, "tech");
