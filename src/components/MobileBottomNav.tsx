import React from 'react';
import { Home, Compass, PlayCircle, Film, Search } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSearch: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenSearch
}) => {
  const items = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'discovery', label: 'Discovery', icon: Compass },
    { id: 'videos', label: 'Videos', icon: PlayCircle },
    { id: 'dramas', label: 'Dramas', icon: Film },
    { id: 'search', label: 'Search', icon: Search, isAction: true }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#06080d]/90 backdrop-blur-2xl border-t border-white/10 px-3 py-1.5 flex items-center justify-around safe-area-bottom">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.isAction) {
                onOpenSearch();
              } else {
                onSelectTab(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors relative min-w-[54px] ${
              isActive ? 'text-pink-400 font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.7]'}`} />
            <span className="text-[10px] tracking-tight">{item.label}</span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-pink-500 absolute -bottom-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
