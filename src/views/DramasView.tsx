import React from 'react';
import { Film, Calendar, Tv, ChevronRight, ExternalLink, Award } from 'lucide-react';
import { Drama } from '../types/index.ts';

interface DramasViewProps {
  dramas: Drama[];
  onSelectDrama: (dramaId: string) => void;
}

export const DramasView: React.FC<DramasViewProps> = ({ dramas, onSelectDrama }) => {
  const [filterYear, setFilterYear] = React.useState('All');
  const [filterStatus, setFilterStatus] = React.useState('All');

  const filteredDramas = React.useMemo(() => {
    return dramas.filter(d => {
      if (filterYear !== 'All' && d.year.toString() !== filterYear) return false;
      if (filterStatus !== 'All' && d.status !== filterStatus) return false;
      return true;
    });
  }, [dramas, filterYear, filterStatus]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 min-h-screen">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-pink-400 font-semibold">
          <Film className="w-4 h-4" />
          <span>Filmography & Television</span>
        </div>
        <h1 className="font-cinematic text-3xl sm:text-4xl lg:text-5xl font-bold tracking-wider text-white">
          DRAMAS
        </h1>
        <p className="text-sm text-zinc-400 font-normal max-w-xl">
          Explore Dananeer Mobeen's acting journey, leading characters, and acclaimed television serials.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {['All', 'Completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === status
                  ? 'bg-pink-600 text-white'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              {status === 'All' ? 'All Dramas' : status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>Year:</span>
          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
          >
            <option value="All">All Years</option>
            <option value="2024">2024 (Very Filmy)</option>
            <option value="2023">2023 (Muhabbat Gumshuda Meri)</option>
            <option value="2021">2021 (Sinf-e-Aahan)</option>
          </select>
        </div>
      </div>

      {/* Drama Posters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDramas.map(drama => (
          <div
            key={drama.id}
            onClick={() => onSelectDrama(drama.id)}
            className="group glass-panel rounded-2xl overflow-hidden border border-white/5 hover:border-pink-500/40 cursor-pointer transition-all duration-300 hover:-translate-y-2 shadow-2xl flex flex-col justify-between"
          >
            <div>
              {/* Poster / Backdrop */}
              <div className="aspect-[16/10] w-full bg-zinc-900 overflow-hidden relative">
                <img
                  src={drama.backdropUrl}
                  alt={drama.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent" />

                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-semibold text-pink-300 border border-white/10">
                  {drama.year} · {drama.network}
                </div>

                <div className="absolute bottom-3 left-4 right-4 space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-pink-400">
                    Character: {drama.character}
                  </span>
                  <h3 className="font-cinematic text-2xl font-bold text-white leading-tight">
                    {drama.title}
                  </h3>
                </div>
              </div>

              {/* Drama Details */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Tv className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{drama.networkChannel}</span>
                  </span>
                  <span>·</span>
                  <span className="font-mono text-zinc-300">{drama.totalEpisodes} Episodes</span>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed line-clamp-3">
                  {drama.synopsis}
                </p>

                {drama.accolades && drama.accolades.length > 0 && (
                  <div className="p-3 rounded-xl bg-pink-950/20 border border-pink-500/20 text-xs text-pink-300 flex items-start gap-2">
                    <Award className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{drama.accolades[0]}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Drama Actions */}
            <div className="p-6 pt-0 border-t border-white/5 pt-4 flex items-center justify-between">
              <a
                href={drama.officialSource}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <span>Official Network Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1 shadow-md shadow-pink-600/30">
                <span>View Drama</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
