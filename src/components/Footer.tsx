import React from 'react';
import { Compass, Film, ExternalLink, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: string) => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab, onOpenAdmin }) => {
  return (
    <footer className="w-full bg-[#04060a] border-t border-white/5 py-14 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="font-cinematic text-2xl font-bold tracking-[0.2em] text-white">
                DANANEER
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
              Explore publicly available content in one place. A multimedia discovery and archive platform organizing verified appearances, dramas, interviews, and public social releases for Pakistani actress and creator Dananeer Mobeen.
            </p>

            <div className="pt-2 text-[11px] text-zinc-400">
              Archived records from 2021 to 2026.
            </div>
          </div>

          {/* Site Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-white font-semibold">
              Explore Archive
            </h4>
            <ul className="space-y-2 text-xs">
              {['Home', 'Explore', 'Videos', 'Posts', 'Dramas', 'Timeline', 'Photos'].map(tab => (
                <li key={tab}>
                  <button
                    onClick={() => {
                      onSelectTab(tab.toLowerCase());
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-pink-400 transition-colors text-left"
                  >
                    {tab}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Operations */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-white font-semibold">
              Indexing & Sources
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Verified Official Sources</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Direct Original Links</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Zero Fabricated Data</span>
              </li>
              <li className="pt-2">
                <button
                  onClick={onOpenAdmin}
                  className="text-pink-400 hover:text-pink-300 font-medium underline underline-offset-4"
                >
                  Admin & Discovery Ops
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer Strip */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-zinc-400 text-center md:text-left">
          <p className="max-w-3xl leading-relaxed">
            <strong>Independent Archive Notice:</strong> This website is an independent digital catalog and discovery platform. It is not owned or operated by Dananeer Mobeen. All videos, photographs, clips, drama titles, trademarks, and associated media belong to their respective creators, broadcast networks (HUM TV, ARY Digital, ISPR), and publications. The platform indexes public metadata and directs traffic to original authorized sources.
          </p>

          <div className="shrink-0 text-zinc-400 font-mono">
            v1.0.0 · Production Ready
          </div>
        </div>
      </div>
    </footer>
  );
};
