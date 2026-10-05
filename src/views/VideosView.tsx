import React from 'react';
import {
  PlayCircle,
  Youtube,
  ExternalLink,
  Film,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Radio,
  Tv,
  Camera,
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { ContentItem, VideoArchiveCategory } from '../types/index.ts';
import { MediaCard } from '../components/MediaCard.tsx';
import { EmptyState } from '../components/EmptyState.tsx';

interface VideosViewProps {
  items: ContentItem[];
  onOpenDetail: (item: ContentItem) => void;
  onNavigateTab?: (tab: string) => void;
}

export const ARCHIVE_CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All Videos' },
  { id: 'Latest Discoveries', label: 'Latest Discoveries' },
  { id: 'Interviews', label: 'Interviews' },
  { id: 'Dramas', label: 'Dramas' },
  { id: 'Episodes', label: 'Episodes' },
  { id: 'Behind the Scenes', label: 'Behind the Scenes' },
  { id: 'Vlogs', label: 'Vlogs' },
  { id: 'Podcasts', label: 'Podcasts' },
  { id: 'Events', label: 'Events' },
  { id: 'Awards', label: 'Awards' },
  { id: 'Fashion', label: 'Fashion' },
  { id: 'Press', label: 'Press' },
  { id: 'Promotions', label: 'Promotions' },
  { id: 'Historical / Viral', label: 'Historical / Viral' },
  { id: 'Official Content', label: 'Official Content' }
];

export const VideosView: React.FC<VideosViewProps> = ({ items, onOpenDetail, onNavigateTab }) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = React.useState<string>('all');
  const [sortOrder, setSortOrder] = React.useState<'latest' | 'oldest'>('latest');
  const [visibleCount, setVisibleCount] = React.useState<number>(16);

  // Filter video-like items
  const allVideoItems = React.useMemo(() => {
    return items.filter(i =>
      ['video', 'reel', 'episode', 'interview', 'clip', 'behind-the-scenes'].includes(i.contentType) ||
      i.platform === 'YouTube' ||
      i.platform === 'Broadcast' ||
      i.platform === 'Interview'
    );
  }, [items]);

  // Lead video spotlight (first item with embedUrl or first video)
  const featuredVideo = allVideoItems.find(i => i.embedUrl && i.verificationStatus === 'VERIFIED') || allVideoItems[0];

  // Filtered & sorted list
  const filteredVideos = React.useMemo(() => {
    let result = [...allVideoItems];

    // Category filter (One video can belong to multiple categories)
    if (selectedCategory !== 'all') {
      result = result.filter(item => {
        if (item.categories && item.categories.includes(selectedCategory)) {
          return true;
        }
        // Fallback checks
        const text = `${item.title} ${item.description} ${item.author}`.toLowerCase();
        if (selectedCategory === 'Interviews' && (item.contentType === 'interview' || text.includes('interview'))) return true;
        if (selectedCategory === 'Dramas' && (item.dramaId || text.includes('drama') || text.includes('hurmat'))) return true;
        if (selectedCategory === 'Episodes' && (item.contentType === 'episode' || item.episodeNumber !== null)) return true;
        if (selectedCategory === 'Behind the Scenes' && (text.includes('bts') || text.includes('behind the scenes'))) return true;
        if (selectedCategory === 'Vlogs' && text.includes('vlog')) return true;
        if (selectedCategory === 'Podcasts' && text.includes('podcast')) return true;
        if (selectedCategory === 'Historical / Viral' && (text.includes('pawri') || text.includes('viral'))) return true;
        if (selectedCategory === 'Official Content' && (item.sourceClassification === 'OFFICIAL_BROADCASTER' || item.sourceClassification === 'OFFICIAL_PERSONAL')) return true;
        if (selectedCategory === 'Latest Discoveries' && item.provenance === 'LIVE_DISCOVERY') return true;
        return false;
      });
    }

    // Platform filter
    if (selectedPlatform !== 'all') {
      result = result.filter(item => item.platform.toLowerCase() === selectedPlatform.toLowerCase());
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);
      result = result.filter(item => {
        const full = `${item.title} ${item.description} ${item.author} ${item.tags.join(' ')} ${item.people.join(' ')}`.toLowerCase();
        return tokens.every(t => full.includes(t));
      });
    }

    // Sort order
    result.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });

    // Safeguard against duplicate IDs
    const seenIds = new Set<string>();
    return result.filter(item => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });
  }, [allVideoItems, selectedCategory, selectedPlatform, searchQuery, sortOrder]);

  const displayedVideos = filteredVideos.slice(0, visibleCount);
  const hasMore = visibleCount < filteredVideos.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 min-h-screen">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-pink-400 font-semibold">
          <PlayCircle className="w-4 h-4" />
          <span>Cinematic Streaming & Public Video Archive</span>
        </div>
        <h1 className="font-cinematic text-3xl sm:text-4xl lg:text-5xl font-bold tracking-wider text-white">
          VIDEOS & APPEARANCES
        </h1>
        <p className="text-sm text-zinc-400 font-normal max-w-2xl leading-relaxed">
          Comprehensive multi-source video directory featuring verified broadcasts, candid press interviews, behind-the-scenes footage, and official vlogs.
        </p>
      </div>

      {/* Video Discovery Section Banner */}
      {onNavigateTab && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/20 to-black/40 border border-pink-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                New: Public Video Discovery Section
              </h3>
              <p className="text-[11px] text-zinc-400">
                Explore dedicated categorized feeds for <strong>Trailers</strong>, <strong>Full Dramas / Episodes</strong>, and <strong>Shorts</strong> with multi-attribute filtering.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('discovery')}
            className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap self-start sm:self-auto shrink-0 shadow-md shadow-pink-600/20"
          >
            Open Video Discovery →
          </button>
        </div>
      )}

      {/* Featured Video Player Spotlight */}
      {featuredVideo && !searchQuery && selectedCategory === 'all' && (
        <section className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Embed / Media Container */}
            <div className="lg:col-span-8 bg-black aspect-video flex items-center justify-center relative">
              {featuredVideo.embedUrl ? (
                <iframe
                  src={featuredVideo.embedUrl}
                  title={featuredVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full relative flex items-center justify-center p-6 text-center">
                  <img
                    src={featuredVideo.thumbnailUrl}
                    alt={featuredVideo.title}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover filter brightness-[0.4]"
                  />
                  <div className="relative z-10 space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-full bg-pink-600 border border-pink-400 flex items-center justify-center text-white shadow-xl">
                      <PlayCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white drop-shadow">
                      {featuredVideo.title}
                    </h3>
                    <a
                      href={featuredVideo.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-lg"
                    >
                      <span>Watch on {featuredVideo.platform}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Video Details Pane */}
            <div className="lg:col-span-4 p-6 lg:p-8 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-pink-400 font-semibold uppercase tracking-wider">
                  <Youtube className="w-4 h-4" />
                  <span>Featured Video Archive</span>
                </div>

                <h2 className="text-xl font-bold text-white leading-snug">
                  {featuredVideo.title}
                </h2>

                <div className="text-xs text-zinc-400 flex items-center gap-2">
                  <span>Published {new Date(featuredVideo.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  {featuredVideo.author && <span>· By {featuredVideo.author}</span>}
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-4">
                  {featuredVideo.description}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                <button
                  onClick={() => onOpenDetail(featuredVideo)}
                  className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  Full Details & Provenance
                </button>

                <a
                  href={featuredVideo.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-all"
                >
                  <span>Open Source</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Category Tabs (Archive Sections) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4 text-pink-400" />
            <span>Archive Categories</span>
          </span>
          <span className="text-xs text-zinc-500 font-mono">
            {filteredVideos.length} videos available
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {ARCHIVE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setVisibleCount(16);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setVisibleCount(16);
            }}
            placeholder="Search videos by title, drama, character, or channel..."
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 focus:border-pink-500/50 rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none transition-colors"
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

        {/* Platform Dropdown */}
        <div className="flex items-center gap-3">
          <select
            value={selectedPlatform}
            onChange={e => {
              setSelectedPlatform(e.target.value);
              setVisibleCount(16);
            }}
            className="px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500/50"
          >
            <option value="all">All Sources</option>
            <option value="YouTube">YouTube</option>
            <option value="Broadcast">Broadcast / TV</option>
            <option value="Interview">Interviews</option>
            <option value="WebSource">Web Articles</option>
            <option value="Instagram">Instagram</option>
          </select>

          {/* Sort Dropdown */}
          <button
            onClick={() => setSortOrder(prev => prev === 'latest' ? 'oldest' : 'latest')}
            className="px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-pink-500/40 text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all whitespace-nowrap"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-pink-400" />
            <span>{sortOrder === 'latest' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {/* Video Grid */}
      {displayedVideos.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedVideos.map(item => (
              <MediaCard key={item.id} item={item} onOpenDetail={onOpenDetail} />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => setVisibleCount(prev => prev + 16)}
                className="px-8 py-3 rounded-xl bg-white/5 hover:bg-pink-600/20 text-pink-300 hover:text-white border border-pink-500/30 font-semibold text-xs uppercase tracking-wider transition-all shadow-lg shadow-pink-950/20"
              >
                Load More Videos ({filteredVideos.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="NO VIDEOS IN THIS SECTION"
          message={`No verified video items matched your current filters${searchQuery ? ` for "${searchQuery}"` : ''}. Choose another category or clear your search to explore.`}
          onResetFilters={() => {
            setSelectedCategory('all');
            setSelectedPlatform('all');
            setSearchQuery('');
          }}
        />
      )}
    </div>
  );
};
