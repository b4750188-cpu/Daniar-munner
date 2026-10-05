import type {
  SourceClassification,
  RelevanceClassification,
  PlatformType
} from '../../types/index.ts';
import { DANANEER_IDENTITY } from './identity.ts';

export interface ClassificationResult {
  sourceClassification: SourceClassification;
  relevanceClassification: RelevanceClassification;
  confidenceScore: number; // 0 to 100 internal score (never shown directly to users)
  detectedDramaId: string | null;
  detectedEpisodeNumber: number | null;
  detectedCategories: string[];
  reason: string;
}

// Known channels and domains with their authorized source classifications
const AUTHORIZED_SOURCES: Array<{ identifier: string; classification: SourceClassification }> = [
  // Personal
  { identifier: '@dananeerm', classification: 'OFFICIAL_PERSONAL' },
  { identifier: 'dananeer mobeen', classification: 'OFFICIAL_PERSONAL' },
  { identifier: 'dananeerr', classification: 'OFFICIAL_PERSONAL' },

  // Broadcasters & Military Media
  { identifier: 'hum tv', classification: 'OFFICIAL_BROADCASTER' },
  { identifier: 'humtv', classification: 'OFFICIAL_BROADCASTER' },
  { identifier: 'ary digital', classification: 'OFFICIAL_BROADCASTER' },
  { identifier: 'arydigital', classification: 'OFFICIAL_BROADCASTER' },
  { identifier: 'ispr', classification: 'OFFICIAL_BROADCASTER' },
  { identifier: 'green entertainment', classification: 'OFFICIAL_BROADCASTER' },
  { identifier: 'har pal geo', classification: 'OFFICIAL_BROADCASTER' },

  // Production Companies
  { identifier: 'md productions', classification: 'OFFICIAL_PRODUCTION' },
  { identifier: 'six sigma plus', classification: 'OFFICIAL_PRODUCTION' },
  { identifier: 'next level entertainment', classification: 'OFFICIAL_PRODUCTION' },

  // Reputable Interview & Entertainment Publications
  { identifier: 'something haute', classification: 'INTERVIEW_PUBLICATION' },
  { identifier: 'fuchsia magazine', classification: 'INTERVIEW_PUBLICATION' },
  { identifier: 'maliha rehman', classification: 'INTERVIEW_PUBLICATION' },
  { identifier: 'galaxy lollywood', classification: 'INTERVIEW_PUBLICATION' },

  // News Organizations
  { identifier: 'dawn images', classification: 'OFFICIAL_MEDIA' },
  { identifier: 'dawn news', classification: 'NEWS_ORGANIZATION' },
  { identifier: 'bbc urdu', classification: 'NEWS_ORGANIZATION' },
  { identifier: 'tribune', classification: 'NEWS_ORGANIZATION' },
  { identifier: 'samaa', classification: 'NEWS_ORGANIZATION' },
  { identifier: 'geo news', classification: 'NEWS_ORGANIZATION' },

  // Podcasts
  { identifier: 'the pakistan experience', classification: 'PODCAST' },
  { identifier: 'honest hour', classification: 'PODCAST' },
  { identifier: 'fwhy podcast', classification: 'PODCAST' },
  { identifier: 'moroo', classification: 'PODCAST' },

  // Public Events / Sports
  { identifier: 'lux style awards', classification: 'PUBLIC_EVENT' },
  { identifier: 'hum awards', classification: 'PUBLIC_EVENT' },
  { identifier: 'peshawar zalmi', classification: 'PUBLIC_EVENT' },
  { identifier: 'psl', classification: 'PUBLIC_EVENT' }
];

export class ClassificationEngine {
  /**
   * Classifies source identity based on publisher, channel, URL, and metadata
   */
  public classifySource(author: string, url: string, platform: PlatformType): SourceClassification {
    const lowerAuthor = (author || '').toLowerCase().trim();
    const lowerUrl = (url || '').toLowerCase().trim();

    // Check fan/repost markers first to prevent false official status
    const fanMarkers = ['fanpage', 'fan page', 'edits', 'updates', 'clips', 'repost', 'stan', 'fandom', 'shorts channel'];
    if (fanMarkers.some(marker => lowerAuthor.includes(marker))) {
      return 'FAN_OR_REPOST';
    }

    // Match against verified list
    for (const source of AUTHORIZED_SOURCES) {
      if (lowerAuthor.includes(source.identifier) || lowerUrl.includes(source.identifier)) {
        return source.classification;
      }
    }

    if (platform === 'Broadcast') return 'OFFICIAL_BROADCASTER';
    if (platform === 'Interview') return 'INTERVIEW_PUBLICATION';
    if (platform === 'Instagram' || platform === 'X') return 'USER_GENERATED';

    return 'UNKNOWN';
  }

  /**
   * Computes internal relevance and extracts structured associations (Drama, Episode, Character)
   */
  public evaluate(
    title: string,
    description: string,
    author: string,
    sourceUrl: string,
    platform: PlatformType
  ): ClassificationResult {
    const fullText = `${title} ${description} ${author}`.toLowerCase();
    const sourceClass = this.classifySource(author, sourceUrl, platform);

    let score = 0;
    const reasons: string[] = [];

    // 1. Direct Name Mentions
    const hasExactName = DANANEER_IDENTITY.aliases.some(alias =>
      fullText.includes(alias.toLowerCase())
    );
    if (hasExactName) {
      score += 45;
      reasons.push('Contains exact name match');
    }

    // Check title specifically (higher weight)
    const titleLower = title.toLowerCase();
    const hasTitleName = DANANEER_IDENTITY.aliases.some(alias =>
      titleLower.includes(alias.toLowerCase())
    );
    if (hasTitleName) {
      score += 25;
      reasons.push('Name prominently in title');
    }

    // 2. Known Dramas & Characters
    let detectedDramaId: string | null = null;
    let detectedEpisodeNumber: number | null = null;

    for (const drama of DANANEER_IDENTITY.dramas) {
      const dramaMatch = fullText.includes(drama.title.toLowerCase());
      const charMatch = fullText.includes(drama.character.toLowerCase());

      if (dramaMatch || charMatch) {
        detectedDramaId = drama.id;
        score += 20;
        reasons.push(`Matched drama "${drama.title}" or character "${drama.character}"`);
        break;
      }
    }

    // Extract episode number if present
    const epMatch = titleLower.match(/ep(?:isode)?\s*(\d+)/i) || description.match(/ep(?:isode)?\s*(\d+)/i);
    if (epMatch) {
      detectedEpisodeNumber = parseInt(epMatch[1], 10);
    }

    // 3. Cultural Milestones
    for (const milestone of DANANEER_IDENTITY.milestones) {
      if (fullText.includes(milestone.toLowerCase())) {
        score += 20;
        reasons.push(`Contains verified milestone "${milestone}"`);
        break;
      }
    }

    // 4. Source Authority Boost
    if (sourceClass === 'OFFICIAL_PERSONAL') {
      score += 35;
      reasons.push('Published from official creator channel');
    } else if (sourceClass === 'OFFICIAL_BROADCASTER' || sourceClass === 'INTERVIEW_PUBLICATION') {
      score += 15;
      reasons.push('From verified broadcaster or media publication');
    } else if (sourceClass === 'FAN_OR_REPOST') {
      score -= 20;
      reasons.push('Tagged as fan/repost account');
    }

    // Deduce Relevance Category
    let relevance: RelevanceClassification = 'UNCERTAIN';
    if (score >= 70 && hasExactName) {
      relevance = 'DIRECT';
    } else if (score >= 50 && hasExactName) {
      relevance = 'STRONG_RELEVANCE';
    } else if (score >= 30) {
      relevance = 'RELATED';
    } else if (score < 15) {
      relevance = 'IRRELEVANT';
    }

    const detectedCategories = this.categorizeContent(
      title,
      description,
      author,
      sourceClass,
      detectedDramaId,
      detectedEpisodeNumber
    );

    return {
      sourceClassification: sourceClass,
      relevanceClassification: relevance,
      confidenceScore: Math.min(100, Math.max(0, score)),
      detectedDramaId,
      detectedEpisodeNumber,
      detectedCategories,
      reason: reasons.join('; ') || 'Standard contextual match'
    };
  }

  /**
   * Assigns multiple relevant archive categories to a single video
   */
  public categorizeContent(
    title: string,
    description: string,
    author: string,
    sourceClass: SourceClassification,
    dramaId: string | null,
    episodeNumber: number | null
  ): string[] {
    const text = `${title} ${description} ${author}`.toLowerCase();
    const categories = new Set<string>();

    // 1. Latest Discoveries (always includes new content)
    categories.add('Latest Discoveries');

    // 2. Official Content
    if (
      sourceClass === 'OFFICIAL_PERSONAL' ||
      sourceClass === 'OFFICIAL_BROADCASTER' ||
      sourceClass === 'OFFICIAL_PRODUCTION'
    ) {
      categories.add('Official Content');
    }

    // 3. Dramas
    if (
      dramaId ||
      text.includes('drama') ||
      text.includes('hurmat') ||
      text.includes('sinf-e-aahan') ||
      text.includes('sinf e aahan') ||
      text.includes('muhabbat gumshuda meri') ||
      text.includes('very filmy') ||
      text.includes('zobia') ||
      text.includes('syeda sidra') ||
      text.includes('sania') ||
      text.includes('ost')
    ) {
      categories.add('Dramas');
    }

    // 4. Episodes
    if (
      episodeNumber !== null ||
      text.includes('episode') ||
      /\bep\s*\d+\b/i.test(title) ||
      text.includes('full episode')
    ) {
      categories.add('Episodes');
    }

    // 5. Interviews
    if (
      text.includes('interview') ||
      text.includes('candid') ||
      text.includes('chit chat') ||
      text.includes('conversation') ||
      text.includes('something haute') ||
      text.includes('fuchsia') ||
      text.includes('bbc urdu') ||
      sourceClass === 'INTERVIEW_PUBLICATION'
    ) {
      categories.add('Interviews');
    }

    // 6. Behind the Scenes
    if (
      text.includes('bts') ||
      text.includes('behind the scenes') ||
      text.includes('behind the camera') ||
      text.includes('blooper') ||
      text.includes('making of') ||
      text.includes('on set')
    ) {
      categories.add('Behind the Scenes');
    }

    // 7. Vlogs
    if (
      text.includes('vlog') ||
      text.includes('vlogging') ||
      text.includes('day in my life') ||
      text.includes('travel') ||
      text.includes('trip') ||
      text.includes('unboxing')
    ) {
      categories.add('Vlogs');
    }

    // 8. Podcasts
    if (
      text.includes('podcast') ||
      text.includes('honest hour') ||
      text.includes('fwhy') ||
      text.includes('pakistan experience') ||
      sourceClass === 'PODCAST'
    ) {
      categories.add('Podcasts');
    }

    // 9. Events
    if (
      text.includes('event') ||
      text.includes('psl') ||
      text.includes('peshawar zalmi') ||
      text.includes('red carpet') ||
      text.includes('premiere') ||
      text.includes('gala') ||
      sourceClass === 'PUBLIC_EVENT'
    ) {
      categories.add('Events');
    }

    // 10. Awards
    if (
      text.includes('award') ||
      text.includes('lux style') ||
      text.includes('hum award') ||
      text.includes('trophy') ||
      text.includes('winner')
    ) {
      categories.add('Awards');
    }

    // 11. Fashion
    if (
      text.includes('fashion') ||
      text.includes('photoshoot') ||
      text.includes('photo shoot') ||
      text.includes('bridal') ||
      text.includes('styling') ||
      text.includes('dress') ||
      text.includes('couture') ||
      text.includes('ramp')
    ) {
      categories.add('Fashion');
    }

    // 12. Press
    if (
      text.includes('press') ||
      text.includes('conference') ||
      text.includes('media byte') ||
      text.includes('news') ||
      text.includes('dawn') ||
      text.includes('tribune') ||
      sourceClass === 'NEWS_ORGANIZATION' ||
      sourceClass === 'OFFICIAL_MEDIA'
    ) {
      categories.add('Press');
    }

    // 13. Promotions
    if (
      text.includes('teaser') ||
      text.includes('trailer') ||
      text.includes('promo') ||
      text.includes('coming soon') ||
      text.includes('announcement') ||
      text.includes('commercial') ||
      text.includes('brand ambassador')
    ) {
      categories.add('Promotions');
    }

    // 14. Historical / Viral
    if (
      text.includes('pawri') ||
      text.includes('viral') ||
      text.includes('2021') ||
      text.includes('nathiagali') ||
      text.includes('breakthrough') ||
      text.includes('meme')
    ) {
      categories.add('Historical / Viral');
    }

    return Array.from(categories);
  }

  /**
   * Infers Discovery Section ('Trailers' | 'Full Dramas / Episodes' | 'Shorts'), language, genre, country
   */
  public detectDiscoveryMetadata(
    title: string,
    description: string,
    author: string,
    dramaId: string | null,
    episodeNumber: number | null,
    duration: string | null,
    contentType?: string
  ): {
    discoveryCategory: 'Trailers' | 'Full Dramas / Episodes' | 'Shorts';
    language: string;
    genre: string;
    country: string;
  } {
    const text = `${title} ${description} ${author}`.toLowerCase();

    // 1. Discovery Category
    let category: 'Trailers' | 'Full Dramas / Episodes' | 'Shorts' = 'Full Dramas / Episodes';

    const isTrailerOrPromo =
      text.includes('teaser') ||
      text.includes('trailer') ||
      text.includes('promo') ||
      text.includes('first look') ||
      text.includes('coming soon') ||
      text.includes('ost') ||
      text.includes('announcement');

    const isShortOrReel =
      contentType === 'reel' ||
      contentType === 'clip' ||
      text.includes('#shorts') ||
      text.includes('shorts') ||
      text.includes('reels') ||
      text.includes('pawri hori hai') ||
      (duration && /^0:[0-5][0-9]$/.test(duration));

    if (isTrailerOrPromo) {
      category = 'Trailers';
    } else if (isShortOrReel) {
      category = 'Shorts';
    } else if (episodeNumber !== null || contentType === 'episode' || dramaId || text.includes('episode') || text.includes('full')) {
      category = 'Full Dramas / Episodes';
    } else if (text.includes('bts') || text.includes('behind the scene')) {
      category = 'Shorts';
    }

    // 2. Language
    let language = 'Urdu';
    if (text.includes('english') || text.includes('bbc world')) {
      language = 'English';
    }

    // 3. Genre
    let genre = 'Drama';
    if (text.includes('sinf-e-aahan') || text.includes('sinf e aahan') || text.includes('ispr') || text.includes('pma')) {
      genre = 'Military Drama';
    } else if (text.includes('muhabbat gumshuda meri') || text.includes('zobia')) {
      genre = 'Romance & Youth';
    } else if (text.includes('very filmy') || text.includes('sania') || text.includes('comedy')) {
      genre = 'Romantic Comedy';
    } else if (text.includes('interview') || text.includes('podcast') || text.includes('something haute') || text.includes('fuchsia')) {
      genre = 'Interview & Talk Show';
    } else if (text.includes('bts') || text.includes('making')) {
      genre = 'Behind the Scenes';
    } else if (text.includes('award') || text.includes('red carpet')) {
      genre = 'Awards & Events';
    } else if (text.includes('vlog') || text.includes('lifestyle')) {
      genre = 'Lifestyle & Vlog';
    }

    return {
      discoveryCategory: category,
      language,
      genre,
      country: 'Pakistan'
    };
  }
}

export const classifier = new ClassificationEngine();
