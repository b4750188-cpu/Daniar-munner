/**
 * Domain types for Dananeer Mubeen Public Content Discovery Platform
 */

export type PlatformType =
  | 'YouTube'
  | 'Instagram'
  | 'X'
  | 'Snapchat'
  | 'WebSource'
  | 'Broadcast'
  | 'Interview';

export type ContentType =
  | 'video'
  | 'reel'
  | 'post'
  | 'photo'
  | 'interview'
  | 'appearance'
  | 'drama'
  | 'episode'
  | 'trailer'
  | 'clip'
  | 'behind-the-scenes'
  | 'performance'
  | 'article';

export type VerificationStatus =
  | 'DISCOVERED'
  | 'REVIEWING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'BROKEN'
  | 'DUPLICATE';

export type SourceClassification =
  | 'OFFICIAL_PERSONAL'
  | 'OFFICIAL_BROADCASTER'
  | 'OFFICIAL_PRODUCTION'
  | 'OFFICIAL_MEDIA'
  | 'NEWS_ORGANIZATION'
  | 'INTERVIEW_PUBLICATION'
  | 'PODCAST'
  | 'PUBLIC_EVENT'
  | 'USER_GENERATED'
  | 'FAN_OR_REPOST'
  | 'UNKNOWN';

export type RelevanceClassification =
  | 'DIRECT'
  | 'STRONG_RELEVANCE'
  | 'RELATED'
  | 'UNCERTAIN'
  | 'IRRELEVANT';

export type ProvenanceType =
  | 'CURATED'
  | 'LIVE_DISCOVERY'
  | 'ADMIN_VERIFIED';

export type SourceHealthStatus =
  | 'ACTIVE'
  | 'REDIRECTED'
  | 'REMOVED'
  | 'PRIVATE'
  | 'UNAVAILABLE'
  | 'ERROR'
  | 'UNKNOWN';

export interface CrossPlatformSource {
  platform: PlatformType;
  url: string;
  note?: string;
  sourceClassification?: SourceClassification;
}

export interface ContentItem {
  id: string;
  platform: PlatformType;
  sourceUrl: string;
  embedUrl: string | null;
  title: string;
  description: string;
  caption: string | null;
  publishedAt: string; // ISO string
  discoveredAt: string;
  author: string;
  contentType: ContentType;
  thumbnailUrl: string;
  duration: string | null;
  tags: string[];
  dramaId: string | null;
  episodeNumber: number | null;
  people: string[];
  verificationStatus: VerificationStatus;
  sourceMetadata: Record<string, unknown>;
  lastCheckedAt: string;
  sourceAvailable: boolean;
  embedAvailable: boolean;
  canonicalId?: string | null;
  duplicateCount?: number;
  crossPlatformSources?: CrossPlatformSource[];
  // Provenance & Discovery Extensions
  provenance?: ProvenanceType;
  sourceClassification?: SourceClassification;
  relevanceClassification?: RelevanceClassification;
  discoveryQuery?: string;
  channelId?: string;
  healthStatus?: SourceHealthStatus;
  reasonForDiscovery?: string;
  categories?: string[];
  discoveryCategory?: 'Trailers' | 'Full Dramas / Episodes' | 'Shorts';
  language?: string;
  genre?: string;
  country?: string;
}

export type DiscoveryCategory = 'Trailers' | 'Full Dramas / Episodes' | 'Shorts';

export interface YouTubeApiConfigStatus {
  configured: boolean;
  status: 'CONNECTED' | 'FAILED' | 'CONFIGURED' | 'NOT_CONFIGURED';
  maskedKey: string;
  lastCheckedAt?: string;
  message?: string;
  errorReason?: string | null;
}

export type VideoArchiveCategory =
  | 'Latest Discoveries'
  | 'Interviews'
  | 'Dramas'
  | 'Episodes'
  | 'Behind the Scenes'
  | 'Vlogs'
  | 'Podcasts'
  | 'Events'
  | 'Awards'
  | 'Fashion'
  | 'Press'
  | 'Promotions'
  | 'Historical / Viral'
  | 'Official Content';

export interface ChannelRecord {
  id: string;
  channelId: string;
  name: string;
  url: string;
  platform: PlatformType;
  channelType: SourceClassification;
  verificationStatus: boolean;
  firstDiscovered: string;
  lastScanned: string;
  itemCount: number;
}

export interface DiscoveryQuery {
  id: string;
  query: string;
  family: 'CORE' | 'DRAMA' | 'INTERVIEW' | 'APPEARANCE' | 'HISTORICAL' | 'RECENT' | 'OFFICIAL_SOURCE';
  enabled: boolean;
  lastRunAt?: string;
  resultsCount?: number;
}

export interface DiscoveryRunReport {
  id: string;
  jobType: 'DAILY_DISCOVERY' | 'WEEKLY_DEEP_SCAN' | 'MANUAL_SCAN' | 'SOURCE_SPECIFIC_SCAN' | 'HISTORICAL_RESCAN';
  targetProvider?: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  status: 'COMPLETED' | 'FAILED' | 'PARTIAL';
  queriesExecuted: number;
  sourcesContacted: number;
  sourcesUnavailable: number;
  rawDiscovered: number;
  uniqueNew: number;
  duplicatesDetected: number;
  rejected: number;
  needsVerification: number;
  verified: number;
  errors: string[];
}

export interface ContentRelationship {
  id: string;
  fromId: string;
  toId: string;
  relationType: 'DRAMA' | 'INTERVIEW' | 'EVENT' | 'AWARD' | 'CHARACTER' | 'TIMELINE_EVENT' | 'ALTERNATE_SOURCE' | 'RELATED_VIDEO';
  note?: string;
}

export interface Drama {
  id: string;
  title: string;
  slug: string;
  year: number;
  character: string;
  network: string;
  networkChannel: string;
  officialSource: string;
  totalEpisodes: number;
  status: 'Completed' | 'Ongoing';
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  director: string;
  writer: string;
  coStars: string[];
  accolades: string[];
  officialPlaylistUrl?: string;
}

export interface Episode {
  id: string;
  dramaId: string;
  episodeNumber: number;
  title: string;
  airDate: string;
  sourceUrl: string;
  embedUrl: string | null;
  thumbnailUrl: string;
  duration: string;
  synopsis: string;
}

export interface TimelineEvent {
  id: string;
  year: number;
  date: string;
  title: string;
  subtitle: string;
  category: 'viral_breakthrough' | 'drama_debut' | 'lead_role' | 'award' | 'brand_ambassador' | 'media_appearance';
  description: string;
  contentItemId: string | null;
  sourceUrl: string;
  platform: PlatformType;
  verified: boolean;
}

export interface PlatformConfig {
  id: string;
  name: PlatformType;
  displayName: string;
  configured: boolean;
  status: 'ACTIVE' | 'NOT_CONFIGURED' | 'RATE_LIMITED' | 'ERROR';
  description: string;
  requiredEnvVar: string;
  itemCount: number;
  lastSyncAt: string | null;
}

export interface FilterOptions {
  platform?: string;
  contentType?: string;
  category?: string;
  discoveryCategory?: string;
  language?: string;
  genre?: string;
  country?: string;
  durationRange?: string;
  year?: string;
  dramaId?: string;
  sort?: 'latest' | 'oldest' | 'relevance';
  search?: string;
  page?: number;
  limit?: number;
}
