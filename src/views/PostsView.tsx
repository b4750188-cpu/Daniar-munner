import React from 'react';
import { Camera, AtSign, ExternalLink, Share2, Info } from 'lucide-react';
import { ContentItem } from '../types/index.ts';
import { EmptyState } from '../components/EmptyState.tsx';

interface PostsViewProps {
  items: ContentItem[];
  onOpenDetail: (item: ContentItem) => void;
}

export const PostsView: React.FC<PostsViewProps> = ({ items, onOpenDetail }) => {
  const [platformTab, setPlatformTab] = React.useState<'all' | 'instagram' | 'x'>('all');

  const socialPosts = React.useMemo(() => {
    let list = items.filter(i => ['post', 'reel', 'photo'].includes(i.contentType) || ['Instagram', 'X'].includes(i.platform));

    if (platformTab === 'instagram') list = list.filter(i => i.platform === 'Instagram');
    if (platformTab === 'x') list = list.filter(i => i.platform === 'X');

    const seen = new Set<string>();
    return list.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [items, platformTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 min-h-screen">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="font-cinematic text-3xl sm:text-4xl lg:text-5xl font-bold tracking-wider text-white">
          SOCIAL DISCOVERY & POSTS
        </h1>
        <p className="text-sm text-zinc-400 font-normal max-w-xl">
          Verified public announcements, fashion shoots, and official posts from authorized social channels.
        </p>
      </div>

      {/* Legal attribution note */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
        <p>
          DANANEER is an independent indexing platform. All posts, photographs, and media belong to Dananeer Mobeen and respective publishers. Click <strong>"VIEW ORIGINAL"</strong> on any item to open the original verified post.
        </p>
      </div>

      {/* Platform Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-3">
        <button
          onClick={() => setPlatformTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            platformTab === 'all'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
              : 'bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          All Social Content
        </button>

        <button
          onClick={() => setPlatformTab('instagram')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            platformTab === 'instagram'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
              : 'bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Instagram (@dananeerr)</span>
        </button>

        <button
          onClick={() => setPlatformTab('x')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            platformTab === 'x'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
              : 'bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          <AtSign className="w-3.5 h-3.5" />
          <span>X / Twitter (@DananeerM)</span>
        </button>
      </div>

      {/* Posts Cards Grid */}
      {socialPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {socialPosts.map(post => {
            const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <article
                key={post.id}
                onClick={() => onOpenDetail(post)}
                className="glass-panel rounded-2xl overflow-hidden border border-white/5 hover:border-pink-500/30 cursor-pointer transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Media preview */}
                  <div className="aspect-[4/3] w-full bg-zinc-900 overflow-hidden relative">
                    <img
                      src={post.thumbnailUrl}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-md text-[11px] font-medium text-pink-300 border border-white/10 flex items-center gap-1.5">
                      {post.platform === 'Instagram' ? (
                        <Camera className="w-3 h-3 text-pink-400" />
                      ) : (
                        <AtSign className="w-3 h-3 text-sky-400" />
                      )}
                      <span>{post.platform}</span>
                    </div>
                  </div>

                  {/* Caption & Info */}
                  <div className="p-5 space-y-3">
                    <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <span>Posted by <strong className="text-zinc-200">@{post.author}</strong></span>
                      <span>·</span>
                      <span>{formattedDate}</span>
                    </div>

                    <h3 className="text-sm font-semibold text-white line-clamp-2">
                      {post.title}
                    </h3>

                    {post.caption && (
                      <p className="text-xs text-zinc-300 italic line-clamp-3 bg-white/5 p-3 rounded-xl border border-white/5">
                        "{post.caption}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer with View Original button */}
                <div className="p-5 pt-0 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-[11px] text-zinc-500">
                    Verified Public Post
                  </span>

                  <a
                    href={post.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-pink-600 text-white text-xs font-medium transition-all"
                  >
                    <span>VIEW ORIGINAL</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="NO SOCIAL POSTS FOUND"
          message={`No verified ${platformTab === 'all' ? 'social' : platformTab} posts are currently indexed in this archive section.`}
          onResetFilters={() => setPlatformTab('all')}
        />
      )}
    </div>
  );
};
