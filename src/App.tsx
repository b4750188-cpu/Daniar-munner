/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Header } from './components/Header.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { Footer } from './components/Footer.tsx';
import { ContentDetailModal } from './components/ContentDetailModal.tsx';
import { HomeView } from './views/HomeView.tsx';
import { ExploreView } from './views/ExploreView.tsx';
import { VideosView } from './views/VideosView.tsx';
import { VideoDiscoveryView } from './views/VideoDiscoveryView.tsx';
import { PostsView } from './views/PostsView.tsx';
import { DramasView } from './views/DramasView.tsx';
import { DramaDetailView } from './views/DramaDetailView.tsx';
import { TimelineView } from './views/TimelineView.tsx';
import { PhotoGalleryView } from './views/PhotoGalleryView.tsx';
import { AdminView } from './views/AdminView.tsx';
import { ContentItem, Drama, Episode, TimelineEvent, PlatformConfig } from './types/index.ts';
import {
  getContent,
  getContentById,
  getDramas,
  getDramaById,
  getTimeline,
  getPlatforms,
  adminLogout
} from './services/api.ts';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = React.useState<string>('home');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  // Selected Detail States
  const [selectedDramaId, setSelectedDramaId] = React.useState<string | null>(null);
  const [modalItem, setModalItem] = React.useState<ContentItem | null>(null);
  const [modalRelated, setModalRelated] = React.useState<ContentItem[]>([]);
  const [modalDuplicates, setModalDuplicates] = React.useState<ContentItem[]>([]);

  // Admin authentication state
  const [adminToken, setAdminToken] = React.useState<string | null>(() => {
    return sessionStorage.getItem('dananeer_admin_token');
  });

  // Data States
  const [items, setItems] = React.useState<ContentItem[]>([]);
  const [dramas, setDramas] = React.useState<Drama[]>([]);
  const [timeline, setTimeline] = React.useState<TimelineEvent[]>([]);
  const [platforms, setPlatforms] = React.useState<PlatformConfig[]>([]);

  // Selected drama detail payload
  const [currentDramaDetail, setCurrentDramaDetail] = React.useState<{
    drama: Drama | null;
    episodes: Episode[];
    content: ContentItem[];
  }>({ drama: null, episodes: [], content: [] });

  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load primary archive data
  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [contentRes, dramaRes, timelineRes, platformRes] = await Promise.all([
        getContent({ limit: 100 }),
        getDramas(),
        getTimeline(),
        getPlatforms()
      ]);

      setItems(contentRes.items);
      setDramas(dramaRes);
      setTimeline(timelineRes);
      setPlatforms(platformRes);
    } catch (err) {
      console.error('Error loading initial content archive:', err);
      setError('Unable to connect to data service. Please refresh or verify that the server is active.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Load drama detail when selectedDramaId changes
  React.useEffect(() => {
    if (selectedDramaId) {
      getDramaById(selectedDramaId)
        .then(res => {
          setCurrentDramaDetail({
            drama: res.drama,
            episodes: res.episodes,
            content: res.content
          });
        })
        .catch(err => {
          console.error('Failed to load drama details:', err);
        });
    } else {
      setCurrentDramaDetail({ drama: null, episodes: [], content: [] });
    }
  }, [selectedDramaId]);

  // Open item modal & fetch its related items
  const handleOpenDetail = async (item: ContentItem) => {
    setModalItem(item);
    try {
      const detail = await getContentById(item.id);
      setModalRelated(detail.related);
      setModalDuplicates(detail.duplicates);
    } catch {
      setModalRelated([]);
      setModalDuplicates([]);
    }
  };

  const handleAdminLoginSuccess = (token: string) => {
    setAdminToken(token);
    sessionStorage.setItem('dananeer_admin_token', token);
  };

  const handleAdminLogout = () => {
    if (adminToken) {
      adminLogout(adminToken);
    }
    setAdminToken(null);
    sessionStorage.removeItem('dananeer_admin_token');
    setActiveTab('home');
  };

  const handleSelectTab = (tab: string) => {
    setSelectedDramaId(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategoryFromHero = (category: string) => {
    setSelectedCategory(category);
    if (category === 'Dramas') {
      handleSelectTab('dramas');
    } else if (category === 'Videos') {
      handleSelectTab('videos');
    } else if (category === 'Photos') {
      handleSelectTab('gallery');
    } else if (category === 'Interviews') {
      handleSelectTab('videos');
    } else if (category === 'Instagram' || category === 'X') {
      handleSelectTab('posts');
    } else {
      handleSelectTab('explore');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#06080d] text-zinc-100 selection:bg-pink-600/30 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenSearch={() => handleSelectTab('explore')}
        searchQuery={searchQuery}
        onSearchChange={q => {
          setSearchQuery(q);
          if (activeTab !== 'explore') {
            setActiveTab('explore');
          }
        }}
        adminLoggedIn={Boolean(adminToken)}
        onOpenAdmin={() => handleSelectTab('admin')}
      />

      {/* Main View Router */}
      <div className="flex-1">
        {loading ? (
          <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            <span className="font-cinematic text-sm tracking-widest text-zinc-400 uppercase">
              Loading Verified Public Archive...
            </span>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto my-20 p-8 glass-panel rounded-2xl border border-red-500/20 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Service Disconnected</h3>
            <p className="text-xs text-zinc-400">{error}</p>
            <button
              onClick={loadData}
              className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        ) : (
          <>
            {/* Drama Detail View */}
            {selectedDramaId && currentDramaDetail.drama ? (
              <DramaDetailView
                drama={currentDramaDetail.drama}
                episodes={currentDramaDetail.episodes}
                relatedContent={currentDramaDetail.content}
                onBack={() => setSelectedDramaId(null)}
                onOpenContentDetail={handleOpenDetail}
              />
            ) : (
              <>
                {activeTab === 'home' && (
                  <HomeView
                    items={items}
                    dramas={dramas}
                    platforms={platforms}
                    selectedCategory={selectedCategory}
                    onSelectCategory={handleSelectCategoryFromHero}
                    onOpenDetail={handleOpenDetail}
                    onSelectDrama={id => setSelectedDramaId(id)}
                    onNavigateTab={handleSelectTab}
                  />
                )}

                {activeTab === 'explore' && (
                  <ExploreView
                    items={items}
                    dramas={dramas}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onOpenDetail={handleOpenDetail}
                  />
                )}

                {activeTab === 'discovery' && (
                  <VideoDiscoveryView
                    items={items}
                    onOpenDetail={handleOpenDetail}
                    onNavigateTab={handleSelectTab}
                  />
                )}

                {activeTab === 'videos' && (
                  <VideosView
                    items={items}
                    onOpenDetail={handleOpenDetail}
                    onNavigateTab={handleSelectTab}
                  />
                )}

                {activeTab === 'posts' && (
                  <PostsView
                    items={items}
                    onOpenDetail={handleOpenDetail}
                  />
                )}

                {activeTab === 'dramas' && (
                  <DramasView
                    dramas={dramas}
                    onSelectDrama={id => setSelectedDramaId(id)}
                  />
                )}

                {activeTab === 'timeline' && (
                  <TimelineView
                    events={timeline}
                  />
                )}

                {activeTab === 'gallery' && (
                  <PhotoGalleryView
                    items={items}
                    onOpenDetail={handleOpenDetail}
                  />
                )}

                {activeTab === 'admin' && (
                  <AdminView
                    token={adminToken}
                    onLoginSuccess={handleAdminLoginSuccess}
                    onLogout={handleAdminLogout}
                    platforms={platforms}
                    onRefreshData={loadData}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Detail Modal / Video Player */}
      <ContentDetailModal
        item={modalItem}
        relatedItems={modalRelated}
        duplicateItems={modalDuplicates}
        onClose={() => setModalItem(null)}
        onSelectRelated={handleOpenDetail}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenSearch={() => handleSelectTab('explore')}
      />

      {/* Footer */}
      <Footer
        onSelectTab={handleSelectTab}
        onOpenAdmin={() => handleSelectTab('admin')}
      />
    </div>
  );
}
