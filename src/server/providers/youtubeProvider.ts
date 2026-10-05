import type { ContentItem, PlatformType, ChannelRecord } from '../../types/index.ts';
import type { ContentProvider } from './baseProvider.ts';
import { classifier } from '../discovery/classifier.ts';
import { deduplicator } from '../discovery/deduplicator.ts';

interface YouTubeSearchResponse {
  nextPageToken?: string;
  pageInfo?: { totalResults?: number; resultsPerPage?: number };
  items?: Array<{
    id?: { kind?: string; videoId?: string; channelId?: string };
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      channelId?: string;
      channelTitle?: string;
      thumbnails?: { high?: { url?: string }; medium?: { url?: string }; default?: { url?: string } };
    };
  }>;
}

export class YouTubeProvider implements ContentProvider {
  public name = 'YouTubeProvider';
  public platform: PlatformType = 'YouTube';

  public isConfigured(): boolean {
    return Boolean(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_API_KEY.trim().length > 0);
  }

  public validateUrl(url: string): boolean {
    return Boolean(deduplicator.extractYouTubeId(url));
  }

  /**
   * Discovers content across configured query families with pagination and rate-limit backoff
   */
  public async discover(queriesToRun?: string[], maxPagesPerQuery = 2): Promise<{
    items: ContentItem[];
    channels: ChannelRecord[];
    queriesExecuted: number;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        items: [],
        channels: [],
        queriesExecuted: 0,
        error: 'YouTube API credentials (YOUTUBE_API_KEY) are not configured. Enable in environment settings to ingest live YouTube data.'
      };
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    const defaultQueries = [
      'Dananeer Mobeen official',
      'Dananeer Mobeen interview',
      'Dananeer Mobeen Sinf e Aahan',
      'Dananeer Mobeen Muhabbat Gumshuda Meri',
      'Dananeer Mobeen Very Filmy',
      'Dananeer Mobeen vlog'
    ];

    const activeQueries = queriesToRun && queriesToRun.length > 0 ? queriesToRun : defaultQueries;
    const discoveredItems: ContentItem[] = [];
    const discoveredChannelsMap = new Map<string, ChannelRecord>();
    let executedCount = 0;
    let queryError: string | undefined;

    for (const q of activeQueries) {
      executedCount++;
      let pageToken: string | undefined = undefined;
      let pagesFetched = 0;

      while (pagesFetched < maxPagesPerQuery) {
        pagesFetched++;
        try {
          const encodedQ = encodeURIComponent(q);
          let apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedQ}&type=video&maxResults=15&order=relevance&key=${apiKey}`;
          if (pageToken) {
            apiUrl += `&pageToken=${pageToken}`;
          }

          const res = await fetch(apiUrl);
          if (res.status === 429) {
            // Rate limit encountered; backoff briefly
            await new Promise(r => setTimeout(r, 2000));
            break;
          }

          if (!res.ok) {
            const errText = await res.text();
            queryError = `YouTube API status ${res.status}: ${errText}`;
            break;
          }

          const data = (await res.json()) as YouTubeSearchResponse;
          if (!data.items || data.items.length === 0) break;

          for (const raw of data.items) {
            const videoId = raw.id?.videoId;
            if (!videoId) continue;

            const snippet = raw.snippet || {};
            const title = snippet.title || 'Untitled';
            const description = snippet.description || '';
            const channelId = snippet.channelId || '';
            const channelTitle = snippet.channelTitle || 'YouTube Creator';
            const publishedAt = snippet.publishedAt || new Date().toISOString();
            const sourceUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            const thumbnailUrl =
              snippet.thumbnails?.high?.url ||
              snippet.thumbnails?.medium?.url ||
              snippet.thumbnails?.default?.url ||
              '/src/assets/images/dananeer_hero_cinematic_1791045480240.jpg';

            // Pipeline: Classify Source & Relevance
            const evaluation = classifier.evaluate(title, description, channelTitle, sourceUrl, 'YouTube');

            // Skip completely irrelevant matches
            if (evaluation.relevanceClassification === 'IRRELEVANT') continue;

            // Channel record
            if (channelId && !discoveredChannelsMap.has(channelId)) {
              discoveredChannelsMap.set(channelId, {
                id: `chan-${channelId}`,
                channelId,
                name: channelTitle,
                url: `https://www.youtube.com/channel/${channelId}`,
                platform: 'YouTube',
                channelType: evaluation.sourceClassification,
                verificationStatus: evaluation.sourceClassification !== 'FAN_OR_REPOST',
                firstDiscovered: new Date().toISOString(),
                lastScanned: new Date().toISOString(),
                itemCount: 1
              });
            } else if (channelId && discoveredChannelsMap.has(channelId)) {
              discoveredChannelsMap.get(channelId)!.itemCount++;
            }

            discoveredItems.push({
              id: `yt-${videoId}`,
              platform: 'YouTube',
              sourceUrl,
              embedUrl,
              title,
              description,
              caption: null,
              publishedAt,
              discoveredAt: new Date().toISOString(),
              author: channelTitle,
              contentType: title.toLowerCase().includes('interview') ? 'interview' : 'video',
              thumbnailUrl,
              duration: null,
              tags: ['youtube', 'dananeer-mobeen', evaluation.detectedDramaId || 'video'],
              dramaId: evaluation.detectedDramaId,
              episodeNumber: evaluation.detectedEpisodeNumber,
              people: ['Dananeer Mobeen'],
              verificationStatus:
                evaluation.relevanceClassification === 'DIRECT' &&
                (evaluation.sourceClassification === 'OFFICIAL_PERSONAL' || evaluation.sourceClassification === 'OFFICIAL_BROADCASTER')
                  ? 'VERIFIED'
                  : 'DISCOVERED',
              sourceMetadata: { videoId, channelId, channelTitle },
              lastCheckedAt: new Date().toISOString(),
              sourceAvailable: true,
              embedAvailable: true,
              provenance: 'LIVE_DISCOVERY',
              sourceClassification: evaluation.sourceClassification,
              relevanceClassification: evaluation.relevanceClassification,
              discoveryQuery: q,
              channelId,
              categories: evaluation.detectedCategories,
              reasonForDiscovery: evaluation.reason
            });
          }

          pageToken = data.nextPageToken;
          if (!pageToken) break;
        } catch (err) {
          queryError = (err as Error).message;
          break;
        }
      }
    }

    return {
      items: discoveredItems,
      channels: Array.from(discoveredChannelsMap.values()),
      queriesExecuted: executedCount,
      error: queryError
    };
  }
}
