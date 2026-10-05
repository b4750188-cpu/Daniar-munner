import React from 'react';
import {
  ArrowLeft,
  Play,
  ExternalLink,
  Share2,
  Calendar,
  Tv,
  Award,
  Users,
  Film,
  CheckCircle
} from 'lucide-react';
import { Drama, Episode, ContentItem } from '../types/index.ts';
import { MediaCard } from '../components/MediaCard.tsx';

interface DramaDetailViewProps {
  drama: Drama;
  episodes: Episode[];
  relatedContent: ContentItem[];
  onBack: () => void;
  onOpenContentDetail: (item: ContentItem) => void;
}

export const DramaDetailView: React.FC<DramaDetailViewProps> = ({
  drama,
  episodes,
  relatedContent,
  onBack,
  onOpenContentDetail
}) => {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'episodes' | 'clips' | 'credits'>('overview');
  const [copied, setCopied] = React.useState(false);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full min-h-screen pb-24 space-y-10">
      {/* Cinematic Hero Backdrop */}
      <section className="relative w-full min-h-[480px] lg:min-h-[560px] flex items-end overflow-hidden border-b border-white/5 bg-[#06080d]">
        <img
          src={drama.backdropUrl}
          alt={drama.title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.55] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-[#06080d]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06080d]/90 via-transparent to-[#06080d]/70" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-24 w-full">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-pink-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Dramas</span>
          </button>

          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="bg-pink-600/90 text-white font-semibold px-2.5 py-1 rounded">
                {drama.year}
              </span>
              <span className="bg-white/10 text-zinc-300 px-2.5 py-1 rounded">
                {drama.network}
              </span>
              <span className="bg-white/10 text-zinc-300 px-2.5 py-1 rounded">
                {drama.totalEpisodes} Verified Episodes
              </span>
            </div>

            <h1 className="font-cinematic text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-wide">
              {drama.title}
            </h1>

            <p className="text-base sm:text-lg text-pink-300 font-medium font-syne">
              Dananeer Mobeen as <strong>{drama.character}</strong>
            </p>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
              {drama.synopsis}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={drama.officialPlaylistUrl || drama.officialSource}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-pink-600/30"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>WATCH / OPEN SOURCE</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={handleShare}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 text-xs font-medium uppercase tracking-wider border border-white/15 transition-all flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>{copied ? 'Link Copied!' : 'Share Drama'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 border-b border-white/10 pb-2">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'episodes', label: `Verified Episodes (${episodes.length})` },
            { id: 'clips', label: `Clips & OSTs (${relatedContent.length})` },
            { id: 'credits', label: 'Cast & Crew' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white font-cinematic">
                  Story Synopsis & Character Arc
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {drama.synopsis}
                </p>
              </div>

              {drama.accolades && drama.accolades.length > 0 && (
                <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
                  <h4 className="text-xs uppercase tracking-widest text-pink-400 font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    <span>Accolades & Critical Recognition</span>
                  </h4>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    {drama.accolades.map((acc, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                        <span>{acc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-4">
              <h4 className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
                Production Details
              </h4>
              <div className="space-y-3 text-xs text-zinc-300">
                <div>
                  <span className="text-zinc-500 block">Director</span>
                  <strong className="text-zinc-200">{drama.director}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Writer</span>
                  <strong className="text-zinc-200">{drama.writer}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Broadcast Network</span>
                  <strong className="text-zinc-200">{drama.network} ({drama.networkChannel})</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Official Portal</span>
                  <a
                    href={drama.officialSource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-400 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <span>Visit Network Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Verified Episodes */}
        {activeTab === 'episodes' && (
          <div className="py-8 space-y-6">
            <p className="text-xs text-zinc-400">
              Verified official full episodes streamed by official television network channels.
            </p>

            {episodes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {episodes.map(ep => (
                  <div
                    key={ep.id}
                    className="glass-panel rounded-2xl overflow-hidden border border-white/5 p-4 flex flex-col sm:flex-row gap-4 hover:border-pink-500/30 transition-all"
                  >
                    <div className="aspect-video sm:w-44 bg-zinc-900 rounded-xl overflow-hidden shrink-0 relative">
                      <img
                        src={ep.thumbnailUrl}
                        alt={ep.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-pink-600/90 flex items-center justify-center text-white">
                          <Play className="w-4 h-4 ml-0.5 fill-current" />
                        </div>
                      </div>
                      <span className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300 rounded">
                        {ep.duration}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <span className="text-[11px] text-pink-400 font-mono">
                          Episode {ep.episodeNumber} · {ep.airDate}
                        </span>
                        <h4 className="text-sm font-semibold text-white">
                          {ep.title}
                        </h4>
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                          {ep.synopsis}
                        </p>
                      </div>

                      <a
                        href={ep.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 font-medium"
                      >
                        <span>Watch Official Stream</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center glass-panel rounded-2xl border border-white/5 text-zinc-400 text-sm">
                No episodes currently indexed. Additional verified episodes will be linked as available.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Clips & Related */}
        {activeTab === 'clips' && (
          <div className="py-8 space-y-6">
            {relatedContent.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedContent.map(item => (
                  <MediaCard key={item.id} item={item} onOpenDetail={onOpenContentDetail} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center glass-panel rounded-2xl border border-white/5 text-zinc-400 text-sm">
                No individual clips indexed for this drama yet.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Cast & Crew */}
        {activeTab === 'credits' && (
          <div className="py-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl glass-panel border border-white/5">
                <span className="text-xs text-pink-400 font-semibold uppercase">Lead Role</span>
                <h5 className="text-base font-bold text-white mt-1">Dananeer Mobeen</h5>
                <p className="text-xs text-zinc-400">as {drama.character}</p>
              </div>

              {drama.coStars.map((actor, idx) => (
                <div key={idx} className="p-4 rounded-xl glass-panel border border-white/5">
                  <span className="text-xs text-zinc-500 font-semibold uppercase">Co-Star</span>
                  <h5 className="text-base font-bold text-zinc-200 mt-1">{actor}</h5>
                  <p className="text-xs text-zinc-400">Cast Ensemble</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
