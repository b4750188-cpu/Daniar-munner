import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { db } from './src/server/db/store.ts';
import { runDiscovery } from './src/server/providers/index.ts';
import { scheduler } from './src/server/discovery/scheduler.ts';
import type { ContentItem } from './src/types/index.ts';

// Load environment variables
dotenv.config();

const app = express();
function resolvePort(): number {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    return parseInt(process.argv[portArgIdx + 1], 10);
  }
  return Number(process.env.PORT) || 3000;
}

const PORT = resolvePort();
const isProduction = process.env.NODE_ENV === 'production';

// Admin secret configured strictly via server environment variable
// No hardcoded secret or fallback string is permitted
const ADMIN_SECRET = (process.env.ADMIN_SECRET || '').trim();

// Active authenticated administrative sessions (token -> expiry timestamp)
// Generated server-side; the real ADMIN_SECRET is never sent to the client
const activeAdminSessions = new Map<string, number>();

// Invalidate expired sessions hourly
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of activeAdminSessions.entries()) {
    if (expiry <= now) {
      activeAdminSessions.delete(token);
    }
  }
}, 60 * 60 * 1000).unref();

app.use(express.json());

// Request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// Admin auth middleware
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  // If ADMIN_SECRET is not configured on the server, fail securely
  if (!ADMIN_SECRET) {
    res.status(503).json({
      error: 'Administrative access unavailable: ADMIN_SECRET is not configured on the server.'
    });
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim() || (req.headers['x-admin-secret'] as string)?.trim();

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Missing administrative authorization token.' });
    return;
  }

  // Validate session token
  const sessionExpiry = activeAdminSessions.get(token);
  const isSessionValid = sessionExpiry ? sessionExpiry > Date.now() : false;

  // Support direct secret comparison (constant-time) for server-side CLI scripts
  let isDirectMatch = false;
  if (token.length === ADMIN_SECRET.length) {
    try {
      isDirectMatch = crypto.timingSafeEqual(Buffer.from(token), Buffer.from(ADMIN_SECRET));
    } catch {
      isDirectMatch = false;
    }
  }

  if (isSessionValid || isDirectMatch) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired administrative session.' });
  }
}

// ----------------------------------------------------
// PUBLIC API ROUTES
// ----------------------------------------------------

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    service: 'dananeer-discovery-platform'
  });
});

// Live Public Deployment URL Status
app.get('/api/public-url', (_req: Request, res: Response) => {
  res.json({
    publicUrl: livePublicUrl || null,
    status: livePublicUrl ? 'connected' : 'initializing',
    timestamp: new Date().toISOString()
  });
});

// Readiness Check
app.get('/api/ready', (_req: Request, res: Response) => {
  try {
    const metrics = db.getMetrics();
    res.json({
      status: 'ready',
      database: 'connected',
      storage: 'persistent-relational-tables',
      totalRecords: metrics.totalContent,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'not_ready',
      error: (err as Error).message
    });
  }
});

// Get Content Items (Search, Filter, Paginate)
app.get('/api/content', (req: Request, res: Response) => {
  try {
    const {
      platform,
      contentType,
      category,
      discoveryCategory,
      language,
      genre,
      country,
      durationRange,
      year,
      dramaId,
      sort,
      search,
      page,
      limit
    } = req.query;

    const result = db.getContent({
      platform: platform ? String(platform) : undefined,
      contentType: contentType ? String(contentType) : undefined,
      category: category ? String(category) : undefined,
      discoveryCategory: discoveryCategory ? String(discoveryCategory) : undefined,
      language: language ? String(language) : undefined,
      genre: genre ? String(genre) : undefined,
      country: country ? String(country) : undefined,
      durationRange: durationRange ? String(durationRange) : undefined,
      year: year ? String(year) : undefined,
      dramaId: dramaId ? String(dramaId) : undefined,
      sort: sort === 'oldest' ? 'oldest' : 'latest',
      search: search ? String(search) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 24
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve content items', details: (err as Error).message });
  }
});

// Get Single Content Item + Related + Duplicates
app.get('/api/content/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = db.getContentById(id);

    if (!result.item) {
      res.status(404).json({ error: 'Content item not found' });
      return;
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve content item', details: (err as Error).message });
  }
});

// Get Dramas
app.get('/api/dramas', (_req: Request, res: Response) => {
  try {
    const dramas = db.getDramas();
    res.json(dramas);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve dramas', details: (err as Error).message });
  }
});

// Get Drama Detail
app.get('/api/dramas/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = db.getDramaById(id);

    if (!result.drama) {
      res.status(404).json({ error: 'Drama record not found' });
      return;
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve drama details', details: (err as Error).message });
  }
});

// Get Episodes
app.get('/api/episodes', (req: Request, res: Response) => {
  try {
    const { dramaId } = req.query;
    const episodes = db.getEpisodes(dramaId ? String(dramaId) : undefined);
    res.json(episodes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve episodes', details: (err as Error).message });
  }
});

// Get Timeline
app.get('/api/timeline', (_req: Request, res: Response) => {
  try {
    const events = db.getTimelineEvents();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve timeline', details: (err as Error).message });
  }
});

// Get Platforms
app.get('/api/platforms', (_req: Request, res: Response) => {
  try {
    const platforms = db.getPlatforms();
    res.json(platforms);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve platforms', details: (err as Error).message });
  }
});

// ----------------------------------------------------
// ADMIN PROTECTED API ROUTES
// ----------------------------------------------------

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  // If ADMIN_SECRET is missing, fail securely and clearly report that the server secret is not configured
  if (!ADMIN_SECRET) {
    res.status(503).json({
      success: false,
      error: 'Server administrative secret is not configured. Please define ADMIN_SECRET in the server environment.'
    });
    return;
  }

  const { secret } = req.body;
  if (!secret || typeof secret !== 'string') {
    res.status(400).json({ success: false, error: 'Administrative passphrase required.' });
    return;
  }

  const userSecret = secret.trim();

  // Validate entered passphrase exclusively on the server using constant-time hash comparison
  const userHash = crypto.createHash('sha256').update(userSecret).digest();
  const secretHash = crypto.createHash('sha256').update(ADMIN_SECRET).digest();
  const isValid = crypto.timingSafeEqual(userHash, secretHash);

  if (isValid) {
    // Generate an opaque, cryptographically secure session token
    // The server NEVER sends ADMIN_SECRET back to the client
    const sessionToken = 'adm_' + crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24-hour expiration
    activeAdminSessions.set(sessionToken, expiry);

    res.json({ success: true, token: sessionToken });
  } else {
    res.status(401).json({ success: false, error: 'Invalid administrative passphrase.' });
  }
});

// Admin Logout
app.post('/api/admin/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim() || (req.headers['x-admin-secret'] as string)?.trim();
  if (token && activeAdminSessions.has(token)) {
    activeAdminSessions.delete(token);
  }
  res.json({ success: true, message: 'Administrative session ended.' });
});

// Admin Metrics
app.get('/api/admin/metrics', requireAdmin, (_req: Request, res: Response) => {
  try {
    const metrics = db.getMetrics();
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load metrics' });
  }
});

// Admin Queue (Discovered, Reviewing, Broken, Duplicates)
app.get('/api/admin/queue', requireAdmin, (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let items = db.getAllContentRaw();

    if (status && typeof status === 'string') {
      items = items.filter(i => i.verificationStatus === status);
    } else {
      // Return non-verified or broken queue items
      items = items.filter(i => i.verificationStatus !== 'VERIFIED');
    }

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load content queue' });
  }
});

// Admin Update Content (Verify, Reject, Edit, Mark Broken)
app.patch('/api/admin/content/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body as Partial<ContentItem>;

    const updated = db.updateContentItem(id, updates);
    if (!updated) {
      res.status(404).json({ error: 'Content item not found' });
      return;
    }

    res.json({ success: true, item: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update content item' });
  }
});

// Admin Merge Duplicates
app.post('/api/admin/content/:id/merge', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params; // canonical
    const { duplicateId } = req.body;

    if (!duplicateId) {
      res.status(400).json({ error: 'duplicateId is required in body' });
      return;
    }

    const merged = db.mergeDuplicates(id, duplicateId);
    if (!merged) {
      res.status(400).json({ error: 'Could not merge: items not found' });
      return;
    }

    res.json({ success: true, canonicalId: id, mergedId: duplicateId });
  } catch (err) {
    res.status(500).json({ error: 'Merge operation failed' });
  }
});

// Admin Create Verified Content Item
app.post('/api/admin/content', requireAdmin, (req: Request, res: Response) => {
  try {
    const item = req.body as ContentItem;
    if (!item.title || !item.sourceUrl || !item.platform) {
      res.status(400).json({ error: 'Title, sourceUrl, and platform are required' });
      return;
    }

    const result = db.addContentItem({
      ...item,
      id: item.id || `custom-${Date.now()}`,
      discoveredAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      sourceAvailable: true,
      embedAvailable: Boolean(item.embedUrl)
    });

    if (!result.success) {
      res.status(409).json({ error: 'Duplicate detected', duplicateOf: result.duplicateOf });
      return;
    }

    res.status(201).json({ success: true, item: result.item });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create content item' });
  }
});

// Admin Delete Content Item
app.delete('/api/admin/content/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteContentItem(id);
    if (!deleted) {
      res.status(404).json({ error: 'Content item not found' });
      return;
    }
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete content item' });
  }
});

// Admin Trigger Discovery (Legacy & Pipeline)
app.post('/api/admin/discover', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { provider } = req.body;
    const results = await runDiscovery(provider ? String(provider) : undefined);
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: 'Discovery run failed', details: (err as Error).message });
  }
});

// Admin Live Discovery Pipeline: "SCAN NOW"
app.post('/api/admin/scan', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { jobType, targetProvider, queryFamily, customQuery } = req.body;
    const report = await scheduler.executeScan({
      jobType,
      targetProvider,
      queryFamily,
      customQuery
    });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: 'Scan execution failed', details: (err as Error).message });
  }
});

// Admin Scan Status
app.get('/api/admin/scan/status', requireAdmin, (_req: Request, res: Response) => {
  res.json({
    active: scheduler.isScanActive(),
    lastRun: db.getDiscoveryRuns()[0] || null
  });
});

// Admin Discovery Historical Runs
app.get('/api/admin/runs', requireAdmin, (_req: Request, res: Response) => {
  try {
    const runs = db.getDiscoveryRuns();
    res.json(runs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve discovery runs' });
  }
});

// Admin Configurable Search Queries
app.get('/api/admin/queries', requireAdmin, (_req: Request, res: Response) => {
  try {
    const queries = db.getDiscoveryQueries();
    res.json(queries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve queries' });
  }
});

app.post('/api/admin/queries', requireAdmin, (req: Request, res: Response) => {
  try {
    const { query, family } = req.body;
    if (!query) {
      res.status(400).json({ error: 'Query string is required' });
      return;
    }
    const created = db.addDiscoveryQuery(query, family || 'CORE');
    res.status(201).json({ success: true, query: created });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add query' });
  }
});

app.patch('/api/admin/queries/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const toggled = db.toggleDiscoveryQuery(id);
    if (!toggled) {
      res.status(404).json({ error: 'Query not found' });
      return;
    }
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update query' });
  }
});

app.delete('/api/admin/queries/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteDiscoveryQuery(id);
    if (!deleted) {
      res.status(404).json({ error: 'Query not found' });
      return;
    }
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete query' });
  }
});

// Admin Indexed Channels
app.get('/api/admin/channels', requireAdmin, (_req: Request, res: Response) => {
  try {
    const channels = db.getChannels();
    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve channels' });
  }
});

// Admin Source Health Check
app.post('/api/admin/health-check', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const report = await db.performHealthCheck();
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: 'Health check run failed', details: (err as Error).message });
  }
});

// ----------------------------------------------------
// SECURE ADMIN-ONLY YOUTUBE API KEY MANAGEMENT
// ----------------------------------------------------

function maskApiKey(key: string): string {
  if (!key || !key.trim()) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '****';
  return `${trimmed.slice(0, 4)}...${'*'.repeat(6)}...${trimmed.slice(-4)}`;
}

function persistEnvVariable(keyName: string, value: string): void {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf-8');
    }
    const regex = new RegExp(`^${keyName}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${keyName}="${value}"`);
    } else {
      content += (content && !content.endsWith('\n') ? '\n' : '') + `${keyName}="${value}"\n`;
    }
    fs.writeFileSync(envPath, content, 'utf-8');
  } catch (err) {
    console.error('Warning: Failed to persist environment variable to .env:', err);
  }
}

async function testYouTubeApiKey(apiKey: string): Promise<{
  success: boolean;
  status: 'CONNECTED' | 'FAILED';
  message: string;
  errorReason?: string;
}> {
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      success: false,
      status: 'FAILED',
      message: 'API connection: FAILED',
      errorReason: 'No API key provided.'
    };
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=Dananeer+Mobeen&maxResults=1&key=${encodeURIComponent(apiKey.trim())}`;
    const res = await fetch(url);

    if (res.ok) {
      return {
        success: true,
        status: 'CONNECTED',
        message: 'API connection: CONNECTED'
      };
    }

    const data = (await res.json().catch(() => null)) as {
      error?: { message?: string; errors?: Array<{ reason?: string }> };
    };

    let errorReason = `Google API returned HTTP ${res.status}`;
    const errorMsg = data?.error?.message || '';
    const errReasonCode = data?.error?.errors?.[0]?.reason || '';

    if (errorMsg.includes('API key expired') || errReasonCode === 'badRequest') {
      errorReason = 'API key expired. Please renew the API key in Google Cloud Console.';
    } else if (errReasonCode === 'keyInvalid' || errReasonCode === 'API_KEY_INVALID') {
      errorReason = 'API key is invalid. Verify the key in Google Cloud Console.';
    } else if (errReasonCode === 'quotaExceeded' || errorMsg.includes('quota')) {
      errorReason = 'YouTube API daily quota exceeded for this project.';
    } else if (errorMsg.includes('has not been used') || errorMsg.includes('disabled')) {
      errorReason = 'YouTube Data API v3 service is disabled or not enabled for this project.';
    } else if (errorMsg.includes('IP') || errorMsg.includes('referrer')) {
      errorReason = 'API key restriction error (HTTP referrer or IP mismatch in Google Cloud Console).';
    } else if (errorMsg) {
      errorReason = errorMsg;
    }

    return {
      success: false,
      status: 'FAILED',
      message: 'API connection: FAILED',
      errorReason
    };
  } catch (err) {
    return {
      success: false,
      status: 'FAILED',
      message: 'API connection: FAILED',
      errorReason: `Network error: ${(err as Error).message}`
    };
  }
}

// Get YouTube API Status (Admin Only)
app.get('/api/admin/settings/youtube-api', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const currentKey = process.env.YOUTUBE_API_KEY || '';
    const isConfigured = Boolean(currentKey && currentKey.trim().length > 0);

    if (!isConfigured) {
      res.json({
        configured: false,
        status: 'NOT_CONFIGURED',
        maskedKey: '',
        message: 'API connection: NOT CONFIGURED',
        errorReason: 'No YouTube API Key is currently configured.',
        lastCheckedAt: new Date().toISOString()
      });
      return;
    }

    const testResult = await testYouTubeApiKey(currentKey);

    res.json({
      configured: true,
      status: testResult.status,
      maskedKey: maskApiKey(currentKey),
      message: testResult.message,
      errorReason: testResult.errorReason || null,
      lastCheckedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to inspect YouTube API configuration' });
  }
});

// Update & Save YouTube API Key (Admin Only)
app.post('/api/admin/settings/youtube-api', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;
    if (typeof apiKey !== 'string') {
      res.status(400).json({ error: 'apiKey must be a string' });
      return;
    }

    const newKey = apiKey.trim();

    if (!newKey) {
      process.env.YOUTUBE_API_KEY = '';
      persistEnvVariable('YOUTUBE_API_KEY', '');
      db.syncPlatformEnvironment();
      res.json({
        success: true,
        configured: false,
        status: 'NOT_CONFIGURED',
        maskedKey: '',
        message: 'YouTube API Key removed.',
        lastCheckedAt: new Date().toISOString()
      });
      return;
    }

    // Set immediately in memory
    process.env.YOUTUBE_API_KEY = newKey;
    persistEnvVariable('YOUTUBE_API_KEY', newKey);
    db.syncPlatformEnvironment();

    // Automatically validate/test against YouTube Data API
    const testResult = await testYouTubeApiKey(newKey);

    res.json({
      success: true,
      configured: true,
      status: testResult.status,
      maskedKey: maskApiKey(newKey),
      message: testResult.message,
      errorReason: testResult.errorReason || null,
      lastCheckedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update YouTube API configuration' });
  }
});

// Test Current YouTube API Connection (Admin Only)
app.post('/api/admin/settings/youtube-api/test', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const currentKey = process.env.YOUTUBE_API_KEY || '';
    if (!currentKey) {
      res.json({
        configured: false,
        status: 'NOT_CONFIGURED',
        maskedKey: '',
        message: 'API connection: NOT CONFIGURED',
        errorReason: 'No API key configured.'
      });
      return;
    }

    const testResult = await testYouTubeApiKey(currentKey);
    res.json({
      configured: true,
      status: testResult.status,
      maskedKey: maskApiKey(currentKey),
      message: testResult.message,
      errorReason: testResult.errorReason || null,
      lastCheckedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to test YouTube API' });
  }
});

// ----------------------------------------------------
// FRONTEND STATIC & VITE MIDDLEWARE SETUP
// ----------------------------------------------------

// Static assets available in both dev and production
app.use('/src/assets', express.static(path.resolve(process.cwd(), 'src/assets')));
app.use('/public', express.static(path.resolve(process.cwd(), 'public')));

// Direct project ZIP archive export route
app.get(['/api/export', '/dananeer_project_complete.zip', '/export.zip'], (_req: Request, res: Response) => {
  const exportPath = path.resolve(process.cwd(), 'dananeer_project_complete.zip');
  if (fs.existsSync(exportPath)) {
    res.download(exportPath, 'dananeer_project_complete.zip');
  } else {
    res.status(404).json({ error: 'Export archive not found' });
  }
});

async function startServer() {
  if (!isProduction) {
    // Vite Dev Server Middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);

    // In dev mode, handle direct SPA page requests through Vite HTML transform
    app.use('*', async (req: Request, res: Response, next: NextFunction) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    // Production Static Files
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    } else {
      console.warn('Production dist/ folder not found. Please run `npm run build` first.');
    }
  }

  // 404 Catch-all for undefined API routes
  app.all('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Client-side SPA routing fallback for production
  if (isProduction) {
    app.get('*', (_req: Request, res: Response) => {
      const distPath = path.resolve(process.cwd(), 'dist');
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application build in progress. Please refresh momentarily.');
      }
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Dananeer Platform] Server operational at http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
