import React from 'react';
import { Play, ExternalLink, Youtube, Camera, AtSign, Film, Mic, Radio, Share2, ShieldCheck, Sparkles } from 'lucide-react';
import { ContentItem } from '../types/index.ts';

interface MediaCardProps {
  item: ContentItem;
  onOpenDetail: (item: ContentItem) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, onOpenDetail }) => {
  const [imageFailed, setImageFailed] = React.useState(false);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return <Youtube className="w-3.5 h-3.5 text-red-400" />;
      case 'instagram':
        return <Camera className="w-3.5 h-3.5 text-pink-400" />;
      case 'x':
        return <AtSign className="w-3.5 h-3.5 text-sky-400" />;
      case 'broadcast':
        return <Radio className="w-3.5 h-3.5 text-emerald-400" />;
      case 'interview':
        return <Mic className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Film className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const isPlayable = ['video', 'reel', 'episode', 'interview', 'clip', 'behind-the-scenes'].includes(item.contentType);

  const formattedDate = new Date(item.publishedAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const totalSourcesCount = (item.crossPlatformSources?.length || 0) + 1;

  return (
    <article
      onClick={() => onOpenDetail(item)}
      className="group relative flex flex-col glass-panel rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-pink-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-950/20"
    >
      {/* Media Thumbnail Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900">
        {!imageFailed && item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            loading="lazy"
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 text-center">
            <Film className="w-8 h-8 text-zinc-600 mb-2" />
            <span className="text-xs text-zinc-500 font-medium">{item.platform} Media</span>
          </div>
        )}

        {/* Media Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Play Button Indicator */}
        {isPlayable && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-pink-600 group-hover:border-pink-500 transition-all duration-300 shadow-lg">
              <Play className="w-5 h-5 ml-0.5 fill-current" />
            </div>
          </div>
        )}

        {/* Duration unboxed overlay */}
        {item.duration && (
          <span className="absolute bottom-2.5 right-2.5 text-[11px] font-mono tabular-nums text-zinc-200 bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10">
            {item.duration}
          </span>
        )}

        {/* Drama Tag if connected */}
        {item.dramaId && (
          <span className="absolute top-2.5 left-2.5 text-[10px] uppercase tracking-wider font-semibold text-pink-300 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded border border-pink-500/20">
            {item.dramaId.replace(/-/g, ' ')}
          </span>
        )}

        {/* Provenance badge */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-zinc-300 font-medium border border-white/10">
          {item.provenance === 'LIVE_DISCOVERY' ? (
            <>
              <Sparkles className="w-3 h-3 text-pink-400" />
              <span>Live Discovered</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Curated</span>
            </>
          )}
        </div>
      </div>

      {/* Card Information */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata line with typographic separators (Zero-Pill discipline) */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2">
            <span className="flex items-center gap-1 font-medium text-zinc-300">
              {getPlatformIcon(item.platform)}
              <span>{item.platform}</span>
            </span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span className="capitalize">{item.contentType}</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span className="text-zinc-400">{formattedDate}</span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-white group-hover:text-pink-300 transition-colors line-clamp-2 leading-snug">
            {item.title}
          </h3>

          {/* Short description excerpt if available */}
          {item.description && (
            <p className="mt-1.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed font-normal">
              {item.description}
            </p>
          )}
        </div>

        {/* Card Footer: Multi-source and original action */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
          {/* Multi-source indicator if duplicates merged */}
          {totalSourcesCount > 1 ? (
            <span className="text-[11px] text-pink-300 flex items-center gap-1 font-medium">
              <Share2 className="w-3 h-3 text-pink-400 shrink-0" />
              <span>Available from {totalSourcesCount} sources</span>
            </span>
          ) : (
            <span className="text-[11px] text-zinc-500 truncate max-w-[140px]">
              By {item.author}
            </span>
          )}

          {/* Open Original quick link */}
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-[11px] text-zinc-400 hover:text-pink-400 flex items-center gap-1 transition-colors ml-auto"
            title="Open legitimate source directly"
          >
            <span>Source</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
};
