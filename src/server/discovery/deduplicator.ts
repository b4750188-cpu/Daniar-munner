import type { ContentItem } from '../../types/index.ts';

export interface DeduplicationMatch {
  level: number;
  levelDescription: string;
  matchedId: string;
  canonicalItem: ContentItem;
}

export class DeduplicationEngine {
  /**
   * Extracts YouTube Video ID from any standard or embedded YouTube URL
   */
  public extractYouTubeId(url: string): string | null {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtu.be')) {
        return parsed.pathname.replace(/^\//, '').split('?')[0].split('&')[0];
      }
      if (parsed.hostname.includes('youtube.com')) {
        if (parsed.searchParams.has('v')) {
          return parsed.searchParams.get('v');
        }
        if (parsed.pathname.includes('/embed/')) {
          return parsed.pathname.split('/embed/')[1]?.split('?')[0];
        }
        if (parsed.pathname.includes('/shorts/')) {
          return parsed.pathname.split('/shorts/')[1]?.split('?')[0];
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Normalizes a URL by stripping tracking parameters, anchors, and trailing slashes
   */
  public normalizeUrl(rawUrl: string): string {
    if (!rawUrl) return '';
    try {
      const parsed = new URL(rawUrl);
      const trackingParams = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'si',
        'fbclid',
        'ref',
        'feature',
        't',
        'ab_channel'
      ];
      for (const param of trackingParams) {
        parsed.searchParams.delete(param);
      }
      // Sort remaining search params for canonical equivalence
      parsed.searchParams.sort();
      let normalized = `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname}`;
      if (parsed.search) {
        normalized += parsed.search;
      }
      return normalized.replace(/\/+$/, '');
    } catch {
      return rawUrl.trim().toLowerCase().replace(/\/+$/, '');
    }
  }

  /**
   * Generates a normalized title token string for title comparisons
   */
  public normalizeTitle(title: string): string {
    if (!title) return '';
    return title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculates token overlap Jaccard similarity (0.0 to 1.0)
   */
  public calculateSimilarity(a: string, b: string): number {
    const tokensA = new Set(this.normalizeTitle(a).split(' ').filter(Boolean));
    const tokensB = new Set(this.normalizeTitle(b).split(' ').filter(Boolean));
    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersection = 0;
    for (const token of tokensA) {
      if (tokensB.has(token)) intersection++;
    }
    const union = new Set([...tokensA, ...tokensB]).size;
    return intersection / union;
  }

  /**
   * Executes 6-level multi-factor duplicate detection against the existing archive
   */
  public findMatch(
    candidate: Partial<ContentItem>,
    existingPool: ContentItem[],
    excludeId?: string
  ): DeduplicationMatch | null {
    if (!candidate || !existingPool || existingPool.length === 0) return null;

    const candUrl = candidate.sourceUrl || '';
    const candNormUrl = this.normalizeUrl(candUrl);
    const candYtId = this.extractYouTubeId(candUrl) || this.extractYouTubeId(candidate.embedUrl || '');
    const candTitleNorm = this.normalizeTitle(candidate.title || '');
    const candAuthor = (candidate.author || '').toLowerCase().trim();
    const candDate = candidate.publishedAt ? new Date(candidate.publishedAt).getTime() : null;

    for (const existing of existingPool) {
      // Exclude specific ID if requested
      if (excludeId && existing.id === excludeId) continue;

      // LEVEL 0: Exact item ID match
      if (candidate.id && existing.id === candidate.id) {
        return {
          level: 1,
          levelDescription: 'Exact item ID match',
          matchedId: existing.id,
          canonicalItem: existing
        };
      }

      const existUrl = existing.sourceUrl || '';
      const existNormUrl = this.normalizeUrl(existUrl);
      const existYtId =
        this.extractYouTubeId(existUrl) ||
        this.extractYouTubeId(existing.embedUrl || '') ||
        (existing.sourceMetadata?.videoId as string);

      // LEVEL 1: Exact canonical URL
      if (candUrl && existUrl && candUrl === existUrl) {
        return {
          level: 1,
          levelDescription: 'Exact canonical URL match',
          matchedId: existing.id,
          canonicalItem: existing
        };
      }

      // LEVEL 2: YouTube video ID match
      if (candYtId && existYtId && candYtId === existYtId) {
        return {
          level: 2,
          levelDescription: 'Matching YouTube video identifier',
          matchedId: existing.id,
          canonicalItem: existing
        };
      }

      // LEVEL 3: Normalized source URL
      if (candNormUrl && existNormUrl && candNormUrl === existNormUrl) {
        return {
          level: 3,
          levelDescription: 'Normalized source URL match (after stripping query parameters)',
          matchedId: existing.id,
          canonicalItem: existing
        };
      }

      // LEVEL 4: Normalized title + publisher
      const existTitleNorm = this.normalizeTitle(existing.title || '');
      const existAuthor = (existing.author || '').toLowerCase().trim();
      if (
        candTitleNorm &&
        existTitleNorm &&
        candTitleNorm === existTitleNorm &&
        candAuthor &&
        existAuthor &&
        (candAuthor === existAuthor || candAuthor.includes(existAuthor) || existAuthor.includes(candAuthor))
      ) {
        return {
          level: 4,
          levelDescription: 'Identical normalized title and publisher',
          matchedId: existing.id,
          canonicalItem: existing
        };
      }

      // LEVEL 5: High title similarity (> 85%) + publication date proximity within 48h
      const similarity = this.calculateSimilarity(candidate.title || '', existing.title || '');
      if (similarity >= 0.85 && candDate && existing.publishedAt) {
        const existDate = new Date(existing.publishedAt).getTime();
        const diffHours = Math.abs(candDate - existDate) / (1000 * 60 * 60);
        if (diffHours <= 48) {
          return {
            level: 5,
            levelDescription: `High title similarity (${Math.round(similarity * 100)}%) with publication date within 48 hours`,
            matchedId: existing.id,
            canonicalItem: existing
          };
        }
      }

      // LEVEL 6: Same video embedded on multiple websites
      if (candidate.embedUrl && existing.embedUrl) {
        const candEmbedNorm = this.normalizeUrl(candidate.embedUrl);
        const existEmbedNorm = this.normalizeUrl(existing.embedUrl);
        if (candEmbedNorm === existEmbedNorm) {
          return {
            level: 6,
            levelDescription: 'Identical media embed URL across distinct publication pages',
            matchedId: existing.id,
            canonicalItem: existing
          };
        }
      }
    }

    return null;
  }
}

export const deduplicator = new DeduplicationEngine();
