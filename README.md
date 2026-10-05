# DANANEER — Cinematic Public Content Discovery Platform

A complete, production-grade, responsive multimedia discovery and browsing platform dedicated to Pakistani actress, media personality, and cultural icon **Dananeer Mobeen**.

This platform indexes and organizes publicly available content from legitimate sources across the web (YouTube, official broadcast networks, press interviews, verified social platforms, and media publications) into a unified, searchable, cinematic archive.

---

## 1. Overview & Philosophy

The application bridges the gap between streaming platforms, editorial archives, and digital portfolios:
- **Netflix + Pinterest + YouTube + Digital Archive aesthetic.**
- **Cinematic dark design**: Deep obsidian surfaces, measured contrast scrims, editorial serif and modern sans typography, and elegant rose/magenta accents.
- **Strict Data Truth (Zero Fake Content)**: No fabricated view counts, fake interviews, invented drama titles, or synthetic social posts. Every record links to an official, traceable public origin.
- **Independent Indexing Layer**: Respects original creator rights and broadcast networks. Provides direct "Open Original" source links and compliant embeds.

---

## 2. Features

- **Cinematic Hero**: Full-bleed responsive visual backdrop with editorial typography, career highlight reel, and quick exploration triggers.
- **Circular Category & Platform Navigation**: Seamlessly filter by *All*, *Videos*, *Instagram*, *Snapchat*, *X*, *YouTube*, *Dramas*, *Interviews*, and *Photos*.
- **Discovery Streams**:
  - *Trending Now*
  - *Drama Spotlights* (Sinf-e-Aahan, Muhabbat Gumshuda Meri, Very Filmy)
  - *Latest Discovered*
  - *In-Depth Interviews & Press*
- **Explore & Universal Search**: Multi-term search across titles, descriptions, captions, tags, people, and dramas, with granular facet filters (Platform, Format, Year, Drama, Sort).
- **Television Drama Archive**: Dedicated catalog of Dananeer's acclaimed acting roles with character information, verified episodes, official network streams, and accolades (e.g. Lux Style Award).
- **Chronological Career Timeline (2021–2026)**: Interactive milestones tracing her trajectory from the viral *Pawri Hori Hai* moment to leading television serials and international brand ambassadorships.
- **Visual Photography Gallery**: Masonry layout for verified bridal couture, fashion week presentations, and press appearances.
- **Media Viewer / Content Modal**: Full embed player for YouTube videos/OSTs or clean platform preview cards for Instagram/X posts with direct source buttons and duplicate cross-references.
- **Administrative Operations Console**:
  - Secret passphrase authentication.
  - Review queue for newly discovered items (*Verify*, *Reject*, *Edit*, *Mark Broken*).
  - Duplicate detection & canonical merge tool.
  - External provider status & discovery sync runner.
  - Live source URL health check.

---

## 3. Architecture

```text
├── .github/workflows/          # CI/CD pipelines (GitHub Actions)
│   ├── ci.yml                  # PR & branch validation (lint, test, build)
│   └── deploy.yml              # Production release verification
├── data/tables/                # Persistent relational database storage
│   ├── content_items.json      # Verified & discovered multimedia items
│   ├── dramas.json             # Television series records & synopsis
│   ├── episodes.json           # Official episode links & metadata
│   ├── platforms.json          # Provider adapter configuration & state
│   └── timeline_events.json    # Chronological milestones (2021-2026)
├── server.ts                   # Full-stack Express server + Vite middleware
├── src/
│   ├── assets/images/          # High-fidelity generated photographic assets
│   ├── components/             # Reusable UI (Header, Hero, PlatformBar, MediaCard, Modal)
│   ├── server/
│   │   ├── db/                 # Database persistence, indexes, migrations & seed
│   │   │   ├── seedData.ts     # Real verified historical Dananeer archive
│   │   │   └── store.ts        # Database queries, search, deduplication & health checks
│   │   └── providers/          # Modular external provider adapters
│   │       ├── baseProvider.ts
│   │       ├── youtubeProvider.ts
│   │       ├── instagramProvider.ts
│   │       ├── xProvider.ts
│   │       ├── snapchatProvider.ts
│   │       └── webSourceProvider.ts
│   ├── services/               # Client API connector
│   ├── types/                  # TypeScript domain models
│   ├── views/                  # Primary screen components (Home, Explore, Dramas, etc.)
│   ├── App.tsx                 # Main application controller
│   └── main.tsx                # Client entry point
└── tests/                      # Automated test suite (Vitest)
```

---

## 4. Local Development

### Prerequisites
- Node.js 20+
- npm or bun

### Setup Steps
```bash
# 1. Clone repository
git clone <repo-url>
cd dananeer-platform

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Start local development server (Express + Vite)
npm run dev
```

The application will be live at `http://localhost:3000`.

---

## 5. Environment Variables

Define the following variables in `.env` (refer to `.env.example`):

| Variable | Required | Description |
| :--- | :---: | :--- |
| `PORT` | Optional | Port for the web server (defaults to `3000`). |
| `NODE_ENV` | Optional | `development` or `production`. |
| `ADMIN_SECRET` | **Recommended** | Secret passphrase for administrative portal access and moderation. |
| `DATABASE_URL` | Optional | PostgreSQL connection string. If omitted, uses high-speed persistent tables in `data/tables/`. |
| `YOUTUBE_API_KEY` | Optional | Google Cloud YouTube Data API v3 key for automated channel sync. |
| `INSTAGRAM_ACCESS_TOKEN` | Optional | Meta Graph API token for public creator media indexing. |
| `X_BEARER_TOKEN` | Optional | Twitter/X API v2 bearer token. |
| `SNAPCHAT_API_KEY` | Optional | Snapchat Public API key. |

*Note: If any provider credential is not configured, the platform functions seamlessly using verified database archives and displays honest configuration notices instead of synthetic fake data.*

---

## 6. Database & Storage Setup

- By default, the platform uses structured relational tables stored in `data/tables/` (`content_items.json`, `dramas.json`, `episodes.json`, `timeline_events.json`, `platforms.json`).
- Atomic writes via temporary files prevent corruption.
- To connect to a PostgreSQL database, set `DATABASE_URL="postgresql://user:password@localhost:5432/dbname"`.

---

## 7. Provider Setup & Ingestion

### Modular Provider System
Each provider implements `ContentProvider` (`src/server/providers/baseProvider.ts`):
1. **YouTube Provider**: Queries official channels (`@DananeerM`, HUM TV, ARY Digital) and extracts video ID, high-res thumbnail, duration, and embed permissions.
2. **Instagram Provider**: Discovers public creator posts and reels.
3. **X Provider**: Ingests public statements and sports ambassadorship announcements.
4. **Web Source Provider**: Indexes broadcast networks and entertainment publications (Something Haute, FUCHSIA Magazine).

### Adding a New Provider
1. Create `src/server/providers/myProvider.ts` implementing `ContentProvider`.
2. Add validation and discovery methods.
3. Register the new instance in `src/server/providers/index.ts`.

---

## 8. Deduplication Engine

When external providers discover new content, `DatabaseStore.findDuplicate()` checks:
1. Exact canonical `sourceUrl` match.
2. Normalized title similarity and publication proximity.
3. Shared video identifiers.

If a duplicate is identified, the system records it as a cross-platform source (`"Also available on YouTube / Instagram"`) rather than cluttering the catalog with repetitive cards.

---

## 9. Administrative Portal

- Click **Admin** in the header or footer (or navigate to the Admin tab).
- Authenticate using the passphrase defined in `ADMIN_SECRET`.
- Operations:
  - **Metrics Dashboard**: Live record counts, broken source count, duplicate counts.
  - **Content Queue**: Verify newly discovered media, reject unauthorized items, mark broken links.
  - **Add Verified Source**: Ingest a new video or interview with title, URL, platform, and author.
  - **Sync Providers**: Trigger real-time discovery scans.
  - **Health Audit**: Validate external URL availability.

---

## 10. Automated Testing

Run the test suite using Vitest:
```bash
npm test
```

Tests cover:
- Database CRUD and pagination.
- Universal search across titles, captions, and tags.
- Duplicate detection algorithms.
- Drama record and episode retrieval.
- Chronological timeline integrity.
- Provider graceful degradation when API keys are unconfigured.

---

## 11. Production Build & Deployment

```bash
# 1. Build client bundle
npm run build

# 2. Run tests
npm test

# 3. Start production server
npm start
```

### Health Endpoints
- **Liveness**: `GET /api/health` -> HTTP 200 with uptime and service status.
- **Readiness**: `GET /api/ready` -> HTTP 200 verifying database table connectivity.

---

## 12. CI/CD Integration

The repository includes pre-configured GitHub Actions workflows:
- `.github/workflows/ci.yml`: Runs on PRs and commits to `main`, validating linting, tests, and production build.
- `.github/workflows/deploy.yml`: Deploys to staging or production when merged to `main`.

---

## 13. Source Attribution & Legal Considerations

- This application is an independent public discovery archive.
- It does not host unauthorized copies of copyright videos.
- Video playback utilizes official platform embeds (YouTube IFrame Player API) or direct links to official television network portals (HUM TV, ARY Digital).
- All trademarks and brand names belong to their respective copyright holders.
