import type { ContentItem, PlatformType } from '../../types/index.ts';

export interface ProviderDiscoveryResult {
  provider: string;
  platform: PlatformType;
  itemsDiscovered: number;
  newItems: number;
  duplicates: number;
  error?: string;
  configured: boolean;
  message?: string;
}

export interface ContentProvider {
  name: string;
  platform: PlatformType;
  isConfigured(): boolean;
  discover(): Promise<{ items: ContentItem[]; error?: string }>;
  validateUrl(url: string): boolean;
}
