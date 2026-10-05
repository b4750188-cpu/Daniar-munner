import React from 'react';
import {
  Compass,
  PlayCircle,
  Camera,
  Ghost,
  AtSign,
  Youtube,
  Film,
  Mic,
  Image as ImageIcon
} from 'lucide-react';

interface PlatformBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const PlatformBar: React.FC<PlatformBarProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  const categories = [
    { id: 'All', label: 'All', icon: Compass },
    { id: 'Videos', label: 'Videos', icon: PlayCircle },
    { id: 'Instagram', label: 'Instagram', icon: Camera },
    { id: 'Snapchat', label: 'Snapchat', icon: Ghost },
    { id: 'X', label: 'X', icon: AtSign },
    { id: 'YouTube', label: 'YouTube', icon: Youtube },
    { id: 'Dramas', label: 'Dramas', icon: Film },
    { id: 'Interviews', label: 'Interviews', icon: Mic },
    { id: 'Photos', label: 'Photos', icon: ImageIcon }
  ];

  return (
    <section className="w-full py-6 sm:py-8 border-b border-white/5 bg-[#070910]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start sm:justify-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2 px-1">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isActive = selectedCategory.toLowerCase() === cat.id.toLowerCase();

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="group flex flex-col items-center gap-2 focus:outline-none shrink-0"
              >
                {/* Circular Icon Container */}
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 transform group-hover:scale-105 ${
                    isActive
                      ? 'bg-gradient-to-tr from-pink-600 to-rose-500 text-white shadow-lg shadow-pink-500/25 ring-2 ring-pink-400 ring-offset-2 ring-offset-[#070910]'
                      : 'bg-white/5 text-zinc-400 border border-white/10 group-hover:border-pink-500/40 group-hover:text-white group-hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
                </div>

                {/* Label */}
                <span
                  className={`text-xs font-medium tracking-wide transition-colors whitespace-nowrap ${
                    isActive ? 'text-pink-300 font-semibold' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
