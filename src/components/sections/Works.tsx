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
    variants={fadeIn('up', 'spring', 0.15, 0.75)}
    className="group relative mt-12 block overflow-hidden rounded-3xl border border-pink-400/30 bg-[linear-gradient(120deg,#17102d_0%,#4f1769_45%,#c02c78_100%)] p-6 shadow-[0_0_50px_rgba(219,39,119,0.14)] transition-all duration-500 hover:-translate-y-1 hover:border-cyan-300/50 hover:shadow-[0_0_60px_rgba(34,211,238,0.18)] sm:p-9"
  >
    <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-orange-400/30 blur-3xl transition-transform duration-700 group-hover:scale-125" />
    <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
    <div className="relative z-10 flex items-center justify-between gap-6">
      <div>
        <span className="inline-flex rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-200 backdrop-blur-md">
          Coming Soon
        </span>
        <h3 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
          Grand Theft Auto VI
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
          Vice City is calling. Get ready to experience GTA VI at Vortex Gaming Cafe.
        </p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-200 transition-all group-hover:gap-3">
          View official game <span aria-hidden="true">→</span>
        </span>
      </div>
      <div className="hidden shrink-0 select-none bg-gradient-to-b from-orange-200 via-pink-300 to-cyan-300 bg-clip-text text-[7rem] font-black italic leading-none text-transparent drop-shadow-[0_0_24px_rgba(236,72,153,0.45)] sm:block">
        VI
      </div>
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
