import React from 'react';
import { Search, Filter, SlidersHorizontal, RefreshCw, X } from 'lucide-react';
import { ContentItem, Drama } from '../types/index.ts';
import { MediaCard } from '../components/MediaCard.tsx';
import { EmptyState } from '../components/EmptyState.tsx';

interface ExploreViewProps {
  items: ContentItem[];
  dramas: Drama[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenDetail: (item: ContentItem) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  items,
  dramas,
  searchQuery,
  onSearchChange,
  onOpenDetail
}) => {
  const [platformFilter, setPlatformFilter] = React.useState('All');
  const [typeFilter, setTypeFilter] = React.useState('All');
  const [dramaFilter, setDramaFilter] = React.useState('All');
  const [yearFilter, setYearFilter] = React.useState('All');
  const [sortOrder, setSortOrder] = React.useState<'latest' | 'oldest'>('latest');

  const platforms = ['All', 'YouTube', 'Instagram', 'X', 'Broadcast', 'Interview'];
  const contentTypes = ['All', 'video', 'reel', 'post', 'photo', 'interview', 'appearance', 'behind-the-scenes'];
  const years = ['All', '2026', '2025', '2024', '2023', '2022', '2021'];

  // Dynamic Filtering Logic
  const filteredItems = React.useMemo(() => {
    let result = [...items];

    // Search query matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(q);
        const descMatch = item.description.toLowerCase().includes(q);
        const captionMatch = item.caption?.toLowerCase().includes(q);
        const tagMatch = item.tags.some(t => t.toLowerCase().includes(q));
        const peopleMatch = item.people.some(p => p.toLowerCase().includes(q));
        const authorMatch = item.author.toLowerCase().includes(q);
        return titleMatch || descMatch || captionMatch || tagMatch || peopleMatch || authorMatch;
      });
    }

    // Platform filter
    if (platformFilter !== 'All') {
      result = result.filter(item => item.platform.toLowerCase() === platformFilter.toLowerCase());
    }

    // Content type filter
    if (typeFilter !== 'All') {
      result = result.filter(item => item.contentType.toLowerCase() === typeFilter.toLowerCase());
    }

    // Drama filter
    if (dramaFilter !== 'All') {
      result = result.filter(item => item.dramaId === dramaFilter);
    }

    // Year filter
    if (yearFilter !== 'All') {
      result = result.filter(item => {
        const y = new Date(item.publishedAt).getFullYear().toString();
        return y === yearFilter;
      });
    }

    // Sort order
    if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
    } else {
      result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }

    // Ensure unique IDs
    const seenIds = new Set<string>();
    return result.filter(item => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });
  }, [items, searchQuery, platformFilter, typeFilter, dramaFilter, yearFilter, sortOrder]);

  const hasActiveFilters =
    platformFilter !== 'All' ||
    typeFilter !== 'All' ||
    dramaFilter !== 'All' ||
    yearFilter !== 'All' ||
    searchQuery.trim().length > 0;

  const resetAllFilters = () => {
    setPlatformFilter('All');
    setTypeFilter('All');
    setDramaFilter('All');
    setYearFilter('All');
    onSearchChange('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 min-h-screen">
      {/* Header */}
      <div className="space-y-3 text-center sm:text-left">
        <h1 className="font-cinematic text-3xl sm:text-4xl lg:text-5xl font-bold tracking-wider text-white">
          EXPLORE
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 font-normal max-w-xl">
          Discover Dananeer Mobeen's publicly available content in one place.
        </p>
      </div>

      {/* Large Search Input */}
      <div className="relative w-full max-w-3xl">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-zinc-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search videos, posts, dramas, interviews..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-12 py-3.5 bg-white/5 hover:bg-white/10 focus:bg-white/10 text-white placeholder-zinc-500 rounded-2xl border border-white/10 focus:border-pink-500 focus:outline-none transition-all text-sm sm:text-base shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-4 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Bars */}
      <div className="space-y-4 pt-2">
        {/* Platform Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mr-1 shrink-0">
            Platform:
          </span>
          {platforms.map(p => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                platformFilter === p
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Content Type Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mr-1 shrink-0">
            Format:
          </span>
          {contentTypes.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap shrink-0 ${
                typeFilter === t
                  ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-sm'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Drama & Year Dropdowns Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Drama Select */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="text-zinc-500">Drama:</span>
              <select
                value={dramaFilter}
                onChange={e => setDramaFilter(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
              >
                <option value="All">All Dramas</option>
                {dramas.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Select */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="text-zinc-500">Year:</span>
              <select
                value={yearFilter}
                onChange={e => setYearFilter(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
              >
                {years.map(y => (
                  <option key={y} value={y}>
                    {y === 'All' ? 'All Years' : y}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset button if active */}
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="text-xs text-pink-400 hover:text-pink-300 underline underline-offset-4 transition-colors"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Sort order & Result count */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-zinc-400 font-mono">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
            </span>

            <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/5">
              <button
                onClick={() => setSortOrder('latest')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  sortOrder === 'latest' ? 'bg-pink-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Latest
              </button>
              <button
                onClick={() => setSortOrder('oldest')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  sortOrder === 'oldest' ? 'bg-pink-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Oldest
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Media Results Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <MediaCard key={item.id} item={item} onOpenDetail={onOpenDetail} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="NO MATCHING CONTENT FOUND"
          message={`No verified public content matched your current filters${searchQuery ? ` for "${searchQuery}"` : ''}. Try adjusting your keywords or clearing selected filters.`}
          onResetFilters={resetAllFilters}
        />
      )}
    </div>
  );
};
