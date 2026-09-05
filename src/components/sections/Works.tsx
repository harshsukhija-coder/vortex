import { useEffect, useState } from 'react';
import Tilt from 'react-parallax-tilt';
import { motion } from 'framer-motion';

import { web } from '../../assets';
import { apiRequest, getApiErrorMessage } from '../../api/bookingApi';
import { SectionWrapper } from '../../hoc';
import { fadeIn } from '../../utils/motion';
import { config } from '../../constants/config';
import { Header } from '../atoms/Header';
import { TProject } from '../../types';

interface ApiGame {
  id: number;
  name: string;
  images: string[];
  isActive: boolean;
}

const toProject = (game: ApiGame): TProject => ({
  name: game.name,
  description: `Play ${game.name} on PlayStation 5 with premium displays and DualSense controllers at Vortex Gaming Cafe.`,
  tags: [
    { name: 'PlayStation 5', color: 'blue-text-gradient' },
    { name: 'Available Now', color: 'green-text-gradient' },
  ],
  image: game.images[0] ?? web,
  sourceCodeLink: '',
});

const ComingSoonBanner = () => (
  <motion.a
    href="https://www.rockstargames.com/VI"
    target="_blank"
    rel="noopener noreferrer"
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, delay: 0.1 }}
    className="group relative mt-10 flex min-h-[480px] items-end overflow-hidden rounded-2xl border border-pink-400/30 bg-[#12091f] p-4 shadow-[0_0_35px_rgba(219,39,119,0.14)] transition-all duration-500 hover:-translate-y-1 hover:border-cyan-300/50 hover:shadow-[0_0_60px_rgba(34,211,238,0.18)] sm:mt-12 sm:min-h-[400px] sm:items-center sm:rounded-3xl sm:p-9"
  >
    <img
      src="https://image.api.playstation.com/vulcan/ap/rnd/202606/1818/4a35c9a8490c69fe89af0f52d4ac0249b230b4fdb12e8469.jpg"
      alt=""
      aria-hidden="true"
      className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-md"
    />
    <img
      src="https://image.api.playstation.com/vulcan/ap/rnd/202606/1818/4a35c9a8490c69fe89af0f52d4ac0249b230b4fdb12e8469.jpg"
      alt="Grand Theft Auto VI"
      className="absolute right-0 top-3 h-[250px] w-full object-contain object-right transition-transform duration-700 group-hover:scale-[1.02] sm:inset-0 sm:h-full"
    />
    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(7,3,18,0.98)_0%,rgba(13,5,28,0.72)_42%,rgba(10,4,24,0.08)_75%)] sm:bg-[linear-gradient(90deg,rgba(7,3,18,0.98)_0%,rgba(13,5,28,0.9)_38%,rgba(10,4,24,0.2)_68%,rgba(10,4,24,0.02)_100%)]" />
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-pink-500 to-orange-400" />
    <div className="relative z-10 w-full rounded-xl border border-white/10 bg-[#090512]/80 p-4 shadow-xl backdrop-blur-lg sm:max-w-md sm:rounded-2xl sm:bg-black/35 sm:p-6">
      <span className="inline-flex rounded-full border border-pink-300/30 bg-pink-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-pink-100 sm:text-[11px]">
        Coming Soon
      </span>
      <h3 className="mt-3 text-[28px] font-black leading-tight tracking-tight text-white sm:mt-4 sm:text-5xl">
        <span className="sm:hidden">GTA VI</span>
        <span className="hidden sm:inline">Grand Theft Auto VI</span>
      </h3>
      <p className="mt-2 text-[13px] leading-5 text-white/70 sm:mt-3 sm:text-base sm:leading-6 sm:text-white/75">
        Vice City is calling. Get ready to experience GTA VI at Vortex Gaming Cafe.
      </p>
      <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-bold text-cyan-100 transition-all group-hover:gap-3 sm:mt-5 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm sm:text-cyan-200">
        View official game <span aria-hidden="true">→</span>
      </span>
    </div>
  </motion.a>
);

const ProjectCard: React.FC<
  { index: number } & TProject & { onWatchGameplay: (videoId: string, title: string) => void }
> = ({
  index,
  name,
  description,
  tags,
  image,
  sourceCodeLink,
  gameplayVideoId,
  onWatchGameplay,
}) => {
  // Hype Counter state synced with local storage
  const [hypeCount, setHypeCount] = useState<number>(() => {
    const saved = localStorage.getItem(`hype_${name}`);
    return saved ? parseInt(saved, 10) : 150 + index * 42;
  });
  const [isHyped, setIsHyped] = useState<boolean>(() => {
    return localStorage.getItem(`hyped_${name}`) === 'true';
  });

  const handleHype = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isHyped) {
      const nextCount = hypeCount - 1;
      setHypeCount(nextCount);
      setIsHyped(false);
      localStorage.setItem(`hyped_${name}`, 'false');
      localStorage.setItem(`hype_${name}`, String(nextCount));
    } else {
      const nextCount = hypeCount + 1;
      setHypeCount(nextCount);
      setIsHyped(true);
      localStorage.setItem(`hyped_${name}`, 'true');
      localStorage.setItem(`hype_${name}`, String(nextCount));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.08, 0.4) }}
    >
      <Tilt glareEnable tiltEnable tiltMaxAngleX={15} tiltMaxAngleY={15} glareColor="#00f0ff">
        <div className="bg-tertiary w-full rounded-2xl p-5 sm:w-[320px] min-h-[480px] flex flex-col justify-between border border-purple-500/10 hover:border-purple-500/35 transition-colors duration-300 shadow-lg hover:shadow-purple-500/5">
          <div>
            <div
              className="relative h-[200px] w-full cursor-pointer overflow-hidden rounded-2xl group"
              onClick={() => gameplayVideoId && onWatchGameplay(gameplayVideoId, name)}
            >
              <img
                src={image}
                alt={name}
                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
              />

              {/* Play Overlay */}
              {gameplayVideoId && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                  <div className="bg-red-600 hover:bg-red-500 text-white rounded-full p-4 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg shadow-red-600/50">
                    <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Hype Upvote overlay */}
              <div
                onClick={handleHype}
                className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold shadow-md cursor-pointer transition-all duration-300 backdrop-blur-md border ${
                  isHyped
                    ? 'bg-orange-600 text-white border-orange-400/50 shadow-orange-500/30 scale-105'
                    : 'bg-black/70 text-orange-400 border-orange-500/20 hover:bg-orange-600 hover:text-white'
                }`}
                title="Hype this game!"
              >
                <span>🔥</span>
                <span>{hypeCount}</span>
              </div>

              {sourceCodeLink && (
                <div className="card-img_hover absolute inset-0 m-3 flex justify-end pointer-events-none">
                  <div
                    onClick={e => {
                      e.stopPropagation();
                      window.open(sourceCodeLink, '_blank');
                    }}
                    className="black-gradient flex h-10 w-10 cursor-pointer items-center justify-center rounded-full pointer-events-auto hover:scale-110 transition-transform"
                    title="View Official Site"
                  >
                    <img src={web} alt="web" className="h-1/2 w-1/2 object-contain" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5">
              <h3 className="text-[22px] font-bold text-white tracking-wide">{name}</h3>
              <p className="text-secondary mt-2 text-[14px] leading-relaxed line-clamp-3">
                {description}
              </p>
            </div>
          </div>

          <div className="mt-auto">
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map(tag => (
                <p key={tag.name} className={`text-[13px] ${tag.color}`}>
                  #{tag.name}
                </p>
              ))}
            </div>

            {gameplayVideoId && (
              <button
                onClick={() => onWatchGameplay(gameplayVideoId, name)}
                className="mt-5 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-[13px] font-bold tracking-wider uppercase py-2.5 px-4 rounded-xl shadow-md shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300"
              >
                <span>▶</span> Watch Gameplay
              </button>
            )}
          </div>
        </div>
      </Tilt>
    </motion.div>
  );
};

const Works = () => {
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; title: string } | null>(null);
  const [projects, setProjects] = useState<TProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGames = async () => {
      try {
        const response = await apiRequest<{
          success?: boolean;
          games?: ApiGame[];
        }>('/api/games');
        setProjects((response.games ?? []).filter(game => game.isActive).map(toProject));
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Could not load the game library.'));
      } finally {
        setLoading(false);
      }
    };

    void loadGames();
  }, []);

  return (
    <>
      <Header useMotion={true} {...config.sections.works} />

      <div className="flex w-full">
        <motion.p
          variants={fadeIn('', '', 0.1, 1)}
          className="text-secondary mt-3 max-w-3xl text-[17px] leading-[30px]"
        >
          {config.sections.works.content}
        </motion.p>
      </div>

      <ComingSoonBanner />

      <div className="mt-20 flex flex-wrap justify-center gap-7">
        {loading ? (
          <p className="text-white/60 text-center">Loading games...</p>
        ) : error ? (
          <p className="text-red-400 text-center">{error}</p>
        ) : projects.length === 0 ? (
          <p className="text-white text-center">No games available at the moment.</p>
        ) : (
          projects.map((project, index) => (
            <ProjectCard
              key={`project-${index}`}
              index={index}
              {...project}
              onWatchGameplay={(id, title) => setSelectedVideo({ id, title })}
            />
          ))
        )}
      </div>

      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-[#1d1836] border border-purple-500/30 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl shadow-purple-500/30"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
              <h3 className="text-white text-lg font-bold tracking-wide">
                🎥 {selectedVideo.title} — Gameplay Trailer
              </h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-secondary hover:text-white text-2xl font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Video Container */}
            <div className="relative aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                title={`${selectedVideo.title} Gameplay`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default SectionWrapper(Works, 'games');
