import React from 'react';
import { Calendar, Award, Film, Sparkles, ExternalLink, Filter, Star } from 'lucide-react';
import { TimelineEvent } from '../types/index.ts';

interface TimelineViewProps {
  events: TimelineEvent[];
  onSelectEventSource?: (url: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ events }) => {
  const [filterCategory, setFilterCategory] = React.useState('all');

  const categories = [
    { id: 'all', label: 'All Milestones' },
    { id: 'viral_breakthrough', label: 'Breakthrough' },
    { id: 'drama_debut', label: 'Debut' },
    { id: 'lead_role', label: 'Lead Roles' },
    { id: 'award', label: 'Awards' },
    { id: 'brand_ambassador', label: 'Ambassadorships' }
  ];

  const filteredEvents = React.useMemo(() => {
    if (filterCategory === 'all') return events;
    return events.filter(e => e.category === filterCategory);
  }, [events, filterCategory]);

  // Group events by year
  const groupedByYear = React.useMemo(() => {
    const map = new Map<number, TimelineEvent[]>();
    for (const event of filteredEvents) {
      const list = map.get(event.year) || [];
      list.push(event);
      map.set(event.year, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filteredEvents]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'viral_breakthrough':
        return <Sparkles className="w-4 h-4 text-pink-400" />;
      case 'drama_debut':
      case 'lead_role':
        return <Film className="w-4 h-4 text-sky-400" />;
      case 'award':
        return <Award className="w-4 h-4 text-amber-400" />;
      default:
        return <Star className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 min-h-screen">
      {/* Header */}
      <div className="space-y-3 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 text-xs uppercase tracking-widest text-pink-400 font-semibold">
          <Calendar className="w-4 h-4" />
          <span>Chronological Public Archive</span>
        </div>
        <h1 className="font-cinematic text-3xl sm:text-4xl lg:text-5xl font-bold tracking-wider text-white">
          CAREER TIMELINE
        </h1>
        <p className="text-sm text-zinc-400 font-normal max-w-xl">
          Tracing Dananeer Mobeen's journey from viral cultural sensation to award-winning television leading actress (2021 – 2026).
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-white/5">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              filterCategory === cat.id
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 border-l border-white/10 space-y-14">
        {groupedByYear.map(([year, yearEvents]) => (
          <div key={year} className="relative space-y-6">
            {/* Year Node Marker */}
            <div className="absolute -left-[35px] sm:-left-[43px] top-0 flex items-center justify-center">
              <span className="font-cinematic text-sm sm:text-base font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 px-3 py-1 rounded-full shadow-lg border border-pink-400/40">
                {year}
              </span>
            </div>

            <div className="pt-2 sm:pt-1 space-y-6">
              {yearEvents.map(event => (
                <div
                  key={event.id}
                  className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/5 hover:border-pink-500/30 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      {getCategoryIcon(event.category)}
                      <span className="text-pink-300 font-semibold">{event.subtitle}</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-400">{event.date}</span>
                    </div>

                    <a
                      href={event.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
                    >
                      <span>Verified {event.platform} Record</span>
                      <ExternalLink className="w-3 h-3 text-pink-400" />
                    </a>
                  </div>

                  <h3 className="font-cinematic text-lg sm:text-xl font-bold text-white">
                    {event.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                    {event.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
