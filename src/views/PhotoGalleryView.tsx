import React from 'react';
import { Camera, ExternalLink, Filter, Sparkles } from 'lucide-react';
import { ContentItem } from '../types/index.ts';

interface PhotoGalleryViewProps {
  items: ContentItem[];
  onOpenDetail: (item: ContentItem) => void;
}

export const PhotoGalleryView: React.FC<PhotoGalleryViewProps> = ({ items, onOpenDetail }) => {
  const [selectedTag, setSelectedTag] = React.useState('all');

  const photoItems = React.useMemo(() => {
    // Collect all items with photo/image representations
    const list = items.filter(i =>
      i.contentType === 'photo' ||
      i.tags.includes('photoshoot') ||
      i.tags.includes('editorial') ||
      i.tags.includes('fashion') ||
      Boolean(i.thumbnailUrl)
    );

    if (selectedTag === 'all') return list;
    return list.filter(i => i.tags.includes(selectedTag) || i.contentType === selectedTag);
  }, [items, selectedTag]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 min-h-screen">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-pink-400 font-semibold">
          <Camera className="w-4 h-4" />
          <span>Visual Photography Archive</span>
        </div>
        <h1 className="font-cinematic text-3xl sm:text-4xl lg:text-5xl font-bold tracking-wider text-white">
          PHOTO GALLERY
        </h1>
        <p className="text-sm text-zinc-400 font-normal max-w-xl">
          High-resolution photography, bridal couture editorials, and public red-carpet appearances.
        </p>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-white/5">
        {[
          { id: 'all', label: 'All Photographs' },
          { id: 'photoshoot', label: 'Couture Photoshoots' },
          { id: 'fashion', label: 'Fashion & Style' },
          { id: 'awards', label: 'Awards & Red Carpet' },
          { id: 'drama', label: 'Drama Stills' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setSelectedTag(filter.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              selectedTag === filter.id
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Masonry / Responsive Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {photoItems.map(item => (
          <div
            key={item.id}
            onClick={() => onOpenDetail(item)}
            className="group break-inside-avoid glass-panel rounded-2xl overflow-hidden border border-white/5 hover:border-pink-500/40 cursor-pointer transition-all duration-300 relative"
          >
            <div className="relative overflow-hidden bg-zinc-900">
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <span className="text-xs text-pink-300 font-semibold mb-1">
                  {item.platform} · {new Date(item.publishedAt).getFullYear()}
                </span>
                <h4 className="text-sm font-bold text-white line-clamp-2">
                  {item.title}
                </h4>
                <div className="mt-3 flex items-center justify-between text-xs text-zinc-300">
                  <span>View Details</span>
                  <ExternalLink className="w-3.5 h-3.5 text-pink-400" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
