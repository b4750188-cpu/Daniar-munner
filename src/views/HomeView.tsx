import React from 'react';
import { Hero } from '../components/Hero.tsx';
import { PlatformBar } from '../components/PlatformBar.tsx';
import { MediaCard } from '../components/MediaCard.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import { ContentItem, Drama, PlatformConfig } from '../types/index.ts';
import { Film, Sparkles, ChevronRight, Play, ExternalLink, Calendar, Star, ShieldCheck } from 'lucide-react';

interface HomeViewProps {
  items: ContentItem[];
  dramas: Drama[];
  platforms: PlatformConfig[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenDetail: (item: ContentItem) => void;
  onSelectDrama: (dramaId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  items,
  dramas,
  platforms,
  selectedCategory,
  onSelectCategory,
  onOpenDetail,
  onSelectDrama,
  onNavigateTab
}) => {
  // Filter items based on circular platform bar if selected
  const filteredItems = React.useMemo(() => {
    if (selectedCategory === 'All') return items;
    if (selectedCategory === 'Videos') {
      return items.filter(i => ['video', 'reel', 'episode', 'clip'].includes(i.contentType));
    }
    if (selectedCategory === 'Dramas') {
      return items.filter(i => Boolean(i.dramaId));
    }
    if (selectedCategory === 'Interviews') {
      return items.filter(i => i.contentType === 'interview');
    }
    if (selectedCategory === 'Photos') {
      return items.filter(i => i.contentType === 'photo');
    }
    return items.filter(i => i.platform.toLowerCase() === selectedCategory.toLowerCase());
  }, [items, selectedCategory]);

  // Section collections
  const uniqueItems = React.useMemo(() => {
    const seen = new Set<string>();
    return filteredItems.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [filteredItems]);

  const trendingItems = uniqueItems.slice(0, 4);
  const latestDiscovered = uniqueItems.slice(0, 8);
  const interviewsAndTalks = React.useMemo(() => {
    const seen = new Set<string>();
    return items
      .filter(i => i.contentType === 'interview')
      .filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
  }, [items]);

  return (
    <div className="w-full min-h-screen pb-24">
      {/* 1. Cinematic Hero */}
      <Hero
        onStartExploring={() => onNavigateTab('explore')}
        onExploreVideos={() => onNavigateTab('videos')}
      />

      {/* 2. Platform Navigation Bar */}
      <PlatformBar
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* Section: Trending Now */}
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-pink-400 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Discovery</span>
              </div>
              <h2 className="font-cinematic text-2xl sm:text-3xl font-bold text-white tracking-wider">
                TRENDING NOW
              </h2>
            </div>

            <button
              onClick={() => onNavigateTab('explore')}
              className="text-xs text-zinc-400 hover:text-pink-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {trendingItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingItems.map(item => (
                <MediaCard key={item.id} item={item} onOpenDetail={onOpenDetail} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="NO MEDIA AVAILABLE IN THIS CATEGORY"
              message={`No verified content is currently indexed under ${selectedCategory}. Discover content from other categories.`}
              onResetFilters={() => onSelectCategory('All')}
            />
          )}
        </section>

        {/* Section: Featured Dramas Spotlight */}
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-pink-400 font-semibold mb-1">
                <Film className="w-3.5 h-3.5" />
                <span>Television Career</span>
              </div>
              <h2 className="font-cinematic text-2xl sm:text-3xl font-bold text-white tracking-wider">
                ICONIC DRAMAS
              </h2>
            </div>

            <button
              onClick={() => onNavigateTab('dramas')}
              className="text-xs text-zinc-400 hover:text-pink-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>Explore Dramas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dramas.map(drama => (
              <div
                key={drama.id}
                onClick={() => onSelectDrama(drama.id)}
                className="group relative rounded-2xl overflow-hidden glass-panel border border-white/5 hover:border-pink-500/40 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 shadow-xl flex flex-col"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-900">
                  <img
                    src={drama.backdropUrl}
                    alt={drama.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-semibold text-pink-300 border border-white/10">
                    {drama.year} · {drama.network}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-xs text-pink-400 font-medium">As {drama.character}</span>
                    <h3 className="font-cinematic text-xl font-bold text-white truncate">
                      {drama.title}
                    </h3>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                    {drama.synopsis}
                  </p>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-mono">
                      {drama.totalEpisodes} Verified Episodes
                    </span>
                    <span className="text-pink-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      <span>View Drama</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Latest Discovered Content */}
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-pink-400 font-semibold mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Verified Public Index</span>
              </div>
              <h2 className="font-cinematic text-2xl sm:text-3xl font-bold text-white tracking-wider">
                LATEST DISCOVERED
              </h2>
            </div>

            <button
              onClick={() => onNavigateTab('explore')}
              className="text-xs text-zinc-400 hover:text-pink-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>Explore All Archive</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestDiscovered.map(item => (
              <MediaCard key={item.id} item={item} onOpenDetail={onOpenDetail} />
            ))}
          </div>
        </section>

        {/* Section: Press & In-Depth Interviews */}
        {interviewsAndTalks.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-end justify-between border-b border-white/5 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-pink-400 font-semibold mb-1">
                  <Star className="w-3.5 h-3.5" />
                  <span>Candid Conversations</span>
                </div>
                <h2 className="font-cinematic text-2xl sm:text-3xl font-bold text-white tracking-wider">
                  INTERVIEWS & PRESS
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {interviewsAndTalks.map(item => (
                <MediaCard key={item.id} item={item} onOpenDetail={onOpenDetail} />
              ))}
            </div>
          </section>
        )}

        {/* Independent Platform Attribution & Data Transparency Notice */}
        <section className="p-6 sm:p-8 rounded-2xl glass-panel border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-pink-400 font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Archive Transparency & Indexing Scope</span>
              </div>
              <h4 className="font-cinematic text-lg sm:text-xl font-bold text-white tracking-wider">
                INDEPENDENT CONTENT DISCOVERY & ARCHIVE
              </h4>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onNavigateTab('timeline')}
                className="px-4 py-2 rounded-xl bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white border border-pink-500/30 text-xs font-semibold uppercase tracking-wider transition-all"
              >
                Career Timeline
              </button>
              <button
                onClick={() => onNavigateTab('explore')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold uppercase tracking-wider border border-white/10 transition-all"
              >
                Full Index
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-400 leading-relaxed">
            <p>
              This archive indexes publicly accessible content from configured sources and verified search strategies. It does not claim ownership of third-party media. Videos and broadcasts remain securely hosted by their original platforms (YouTube, HUM TV, ARY Digital, Instagram, X).
            </p>
            <p>
              Coverage represents publicly discoverable results returned by configured query strategies. Scope depends on source availability, network indexing, API quotas, platform restrictions, and removed or private third-party content.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};
