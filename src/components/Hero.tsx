import React from 'react';
import { Play, Compass, ExternalLink, Sparkles } from 'lucide-react';

interface HeroProps {
  onStartExploring: () => void;
  onExploreVideos: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartExploring, onExploreVideos }) => {
  const [imageError, setImageError] = React.useState(false);
  const heroImageSrc = '/src/assets/images/dananeer_hero_cinematic_1791045480240.jpg';

  return (
    <section className="relative w-full min-h-[580px] lg:min-h-[720px] flex items-center justify-center overflow-hidden border-b border-white/5 bg-[#06080d]">
      {/* Background Image / Ambient Scrim */}
      <div className="absolute inset-0 z-0">
        {!imageError ? (
          <img
            src={heroImageSrc}
            alt="Dananeer Mobeen Cinematic Editorial"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center lg:object-[center_28%] filter brightness-[0.72] contrast-[1.08] transition-transform duration-1000 scale-[1.02] hover:scale-100"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0c1220] via-[#080b12] to-[#120817]" />
        )}

        {/* Cinematic Multi-layered Contrast Scrims */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-[#06080d]/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06080d]/90 via-[#06080d]/40 to-[#06080d]/85" />
        <div className="absolute inset-0 bg-radial-[circle_at_center] from-pink-500/10 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 flex flex-col items-center text-center">
        {/* Quiet Kicker */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 text-xs text-zinc-300">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span className="tracking-widest uppercase text-[11px] font-medium text-pink-200">
            Public Content Discovery Archive
          </span>
        </div>

        {/* Editorial Heading */}
        <h1 className="font-cinematic text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[0.12em] text-white uppercase text-balance max-w-5xl leading-[1.05] drop-shadow-2xl">
          DANANEER MUBEEN
        </h1>

        {/* Subtitle */}
        <p className="font-syne text-xl sm:text-2xl lg:text-3xl text-pink-300/90 font-medium tracking-wide mt-4 mb-6">
          Explore her world.
        </p>

        {/* Descriptive prose */}
        <p className="text-sm sm:text-base lg:text-lg text-zinc-300/90 max-w-2xl font-normal leading-relaxed text-balance mb-8">
          A dedicated discovery platform indexing publicly available videos, verified social updates,
          dramatic television roles, and press appearances into one cinematic, searchable destination.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto">
          <button
            onClick={onStartExploring}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-pink-500 text-white font-semibold text-sm tracking-wider uppercase shadow-lg shadow-pink-600/30 hover:shadow-pink-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>START EXPLORING</span>
          </button>

          <button
            onClick={onExploreVideos}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm tracking-wider uppercase border border-white/15 backdrop-blur-md hover:border-pink-500/40 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 text-pink-400 fill-pink-400" />
            <span>EXPLORE VIDEOS</span>
          </button>
        </div>

        {/* Career highlights ticker / credits */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-zinc-400">
          <span className="text-zinc-500 uppercase tracking-widest text-[11px]">Key Highlights</span>
          <span className="text-zinc-300">Sinf-e-Aahan (Sidra)</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-300">Muhabbat Gumshuda Meri (Zobia)</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-300">Very Filmy (Sania)</span>
          <span className="text-zinc-600">·</span>
          <span className="text-pink-400 font-medium">Lux Style Award Winner</span>
        </div>
      </div>
    </section>
  );
};
