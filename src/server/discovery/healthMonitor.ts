import type { ContentItem, SourceHealthStatus } from '../../types/index.ts';

export interface HealthCheckResult {
  itemId: string;
  sourceUrl: string;
  status: SourceHealthStatus;
  httpStatus?: number;
  embedAvailable: boolean;
  checkedAt: string;
  error?: string;
  retryAttempts: number;
}

export class SourceHealthMonitor {
  /**
   * Pings a single URL with retry logic (up to 3 attempts with exponential backoff)
   */
  public async checkUrl(url: string, maxRetries = 2): Promise<{ status: SourceHealthStatus; httpStatus?: number; error?: string; retries: number }> {
    let attempts = 0;
    let lastError = '';

    while (attempts <= maxRetries) {
      attempts++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

        const res = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'DananeerArchiveBot/1.0 (+https://dananeer-archive.org/bot)'
          }
        });
        clearTimeout(timeoutId);

        if (res.status >= 200 && res.status < 300) {
          return { status: 'ACTIVE', httpStatus: res.status, retries: attempts - 1 };
        } else if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
          return { status: 'REDIRECTED', httpStatus: res.status, retries: attempts - 1 };
        } else if (res.status === 404 || res.status === 410) {
          return { status: 'REMOVED', httpStatus: res.status, retries: attempts - 1 };
        } else if (res.status === 401 || res.status === 403) {
          return { status: 'PRIVATE', httpStatus: res.status, retries: attempts - 1 };
        } else if (res.status >= 500) {
          // Server-side temporary error; retry if attempts left
          lastError = `HTTP ${res.status}`;
          if (attempts <= maxRetries) {
            await new Promise(r => setTimeout(r, 1000 * attempts));
            continue;
          }
          return { status: 'UNAVAILABLE', httpStatus: res.status, error: lastError, retries: attempts - 1 };
        }
      } catch (err) {
        lastError = (err as Error).message;
        if (attempts <= maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * attempts));
          continue;
        }
        return { status: 'ERROR', error: lastError, retries: attempts - 1 };
      }
    }

    return { status: 'UNKNOWN', error: lastError, retries: attempts - 1 };
  }

  /**
   * Checks YouTube embed availability using YouTube's official public oEmbed endpoint
   */
  public async checkYouTubeEmbed(sourceUrl: string): Promise<boolean> {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(sourceUrl)}&format=json`;
      const res = await fetch(oembedUrl, { method: 'GET' });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Evaluates an individual ContentItem
   */
  public async evaluateItem(item: ContentItem): Promise<HealthCheckResult> {
    const isYouTube = item.platform === 'YouTube' || item.sourceUrl.includes('youtube.com') || item.sourceUrl.includes('youtu.be');
    
    let embedAvail = Boolean(item.embedUrl);
    if (isYouTube) {
      const oembedSuccess = await this.checkYouTubeEmbed(item.sourceUrl);
      embedAvail = oembedSuccess;
    }

    const ping = await this.checkUrl(item.sourceUrl);

    return {
      itemId: item.id,
      sourceUrl: item.sourceUrl,
      status: ping.status,
      httpStatus: ping.httpStatus,
      embedAvailable: embedAvail,
      checkedAt: new Date().toISOString(),
      error: ping.error,
      retryAttempts: ping.retries
    };
  }

  /**
   * Batch checks a collection of content items
   */
  public async auditBatch(items: ContentItem[]): Promise<{
    results: HealthCheckResult[];
    activeCount: number;
    removedCount: number;
    unavailableCount: number;
  }> {
    const results: HealthCheckResult[] = [];
    let activeCount = 0;
    let removedCount = 0;
    let unavailableCount = 0;

    for (const item of items) {
      const result = await this.evaluateItem(item);
      results.push(result);

      if (result.status === 'ACTIVE' || result.status === 'REDIRECTED') {
        activeCount++;
      } else if (result.status === 'REMOVED' || result.status === 'PRIVATE') {
        removedCount++;
      } else {
        unavailableCount++;
      }
    }

    return { results, activeCount, removedCount, unavailableCount };
  }
}

export const healthMonitor = new SourceHealthMonitor();
