import type { ContentItem, PlatformType } from '../../types/index.ts';
import type { ContentProvider } from './baseProvider.ts';
import { classifier } from '../discovery/classifier.ts';
import { deduplicator } from '../discovery/deduplicator.ts';

interface PublicSeedTarget {
  url: string;
  expectedPublisher: string;
  defaultContentType: 'interview' | 'article' | 'video' | 'appearance';
  dramaId?: string;
}

export class WebSourceProvider implements ContentProvider {
  public name = 'WebSourceProvider';
  public platform: PlatformType = 'WebSource';

  // Verified public sources and drama hubs known to publish Dananeer Mobeen content
  private publicTargets: PublicSeedTarget[] = [
    {
      url: 'https://somethinghaute.com/haute-byte-dananeer-mobeen-very-filmy/',
      expectedPublisher: 'Something Haute',
      defaultContentType: 'interview',
      dramaId: 'very-filmy'
    },
    {
      url: 'https://fuchsiamagazine.com/dananeer-mobeen-on-zobia-muhabbat-gumshuda-meri/',
      expectedPublisher: 'FUCHSIA Magazine',
      defaultContentType: 'interview',
      dramaId: 'muhabbat-gumshuda-meri'
    },
    {
      url: 'https://images.dawn.com/news/1188902',
      expectedPublisher: 'Dawn Images',
      defaultContentType: 'article'
    },
    {
      url: 'https://arydigital.tv/sinf-e-aahan-drama-cast-crew-episodes/',
      expectedPublisher: 'ARY Digital',
      defaultContentType: 'video',
      dramaId: 'sinf-e-aahan'
    },
    {
      url: 'https://hum.tv/dramas/muhabbat-gumshuda-meri-ost-and-episodes/',
      expectedPublisher: 'HUM TV',
      defaultContentType: 'video',
      dramaId: 'muhabbat-gumshuda-meri'
    }
  ];

  public isConfigured(): boolean {
    return true; // Web discovery is active for public verified pages
  }

  public validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const allowedHosts = [
        'hum.tv',
        'arydigital.tv',
        'somethinghaute.com',
        'fuchsiamagazine.com',
        'images.dawn.com',
        'tribune.com.pk',
        'bbc.com',
        'youtube.com',
        'youtu.be'
      ];
      return allowedHosts.some(host => parsed.hostname.endsWith(host));
    } catch {
      return false;
    }
  }

  /**
   * Scrapes public HTML metadata (og:title, og:description, og:image, og:video) from verified portals
   */
  public async extractPageMetadata(target: PublicSeedTarget): Promise<ContentItem | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(target.url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;

      const html = await res.text();

      // Extract Open Graph tags
      const getMeta = (prop: string): string => {
        const regex = new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:)?${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
        const match = html.match(regex);
        return match ? match[1] : '';
      };

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const pageTitle = getMeta('title') || (titleMatch ? titleMatch[1] : 'Dananeer Mobeen Public Article');
      const pageDesc = getMeta('description') || 'Publicly indexed journalistic coverage or media reference.';
      const pageImage = getMeta('image') || '/src/assets/images/dananeer_hero_cinematic_1791045480240.jpg';
      const pageVideo = getMeta('video') || '';

      // Check embedded YouTube video in page HTML
      let embedUrl: string | null = null;
      const ytIframeMatch = html.match(/src=["'](?:https?:)?\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)["']/i);
      if (ytIframeMatch) {
        embedUrl = `https://www.youtube.com/embed/${ytIframeMatch[1]}`;
      } else if (pageVideo && pageVideo.includes('youtube.com')) {
        const ytId = deduplicator.extractYouTubeId(pageVideo);
        if (ytId) embedUrl = `https://www.youtube.com/embed/${ytId}`;
      }

      // Classify source & relevance
      const evaluation = classifier.evaluate(pageTitle, pageDesc, target.expectedPublisher, target.url, 'WebSource');

      // Reject irrelevant
      if (evaluation.relevanceClassification === 'IRRELEVANT') return null;

      return {
        id: `web-${Buffer.from(target.url).toString('base64url').slice(0, 16)}`,
        platform: 'WebSource',
        sourceUrl: target.url,
        embedUrl,
        title: pageTitle.trim(),
        description: pageDesc.trim(),
        caption: null,
        publishedAt: new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        author: target.expectedPublisher,
        contentType: target.defaultContentType,
        thumbnailUrl: pageImage,
        duration: null,
        tags: ['web-discovery', 'public-archive', evaluation.detectedDramaId || 'press'],
        dramaId: evaluation.detectedDramaId || target.dramaId || null,
        episodeNumber: evaluation.detectedEpisodeNumber,
        people: ['Dananeer Mobeen'],
        verificationStatus: 'VERIFIED',
        sourceMetadata: {
          originalPortal: target.expectedPublisher,
          indexedFromPublicHtml: true
        },
        lastCheckedAt: new Date().toISOString(),
        sourceAvailable: true,
        embedAvailable: Boolean(embedUrl),
        provenance: 'LIVE_DISCOVERY',
        sourceClassification: evaluation.sourceClassification,
        relevanceClassification: evaluation.relevanceClassification,
        categories: evaluation.detectedCategories,
        reasonForDiscovery: `Verified public crawl of ${target.expectedPublisher}`
      };
    } catch {
      return null;
    }
  }

  public async discover(): Promise<{ items: ContentItem[]; error?: string }> {
    const items: ContentItem[] = [];
    for (const target of this.publicTargets) {
      const extracted = await this.extractPageMetadata(target);
      if (extracted) {
        items.push(extracted);
      }
    }

    return { items };
  }
}
