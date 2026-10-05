import type { DiscoveryQuery } from '../../types/index.ts';

export interface IdentityProfile {
  canonicalName: string;
  aliases: string[];
  dramas: Array<{ title: string; character: string; id: string }>;
  milestones: string[];
  contextualTerms: string[];
  knownOfficialHandles: {
    youtube: string[];
    instagram: string[];
    x: string[];
  };
}

export const DANANEER_IDENTITY: IdentityProfile = {
  canonicalName: 'Dananeer Mobeen',
  aliases: [
    'Dananeer Mobeen',
    'Dananeer',
    'Dananeer Mobeen Official',
    'Dananeer Mobeen actress',
    'Dananeer Mobeen influencer'
  ],
  dramas: [
    { title: 'Sinf-e-Aahan', character: 'Syeda Sidra', id: 'sinf-e-aahan' },
    { title: 'Muhabbat Gumshuda Meri', character: 'Zobia', id: 'muhabbat-gumshuda-meri' },
    { title: 'Very Filmy', character: 'Sania', id: 'very-filmy' }
  ],
  milestones: [
    'Pawri',
    'Pawri Hori Hai',
    'Pawri Ho Rahi Hai',
    'Peshawar Zalmi Ambassador',
    'Lux Style Award Best Emerging Talent'
  ],
  contextualTerms: [
    'interview',
    'vlog',
    'behind the scenes',
    'BTS',
    'appearance',
    'photoshoot',
    'fashion',
    'award',
    'OST',
    'drama',
    'episode',
    'podcast',
    'press',
    'promotion',
    'red carpet'
  ],
  knownOfficialHandles: {
    youtube: ['@DananeerM', 'Dananeer Mobeen'],
    instagram: ['dananeerr'],
    x: ['DananeerM']
  }
};

export const INITIAL_DISCOVERY_QUERIES: DiscoveryQuery[] = [
  // Core Queries (Requirement 1 exact queries)
  { id: 'q-core-1', query: 'Dananeer Mobeen', family: 'CORE', enabled: true },
  { id: 'q-core-2', query: 'Dananeer', family: 'CORE', enabled: true },
  { id: 'q-core-3', query: 'Dananeer Mobeen interview', family: 'INTERVIEW', enabled: true },
  { id: 'q-core-4', query: 'Dananeer Mobeen vlog', family: 'CORE', enabled: true },
  { id: 'q-core-5', query: 'Dananeer Mobeen BTS', family: 'CORE', enabled: true },
  { id: 'q-core-6', query: 'Dananeer Mobeen appearance', family: 'APPEARANCE', enabled: true },
  { id: 'q-core-7', query: 'Dananeer Mobeen podcast', family: 'INTERVIEW', enabled: true },
  { id: 'q-core-8', query: 'Dananeer Mobeen drama', family: 'DRAMA', enabled: true },
  { id: 'q-core-9', query: 'Sinf-e-Aahan Dananeer', family: 'DRAMA', enabled: true },
  { id: 'q-core-10', query: 'Muhabbat Gumshuda Meri Dananeer', family: 'DRAMA', enabled: true },
  { id: 'q-core-11', query: 'Very Filmy Dananeer', family: 'DRAMA', enabled: true },
  { id: 'q-core-12', query: 'Pawri Dananeer', family: 'HISTORICAL', enabled: true },

  // Supplementary Family Queries
  { id: 'q-drama-1', query: 'Dananeer Mobeen Sinf-e-Aahan', family: 'DRAMA', enabled: true },
  { id: 'q-drama-2', query: 'Dananeer Mobeen Muhabbat Gumshuda Meri', family: 'DRAMA', enabled: true },
  { id: 'q-drama-3', query: 'Dananeer Mobeen Very Filmy', family: 'DRAMA', enabled: true },
  { id: 'q-drama-4', query: 'Dananeer as Syeda Sidra', family: 'DRAMA', enabled: true },
  { id: 'q-drama-5', query: 'Dananeer as Zobia', family: 'DRAMA', enabled: true },
  { id: 'q-drama-6', query: 'Dananeer as Sania', family: 'DRAMA', enabled: true },
  { id: 'q-interview-2', query: 'Dananeer Mobeen Something Haute', family: 'INTERVIEW', enabled: true },
  { id: 'q-interview-3', query: 'Dananeer Mobeen Fuchsia', family: 'INTERVIEW', enabled: true },
  { id: 'q-interview-5', query: 'Dananeer Mobeen BBC Urdu', family: 'INTERVIEW', enabled: true },
  { id: 'q-app-1', query: 'Dananeer Mobeen red carpet', family: 'APPEARANCE', enabled: true },
  { id: 'q-app-2', query: 'Dananeer Mobeen Lux Style Award', family: 'APPEARANCE', enabled: true },
  { id: 'q-app-3', query: 'Dananeer Mobeen photoshoot', family: 'APPEARANCE', enabled: true },
  { id: 'q-app-4', query: 'Dananeer Mobeen fashion bridal', family: 'APPEARANCE', enabled: true },
  { id: 'q-hist-1', query: 'Dananeer Mobeen Pawri Hori Hai original', family: 'HISTORICAL', enabled: true },
  { id: 'q-hist-2', query: 'Dananeer Mobeen viral 2021', family: 'HISTORICAL', enabled: true },
  { id: 'q-hist-3', query: 'Dananeer Mobeen Peshawar Zalmi PSL', family: 'HISTORICAL', enabled: true },
  { id: 'q-recent-1', query: 'Dananeer Mobeen latest 2025 2026', family: 'RECENT', enabled: true },
  { id: 'q-recent-2', query: 'Dananeer Mobeen new drama teaser', family: 'RECENT', enabled: true }
];
