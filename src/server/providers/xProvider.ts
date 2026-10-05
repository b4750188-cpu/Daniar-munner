import type { ContentItem, PlatformType } from '../../types/index.ts';
import type { ContentProvider } from './baseProvider.ts';

export class XProvider implements ContentProvider {
  public name = 'XProvider';
  public platform: PlatformType = 'X';

  public isConfigured(): boolean {
    return Boolean(process.env.X_BEARER_TOKEN && process.env.X_BEARER_TOKEN.trim().length > 0);
  }

  public validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return (
        parsed.hostname.includes('twitter.com') ||
        parsed.hostname.includes('x.com')
      );
    } catch {
      return false;
    }
  }

  public async discover(): Promise<{ items: ContentItem[]; error?: string }> {
    if (!this.isConfigured()) {
      return {
        items: [],
        error: 'X API Bearer token (X_BEARER_TOKEN) is not configured. Configure in environment variables to ingest public tweets and announcements.'
      };
    }

    const token = process.env.X_BEARER_TOKEN;
    try {
      // X API v2 query for public Dananeer Mobeen posts
      const res = await fetch('https://api.twitter.com/2/tweets/search/recent?query=from:DananeerM%20has:media&tweet.fields=created_at,text,entities,attachments', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const text = await res.text();
        return {
          items: [],
          error: `X API returned status ${res.status}: ${text}`
        };
      }

      const data = await res.json() as {
        data?: Array<{ id: string; text: string; created_at: string }>;
      };

      if (!data.data || !Array.isArray(data.data)) {
        return { items: [] };
      }

      const normalized: ContentItem[] = data.data.map(tweet => ({
        id: `x-${tweet.id}`,
        platform: 'X',
        sourceUrl: `https://x.com/DananeerM/status/${tweet.id}`,
        embedUrl: null,
        title: tweet.text.slice(0, 80) + (tweet.text.length > 80 ? '...' : ''),
        description: tweet.text,
        caption: tweet.text,
        publishedAt: tweet.created_at || new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        author: 'DananeerM',
        contentType: 'post',
        thumbnailUrl: '/src/assets/images/dananeer_hero_cinematic_1791045480240.jpg',
        duration: null,
        tags: ['x', 'twitter', 'announcement', 'dananeer-mobeen'],
        dramaId: null,
        episodeNumber: null,
        people: ['Dananeer Mobeen'],
        verificationStatus: 'DISCOVERED',
        sourceMetadata: { tweetId: tweet.id },
        lastCheckedAt: new Date().toISOString(),
        sourceAvailable: true,
        embedAvailable: false,
        duplicateCount: 0
      }));

      return { items: normalized };
    } catch (err) {
      return {
        items: [],
        error: `X discovery error: ${(err as Error).message}`
      };
    }
  }
}
