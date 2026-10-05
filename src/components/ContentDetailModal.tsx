import React from 'react';
import {
  X,
  ExternalLink,
  Share2,
  Calendar,
  Clock,
  User,
  Tag,
  ShieldCheck,
  AlertTriangle,
  Play,
  Film
} from 'lucide-react';
import { ContentItem } from '../types/index.ts';

interface ContentDetailModalProps {
  item: ContentItem | null;
  relatedItems?: ContentItem[];
  duplicateItems?: ContentItem[];
  onClose: () => void;
  onSelectRelated: (item: ContentItem) => void;
}

export const ContentDetailModal: React.FC<ContentDetailModalProps> = ({
  item,
  relatedItems = [],
  duplicateItems = [],
  onClose,
  onSelectRelated
}) => {
  // ESC key handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const formattedDate = new Date(item.publishedAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div
        className="relative z-10 w-full sm:max-w-4xl max-h-screen sm:max-h-[90vh] bg-[#090d16] border border-white/10 sm:rounded-2xl shadow-2xl overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky Header with Title and Close Button */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-[#090d16]/95 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-semibold text-pink-400">{item.platform}</span>
            <span>·</span>
            <span className="capitalize">{item.contentType}</span>
            <span>·</span>
            <span>{formattedDate}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media / Embed Section */}
        <div className="w-full bg-black aspect-video relative flex items-center justify-center overflow-hidden">
          {item.embedUrl ? (
            <iframe
              src={item.embedUrl}
              title={item.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <img
                src={item.thumbnailUrl || '/src/assets/images/dananeer_hero_cinematic_1791045480240.jpg'}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover filter brightness-[0.4]"
              />
              <div className="relative z-10 max-w-md space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-pink-600/80 border border-pink-400 flex items-center justify-center text-white shadow-lg">
                  <Play className="w-6 h-6 ml-1 fill-current" />
                </div>
                <h4 className="text-lg font-semibold text-white drop-shadow">
                  View on {item.platform}
                </h4>
                <p className="text-xs text-zinc-300 drop-shadow">
                  This media is hosted securely on {item.platform}. In compliance with privacy and terms, open directly on the authorized platform.
                </p>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold tracking-wide uppercase transition-all shadow-lg shadow-pink-600/30"
                >
                  <span>Open on {item.platform}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-8 space-y-6 flex-1">
          {/* Headline & Primary Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-white/5">
            <div className="space-y-2 max-w-2xl">
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                {item.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Publisher: <strong className="text-zinc-300 font-medium">{item.author}</strong></span>
                </span>
                {item.duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Duration: <strong className="text-zinc-300 font-medium font-mono">{item.duration}</strong></span>
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Source</span>
                </span>
              </div>
            </div>

            {/* Open Original Source Button */}
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-pink-600 text-white font-medium text-xs tracking-wider uppercase border border-white/15 hover:border-pink-500 transition-all shrink-0"
            >
              <span>OPEN ORIGINAL</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Description / Caption */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
              Archived Overview
            </h4>
            <p className="text-sm text-zinc-300 leading-relaxed font-normal whitespace-pre-line">
              {item.description}
            </p>
            {item.caption && item.caption !== item.description && (
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-300 italic">
                "{item.caption}"
              </div>
            )}
          </div>

          {/* Tags & Linked People */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-zinc-500 font-medium">Tags:</span>
              {item.tags.map(t => (
                <span key={t} className="text-pink-300/90 hover:text-pink-200">
                  #{t}
                </span>
              ))}
            </div>

            {item.people && item.people.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-zinc-500 font-medium">People:</span>
                {item.people.map(p => (
                  <span key={p} className="text-zinc-300">
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Provenance & Archive Transparency */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Archive Provenance & Traceability</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-950 text-pink-300">
                {item.provenance || 'CURATED ARCHIVE'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-zinc-500 block text-[10px]">Source Classification</span>
                <span className="text-zinc-200 font-medium font-mono text-[11px]">{item.sourceClassification || 'OFFICIAL_BROADCASTER'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Relevance Status</span>
                <span className="text-emerald-400 font-medium font-mono text-[11px]">{item.relevanceClassification || 'DIRECT'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Discovered On</span>
                <span className="text-zinc-300 font-mono text-[11px]">{new Date(item.discoveredAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Discovery Query</span>
                <span className="text-zinc-300 font-mono text-[11px] truncate block">{item.discoveryQuery || 'Curated Canonical'}</span>
              </div>
            </div>
          </div>

          {/* Cross-Platform Sources / Duplicate Links */}
          {item.crossPlatformSources && item.crossPlatformSources.length > 0 && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-pink-300 uppercase tracking-wider">
                <Share2 className="w-4 h-4 text-pink-400" />
                <span>Multi-Platform Availability ({item.crossPlatformSources.length + 1} Sources)</span>
              </div>
              <p className="text-xs text-zinc-400">
                This material has also been indexed across other authorized public channels and unified into this record:
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                {item.crossPlatformSources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 hover:border-pink-500/40 text-xs text-zinc-300 hover:text-white transition-all"
                  >
                    <span>Also on {source.platform}</span>
                    <ExternalLink className="w-3 h-3 text-pink-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Related Verified Content */}
          {relatedItems.length > 0 && (
            <div className="pt-6 border-t border-white/5 space-y-4">
              <h4 className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
                Related Public Content
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedItems.map(rel => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectRelated(rel)}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-pink-500/20 cursor-pointer transition-all"
                  >
                    <div className="w-16 h-12 rounded-lg bg-zinc-900 overflow-hidden shrink-0">
                      <img
                        src={rel.thumbnailUrl || '/src/assets/images/dananeer_hero_cinematic_1791045480240.jpg'}
                        alt={rel.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-medium text-white truncate hover:text-pink-300">
                        {rel.title}
                      </h5>
                      <span className="text-[10px] text-zinc-400">
                        {rel.platform} · {rel.contentType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Legal Attribution */}
        <div className="px-5 py-3.5 bg-black/40 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500">
          <span>Source verification: {item.sourceAvailable ? 'Active & Accessible' : 'Pending verification'}</span>
          <span>Content belongs to original creators & platforms · Non-commercial public indexing</span>
        </div>
      </div>
    </div>
  );
};
