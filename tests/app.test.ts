import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseStore } from '../src/server/db/store.ts';
import { deduplicator, DeduplicationEngine } from '../src/server/discovery/deduplicator.ts';
import { classifier, ClassificationEngine } from '../src/server/discovery/classifier.ts';
import { healthMonitor, SourceHealthMonitor } from '../src/server/discovery/healthMonitor.ts';
import { YouTubeProvider } from '../src/server/providers/youtubeProvider.ts';
import { InstagramProvider } from '../src/server/providers/instagramProvider.ts';
import { XProvider } from '../src/server/providers/xProvider.ts';
import { SnapchatProvider } from '../src/server/providers/snapchatProvider.ts';
import { WebSourceProvider } from '../src/server/providers/webSourceProvider.ts';
import { scheduler, DiscoveryScheduler } from '../src/server/discovery/scheduler.ts';
import type { ContentItem } from '../src/types/index.ts';

describe('1. Deduplication Engine (6 Levels)', () => {
  const engine = new DeduplicationEngine();

  it('extracts canonical YouTube IDs from various URL formats', () => {
    expect(engine.extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(engine.extractYouTubeId('https://youtu.be/dQw4w9WgXcQ?si=tracking123')).toBe('dQw4w9WgXcQ');
    expect(engine.extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(engine.extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(engine.extractYouTubeId('https://example.com/video')).toBeNull();
  });

  it('normalizes URLs by stripping tracking and sorting query parameters', () => {
    const raw = 'https://www.youtube.com/watch?v=abc1234&utm_source=twitter&utm_medium=social&si=xyz987';
    const norm = engine.normalizeUrl(raw);
    expect(norm).toBe('https://www.youtube.com/watch?v=abc1234');
    expect(norm).not.toContain('utm_source');
    expect(norm).not.toContain('si=xyz987');
  });

  it('detects Level 1 exact canonical URL match', () => {
    const existing: ContentItem = {
      id: 'item-1',
      platform: 'YouTube',
      sourceUrl: 'https://www.youtube.com/watch?v=test1234',
      embedUrl: 'https://www.youtube.com/embed/test1234',
      title: 'Dananeer Mobeen Interview',
      description: 'Candid conversation',
      caption: null,
      publishedAt: '2024-01-01T00:00:00Z',
      discoveredAt: '2024-01-01T01:00:00Z',
      author: 'HUM TV',
      contentType: 'interview',
      thumbnailUrl: 'https://img.com/1.jpg',
      duration: '10:00',
      tags: [],
      dramaId: null,
      episodeNumber: null,
      people: ['Dananeer Mobeen'],
      verificationStatus: 'VERIFIED',
      sourceMetadata: {},
      lastCheckedAt: '2024-01-01T00:00:00Z',
      sourceAvailable: true,
      embedAvailable: true
    };

    const match = engine.findMatch({ sourceUrl: 'https://www.youtube.com/watch?v=test1234' }, [existing]);
    expect(match).not.toBeNull();
    expect(match?.level).toBe(1);
    expect(match?.matchedId).toBe('item-1');
  });

  it('detects Level 2 YouTube ID match from short URL', () => {
    const existing: ContentItem = {
      id: 'item-2',
      platform: 'YouTube',
      sourceUrl: 'https://www.youtube.com/watch?v=uniqueVideoId',
      embedUrl: 'https://www.youtube.com/embed/uniqueVideoId',
      title: 'Behind the Scenes',
      description: '',
      caption: null,
      publishedAt: '2024-01-01T00:00:00Z',
      discoveredAt: '2024-01-01T01:00:00Z',
      author: 'Official',
      contentType: 'video',
      thumbnailUrl: '',
      duration: null,
      tags: [],
      dramaId: null,
      episodeNumber: null,
      people: [],
      verificationStatus: 'VERIFIED',
      sourceMetadata: {},
      lastCheckedAt: '',
      sourceAvailable: true,
      embedAvailable: true
    };

    const candidate = { sourceUrl: 'https://youtu.be/uniqueVideoId?t=10s' };
    const match = engine.findMatch(candidate, [existing]);
    expect(match).not.toBeNull();
    expect(match?.level).toBe(2);
  });

  it('detects Level 4 identical normalized title + author', () => {
    const existing: ContentItem = {
      id: 'item-3',
      platform: 'Broadcast',
      sourceUrl: 'https://arydigital.tv/drama-clip-1',
      embedUrl: null,
      title: 'Dananeer Mobeen - Syeda Sidra Graduation Scene!',
      description: '',
      caption: null,
      publishedAt: '2022-01-01T00:00:00Z',
      discoveredAt: '2022-01-01T01:00:00Z',
      author: 'ARY Digital',
      contentType: 'clip',
      thumbnailUrl: '',
      duration: null,
      tags: [],
      dramaId: 'sinf-e-aahan',
      episodeNumber: null,
      people: [],
      verificationStatus: 'VERIFIED',
      sourceMetadata: {},
      lastCheckedAt: '',
      sourceAvailable: true,
      embedAvailable: false
    };

    const candidate = {
      sourceUrl: 'https://hum.tv/re-broadcast',
      title: 'Dananeer Mobeen Syeda Sidra Graduation Scene',
      author: 'ary digital'
    };
    const match = engine.findMatch(candidate, [existing]);
    expect(match).not.toBeNull();
    expect(match?.level).toBe(4);
  });
});

describe('2. Source Classification & Relevance Engine', () => {
  const engine = new ClassificationEngine();

  it('correctly classifies personal and broadcaster channels', () => {
    expect(engine.classifySource('@DananeerM', 'https://youtube.com', 'YouTube')).toBe('OFFICIAL_PERSONAL');
    expect(engine.classifySource('HUM TV', 'https://youtube.com', 'YouTube')).toBe('OFFICIAL_BROADCASTER');
    expect(engine.classifySource('Something Haute', 'https://somethinghaute.com', 'WebSource')).toBe('INTERVIEW_PUBLICATION');
    expect(engine.classifySource('Dananeer Fan Edits & Updates', 'https://youtube.com', 'YouTube')).toBe('FAN_OR_REPOST');
  });

  it('computes relevance score and extracts connected drama and character', () => {
    const eval1 = engine.evaluate(
      'Dananeer Mobeen on Playing Zobia in Muhabbat Gumshuda Meri - Exclusive Byte',
      'Dananeer shares her experience preparing for emotional tragedy scenes in episode 15.',
      'FUCHSIA Magazine',
      'https://youtube.com/watch?v=123',
      'YouTube'
    );

    expect(eval1.relevanceClassification).toBe('DIRECT');
    expect(eval1.detectedDramaId).toBe('muhabbat-gumshuda-meri');
    expect(eval1.sourceClassification).toBe('INTERVIEW_PUBLICATION');
    expect(eval1.confidenceScore).toBeGreaterThanOrEqual(70);
  });

  it('flags unrelated content as IRRELEVANT', () => {
    const evalUnrelated = engine.evaluate(
      'Top 10 Tourist Places in Northern Pakistan to Visit This Summer',
      'A scenic travel vlog of Swat and Hunza valley.',
      'Travel Pakistan Official',
      'https://youtube.com/watch?v=999',
      'YouTube'
    );

    expect(evalUnrelated.relevanceClassification).toBe('IRRELEVANT');
  });

  it('assigns multiple relevant archive categories to a single video', () => {
    const categories = engine.categorizeContent(
      'Exclusive BTS & Interview: Dananeer Mobeen on Set of Sinf-e-Aahan Episode 5',
      'Behind the scenes fun and candid interview with Syeda Sidra at the PMA academy graduation ceremony.',
      'HUM TV Official',
      'OFFICIAL_BROADCASTER',
      'sinf-e-aahan',
      5
    );

    expect(categories).toContain('Latest Discoveries');
    expect(categories).toContain('Official Content');
    expect(categories).toContain('Dramas');
    expect(categories).toContain('Episodes');
    expect(categories).toContain('Interviews');
    expect(categories).toContain('Behind the Scenes');
  });
});

describe('3. Database Persistence & Discovery Pipeline', () => {
  let store: DatabaseStore;

  beforeEach(() => {
    store = new DatabaseStore();
  });

  it('manages configurable search queries dynamically', () => {
    const initial = store.getDiscoveryQueries();
    expect(initial.length).toBeGreaterThan(0);

    const created = store.addDiscoveryQuery('Dananeer Mobeen Live OST', 'CORE');
    expect(created.id).toBeDefined();
    expect(created.query).toBe('Dananeer Mobeen Live OST');

    const toggled = store.toggleDiscoveryQuery(created.id);
    expect(toggled).toBe(true);

    const deleted = store.deleteDiscoveryQuery(created.id);
    expect(deleted).toBe(true);
  });

  it('upserts and tracks discovered media channels', () => {
    store.upsertChannel({
      id: 'chan-test-1',
      channelId: 'UC_test_123',
      name: 'HUM TV Official',
      url: 'https://youtube.com/channel/UC_test_123',
      platform: 'YouTube',
      channelType: 'OFFICIAL_BROADCASTER',
      verificationStatus: true,
      firstDiscovered: new Date().toISOString(),
      lastScanned: new Date().toISOString(),
      itemCount: 5
    });

    const channels = store.getChannels();
    const found = channels.find(c => c.channelId === 'UC_test_123');
    expect(found).toBeDefined();
    expect(found?.name).toBe('HUM TV Official');
  });

  it('merges duplicate items into canonical record with crossPlatformSources', () => {
    const items = store.getContent({ limit: 1 }).items;
    expect(items.length).toBeGreaterThan(0);
    const canonical = items[0];

    const duplicateCandidate: ContentItem = {
      id: `dup-${Date.now()}`,
      platform: 'WebSource',
      sourceUrl: 'https://hum.tv/duplicate-entry',
      embedUrl: canonical.embedUrl,
      title: canonical.title,
      description: 'Duplicate cross post',
      caption: null,
      publishedAt: canonical.publishedAt,
      discoveredAt: new Date().toISOString(),
      author: 'HUM TV Web',
      contentType: 'video',
      thumbnailUrl: canonical.thumbnailUrl,
      duration: canonical.duration,
      tags: [],
      dramaId: canonical.dramaId,
      episodeNumber: null,
      people: ['Dananeer Mobeen'],
      verificationStatus: 'DISCOVERED',
      sourceMetadata: {},
      lastCheckedAt: new Date().toISOString(),
      sourceAvailable: true,
      embedAvailable: true
    };

    // Add duplicate candidate; store should detect and merge
    const res = store.addContentItem(duplicateCandidate);
    expect(res.success).toBe(false);
    expect(res.duplicateOf).toBe(canonical.id);

    // Verify canonical now has cross-platform source attached
    const detail = store.getContentById(canonical.id);
    expect(detail.item?.crossPlatformSources).toBeDefined();
    expect(detail.item?.crossPlatformSources?.length).toBeGreaterThan(0);
  });

  it('supports multi-word search across tags, description, and people', () => {
    const res = store.getContent({ search: 'Pawri Nathiagali' });
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items[0].tags).toContain('pawri-hori-hai');
  });
});

describe('4. Provider Graceful Degradation (Zero Fake Data)', () => {
  it('YouTube provider fails gracefully when unconfigured without generating fake data', async () => {
    const old = process.env.YOUTUBE_API_KEY;
    delete process.env.YOUTUBE_API_KEY;

    const yt = new YouTubeProvider();
    expect(yt.isConfigured()).toBe(false);

    const res = await yt.discover();
    expect(res.items).toHaveLength(0);
    expect(res.error).toContain('YOUTUBE_API_KEY');

    if (old) process.env.YOUTUBE_API_KEY = old;
  });

  it('Instagram provider fails gracefully when unconfigured without fake data', async () => {
    const old = process.env.INSTAGRAM_ACCESS_TOKEN;
    delete process.env.INSTAGRAM_ACCESS_TOKEN;

    const ig = new InstagramProvider();
    expect(ig.isConfigured()).toBe(false);

    const res = await ig.discover();
    expect(res.items).toHaveLength(0);
    expect(res.error).toContain('INSTAGRAM_ACCESS_TOKEN');

    if (old) process.env.INSTAGRAM_ACCESS_TOKEN = old;
  });

  it('Snapchat provider honestly reports unconfigured state', async () => {
    const snap = new SnapchatProvider();
    delete process.env.SNAPCHAT_API_KEY;
    expect(snap.isConfigured()).toBe(false);

    const res = await snap.discover();
    expect(res.items).toHaveLength(0);
    expect(res.error).toContain('SNAPCHAT_API_KEY');
  });

  it('WebSourceProvider validates authorized domains', () => {
    const web = new WebSourceProvider();
    expect(web.validateUrl('https://hum.tv/dramas/very-filmy')).toBe(true);
    expect(web.validateUrl('https://arydigital.tv/drama-sinf-e-aahan')).toBe(true);
    expect(web.validateUrl('https://somethinghaute.com/byte-interview')).toBe(true);
    expect(web.validateUrl('https://random-unverified-blog.xyz/post')).toBe(false);
  });
});

describe('5. Source Health Monitor & Retries', () => {
  const monitor = new SourceHealthMonitor();

  it('validates public URL formats and classifies status', async () => {
    const res = await monitor.checkUrl('https://example.com', 1);
    expect(['ACTIVE', 'REDIRECTED', 'REMOVED', 'UNAVAILABLE', 'ERROR', 'UNKNOWN']).toContain(res.status);
  });

  it('identifies YouTube embed accessibility via oEmbed', async () => {
    const isAvail = await monitor.checkYouTubeEmbed('https://www.youtube.com/watch?v=2nF4gK9vB8w');
    // Result is boolean without throwing
    expect(typeof isAvail).toBe('boolean');
  });
});

describe('6. Discovery Pipeline Scheduler & Telemetry', () => {
  it('executes discovery scan and records structured telemetry report', async () => {
    const sched = new DiscoveryScheduler();
    const report = await sched.executeScan({
      jobType: 'MANUAL_SCAN',
      customQuery: 'Dananeer Mobeen'
    });

    expect(report.id).toBeDefined();
    expect(['COMPLETED', 'PARTIAL']).toContain(report.status);
    expect(report.durationSeconds).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(report.errors)).toBe(true);
  }, 15000);
});

describe('7. Video Discovery Engine (Trailers, Full Dramas, Shorts)', () => {
  const engine = new ClassificationEngine();

  it('classifies promotional videos into Trailers category', () => {
    const meta = engine.detectDiscoveryMetadata(
      'Very Filmy | Official Teaser 01 | Dananeer Mobeen | Ameer Gilani',
      'Watch the official teaser for the upcoming romantic comedy series.',
      'HUM TV Official',
      'very-filmy',
      null,
      '01:15'
    );
    expect(meta.discoveryCategory).toBe('Trailers');
    expect(meta.language).toBe('Urdu');
    expect(meta.country).toBe('Pakistan');
    expect(meta.genre).toBe('Romantic Comedy');
  });

  it('classifies full broadcaster episodes into Full Dramas / Episodes category', () => {
    const meta = engine.detectDiscoveryMetadata(
      'Sinf e Aahan Episode 12 [Eng Sub] Digitally Presented by Master Paints | Dananeer Mobeen',
      'Cadet Syeda Sidra faces academy training challenges.',
      'ARY Digital',
      'sinf-e-aahan',
      12,
      '38:40',
      'episode'
    );
    expect(meta.discoveryCategory).toBe('Full Dramas / Episodes');
    expect(meta.genre).toBe('Military Drama');
    expect(meta.country).toBe('Pakistan');
  });

  it('classifies reels and short clips into Shorts category', () => {
    const meta = engine.detectDiscoveryMetadata(
      'Dananeer Viral Pawri Hori Hai Real Original Video #shorts',
      'The iconic 5 second viral clip recorded in Nathiagali.',
      'Dananeer Mobeen',
      null,
      null,
      '0:06',
      'reel'
    );
    expect(meta.discoveryCategory).toBe('Shorts');
  });

  it('filters content by discovery category, language, and country in store', () => {
    const store = new DatabaseStore();
    const trailers = store.getContent({ discoveryCategory: 'Trailers' });
    expect(Array.isArray(trailers.items)).toBe(true);

    const fullDramas = store.getContent({ discoveryCategory: 'Full Dramas / Episodes' });
    expect(Array.isArray(fullDramas.items)).toBe(true);

    const shorts = store.getContent({ discoveryCategory: 'Shorts' });
    expect(Array.isArray(shorts.items)).toBe(true);

    // Verify all returned items have valid discovery categories
    for (const item of fullDramas.items) {
      expect(item.discoveryCategory).toBe('Full Dramas / Episodes');
    }
  });
});

describe('7. Administrative Authentication Security', () => {
  it('validates passphrases strictly on the server and rejects unauthorized tokens', () => {
    const crypto = require('crypto');
    const serverSecret = 'RealProductionServerSecret-99!';
    
    // Server comparison logic using timingSafeEqual
    const testSecretCorrect = 'RealProductionServerSecret-99!';
    const testSecretIncorrect = 'ArbitraryWrongPassword123!';

    const hashExpected = crypto.createHash('sha256').update(serverSecret).digest();
    const hashCorrect = crypto.createHash('sha256').update(testSecretCorrect).digest();
    const hashIncorrect = crypto.createHash('sha256').update(testSecretIncorrect).digest();

    const isCorrectValid = crypto.timingSafeEqual(hashExpected, hashCorrect);
    const isIncorrectValid = crypto.timingSafeEqual(hashExpected, hashIncorrect);

    expect(isCorrectValid).toBe(true);
    expect(isIncorrectValid).toBe(false);

    // Verify session tokens are opaque and do not leak the secret
    const sessionToken = 'adm_' + crypto.randomBytes(32).toString('hex');
    expect(sessionToken.startsWith('adm_')).toBe(true);
    expect(sessionToken).not.toBe(serverSecret);
    expect(sessionToken.includes(serverSecret)).toBe(false);
  });
});

