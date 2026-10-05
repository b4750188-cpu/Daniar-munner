import type { ContentItem, PlatformType } from '../../types/index.ts';
import type { ContentProvider } from './baseProvider.ts';

export class InstagramProvider implements ContentProvider {
  public name = 'InstagramProvider';
  public platform: PlatformType = 'Instagram';

  public isConfigured(): boolean {
    return Boolean(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_ACCESS_TOKEN.trim().length > 0);
  }

  public validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return (
        parsed.hostname.includes('instagram.com') ||
        parsed.hostname.includes('instagr.am')
      );
    } catch {
      return false;
    }
  }

  public async discover(): Promise<{ items: ContentItem[]; error?: string }> {
    if (!this.isConfigured()) {
      return {
        items: [],
        error: 'Instagram Graph API access token (INSTAGRAM_ACCESS_TOKEN) is not configured. Configure in environment variables to ingest public media.'
      };
    }

    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    try {
      // Instagram Graph API query for business/creator account media
      const res = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${token}`);
      if (!res.ok) {
        const errorText = await res.text();
        return {
          items: [],
          error: `Instagram API returned status ${res.status}: ${errorText}`
        };
      }

      const data = await res.json() as {
        data?: Array<{
          id: string;
          caption?: string;
          media_type?: string;
          media_url?: string;
          permalink?: string;
          thumbnail_url?: string;
          timestamp?: string;
        }>;
      };

      if (!data.data || !Array.isArray(data.data)) {
        return { items: [] };
      }

      const normalized: ContentItem[] = data.data.map(raw => {
        const isVideo = raw.media_type === 'VIDEO';
        return {
          id: `ig-${raw.id}`,
          platform: 'Instagram',
          sourceUrl: raw.permalink || `https://www.instagram.com/p/${raw.id}/`,
          embedUrl: null,
          title: (raw.caption?.slice(0, 70) || 'Instagram Public Post') + (raw.caption && raw.caption.length > 70 ? '...' : ''),
          description: raw.caption || 'Public Instagram post by Dananeer Mobeen (@dananeerr).',
          caption: raw.caption || null,
          publishedAt: raw.timestamp || new Date().toISOString(),
          discoveredAt: new Date().toISOString(),
          author: 'dananeerr',
          contentType: isVideo ? 'reel' : 'photo',
          thumbnailUrl: raw.thumbnail_url || raw.media_url || '/src/assets/images/dananeer_hero_cinematic_1791045480240.jpg',
          duration: null,
          tags: ['instagram', 'dananeerr', isVideo ? 'reel' : 'photo'],
          dramaId: null,
          episodeNumber: null,
          people: ['Dananeer Mobeen'],
          verificationStatus: 'DISCOVERED',
          sourceMetadata: { instagramId: raw.id, mediaType: raw.media_type },
          lastCheckedAt: new Date().toISOString(),
          sourceAvailable: true,
          embedAvailable: false,
          duplicateCount: 0
        };
      });

      return { items: normalized };
    } catch (err) {
      return {
        items: [],
        error: `Instagram discovery failed: ${(err as Error).message}`
      };
    }
  }
}
