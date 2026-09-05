import React from 'react';
import Tilt from 'react-parallax-tilt';
import { motion } from 'framer-motion';
import { SectionWrapper } from '../../hoc';
import { fadeIn } from '../../utils/motion';

interface IPS5Game {
  name: string;
  description: string;
  specs: string[];
  genre: string;
  image: string;
}

const ps5GamesList: IPS5Game[] = [
  {
    name: "Marvel's Spider-Man 2",
    description:
      "Swing through Marvel's New York as both Peter Parker and Miles Morales. Experience near-instant character switching and ray-traced reflections.",
    specs: ['4K Ray-Tracing', 'Haptic Feedback', '120 Hz Support'],
    genre: 'Action-Adventure',
    image:
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'God of War Ragnarök',
    description:
      'Embark on an epic Norse mythological journey with Kratos and Atreus. Enjoy stunning 3D Audio and fluid combat at high frame rates.',
    specs: ['3D Tempest Audio', 'Adaptive Triggers', 'Locked 60 FPS'],
    genre: 'Action RPG',
    image:
      'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'EA Sports FC 25',
    description:
      'The ultimate next-gen football experience. Command tactical adjustments and feel every tackle with the DualSense haptic engine.',
    specs: ['HyperMotion V', 'PlayStyles+', 'Local Multiplayer'],
    genre: 'Sports',
    image:
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Tekken 8',
    description:
      'Fist Meets Fate in the ultimate fighting arena. Experience the brand new Heat System and competitive local matchups with zero latency.',
    specs: ['Unreal Engine 5', 'Zero-Lag PVP', 'DualSense Support'],
    genre: 'Fighting',
    image:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Gran Turismo 7',
    description:
      'The Real Driving Simulator. Feel the road, tire grip, and gear shifts with high-fidelity haptics, running at up to 120 FPS.',
    specs: ['Real-Time Raytracing', 'Sim Wheel Support', 'Tempest 3D Audio'],
    genre: 'Racing',
    image:
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Mortal Kombat 1',
    description:
      'A reborn Mortal Kombat Universe created by Fire God Liu Kang. Experience new fighting mechanics and gory fatalities in ultra HD.',
    specs: ['Kameo Fighters', 'Smooth 60 FPS', 'Cinematic Campaign'],
    genre: 'Fighting',
    image:
      'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?q=80&w=600&auto=format&fit=crop',
  },
];

const PS5GameCard: React.FC<{ index: number } & IPS5Game> = ({
  index,
  name,
  description,
  specs,
  genre,
  image,
}) => {
  return (
    <motion.div variants={fadeIn('up', 'spring', index * 0.2, 0.75)}>
      <Tilt glareEnable tiltEnable tiltMaxAngleX={20} tiltMaxAngleY={20} glareColor="#00f0ff">
        <div className="bg-tertiary w-full rounded-2xl p-5 sm:w-[340px] border border-blue-900/30 hover:border-cyan-500/50 transition-all duration-300">
          <div className="relative h-[200px] w-full rounded-2xl overflow-hidden">
            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover transform hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3 bg-blue-600/95 text-white text-[12px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              PS5
            </div>
            <div className="absolute bottom-3 right-3 bg-black/85 text-cyan-400 text-[12px] font-medium px-2 py-0.5 rounded border border-cyan-500/30">
              {genre}
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-[22px] font-bold text-white tracking-wide">{name}</h3>
            <p className="text-secondary mt-2 text-[14px] leading-relaxed min-h-[60px]">
              {description}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-secondary/15">
            <p className="text-white text-[12px] font-semibold tracking-wider uppercase mb-2 text-cyan-400">
              Console Optimizations:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {specs.map(spec => (
                <span
                  key={spec}
                  className="bg-black-200 text-secondary text-[11px] px-2.5 py-1 rounded border border-blue-900/40"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Tilt>
    </motion.div>
  );
};

const PS5Games = () => {
  return (
    <div className="mt-10">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="sm:text-[18px] text-[14px] text-cyan-400 uppercase tracking-widest font-bold neon-text-blue">
          Next-Gen Console Experience
        </span>
        <h2 className="text-white font-black md:text-[60px] sm:text-[50px] xs:text-[40px] text-[30px] mt-2">
          Famous PS5 Games.
        </h2>
        <p className="text-secondary mt-4 max-w-3xl text-[17px] leading-[30px]">
          Vortex Gaming Cafe features high-speed PlayStation 5 stations, loaded with Sony's most
          celebrated blockbuster exclusives and competitive multiplayer games. All running on
          premium recliners and 4K HDR displays.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        {ps5GamesList.map((game, index) => (
          <PS5GameCard key={`ps5-game-${index}`} index={index} {...game} />
        ))}
      </div>
    </div>
  );
};

export default SectionWrapper(PS5Games, 'ps5');
