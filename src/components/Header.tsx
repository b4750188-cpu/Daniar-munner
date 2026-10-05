import React from 'react';
import { Search, Lock, SlidersHorizontal, Menu, X, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSearch: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  adminLoggedIn: boolean;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenSearch,
  searchQuery,
  onSearchChange,
  adminLoggedIn,
  onOpenAdmin
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'discovery', label: 'Video Discovery' },
    { id: 'explore', label: 'Explore' },
    { id: 'videos', label: 'Videos' },
    { id: 'posts', label: 'Posts' },
    { id: 'dramas', label: 'Dramas' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'gallery', label: 'Photos' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#06080d]/85 backdrop-blur-xl border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onSelectTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-left group flex items-baseline gap-1"
          >
            <span className="font-cinematic text-2xl sm:text-3xl font-bold tracking-[0.2em] text-white group-hover:text-pink-400 transition-colors">
              DANANEER
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span>
          </button>
        </div>

        {/* Zone 2: Clean 4-6 text navigation links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium tracking-wide">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`transition-colors whitespace-nowrap pb-1 relative ${
                  isActive ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick search input */}
          <div className="relative hidden sm:block w-48 lg:w-64">
            <input
              type="text"
              placeholder="Search archive..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              onFocus={onOpenSearch}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 focus:bg-white/10 text-white placeholder-zinc-500 rounded-lg border border-white/10 focus:border-pink-500/50 focus:outline-none transition-all"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Search trigger on small mobile */}
          <button
            onClick={onOpenSearch}
            className="sm:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Search"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Admin portal trigger */}
          <button
            onClick={onOpenAdmin}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
              adminLoggedIn
                ? 'bg-pink-950/40 text-pink-300 border-pink-500/40 hover:bg-pink-900/50'
                : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
            title="Admin & Verification Portal"
          >
            <Lock className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden lg:inline">{adminLoggedIn ? 'Admin Active' : 'Admin'}</span>
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#080c16]/95 backdrop-blur-2xl px-5 py-4 space-y-3">
          <div className="space-y-1">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left py-2.5 px-3 rounded-lg text-sm transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-pink-500/15 text-pink-300 font-semibold border border-pink-500/20'
                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
            <span>Independent Public Discovery</span>
            <button
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="text-pink-400 hover:underline flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              <span>Admin Queue</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
