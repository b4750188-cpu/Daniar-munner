import type { ContentItem, PlatformType } from '../../types/index.ts';
import type { ContentProvider } from './baseProvider.ts';

export class SnapchatProvider implements ContentProvider {
  public name = 'SnapchatProvider';
  public platform: PlatformType = 'Snapchat';

  public isConfigured(): boolean {
    return Boolean(process.env.SNAPCHAT_API_KEY && process.env.SNAPCHAT_API_KEY.trim().length > 0);
  }

  public validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.hostname.includes('snapchat.com');
    } catch {
      return false;
    }
  }

  public async discover(): Promise<{ items: ContentItem[]; error?: string }> {
    if (!this.isConfigured()) {
      return {
        items: [],
        error: 'Snapchat Public API key (SNAPCHAT_API_KEY) is not configured in environment variables.'
      };
    }

    // Snapchat public spotlight & story feeds endpoint when configured
    return {
      items: [],
      error: 'Snapchat provider configured, but no new public spotlights currently available.'
    };
  }
}
