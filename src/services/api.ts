import {
  ContentItem,
  Drama,
  Episode,
  TimelineEvent,
  PlatformConfig,
  FilterOptions,
  DiscoveryQuery,
  DiscoveryRunReport,
  ChannelRecord
} from '../types/index.ts';

const BASE_URL = '/api';

export async function getContent(filters: FilterOptions = {}): Promise<{
  items: ContentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const params = new URLSearchParams();
  if (filters.platform && filters.platform !== 'All') params.set('platform', filters.platform);
  if (filters.contentType && filters.contentType !== 'All') params.set('contentType', filters.contentType);
  if (filters.category && filters.category !== 'All') params.set('category', filters.category);
  if (filters.discoveryCategory && filters.discoveryCategory !== 'All') params.set('discoveryCategory', filters.discoveryCategory);
  if (filters.language && filters.language !== 'All') params.set('language', filters.language);
  if (filters.genre && filters.genre !== 'All') params.set('genre', filters.genre);
  if (filters.country && filters.country !== 'All') params.set('country', filters.country);
  if (filters.durationRange && filters.durationRange !== 'All') params.set('durationRange', filters.durationRange);
  if (filters.year && filters.year !== 'All') params.set('year', filters.year);
  if (filters.dramaId && filters.dramaId !== 'All') params.set('dramaId', filters.dramaId);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const res = await fetch(`${BASE_URL}/content?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to load content (${res.status})`);
  return res.json();
}

export async function getContentById(id: string): Promise<{
  item: ContentItem;
  related: ContentItem[];
  duplicates: ContentItem[];
}> {
  const res = await fetch(`${BASE_URL}/content/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Content not found (${res.status})`);
  return res.json();
}

export async function getDramas(): Promise<Drama[]> {
  const res = await fetch(`${BASE_URL}/dramas`);
  if (!res.ok) throw new Error('Failed to load dramas');
  return res.json();
}

export async function getDramaById(id: string): Promise<{
  drama: Drama;
  episodes: Episode[];
  content: ContentItem[];
}> {
  const res = await fetch(`${BASE_URL}/dramas/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Drama not found');
  return res.json();
}

export async function getEpisodes(dramaId?: string): Promise<Episode[]> {
  const url = dramaId ? `${BASE_URL}/episodes?dramaId=${encodeURIComponent(dramaId)}` : `${BASE_URL}/episodes`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load episodes');
  return res.json();
}

export async function getTimeline(): Promise<TimelineEvent[]> {
  const res = await fetch(`${BASE_URL}/timeline`);
  if (!res.ok) throw new Error('Failed to load timeline');
  return res.json();
}

export async function getPlatforms(): Promise<PlatformConfig[]> {
  const res = await fetch(`${BASE_URL}/platforms`);
  if (!res.ok) throw new Error('Failed to load platforms');
  return res.json();
}

// Admin APIs
export async function adminLogin(secret: string): Promise<{ success: boolean; token?: string; error?: string }> {
  const res = await fetch(`${BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret })
  });
  return res.json();
}

export async function adminLogout(token: string): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${BASE_URL}/admin/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  } catch {
    return { success: true };
  }
}

export async function getAdminMetrics(token: string) {
  const res = await fetch(`${BASE_URL}/admin/metrics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Unauthorized or metrics error');
  return res.json();
}

export async function getAdminQueue(token: string, status?: string): Promise<ContentItem[]> {
  const url = status ? `${BASE_URL}/admin/queue?status=${status}` : `${BASE_URL}/admin/queue`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load queue');
  return res.json();
}

export async function updateAdminContent(token: string, id: string, updates: Partial<ContentItem>) {
  const res = await fetch(`${BASE_URL}/admin/content/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Update failed');
  return res.json();
}

export async function mergeDuplicateContent(token: string, canonicalId: string, duplicateId: string) {
  const res = await fetch(`${BASE_URL}/admin/content/${encodeURIComponent(canonicalId)}/merge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ duplicateId })
  });
  if (!res.ok) throw new Error('Merge failed');
  return res.json();
}

export async function createAdminContent(token: string, item: Partial<ContentItem>) {
  const res = await fetch(`${BASE_URL}/admin/content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error('Creation failed');
  return res.json();
}

export async function deleteAdminContent(token: string, id: string) {
  const res = await fetch(`${BASE_URL}/admin/content/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Deletion failed');
  return res.json();
}

export async function triggerDiscoveryScan(token: string, provider?: string) {
  const res = await fetch(`${BASE_URL}/admin/discover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ provider })
  });
  if (!res.ok) throw new Error('Discovery failed');
  return res.json();
}

export async function triggerHealthCheck(token: string) {
  const res = await fetch(`${BASE_URL}/admin/health-check`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

// Discovery Pipeline Operations
export async function triggerScanPipeline(
  token: string,
  options: {
    jobType?: string;
    targetProvider?: string;
    queryFamily?: string;
    customQuery?: string;
  } = {}
): Promise<{ success: boolean; report: DiscoveryRunReport }> {
  const res = await fetch(`${BASE_URL}/admin/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(options)
  });
  if (!res.ok) throw new Error('Scan pipeline request failed');
  return res.json();
}

export async function getScanStatus(token: string): Promise<{ active: boolean; lastRun: DiscoveryRunReport | null }> {
  const res = await fetch(`${BASE_URL}/admin/scan/status`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to retrieve scan status');
  return res.json();
}

export async function getDiscoveryRuns(token: string): Promise<DiscoveryRunReport[]> {
  const res = await fetch(`${BASE_URL}/admin/runs`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to retrieve discovery runs');
  return res.json();
}

export async function getDiscoveryQueries(token: string): Promise<DiscoveryQuery[]> {
  const res = await fetch(`${BASE_URL}/admin/queries`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to retrieve discovery queries');
  return res.json();
}

export async function addDiscoveryQuery(token: string, query: string, family: string): Promise<{ success: boolean; query: DiscoveryQuery }> {
  const res = await fetch(`${BASE_URL}/admin/queries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ query, family })
  });
  if (!res.ok) throw new Error('Failed to add query');
  return res.json();
}

export async function toggleDiscoveryQuery(token: string, id: string): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`${BASE_URL}/admin/queries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to toggle query');
  return res.json();
}

export async function deleteDiscoveryQuery(token: string, id: string): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`${BASE_URL}/admin/queries/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete query');
  return res.json();
}

export async function getDiscoveredChannels(token: string): Promise<ChannelRecord[]> {
  const res = await fetch(`${BASE_URL}/admin/channels`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to retrieve channels');
  return res.json();
}

export async function getYouTubeApiStatus(token: string): Promise<{
  configured: boolean;
  status: 'CONNECTED' | 'FAILED' | 'CONFIGURED' | 'NOT_CONFIGURED';
  maskedKey: string;
  message: string;
  errorReason?: string | null;
  lastCheckedAt: string;
}> {
  const res = await fetch(`${BASE_URL}/admin/settings/youtube-api`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load YouTube API status');
  return res.json();
}

export async function updateYouTubeApiKey(
  token: string,
  apiKey: string
): Promise<{
  success: boolean;
  configured: boolean;
  status: 'CONNECTED' | 'FAILED' | 'CONFIGURED' | 'NOT_CONFIGURED';
  maskedKey: string;
  message: string;
  errorReason?: string | null;
  lastCheckedAt: string;
}> {
  const res = await fetch(`${BASE_URL}/admin/settings/youtube-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ apiKey })
  });
  if (!res.ok) throw new Error('Failed to update YouTube API key');
  return res.json();
}

export async function testYouTubeApiKeyConnection(token: string): Promise<{
  configured: boolean;
  status: 'CONNECTED' | 'FAILED' | 'CONFIGURED' | 'NOT_CONFIGURED';
  maskedKey: string;
  message: string;
  errorReason?: string | null;
  lastCheckedAt: string;
}> {
  const res = await fetch(`${BASE_URL}/admin/settings/youtube-api/test`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to test YouTube API connection');
  return res.json();
}

