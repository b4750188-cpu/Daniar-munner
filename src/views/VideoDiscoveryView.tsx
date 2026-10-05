import React from 'react';
import {
  Compass,
  Film,
  Tv,
  Sparkles,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  PlayCircle,
  Clock,
  Globe,
  Tag,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Layers,
  ChevronRight,
  Share2,
  Video
} from 'lucide-react';
import { ContentItem, DiscoveryCategory } from '../types/index.ts';
import { MediaCard } from '../components/MediaCard.tsx';
import { EmptyState } from '../components/EmptyState.tsx';

interface VideoDiscoveryViewProps {
  items: ContentItem[];
  onOpenDetail: (item: ContentItem) => void;
  onNavigateTab?: (tab: string) => void;
}

export const VideoDiscoveryView: React.FC<VideoDiscoveryViewProps> = ({
  items,
  onOpenDetail,
  onNavigateTab
}) => {
  // Category tabs
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>('all');
  const [selectedGenre, setSelectedGenre] = React.useState<string>('all');
  const [selectedCountry, setSelectedCountry] = React.useState<string>('all');
  const [selectedDuration, setSelectedDuration] = React.useState<string>('all');
  const [selectedYear, setSelectedYear] = React.useState<string>('all');
  const [sortOrder, setSortOrder] = React.useState<'latest' | 'oldest' | 'duration'>('latest');
  const [visibleCount, setVisibleCount] = React.useState<number>(12);

  // Filter video-relevant items
  const discoveryItems = React.useMemo(() => {
    return items.filter(item => {
      // Must be a video-type asset
      const isVideo =
        ['video', 'episode', 'reel', 'interview', 'clip', 'behind-the-scenes', 'promo'].includes(item.contentType) ||
        item.platform === 'YouTube' ||
        item.platform === 'Broadcast' ||
        item.platform === 'Interview' ||
        Boolean(item.embedUrl);
      return isVideo;
    });
  }, [items]);

  // Apply all multi-factor filters
  const filteredItems = React.useMemo(() => {
    let result = [...discoveryItems];

    // 1. Category Filter: 'Trailers' | 'Full Dramas / Episodes' | 'Shorts'
    if (selectedCategory !== 'all') {
      result = result.filter(item => {
        if (item.discoveryCategory === selectedCategory) return true;
        // Fallback inference
        const titleLower = item.title.toLowerCase();
        if (selectedCategory === 'Trailers') {
          return (
            titleLower.includes('trailer') ||
            titleLower.includes('teaser') ||
            titleLower.includes('promo') ||
            titleLower.includes('first look') ||
            titleLower.includes('ost')
          );
        }
        if (selectedCategory === 'Full Dramas / Episodes') {
          return (
            item.contentType === 'episode' ||
            item.episodeNumber !== null ||
            Boolean(item.dramaId) ||
            titleLower.includes('episode') ||
            titleLower.includes('ep ')
          );
        }
        if (selectedCategory === 'Shorts') {
          return (
            item.contentType === 'reel' ||
            item.contentType === 'clip' ||
            titleLower.includes('#shorts') ||
            titleLower.includes('shorts') ||
            titleLower.includes('pawri') ||
            (item.duration && /^0:[0-5][0-9]$/.test(item.duration))
          );
        }
        return false;
      });
    }

    // 2. Language Filter
    if (selectedLanguage !== 'all') {
      result = result.filter(item => {
        const lang = (item.language || 'Urdu').toLowerCase();
        return lang === selectedLanguage.toLowerCase();
      });
    }

    // 3. Genre Filter
    if (selectedGenre !== 'all') {
      result = result.filter(item => {
        const g = (item.genre || 'Drama').toLowerCase();
        return g.includes(selectedGenre.toLowerCase());
      });
    }

    // 4. Country Filter
    if (selectedCountry !== 'all') {
      result = result.filter(item => {
        const c = (item.country || 'Pakistan').toLowerCase();
        return c === selectedCountry.toLowerCase();
      });
    }

    // 5. Duration Filter
    if (selectedDuration !== 'all') {
      result = result.filter(item => {
        if (!item.duration) return selectedDuration === 'short';
        const parts = item.duration.split(':').map(Number);
        let mins = 0;
        if (parts.length === 2) mins = parts[0] + parts[1] / 60;
        else if (parts.length === 3) mins = parts[0] * 60 + parts[1] + parts[2] / 60;

        if (selectedDuration === 'short') return mins < 5;
        if (selectedDuration === 'medium') return mins >= 5 && mins <= 20;
        if (selectedDuration === 'long') return mins > 20;
        return true;
      });
    }

    // 6. Year Filter
    if (selectedYear !== 'all') {
      result = result.filter(item => {
        const y = new Date(item.publishedAt).getFullYear().toString();
        return y === selectedYear;
      });
    }

    // 7. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);
      result = result.filter(item => {
        const haystack = `${item.title} ${item.description} ${item.author} ${item.genre || ''} ${item.language || ''} ${item.country || ''} ${item.tags.join(' ')}`.toLowerCase();
        return tokens.every(token => haystack.includes(token));
      });
    }

    // 8. Sorting
    result.sort((a, b) => {
      if (sortOrder === 'latest') {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
      if (sortOrder === 'oldest') {
        return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      }
      if (sortOrder === 'duration') {
        const getSec = (dur: string | null) => {
          if (!dur) return 0;
          const p = dur.split(':').map(Number);
          if (p.length === 2) return p[0] * 60 + p[1];
          if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
          return 0;
        };
        return getSec(b.duration) - getSec(a.duration);
      }
      return 0;
    });

    // Deduplicate IDs
    const seen = new Set<string>();
    return result.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [
    discoveryItems,
    selectedCategory,
    selectedLanguage,
    selectedGenre,
    selectedCountry,
    selectedDuration,
    selectedYear,
    searchQuery,
    sortOrder
  ]);

  const displayedItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;

  // Category counts
  const categoryCounts = React.useMemo(() => {
    const counts = {
      all: discoveryItems.length,
      trailers: 0,
      fullDramas: 0,
      shorts: 0
    };
    for (const item of discoveryItems) {
      const cat = item.discoveryCategory || 'Full Dramas / Episodes';
      if (cat === 'Trailers') counts.trailers++;
      else if (cat === 'Full Dramas / Episodes') counts.fullDramas++;
      else if (cat === 'Shorts') counts.shorts++;
    }
    return counts;
  }, [discoveryItems]);

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedLanguage('all');
    setSelectedGenre('all');
    setSelectedCountry('all');
    setSelectedDuration('all');
    setSelectedYear('all');
    setSearchQuery('');
    setSortOrder('latest');
    setVisibleCount(12);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 min-h-screen">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-pink-400 font-semibold">
          <Compass className="w-4 h-4" />
          <span>Public Video Discovery & Verified Index</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-cinematic text-3xl sm:text-4xl lg:text-5xl font-bold tracking-wider text-white">
              VIDEO DISCOVERY
            </h1>
            <p className="text-sm text-zinc-400 font-normal max-w-2xl mt-1 leading-relaxed">
              Explore officially broadcast full episodes, cinematic trailers, and verified short-form clips indexed exclusively from legitimate public platforms and broadcaster APIs.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Authorized Public Feeds · Zero Piracy</span>
          </div>
        </div>
      </div>

      {/* 3 Primary Category Selector Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Category 1: Trailers */}
        <button
          onClick={() => {
            setSelectedCategory(selectedCategory === 'Trailers' ? 'all' : 'Trailers');
            setVisibleCount(12);
          }}
          className={`p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
            selectedCategory === 'Trailers'
              ? 'bg-gradient-to-br from-pink-950/70 to-rose-950/50 border-pink-500 shadow-xl shadow-pink-950/40'
              : 'glass-panel border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5">
              {categoryCounts.trailers} videos
            </span>
          </div>
          <h3 className="font-cinematic text-lg font-bold text-white tracking-wide">
            1. Trailers & Teasers
          </h3>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
            First-look promos, official network teasers, and original drama soundtracks.
          </p>
          <div className="mt-3 text-[11px] text-pink-400 font-medium flex items-center gap-1">
            <span>{selectedCategory === 'Trailers' ? 'Active Filter (Click to Reset)' : 'Filter Trailers'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Category 2: Full Dramas / Episodes */}
        <button
          onClick={() => {
            setSelectedCategory(selectedCategory === 'Full Dramas / Episodes' ? 'all' : 'Full Dramas / Episodes');
            setVisibleCount(12);
          }}
          className={`p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
            selectedCategory === 'Full Dramas / Episodes'
              ? 'bg-gradient-to-br from-pink-950/70 to-rose-950/50 border-pink-500 shadow-xl shadow-pink-950/40'
              : 'glass-panel border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <Tv className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5">
              {categoryCounts.fullDramas} videos
            </span>
          </div>
          <h3 className="font-cinematic text-lg font-bold text-white tracking-wide">
            2. Full Dramas & Episodes
          </h3>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
            Official broadcaster episodes streamed legally on HUM TV, ARY Digital & Green TV.
          </p>
          <div className="mt-3 text-[11px] text-pink-400 font-medium flex items-center gap-1">
            <span>{selectedCategory === 'Full Dramas / Episodes' ? 'Active Filter (Click to Reset)' : 'Filter Full Episodes'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Category 3: Shorts */}
        <button
          onClick={() => {
            setSelectedCategory(selectedCategory === 'Shorts' ? 'all' : 'Shorts');
            setVisibleCount(12);
          }}
          className={`p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
            selectedCategory === 'Shorts'
              ? 'bg-gradient-to-br from-pink-950/70 to-rose-950/50 border-pink-500 shadow-xl shadow-pink-950/40'
              : 'glass-panel border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5">
              {categoryCounts.shorts} videos
            </span>
          </div>
          <h3 className="font-cinematic text-lg font-bold text-white tracking-wide">
            3. Shorts & Viral Clips
          </h3>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
            Short-form reels, candid clips, on-set moments, and iconic viral breakthroughs.
          </p>
          <div className="mt-3 text-[11px] text-pink-400 font-medium flex items-center gap-1">
            <span>{selectedCategory === 'Shorts' ? 'Active Filter (Click to Reset)' : 'Filter Shorts'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* Multi-Factor Filter & Search Controls */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setVisibleCount(12);
              }}
              placeholder="Search by title, drama, publisher, genre, or keyword..."
              className="w-full pl-10 pr-8 py-2.5 bg-black/40 border border-white/10 focus:border-pink-500/50 rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Order */}
          <button
            onClick={() => {
              setSortOrder(prev => (prev === 'latest' ? 'oldest' : prev === 'oldest' ? 'duration' : 'latest'));
            }}
            className="px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-pink-500/40 text-xs text-zinc-300 hover:text-white flex items-center gap-2 transition-all whitespace-nowrap"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-pink-400" />
            <span>
              {sortOrder === 'latest'
                ? 'Sort: Newest First'
                : sortOrder === 'oldest'
                ? 'Sort: Oldest First'
                : 'Sort: Longest Duration'}
            </span>
          </button>
        </div>

        {/* Extended Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-white/5 text-xs">
          {/* Category Dropdown */}
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setVisibleCount(12);
              }}
              className="w-full px-2.5 py-2 bg-black/40 border border-white/10 rounded-lg text-zinc-300 focus:outline-none focus:border-pink-500 text-xs"
            >
              <option value="all">All (3 Categories)</option>
              <option value="Trailers">Trailers</option>
              <option value="Full Dramas / Episodes">Full Dramas / Episodes</option>
              <option value="Shorts">Shorts</option>
            </select>
          </div>

          {/* Language Dropdown */}
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Language</label>
            <select
              value={selectedLanguage}
              onChange={e => {
                setSelectedLanguage(e.target.value);
                setVisibleCount(12);
              }}
              className="w-full px-2.5 py-2 bg-black/40 border border-white/10 rounded-lg text-zinc-300 focus:outline-none focus:border-pink-500 text-xs"
            >
              <option value="all">All Languages</option>
              <option value="Urdu">Urdu</option>
              <option value="English">English</option>
            </select>
          </div>

          {/* Genre Dropdown */}
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Genre</label>
            <select
              value={selectedGenre}
              onChange={e => {
                setSelectedGenre(e.target.value);
                setVisibleCount(12);
              }}
              className="w-full px-2.5 py-2 bg-black/40 border border-white/10 rounded-lg text-zinc-300 focus:outline-none focus:border-pink-500 text-xs"
            >
              <option value="all">All Genres</option>
              <option value="Drama">Drama</option>
              <option value="Romance">Romance & Youth</option>
              <option value="Military">Military Drama</option>
              <option value="Comedy">Romantic Comedy</option>
              <option value="Interview">Interview & Talks</option>
              <option value="Behind the Scenes">Behind the Scenes</option>
              <option value="Lifestyle">Lifestyle & Vlog</option>
            </select>
          </div>

          {/* Country Dropdown */}
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Country</label>
            <select
              value={selectedCountry}
              onChange={e => {
                setSelectedCountry(e.target.value);
                setVisibleCount(12);
              }}
              className="w-full px-2.5 py-2 bg-black/40 border border-white/10 rounded-lg text-zinc-300 focus:outline-none focus:border-pink-500 text-xs"
            >
              <option value="all">All Countries</option>
              <option value="Pakistan">Pakistan</option>
              <option value="International">International</option>
            </select>
          </div>

          {/* Duration Dropdown */}
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Duration</label>
            <select
              value={selectedDuration}
              onChange={e => {
                setSelectedDuration(e.target.value);
                setVisibleCount(12);
              }}
              className="w-full px-2.5 py-2 bg-black/40 border border-white/10 rounded-lg text-zinc-300 focus:outline-none focus:border-pink-500 text-xs"
            >
              <option value="all">All Durations</option>
              <option value="short">Short (&lt; 5 min)</option>
              <option value="medium">Medium (5–20 min)</option>
              <option value="long">Long (&gt; 20 min)</option>
            </select>
          </div>

          {/* Year Dropdown */}
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Release Year</label>
            <select
              value={selectedYear}
              onChange={e => {
                setSelectedYear(e.target.value);
                setVisibleCount(12);
              }}
              className="w-full px-2.5 py-2 bg-black/40 border border-white/10 rounded-lg text-zinc-300 focus:outline-none focus:border-pink-500 text-xs"
            >
              <option value="all">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
          </div>
        </div>

        {/* Active Filter Badges */}
        {(selectedCategory !== 'all' ||
          selectedLanguage !== 'all' ||
          selectedGenre !== 'all' ||
          selectedCountry !== 'all' ||
          selectedDuration !== 'all' ||
          selectedYear !== 'all' ||
          searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="text-zinc-500 text-[11px]">Active Filters:</span>
            {selectedCategory !== 'all' && (
              <span className="px-2 py-0.5 rounded bg-pink-950/60 text-pink-300 border border-pink-500/30">
                Category: {selectedCategory}
              </span>
            )}
            {selectedLanguage !== 'all' && (
              <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/10">
                Language: {selectedLanguage}
              </span>
            )}
            {selectedGenre !== 'all' && (
              <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/10">
                Genre: {selectedGenre}
              </span>
            )}
            {selectedDuration !== 'all' && (
              <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/10">
                Duration: {selectedDuration}
              </span>
            )}
            {selectedYear !== 'all' && (
              <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/10">
                Year: {selectedYear}
              </span>
            )}
            {searchQuery && (
              <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/10">
                Query: "{searchQuery}"
              </span>
            )}
            <button
              onClick={resetAllFilters}
              className="text-pink-400 hover:text-pink-300 font-medium text-[11px] underline ml-auto"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-pink-400" />
          <h2 className="text-sm uppercase tracking-wider font-semibold text-white">
            Discovered Videos ({filteredItems.length})
          </h2>
        </div>
        <span className="text-xs text-zinc-500 font-mono">
          Showing {displayedItems.length} of {filteredItems.length}
        </span>
      </div>

      {/* Video Cards Grid */}
      {displayedItems.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedItems.map(item => (
              <div key={item.id} className="relative group">
                <MediaCard item={item} onOpenDetail={onOpenDetail} />
                {/* Discovery Section Overlay Tag */}
                <div className="absolute top-3 right-3 pointer-events-none z-10 flex flex-col items-end gap-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md bg-black/80 text-pink-300 border border-pink-500/30">
                    {item.discoveryCategory || 'Verified Stream'}
                  </span>
                  {item.genre && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium backdrop-blur-md bg-black/70 text-zinc-300 border border-white/10">
                      {item.genre}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-6">
              <button
                onClick={() => setVisibleCount(prev => prev + 12)}
                className="px-8 py-3 rounded-xl bg-white/5 hover:bg-pink-600/20 text-pink-300 hover:text-white border border-pink-500/30 font-semibold text-xs uppercase tracking-wider transition-all shadow-lg shadow-pink-950/20"
              >
                Load More Discovery Videos ({filteredItems.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="NO DISCOVERED VIDEOS MATCH CRITERIA"
          message={`No verified video items matched your current filter criteria${
            searchQuery ? ` for "${searchQuery}"` : ''
          }. Try clearing your filters or choosing another category.`}
          onResetFilters={resetAllFilters}
        />
      )}

      {/* Source Legitimacy & Legal Attribution Notice */}
      <section className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-pink-400 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Strict Copyright & Open Source Indexing Policy</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          DANANEER indexes only legally public content made available by verified rights holders (HUM TV, ARY Digital, Green TV, ISPR, and verified official handles) via official APIs and embed protocols. No video files are copied, rehosted, or downloaded. Click any video to stream through the rights holder's official player or open the verified source.
        </p>
      </section>
    </div>
  );
};
