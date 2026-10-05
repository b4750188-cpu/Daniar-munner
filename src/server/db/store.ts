import fs from 'fs';
import path from 'path';
import type {
  ContentItem,
  Drama,
  Episode,
  TimelineEvent,
  PlatformConfig,
  FilterOptions,
  VerificationStatus,
  DiscoveryQuery,
  DiscoveryRunReport,
  ChannelRecord
} from '../../types/index.ts';
import {
  SEED_DRAMAS,
  SEED_EPISODES,
  SEED_CONTENT_ITEMS,
  SEED_TIMELINE_EVENTS,
  INITIAL_PLATFORM_CONFIGS
} from './seedData.ts';
import { INITIAL_DISCOVERY_QUERIES } from '../discovery/identity.ts';
import { deduplicator } from '../discovery/deduplicator.ts';
import { healthMonitor } from '../discovery/healthMonitor.ts';
import { classifier } from '../discovery/classifier.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const TABLES_DIR = path.join(DATA_DIR, 'tables');

// Ensure tables directory exists
if (!fs.existsSync(TABLES_DIR)) {
  fs.mkdirSync(TABLES_DIR, { recursive: true });
}

export class DatabaseStore {
  private contentItems: ContentItem[] = [];
  private dramas: Drama[] = [];
  private episodes: Episode[] = [];
  private timelineEvents: TimelineEvent[] = [];
  private platforms: PlatformConfig[] = [];
  private queries: DiscoveryQuery[] = [];
  private channels: ChannelRecord[] = [];
  private discoveryRuns: DiscoveryRunReport[] = [];

  constructor() {
    this.init();
  }

  private getTablePath(tableName: string): string {
    return path.join(TABLES_DIR, `${tableName}.json`);
  }

  private loadTable<T>(tableName: string, defaultData: T[]): T[] {
    const filePath = this.getTablePath(tableName);
    if (!fs.existsSync(filePath)) {
      this.saveTable(tableName, defaultData);
      return defaultData;
    }
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error(`Error loading table ${tableName}, falling back to defaults`, err);
      return defaultData;
    }
  }

  private saveTable<T>(tableName: string, data: T[]): void {
    const filePath = this.getTablePath(tableName);
    const tempPath = `${filePath}.tmp`;
    try {
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, filePath);
    } catch (err) {
      console.error(`Error writing table ${tableName}`, err);
    }
  }

  public init(): void {
    this.contentItems = this.loadTable<ContentItem>('content_items', SEED_CONTENT_ITEMS);
    this.dramas = this.loadTable<Drama>('dramas', SEED_DRAMAS);
    this.episodes = this.loadTable<Episode>('episodes', SEED_EPISODES);
    this.timelineEvents = this.loadTable<TimelineEvent>('timeline_events', SEED_TIMELINE_EVENTS);
    this.platforms = this.loadTable<PlatformConfig>('platforms', INITIAL_PLATFORM_CONFIGS);
    this.queries = this.loadTable<DiscoveryQuery>('queries', INITIAL_DISCOVERY_QUERIES);
    this.channels = this.loadTable<ChannelRecord>('channels', []);
    this.discoveryRuns = this.loadTable<DiscoveryRunReport>('discovery_runs', []);

    // Ensure initial items have default provenance, multi-categories, and guaranteed unique IDs
    const seenIds = new Set<string>();
    const uniqueItems: ContentItem[] = [];
    let updatedItems = false;

    for (const item of this.contentItems) {
      if (seenIds.has(item.id)) {
        updatedItems = true;
        continue;
      }
      seenIds.add(item.id);

      if (!item.provenance) {
        item.provenance = 'CURATED';
        item.sourceClassification = item.sourceClassification || 'OFFICIAL_BROADCASTER';
        item.relevanceClassification = item.relevanceClassification || 'DIRECT';
        updatedItems = true;
      }
      if (!item.categories || item.categories.length === 0) {
        item.categories = classifier.categorizeContent(
          item.title,
          item.description,
          item.author,
          item.sourceClassification || 'UNKNOWN',
          item.dramaId,
          item.episodeNumber
        );
        updatedItems = true;
      }
      if (!item.discoveryCategory || !item.language || !item.genre || !item.country) {
        const meta = classifier.detectDiscoveryMetadata(
          item.title,
          item.description,
          item.author,
          item.dramaId,
          item.episodeNumber,
          item.duration,
          item.contentType
        );
        item.discoveryCategory = item.discoveryCategory || meta.discoveryCategory;
        item.language = item.language || meta.language;
        item.genre = item.genre || meta.genre;
        item.country = item.country || meta.country;
        updatedItems = true;
      }
      uniqueItems.push(item);
    }

    if (updatedItems || uniqueItems.length !== this.contentItems.length) {
      this.contentItems = uniqueItems;
      this.saveTable('content_items', this.contentItems);
    }

    // Refresh dynamic platform config statuses
    this.syncPlatformEnvironment();
  }

  public syncPlatformEnvironment(): void {
    this.platforms = this.platforms.map(p => {
      let isConfigured = false;
      if (p.name === 'YouTube') isConfigured = Boolean(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_API_KEY.trim().length > 0);
      else if (p.name === 'Instagram') isConfigured = Boolean(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_ACCESS_TOKEN.trim().length > 0);
      else if (p.name === 'X') isConfigured = Boolean(process.env.X_BEARER_TOKEN && process.env.X_BEARER_TOKEN.trim().length > 0);
      else if (p.name === 'Snapchat') isConfigured = Boolean(process.env.SNAPCHAT_API_KEY && process.env.SNAPCHAT_API_KEY.trim().length > 0);
      else isConfigured = true;

      const count = this.contentItems.filter(item => item.platform === p.name).length;
      return {
        ...p,
        configured: isConfigured,
        status: isConfigured ? 'ACTIVE' : 'NOT_CONFIGURED',
        itemCount: count
      };
    });
    this.saveTable('platforms', this.platforms);
  }

  // Content queries
  public getContent(filters: FilterOptions = {}): {
    items: ContentItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    let items = [...this.contentItems];

    // Filter by verification unless in admin view
    if (filters.sort !== 'relevance' && !filters.search) {
      items = items.filter(i => i.verificationStatus === 'VERIFIED');
    }

    if (filters.platform && filters.platform !== 'All') {
      items = items.filter(i => i.platform.toLowerCase() === filters.platform!.toLowerCase());
    }

    if (filters.contentType && filters.contentType !== 'All') {
      items = items.filter(i => i.contentType.toLowerCase() === filters.contentType!.toLowerCase());
    }

    if (filters.category && filters.category !== 'All' && filters.category !== 'All Categories') {
      const cat = filters.category.toLowerCase().trim();
      items = items.filter(i => {
        if (i.categories && i.categories.some(c => c.toLowerCase() === cat)) return true;
        if (i.contentType && i.contentType.toLowerCase() === cat) return true;
        if (i.discoveryCategory && i.discoveryCategory.toLowerCase() === cat) return true;
        return false;
      });
    }

    if (filters.discoveryCategory && filters.discoveryCategory !== 'All') {
      const dCat = filters.discoveryCategory.toLowerCase().trim();
      items = items.filter(i => i.discoveryCategory && i.discoveryCategory.toLowerCase() === dCat);
    }

    if (filters.language && filters.language !== 'All') {
      const lang = filters.language.toLowerCase().trim();
      items = items.filter(i => (i.language || 'Urdu').toLowerCase() === lang);
    }

    if (filters.genre && filters.genre !== 'All') {
      const g = filters.genre.toLowerCase().trim();
      items = items.filter(i => (i.genre || 'Drama').toLowerCase().includes(g));
    }

    if (filters.country && filters.country !== 'All') {
      const cntry = filters.country.toLowerCase().trim();
      items = items.filter(i => (i.country || 'Pakistan').toLowerCase() === cntry);
    }

    if (filters.durationRange && filters.durationRange !== 'All') {
      items = items.filter(i => {
        if (!i.duration) return filters.durationRange === 'short';
        const parts = i.duration.split(':').map(Number);
        let totalMinutes = 0;
        if (parts.length === 2) {
          totalMinutes = parts[0] + parts[1] / 60;
        } else if (parts.length === 3) {
          totalMinutes = parts[0] * 60 + parts[1] + parts[2] / 60;
        }
        if (filters.durationRange === 'short') return totalMinutes < 5;
        if (filters.durationRange === 'medium') return totalMinutes >= 5 && totalMinutes <= 20;
        if (filters.durationRange === 'long') return totalMinutes > 20;
        return true;
      });
    }

    if (filters.dramaId && filters.dramaId !== 'All') {
      items = items.filter(i => i.dramaId === filters.dramaId);
    }

    if (filters.year && filters.year !== 'All') {
      items = items.filter(i => {
        const itemYear = new Date(i.publishedAt).getFullYear().toString();
        return itemYear === filters.year;
      });
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);

      items = items.filter(i => {
        const text = `${i.title} ${i.description} ${i.author} ${i.caption || ''} ${i.tags.join(' ')} ${i.people.join(' ')}`.toLowerCase();
        // Multi-word partial and exact match
        return tokens.every(token => text.includes(token));
      });
    }

    // Sort options: latest, oldest, relevance
    if (filters.sort === 'oldest') {
      items.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
    } else {
      // Default: newest published
      items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }

    // Ensure absolutely zero duplicate IDs are returned
    const seenReturnIds = new Set<string>();
    items = items.filter(i => {
      if (seenReturnIds.has(i.id)) return false;
      seenReturnIds.add(i.id);
      return true;
    });

    const total = items.length;
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 24;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages
    };
  }

  public getContentById(id: string): {
    item: ContentItem | null;
    related: ContentItem[];
    duplicates: ContentItem[];
  } {
    const item = this.contentItems.find(i => i.id === id) || null;
    if (!item) {
      return { item: null, related: [], duplicates: [] };
    }

    // Find related items by shared dramaId, content format, or tags
    const related = this.contentItems
      .filter(i => i.id !== id && i.verificationStatus === 'VERIFIED')
      .map(i => {
        let score = 0;
        if (item.dramaId && i.dramaId === item.dramaId) score += 6;
        if (i.contentType === item.contentType) score += 3;
        if (i.platform === item.platform) score += 1;
        const sharedTags = i.tags.filter(t => item.tags.includes(t));
        score += sharedTags.length * 2;
        return { item: i, score };
      })
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(entry => entry.item);

    // Duplicates or cross-platform counterparts
    const duplicates = this.contentItems.filter(
      i => i.id !== id && (i.canonicalId === id || (item.canonicalId && i.id === item.canonicalId))
    );

    return { item, related, duplicates };
  }

  public getAllContentRaw(): ContentItem[] {
    return [...this.contentItems];
  }

  public addContentItem(item: ContentItem): { success: boolean; item?: ContentItem; duplicateOf?: string } {
    if (!item.categories || item.categories.length === 0) {
      item.categories = classifier.categorizeContent(
        item.title,
        item.description,
        item.author,
        item.sourceClassification || 'UNKNOWN',
        item.dramaId,
        item.episodeNumber
      );
    }

    if (!item.discoveryCategory || !item.language || !item.genre || !item.country) {
      const meta = classifier.detectDiscoveryMetadata(
        item.title,
        item.description,
        item.author,
        item.dramaId,
        item.episodeNumber,
        item.duration,
        item.contentType
      );
      item.discoveryCategory = item.discoveryCategory || meta.discoveryCategory;
      item.language = item.language || meta.language;
      item.genre = item.genre || meta.genre;
      item.country = item.country || meta.country;
    }

    const existingById = this.contentItems.find(i => i.id === item.id);
    if (existingById) {
      this.mergeDuplicates(existingById.id, item.id, item);
      return { success: false, duplicateOf: existingById.id };
    }

    const dupMatch = deduplicator.findMatch(item, this.contentItems);
    if (dupMatch) {
      this.mergeDuplicates(dupMatch.matchedId, item.id, item);
      return { success: false, duplicateOf: dupMatch.matchedId };
    }

    this.contentItems.unshift(item);
    this.saveTable('content_items', this.contentItems);
    this.syncPlatformEnvironment();
    return { success: true, item };
  }

  public updateContentItem(id: string, updates: Partial<ContentItem>): ContentItem | null {
    const index = this.contentItems.findIndex(i => i.id === id);
    if (index === -1) return null;

    this.contentItems[index] = {
      ...this.contentItems[index],
      ...updates,
      lastCheckedAt: new Date().toISOString()
    };
    this.saveTable('content_items', this.contentItems);
    this.syncPlatformEnvironment();
    return this.contentItems[index];
  }

  public deleteContentItem(id: string): boolean {
    const beforeLen = this.contentItems.length;
    this.contentItems = this.contentItems.filter(i => i.id !== id);
    if (this.contentItems.length !== beforeLen) {
      this.saveTable('content_items', this.contentItems);
      this.syncPlatformEnvironment();
      return true;
    }
    return false;
  }

  // Multi-Level Deduplication matching
  public findDuplicate(candidate: Partial<ContentItem>): ContentItem | null {
    const match = deduplicator.findMatch(candidate, this.contentItems);
    return match ? match.canonicalItem : null;
  }

  // Merge duplicates into a single canonical record with multiple attached source references
  public mergeDuplicates(canonicalId: string, duplicateId: string, candidateData?: Partial<ContentItem>): boolean {
    const canonical = this.contentItems.find(i => i.id === canonicalId);
    if (!canonical) return false;

    const crossSources = canonical.crossPlatformSources || [];
    const sourceUrl = candidateData?.sourceUrl || this.contentItems.find(i => i.id === duplicateId)?.sourceUrl;
    const platform = candidateData?.platform || this.contentItems.find(i => i.id === duplicateId)?.platform || 'WebSource';

    if (sourceUrl && !crossSources.some(s => s.url === sourceUrl)) {
      crossSources.push({
        platform,
        url: sourceUrl,
        note: candidateData?.title ? `Also on ${platform}: ${candidateData.title}` : `Available on ${platform}`
      });
    }

    canonical.crossPlatformSources = crossSources;
    canonical.duplicateCount = (canonical.duplicateCount || 0) + 1;

    // If duplicate already exists in DB, mark status as DUPLICATE
    const existingDup = this.contentItems.find(i => i.id === duplicateId);
    if (existingDup) {
      existingDup.verificationStatus = 'DUPLICATE';
      existingDup.canonicalId = canonicalId;
    }

    this.saveTable('content_items', this.contentItems);
    return true;
  }

  // Dramas
  public getDramas(): Drama[] {
    return [...this.dramas];
  }

  public getDramaById(id: string): { drama: Drama | null; episodes: Episode[]; content: ContentItem[] } {
    const drama = this.dramas.find(d => d.id === id || d.slug === id) || null;
    if (!drama) return { drama: null, episodes: [], content: [] };

    const episodes = this.episodes
      .filter(e => e.dramaId === drama.id)
      .sort((a, b) => a.episodeNumber - b.episodeNumber);

    const content = this.contentItems.filter(
      c => c.dramaId === drama.id && c.verificationStatus === 'VERIFIED'
    );

    return { drama, episodes, content };
  }

  public getEpisodes(dramaId?: string): Episode[] {
    if (!dramaId) return [...this.episodes];
    return this.episodes.filter(e => e.dramaId === dramaId);
  }

  // Timeline
  public getTimelineEvents(): TimelineEvent[] {
    return [...this.timelineEvents].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  // Platforms
  public getPlatforms(): PlatformConfig[] {
    return [...this.platforms];
  }

  // Discovery Queries Management
  public getDiscoveryQueries(): DiscoveryQuery[] {
    return [...this.queries];
  }

  public addDiscoveryQuery(query: string, family: DiscoveryQuery['family']): DiscoveryQuery {
    const newQ: DiscoveryQuery = {
      id: `q-${Date.now()}`,
      query: query.trim(),
      family,
      enabled: true,
      resultsCount: 0
    };
    this.queries.push(newQ);
    this.saveTable('queries', this.queries);
    return newQ;
  }

  public toggleDiscoveryQuery(id: string): boolean {
    const q = this.queries.find(item => item.id === id);
    if (!q) return false;
    q.enabled = !q.enabled;
    this.saveTable('queries', this.queries);
    return true;
  }

  public deleteDiscoveryQuery(id: string): boolean {
    const initial = this.queries.length;
    this.queries = this.queries.filter(item => item.id !== id);
    if (this.queries.length !== initial) {
      this.saveTable('queries', this.queries);
      return true;
    }
    return false;
  }

  // Channels Management
  public getChannels(): ChannelRecord[] {
    return [...this.channels];
  }

  public upsertChannel(channel: ChannelRecord): void {
    const idx = this.channels.findIndex(c => c.channelId === channel.channelId);
    if (idx >= 0) {
      this.channels[idx] = { ...this.channels[idx], ...channel, lastScanned: new Date().toISOString() };
    } else {
      this.channels.push(channel);
    }
    this.saveTable('channels', this.channels);
  }

  // Discovery Runs Audit Log
  public getDiscoveryRuns(): DiscoveryRunReport[] {
    return [...this.discoveryRuns].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  public recordDiscoveryRun(report: DiscoveryRunReport): void {
    this.discoveryRuns.unshift(report);
    // Keep last 100 historical scan logs
    if (this.discoveryRuns.length > 100) {
      this.discoveryRuns = this.discoveryRuns.slice(0, 100);
    }
    this.saveTable('discovery_runs', this.discoveryRuns);
  }

  // Admin Metrics
  public getMetrics(): {
    totalContent: number;
    verifiedContent: number;
    pendingReview: number;
    discovered: number;
    brokenSources: number;
    duplicates: number;
    totalDramas: number;
    totalEpisodes: number;
    totalChannels: number;
    totalQueries: number;
    lastScan: DiscoveryRunReport | null;
    platformBreakdown: Record<string, number>;
  } {
    const totalContent = this.contentItems.length;
    const verifiedContent = this.contentItems.filter(i => i.verificationStatus === 'VERIFIED').length;
    const pendingReview = this.contentItems.filter(i => i.verificationStatus === 'REVIEWING').length;
    const discovered = this.contentItems.filter(i => i.verificationStatus === 'DISCOVERED').length;
    const brokenSources = this.contentItems.filter(i => !i.sourceAvailable || i.verificationStatus === 'BROKEN').length;
    const duplicates = this.contentItems.filter(i => i.verificationStatus === 'DUPLICATE').length;

    const platformBreakdown: Record<string, number> = {};
    for (const item of this.contentItems) {
      platformBreakdown[item.platform] = (platformBreakdown[item.platform] || 0) + 1;
    }

    return {
      totalContent,
      verifiedContent,
      pendingReview,
      discovered,
      brokenSources,
      duplicates,
      totalDramas: this.dramas.length,
      totalEpisodes: this.episodes.length,
      totalChannels: this.channels.length,
      totalQueries: this.queries.length,
      lastScan: this.discoveryRuns[0] || null,
      platformBreakdown
    };
  }

  // Perform source health check using SourceHealthMonitor
  public async performHealthCheck(): Promise<{ checked: number; healthy: number; unavailable: number }> {
    const audit = await healthMonitor.auditBatch(this.contentItems);

    for (const res of audit.results) {
      const item = this.contentItems.find(i => i.id === res.itemId);
      if (item) {
        item.sourceAvailable = res.status === 'ACTIVE' || res.status === 'REDIRECTED';
        item.embedAvailable = res.embedAvailable;
        item.lastCheckedAt = res.checkedAt;
        item.healthStatus = res.status;
        if (res.status === 'REMOVED' || res.status === 'PRIVATE') {
          item.verificationStatus = 'BROKEN';
        }
      }
    }

    this.saveTable('content_items', this.contentItems);
    return {
      checked: audit.results.length,
      healthy: audit.activeCount,
      unavailable: audit.unavailableCount + audit.removedCount
    };
  }
}

// Singleton database store
export const db = new DatabaseStore();
