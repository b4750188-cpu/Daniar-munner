import { db } from '../db/store.ts';
import type { ContentProvider, ProviderDiscoveryResult } from './baseProvider.ts';
import { YouTubeProvider } from './youtubeProvider.ts';
import { InstagramProvider } from './instagramProvider.ts';
import { XProvider } from './xProvider.ts';
import { SnapchatProvider } from './snapchatProvider.ts';
import { WebSourceProvider } from './webSourceProvider.ts';

export const providers: ContentProvider[] = [
  new YouTubeProvider(),
  new InstagramProvider(),
  new XProvider(),
  new SnapchatProvider(),
  new WebSourceProvider()
];

export function getProviderByName(name: string): ContentProvider | undefined {
  return providers.find(p => p.name.toLowerCase() === name.toLowerCase() || p.platform.toLowerCase() === name.toLowerCase());
}

export async function runDiscovery(targetProviderName?: string): Promise<ProviderDiscoveryResult[]> {
  const activeProviders = targetProviderName
    ? providers.filter(p => p.name.toLowerCase() === targetProviderName.toLowerCase() || p.platform.toLowerCase() === targetProviderName.toLowerCase())
    : providers;

  const results: ProviderDiscoveryResult[] = [];

  for (const provider of activeProviders) {
    const isConfigured = provider.isConfigured();
    if (!isConfigured) {
      results.push({
        provider: provider.name,
        platform: provider.platform,
        itemsDiscovered: 0,
        newItems: 0,
        duplicates: 0,
        configured: false,
        message: `${provider.platform} integration credentials are not configured in environment variables.`
      });
      continue;
    }

    try {
      const discovery = await provider.discover();
      let newCount = 0;
      let dupCount = 0;

      for (const item of discovery.items) {
        const dup = db.findDuplicate(item);
        if (dup) {
          dupCount++;
        } else {
          db.addContentItem(item);
          newCount++;
        }
      }

      results.push({
        provider: provider.name,
        platform: provider.platform,
        itemsDiscovered: discovery.items.length,
        newItems: newCount,
        duplicates: dupCount,
        configured: true,
        error: discovery.error,
        message: discovery.error ? undefined : `Discovery completed: found ${discovery.items.length} items (${newCount} new, ${dupCount} duplicates).`
      });
    } catch (err) {
      results.push({
        provider: provider.name,
        platform: provider.platform,
        itemsDiscovered: 0,
        newItems: 0,
        duplicates: 0,
        configured: true,
        error: (err as Error).message
      });
    }
  }

  return results;
}
