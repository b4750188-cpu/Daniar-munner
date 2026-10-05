import React from 'react';
import { Film, AlertCircle, RefreshCw, Compass } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  onResetFilters?: () => void;
  onRefresh?: () => void;
  providerNotice?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'NO VERIFIED CONTENT YET',
  message = 'New content will appear when a verified public source becomes available.',
  onResetFilters,
  onRefresh,
  providerNotice
}) => {
  return (
    <div className="w-full py-16 px-4 flex flex-col items-center justify-center text-center glass-panel rounded-2xl border border-white/5 my-6">
      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-pink-400">
        <Film className="w-7 h-7 stroke-[1.5]" />
      </div>

      <h3 className="font-cinematic text-lg sm:text-xl font-bold tracking-wider text-white uppercase mb-2">
        {title}
      </h3>

      <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
        {message}
      </p>

      {providerNotice && (
        <div className="mb-6 px-4 py-2.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2 max-w-lg">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{providerNotice}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-2 shadow-lg shadow-pink-600/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>TRY AGAIN</span>
          </button>
        )}

        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold tracking-wider uppercase border border-white/10 transition-all flex items-center gap-2"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>EXPLORE OTHER SOURCES</span>
          </button>
        )}
      </div>
    </div>
  );
};
