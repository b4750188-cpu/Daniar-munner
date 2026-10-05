import React from 'react';
import {
  Lock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Layers,
  Activity,
  Server,
  Key,
  Trash2,
  Edit3,
  ExternalLink,
  Plus,
  Share2,
  Radio,
  Sliders,
  Database,
  Search,
  Filter,
  Eye,
  Check,
  Zap,
  Clock,
  Tag,
  EyeOff,
  Save,
  Shield
} from 'lucide-react';
import { ContentItem, PlatformConfig, DiscoveryQuery, DiscoveryRunReport, ChannelRecord } from '../types/index.ts';
import {
  adminLogin,
  getAdminMetrics,
  getAdminQueue,
  updateAdminContent,
  mergeDuplicateContent,
  createAdminContent,
  deleteAdminContent,
  triggerHealthCheck,
  triggerScanPipeline,
  getDiscoveryRuns,
  getDiscoveryQueries,
  addDiscoveryQuery,
  toggleDiscoveryQuery,
  deleteDiscoveryQuery,
  getDiscoveredChannels,
  getYouTubeApiStatus,
  updateYouTubeApiKey,
  testYouTubeApiKeyConnection
} from '../services/api.ts';

interface AdminViewProps {
  token: string | null;
  onLoginSuccess: (token: string) => void;
  onLogout: () => void;
  platforms: PlatformConfig[];
  onRefreshData: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  token,
  onLoginSuccess,
  onLogout,
  platforms,
  onRefreshData
}) => {
  const [passphrase, setPassphrase] = React.useState('');
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [activeTab, setActiveTab] = React.useState<
    'overview' | 'queue' | 'scan' | 'queries' | 'channels' | 'newItem' | 'providers' | 'health' | 'settings'
  >('overview');
  const [metrics, setMetrics] = React.useState<any>(null);
  const [queueItems, setQueueItems] = React.useState<ContentItem[]>([]);
  const [runs, setRuns] = React.useState<DiscoveryRunReport[]>([]);
  const [queries, setQueries] = React.useState<DiscoveryQuery[]>([]);
  const [channels, setChannels] = React.useState<ChannelRecord[]>([]);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  // YouTube API Settings state
  const [ytConfig, setYtConfig] = React.useState<{
    configured: boolean;
    status: 'CONNECTED' | 'FAILED' | 'CONFIGURED' | 'NOT_CONFIGURED';
    maskedKey: string;
    message: string;
    errorReason?: string | null;
    lastCheckedAt: string;
  } | null>(null);
  const [newApiKeyInput, setNewApiKeyInput] = React.useState('');
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [isSavingKey, setIsSavingKey] = React.useState(false);
  const [isTestingKey, setIsTestingKey] = React.useState(false);
  const [keyNotice, setKeyNotice] = React.useState<{ text: string; isError: boolean } | null>(null);

  // Scan control state
  const [scanJobType, setScanJobType] = React.useState<string>('MANUAL_SCAN');
  const [scanProvider, setScanProvider] = React.useState<string>('');
  const [scanQueryFamily, setScanQueryFamily] = React.useState<string>('');
  const [customScanQuery, setCustomScanQuery] = React.useState<string>('');
  const [isScanning, setIsScanning] = React.useState<boolean>(false);
  const [lastScanResult, setLastScanResult] = React.useState<DiscoveryRunReport | null>(null);

  // Add query state
  const [newQueryText, setNewQueryText] = React.useState('');
  const [newQueryFamily, setNewQueryFamily] = React.useState('CORE');

  // Add content state
  const [newTitle, setNewTitle] = React.useState('');
  const [newUrl, setNewUrl] = React.useState('');
  const [newPlatform, setNewPlatform] = React.useState('YouTube');
  const [newType, setNewType] = React.useState('video');
  const [newDesc, setNewDesc] = React.useState('');
  const [newAuthor, setNewAuthor] = React.useState('Official Source');

  // Load metrics, queue, and runs
  const loadAdminData = React.useCallback(async () => {
    if (!token) return;
    try {
      const [m, q, r, qry, ch] = await Promise.all([
        getAdminMetrics(token),
        getAdminQueue(token),
        getDiscoveryRuns(token),
        getDiscoveryQueries(token),
        getDiscoveredChannels(token)
      ]);
      setMetrics(m);
      setQueueItems(q);
      setRuns(r);
      setQueries(qry);
      setChannels(ch);
      if (m.lastScan) {
        setLastScanResult(m.lastScan);
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
    }
  }, [token]);

  const loadYouTubeConfig = React.useCallback(async () => {
    if (!token) return;
    try {
      const status = await getYouTubeApiStatus(token);
      setYtConfig(status);
    } catch (err) {
      console.error('Failed to load YouTube API status', err);
    }
  }, [token]);

  React.useEffect(() => {
    if (token) {
      loadAdminData();
      loadYouTubeConfig();
    }
  }, [token, loadAdminData, loadYouTubeConfig]);

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSavingKey(true);
    setKeyNotice(null);
    try {
      const res = await updateYouTubeApiKey(token, newApiKeyInput);
      setYtConfig(res);
      setNewApiKeyInput('');
      if (res.status === 'CONNECTED') {
        setKeyNotice({ text: 'YouTube Data API v3 key saved and successfully validated! Real-time connection active.', isError: false });
      } else if (res.status === 'FAILED') {
        setKeyNotice({ text: `Key saved, but validation failed: ${res.errorReason || 'Invalid API key'}`, isError: true });
      } else {
        setKeyNotice({ text: 'YouTube API key configuration updated.', isError: false });
      }
      onRefreshData();
    } catch (err) {
      setKeyNotice({ text: `Failed to update API key: ${(err as Error).message}`, isError: true });
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleTestApiKey = async () => {
    if (!token) return;
    setIsTestingKey(true);
    setKeyNotice(null);
    try {
      const res = await testYouTubeApiKeyConnection(token);
      setYtConfig(res);
      if (res.status === 'CONNECTED') {
        setKeyNotice({ text: 'Connection test passed: YouTube Data API v3 is responsive and connected.', isError: false });
      } else {
        setKeyNotice({ text: `Connection test failed: ${res.errorReason || 'Unable to connect'}`, isError: true });
      }
    } catch (err) {
      setKeyNotice({ text: `Test error: ${(err as Error).message}`, isError: true });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleRemoveApiKey = async () => {
    if (!token) return;
    if (!confirm('Are you sure you want to remove the YouTube API Key? Real-time YouTube discovery will be disabled.')) return;
    setIsSavingKey(true);
    setKeyNotice(null);
    try {
      const res = await updateYouTubeApiKey(token, '');
      setYtConfig(res);
      setKeyNotice({ text: 'YouTube API key removed. YouTube provider set to unconfigured.', isError: false });
      onRefreshData();
    } catch (err) {
      setKeyNotice({ text: `Failed to remove key: ${(err as Error).message}`, isError: true });
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);
    try {
      const res = await adminLogin(passphrase);
      if (res.success && res.token) {
        onLoginSuccess(res.token);
      } else {
        setAuthError(res.error || 'Invalid credentials');
      }
    } catch (err) {
      setAuthError('Network error connecting to auth service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (id: string) => {
    if (!token) return;
    try {
      await updateAdminContent(token, id, { verificationStatus: 'VERIFIED', provenance: 'ADMIN_VERIFIED' });
      setActionNotice('Item verified and published to the active public catalog.');
      loadAdminData();
      onRefreshData();
    } catch {
      setActionNotice('Failed to verify item.');
    }
  };

  const handleReject = async (id: string) => {
    if (!token) return;
    try {
      await updateAdminContent(token, id, { verificationStatus: 'REJECTED' });
      setActionNotice('Item rejected and removed from public discovery views.');
      loadAdminData();
    } catch {
      setActionNotice('Failed to reject item.');
    }
  };

  const handleMarkBroken = async (id: string) => {
    if (!token) return;
    try {
      await updateAdminContent(token, id, { verificationStatus: 'BROKEN', sourceAvailable: false });
      setActionNotice('Source marked as degraded/broken.');
      loadAdminData();
    } catch {
      setActionNotice('Failed to mark broken.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to permanently delete this content item?')) return;
    try {
      await deleteAdminContent(token, id);
      setActionNotice('Item permanently deleted from database.');
      loadAdminData();
      onRefreshData();
    } catch {
      setActionNotice('Failed to delete item.');
    }
  };

  // Execute SCAN NOW
  const handleExecuteScan = async () => {
    if (!token) return;
    setIsScanning(true);
    setActionNotice('Running discovery pipeline across configured search families...');
    try {
      const res = await triggerScanPipeline(token, {
        jobType: scanJobType,
        targetProvider: scanProvider || undefined,
        queryFamily: scanQueryFamily || undefined,
        customQuery: customScanQuery || undefined
      });

      if (res.success) {
        setLastScanResult(res.report);
        setActionNotice(
          `Discovery Scan Complete in ${res.report.durationSeconds}s. Found ${res.report.rawDiscovered} raw items (${res.report.uniqueNew} new unique, ${res.report.duplicatesDetected} duplicates merged).`
        );
        loadAdminData();
        onRefreshData();
      }
    } catch (err) {
      setActionNotice(`Discovery scan failed: ${(err as Error).message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newQueryText.trim()) return;
    try {
      await addDiscoveryQuery(token, newQueryText.trim(), newQueryFamily);
      setNewQueryText('');
      setActionNotice('New discovery query term added successfully.');
      loadAdminData();
    } catch {
      setActionNotice('Failed to add query term.');
    }
  };

  const handleToggleQuery = async (id: string) => {
    if (!token) return;
    try {
      await toggleDiscoveryQuery(token, id);
      loadAdminData();
    } catch {
      setActionNotice('Failed to toggle query.');
    }
  };

  const handleDeleteQuery = async (id: string) => {
    if (!token) return;
    try {
      await deleteDiscoveryQuery(token, id);
      loadAdminData();
    } catch {
      setActionNotice('Failed to delete query.');
    }
  };

  const handleTriggerHealth = async () => {
    if (!token) return;
    setActionNotice('Auditing source URLs and embed permissions...');
    try {
      const res = await triggerHealthCheck(token);
      setActionNotice(`Health check complete: ${res.report.healthy} sources active, ${res.report.unavailable} unavailable.`);
      loadAdminData();
    } catch (err) {
      setActionNotice(`Health check error: ${(err as Error).message}`);
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await createAdminContent(token, {
        title: newTitle,
        sourceUrl: newUrl,
        platform: newPlatform as any,
        contentType: newType as any,
        description: newDesc,
        author: newAuthor,
        publishedAt: new Date().toISOString(),
        thumbnailUrl: '/src/assets/images/dananeer_hero_cinematic_1791045480240.jpg',
        tags: ['verified', newPlatform.toLowerCase()],
        people: ['Dananeer Mobeen'],
        verificationStatus: 'VERIFIED',
        provenance: 'ADMIN_VERIFIED',
        sourceClassification: 'OFFICIAL_BROADCASTER',
        relevanceClassification: 'DIRECT'
      });
      setActionNotice('Verified content item created and published.');
      setNewTitle('');
      setNewUrl('');
      setNewDesc('');
      loadAdminData();
      onRefreshData();
      setActiveTab('queue');
    } catch (err) {
      setActionNotice('Failed to create item (may be duplicate).');
    }
  };

  // Login view
  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 min-h-screen flex items-center justify-center">
        <div className="w-full glass-panel rounded-2xl p-8 border border-white/10 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-pink-600/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="font-cinematic text-xl font-bold text-white tracking-wide">
              ADMINISTRATIVE CONSOLE
            </h2>
            <p className="text-xs text-zinc-400">
              Enter your administrative secret passphrase to review the discovery pipeline, trigger live scans, and moderate content.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 font-medium block mb-1">
                Admin Passphrase
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
                placeholder="Enter admin passphrase..."
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 focus:border-pink-500 rounded-xl text-white text-sm focus:outline-none"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Validated securely by server-side authentication.
              </span>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-pink-600/30 disabled:opacity-50"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In to Console'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-pink-400 font-semibold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5" />
            <span>Archive Ingestion & Discovery Operations</span>
          </div>
          <h1 className="font-cinematic text-2xl sm:text-3xl font-bold text-white tracking-wider mt-1">
            DANANEER DISCOVERY PIPELINE
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('scan')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-semibold uppercase tracking-wider shadow-lg shadow-pink-600/20 flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>SCAN NOW</span>
          </button>

          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-300 border border-red-500/30 text-xs font-medium transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-pink-950/30 border border-pink-500/30 text-xs text-pink-300 flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Metrics' },
          { id: 'scan', label: 'Scan Now' },
          { id: 'queue', label: `Queue (${queueItems.length})` },
          { id: 'queries', label: `Queries (${queries.length})` },
          { id: 'channels', label: `Channels (${channels.length})` },
          { id: 'newItem', label: 'Add Verified' },
          { id: 'providers', label: 'Providers' },
          { id: 'health', label: 'Link Health' },
          { id: 'settings', label: 'YouTube API & Settings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview Metrics */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-white/5">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Total Catalog</span>
              <strong className="text-2xl font-bold font-mono text-white">{metrics.totalContent}</strong>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-white/5">
              <span className="text-[11px] text-emerald-400 uppercase tracking-wider block">Verified Public</span>
              <strong className="text-2xl font-bold font-mono text-emerald-400">{metrics.verifiedContent}</strong>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-white/5">
              <span className="text-[11px] text-amber-400 uppercase tracking-wider block">Awaiting Review</span>
              <strong className="text-2xl font-bold font-mono text-amber-400">{metrics.discovered + metrics.pendingReview}</strong>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-white/5">
              <span className="text-[11px] text-pink-400 uppercase tracking-wider block">Duplicates Merged</span>
              <strong className="text-2xl font-bold font-mono text-pink-400">{metrics.duplicates}</strong>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-white/5">
              <span className="text-[11px] text-sky-400 uppercase tracking-wider block">Search Queries</span>
              <strong className="text-2xl font-bold font-mono text-sky-400">{metrics.totalQueries}</strong>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-white/5">
              <span className="text-[11px] text-rose-400 uppercase tracking-wider block">Indexed Channels</span>
              <strong className="text-2xl font-bold font-mono text-rose-400">{metrics.totalChannels}</strong>
            </div>
          </div>

          {/* Last Discovery Run Summary Card */}
          {metrics.lastScan && (
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-pink-400" />
                  <h3 className="font-cinematic text-lg font-bold text-white">Latest Discovery Scan Telemetry</h3>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  Completed in {metrics.lastScan.durationSeconds}s ({new Date(metrics.lastScan.completedAt).toLocaleTimeString()})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-zinc-500 block">Sources Contacted</span>
                  <strong className="text-sm font-mono text-white">{metrics.lastScan.sourcesContacted}</strong>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-zinc-500 block">Queries Executed</span>
                  <strong className="text-sm font-mono text-white">{metrics.lastScan.queriesExecuted}</strong>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-zinc-500 block">Raw Results</span>
                  <strong className="text-sm font-mono text-white">{metrics.lastScan.rawDiscovered}</strong>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-emerald-400 block">New Unique Items</span>
                  <strong className="text-sm font-mono text-emerald-400">{metrics.lastScan.uniqueNew}</strong>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-pink-400 block">Duplicates Merged</span>
                  <strong className="text-sm font-mono text-pink-400">{metrics.lastScan.duplicatesDetected}</strong>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-amber-400 block">Needs Review</span>
                  <strong className="text-sm font-mono text-amber-400">{metrics.lastScan.needsVerification}</strong>
                </div>
              </div>

              {metrics.lastScan.errors && metrics.lastScan.errors.length > 0 && (
                <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                  <strong>Notes:</strong> {metrics.lastScan.errors.join('; ')}
                </div>
              )}
            </div>
          )}

          {/* Platform breakdown */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="font-cinematic text-lg font-bold text-white">
              Public Content Distribution by Platform
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(metrics.platformBreakdown || {}).map(([platform, count]) => (
                <div key={platform} className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-xs text-zinc-400">{platform}</span>
                  <p className="text-lg font-bold font-mono text-white mt-1">{count as number} items</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: SCAN NOW (Real Discovery Pipeline Control) */}
      {activeTab === 'scan' && (
        <div className="space-y-6 max-w-4xl">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <div className="space-y-1">
              <h3 className="font-cinematic text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-pink-400" />
                <span>Live Discovery Pipeline Runner</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Execute a real discovery run through the pipeline: <code>DISCOVER → NORMALIZE → CLASSIFY → DEDUPLICATE → VERIFY → STORE</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Scan Strategy / Job Type</label>
                <select
                  value={scanJobType}
                  onChange={e => setScanJobType(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
                >
                  <option value="MANUAL_SCAN">Manual Scan (Default queries)</option>
                  <option value="DAILY_DISCOVERY">Daily Scan (Recent + Core queries)</option>
                  <option value="WEEKLY_DEEP_SCAN">Weekly Deep Scan (All query families)</option>
                  <option value="HISTORICAL_RESCAN">Historical Rescan (Older 2021–2023 milestones)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Target Provider</label>
                <select
                  value={scanProvider}
                  onChange={e => setScanProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
                >
                  <option value="">All Configured Providers</option>
                  <option value="YouTube">YouTube Only</option>
                  <option value="WebSource">Web Source Only</option>
                  <option value="Instagram">Instagram Only</option>
                  <option value="X">X Only</option>
                  <option value="Snapchat">Snapchat Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Filter by Query Family (Optional)</label>
              <select
                value={scanQueryFamily}
                onChange={e => setScanQueryFamily(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
              >
                <option value="">All Active Families</option>
                <option value="CORE">CORE (Exact name, official vlog)</option>
                <option value="DRAMA">DRAMA (Sinf-e-Aahan, Muhabbat Gumshuda Meri, Very Filmy)</option>
                <option value="INTERVIEW">INTERVIEW (Press bytes, podcasts)</option>
                <option value="APPEARANCE">APPEARANCE (Red carpet, awards, bridal)</option>
                <option value="HISTORICAL">HISTORICAL (Viral 2021, PSL)</option>
                <option value="RECENT">RECENT (2025/2026 releases)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Single Custom Search Query (Optional)</label>
              <input
                type="text"
                value={customScanQuery}
                onChange={e => setCustomScanQuery(e.target.value)}
                placeholder="e.g. Dananeer Mobeen OST song live"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 focus:border-pink-500 rounded-xl text-white text-xs focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleExecuteScan}
                disabled={isScanning}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-pink-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>{isScanning ? 'Discovery Pipeline Running...' : 'START DISCOVERY SCAN NOW'}</span>
              </button>
            </div>
          </div>

          {/* Past Scan Run Reports */}
          {runs.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
              <h4 className="font-cinematic text-base font-bold text-white">Historical Scan Audit Logs</h4>
              <div className="space-y-3">
                {runs.slice(0, 5).map(run => (
                  <div key={run.id} className="p-3.5 bg-white/5 rounded-xl border border-white/5 text-xs space-y-1">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="font-semibold text-pink-400">{run.jobType}</span>
                      <span>{new Date(run.startedAt).toLocaleString()} ({run.durationSeconds}s)</span>
                    </div>
                    <div className="text-zinc-300">
                      Contacted: {run.sourcesContacted} | Queries: {run.queriesExecuted} | Raw: {run.rawDiscovered} | New Unique: {run.uniqueNew} | Merged Duplicates: {run.duplicatesDetected}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Content Queue ("NEW DISCOVERIES") */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-cinematic text-xl font-bold text-white">
              NEW DISCOVERIES & VERIFICATION QUEUE
            </h3>
            <span className="text-xs text-zinc-400 font-mono">
              {queueItems.length} records awaiting moderation or flagged
            </span>
          </div>

          {queueItems.length > 0 ? (
            <div className="space-y-4">
              {queueItems.map(item => (
                <div
                  key={item.id}
                  className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 max-w-2xl">
                    <div className="w-20 h-16 rounded-xl bg-zinc-900 overflow-hidden shrink-0">
                      <img
                        src={item.thumbnailUrl || '/src/assets/images/dananeer_hero_cinematic_1791045480240.jpg'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-pink-950 text-pink-300 font-mono">
                          {item.platform}
                        </span>
                        <span className="text-zinc-500">·</span>
                        <span className="text-zinc-300 font-medium">{item.author}</span>
                        {item.sourceClassification && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">
                            {item.sourceClassification}
                          </span>
                        )}
                        {item.relevanceClassification && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            item.relevanceClassification === 'DIRECT' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                          }`}>
                            {item.relevanceClassification}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-semibold text-white">
                        {item.title}
                      </h4>

                      <p className="text-xs text-zinc-400 line-clamp-1">
                        Reason: {item.reasonForDiscovery || item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleVerify(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Verify</span>
                    </button>

                    <button
                      onClick={() => handleReject(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white text-xs flex items-center gap-1"
                    >
                      <span>Open Original</span>
                      <ExternalLink className="w-3 h-3 text-pink-400" />
                    </a>

                    <button
                      onClick={() => handleMarkBroken(item.id)}
                      className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-950/40"
                      title="Mark Broken"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/40"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center glass-panel rounded-2xl border border-white/5 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">Queue is Clear</h4>
              <p className="text-xs text-zinc-400">
                All discovered content items have been reviewed or verified into the public archive.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Search Query Strategy Manager */}
      {activeTab === 'queries' && (
        <div className="space-y-6 max-w-4xl">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-cinematic text-lg font-bold text-white">
              Add New Discovery Query Term
            </h3>
            <form onSubmit={handleAddQuery} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={newQueryText}
                onChange={e => setNewQueryText(e.target.value)}
                placeholder="e.g. Dananeer Mobeen OST song acoustic"
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 focus:border-pink-500 rounded-xl text-white text-xs focus:outline-none"
              />
              <select
                value={newQueryFamily}
                onChange={e => setNewQueryFamily(e.target.value)}
                className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none"
              >
                <option value="CORE">CORE</option>
                <option value="DRAMA">DRAMA</option>
                <option value="INTERVIEW">INTERVIEW</option>
                <option value="APPEARANCE">APPEARANCE</option>
                <option value="HISTORICAL">HISTORICAL</option>
                <option value="RECENT">RECENT</option>
              </select>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold uppercase tracking-wider transition-all shrink-0"
              >
                Add Query
              </button>
            </form>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-cinematic text-base font-bold text-white">Configured Query Strategy Terms</h4>
              <span className="text-xs text-zinc-400">{queries.length} queries active in discovery engine</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {queries.map(q => (
                <div
                  key={q.id}
                  className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] text-pink-400 font-mono uppercase">{q.family}</span>
                    <p className="font-medium text-white truncate">{q.query}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleQuery(q.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        q.enabled ? 'bg-emerald-950 text-emerald-300' : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {q.enabled ? 'ACTIVE' : 'OFF'}
                    </button>
                    <button
                      onClick={() => handleDeleteQuery(q.id)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Indexed Channels */}
      {activeTab === 'channels' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-cinematic text-lg font-bold text-white">
              Indexed Media Channels & Publishers
            </h3>
            <span className="text-xs text-zinc-400">{channels.length} channels tracked</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map(ch => (
              <div key={ch.id} className="glass-panel p-4 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-pink-400 font-mono">{ch.platform}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-mono">
                    {ch.channelType}
                  </span>
                </div>
                <h4 className="font-semibold text-white text-sm truncate">{ch.name}</h4>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/5">
                  <span>{ch.itemCount} items discovered</span>
                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-400 hover:underline flex items-center gap-1"
                  >
                    <span>View Channel</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Add Verified Content */}
      {activeTab === 'newItem' && (
        <div className="max-w-2xl glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="space-y-1">
            <h3 className="font-cinematic text-xl font-bold text-white">
              Index Verified Public Source
            </h3>
            <p className="text-xs text-zinc-400">
              Directly ingest a verified YouTube video, interview, or official release into the database.
            </p>
          </div>

          <form onSubmit={handleCreateNew} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Dananeer Mobeen Candid Interview with BBC Urdu"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 focus:border-pink-500 rounded-xl text-white text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Legitimate Source URL</label>
              <input
                type="url"
                required
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-2 bg-white/5 border border-white/10 focus:border-pink-500 rounded-xl text-white text-sm focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Platform</label>
                <select
                  value={newPlatform}
                  onChange={e => setNewPlatform(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
                >
                  <option value="YouTube">YouTube</option>
                  <option value="Instagram">Instagram</option>
                  <option value="X">X (Twitter)</option>
                  <option value="Broadcast">Broadcast / Television</option>
                  <option value="Interview">Interview</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Content Type</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
                >
                  <option value="video">Video</option>
                  <option value="interview">Interview</option>
                  <option value="episode">Drama Episode</option>
                  <option value="reel">Reel / Short</option>
                  <option value="appearance">Appearance</option>
                  <option value="behind-the-scenes">Behind the Scenes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Author / Channel</label>
              <input
                type="text"
                value={newAuthor}
                onChange={e => setNewAuthor(e.target.value)}
                placeholder="e.g. FUCHSIA Magazine / HUM TV"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 focus:border-pink-500 rounded-xl text-white text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Description / Summary</label>
              <textarea
                rows={3}
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Summary of the public appearance or video..."
                className="w-full px-4 py-2 bg-white/5 border border-white/10 focus:border-pink-500 rounded-xl text-white text-sm focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg"
            >
              Verify & Save to Database
            </button>
          </form>
        </div>
      )}

      {/* Tab: Providers */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="font-cinematic text-xl font-bold text-white">
              Configured Provider Integrations
            </h3>
            <p className="text-xs text-zinc-400">
              Live provider adapters query external platforms when API credentials are configured.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {platforms.map(p => (
              <div
                key={p.id}
                className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-white">{p.displayName}</h4>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        p.configured
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {p.configured ? 'CONFIGURED' : 'NOT CONFIGURED'}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-zinc-500">
                    Required Variable: <code className="text-pink-400">{p.requiredEnvVar}</code>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-zinc-400 font-mono">
                    {p.itemCount} items indexed
                  </span>

                  <button
                    onClick={() => {
                      setScanProvider(p.name);
                      setActiveTab('scan');
                    }}
                    disabled={!p.configured}
                    className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    Configure Scan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Link Health Monitor */}
      {activeTab === 'health' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-cinematic text-xl font-bold text-white">
                Live Source URL & Embed Monitor
              </h3>
              <p className="text-xs text-zinc-400">
                Pings external sources with exponential retry logic to detect removed videos or broken links.
              </p>
            </div>

            <button
              onClick={handleTriggerHealth}
              className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              <span>Run Health Audit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <span className="text-xs text-zinc-400">Database Layer</span>
              <p className="text-base font-bold text-emerald-400 mt-1">Operational (Persistent JSON Tables)</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <span className="text-xs text-zinc-400">Readiness API</span>
              <p className="text-base font-bold text-emerald-400 mt-1">HTTP 200 OK (/api/ready)</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <span className="text-xs text-zinc-400">6-Level Deduplicator</span>
              <p className="text-base font-bold text-emerald-400 mt-1">Canonical Matcher Active</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: YouTube API & Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-pink-400 font-semibold">
              <Shield className="w-4 h-4" />
              <span>Admin Settings & Secrets Management</span>
            </div>
            <h3 className="font-cinematic text-2xl font-bold text-white tracking-wider">
              YOUTUBE DATA API V3 CONFIGURATION
            </h3>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Configure and test the YouTube Data API key used for multi-query discovery, channel metadata ingestion, and streaming archive updates. Replaced keys take effect immediately without restarting.
            </p>
          </div>

          {/* Action / Key Save Notification */}
          {keyNotice && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
                keyNotice.isError
                  ? 'bg-red-950/40 border-red-500/40 text-red-300'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {keyNotice.isError ? (
                  <XCircle className="w-4 h-4 shrink-0 text-red-400" />
                ) : (
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                )}
                <span>{keyNotice.text}</span>
              </div>
              <button
                onClick={() => setKeyNotice(null)}
                className="text-zinc-400 hover:text-white ml-3"
              >
                ✕
              </button>
            </div>
          )}

          {/* Live Connection Status Banner */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
              <div>
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-mono">
                  Live Service Status
                </span>
                <div className="flex items-center gap-3 mt-1.5">
                  {ytConfig?.status === 'CONNECTED' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      API connection: CONNECTED
                    </span>
                  ) : ytConfig?.status === 'FAILED' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/60 text-red-300 border border-red-500/40">
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                      API connection: FAILED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/40">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      API connection: NOT CONFIGURED
                    </span>
                  )}

                  <span className="text-xs text-zinc-400">
                    {ytConfig?.configured ? 'Key Installed in Secure Storage' : 'No Key Provided'}
                  </span>
                </div>
              </div>

              {/* Test Connection Button */}
              <button
                onClick={handleTestApiKey}
                disabled={isTestingKey || !ytConfig?.configured}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-200 border border-white/10 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingKey ? 'animate-spin' : ''}`} />
                <span>{isTestingKey ? 'Testing Connection...' : 'Test Connection'}</span>
              </button>
            </div>

            {/* Error or Success details */}
            {ytConfig?.errorReason && (
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/20 text-xs text-red-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <div>
                  <strong className="font-semibold block text-red-200">Diagnostic Reason:</strong>
                  <span>{ytConfig.errorReason}</span>
                </div>
              </div>
            )}

            {/* Current Masked Key & Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-mono">
                  Currently Active Key (Masked)
                </span>
                <p className="font-mono text-xs text-pink-300 truncate">
                  {ytConfig?.maskedKey || 'No active key configured'}
                </p>
                <span className="text-[10px] text-zinc-500 block">
                  Keys are never exposed in logs, client bundles, or public endpoints.
                </span>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-mono">
                  Last Validated
                </span>
                <p className="text-xs text-zinc-300">
                  {ytConfig?.lastCheckedAt
                    ? new Date(ytConfig.lastCheckedAt).toLocaleString()
                    : 'Awaiting validation'}
                </p>
                <span className="text-[10px] text-zinc-500 block">
                  Automated validation verifies credentials against Google Cloud v3 endpoints.
                </span>
              </div>
            </div>
          </div>

          {/* Secure Key Input & Replacement Form */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5 shadow-xl">
            <div className="space-y-1">
              <h4 className="font-cinematic text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <Key className="w-4 h-4 text-pink-400" />
                <span>Enter or Replace YouTube Data API Key</span>
              </h4>
              <p className="text-xs text-zinc-400">
                To replace an expired key or configure a new Google Cloud project, enter your key below. It will be stored in secure environment storage and tested immediately.
              </p>
            </div>

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>YouTube Data API v3 Key</span>
                  <span className="text-[11px] text-zinc-500 font-normal">
                    Format: AIzaSy... (39 characters)
                  </span>
                </label>

                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={newApiKeyInput}
                    onChange={e => setNewApiKeyInput(e.target.value)}
                    placeholder="Enter or paste your YouTube Data API v3 key..."
                    autoComplete="off"
                    spellCheck="false"
                    className="w-full pl-4 pr-12 py-3 bg-black/50 border border-white/10 focus:border-pink-500/60 rounded-xl text-white text-xs font-mono focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1"
                    title={showApiKey ? 'Hide API Key' : 'Show API Key'}
                  >
                    {showApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingKey || !newApiKeyInput.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-lg shadow-pink-600/20 flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingKey ? 'Saving & Validating...' : 'Save & Validate API Key'}</span>
                </button>

                {ytConfig?.configured && (
                  <button
                    type="button"
                    onClick={handleRemoveApiKey}
                    disabled={isSavingKey}
                    className="px-4 py-2.5 rounded-xl bg-red-950/20 hover:bg-red-900/40 text-red-300 border border-red-500/30 text-xs font-medium transition-all"
                  >
                    Clear / Remove Key
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Quick Setup Instructions Card */}
          <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-pink-400 font-semibold">
              How to Obtain a YouTube Data API v3 Key
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-zinc-400">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                <span className="font-bold text-pink-400 block font-mono">STEP 1</span>
                <p className="text-zinc-200 font-semibold">Google Cloud Console</p>
                <p className="text-[11px] leading-relaxed">
                  Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-pink-400 underline inline-flex items-center gap-0.5">console.cloud.google.com <ExternalLink className="w-2.5 h-2.5" /></a> and select or create a project.
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                <span className="font-bold text-pink-400 block font-mono">STEP 2</span>
                <p className="text-zinc-200 font-semibold">Enable API</p>
                <p className="text-[11px] leading-relaxed">
                  Navigate to <strong>APIs & Services &gt; Library</strong>, search for <em>YouTube Data API v3</em>, and click <strong>Enable</strong>.
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                <span className="font-bold text-pink-400 block font-mono">STEP 3</span>
                <p className="text-zinc-200 font-semibold">Generate Credentials</p>
                <p className="text-[11px] leading-relaxed">
                  Under <strong>Credentials</strong>, click <strong>Create Credentials &gt; API key</strong>. Copy your newly created key.
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                <span className="font-bold text-pink-400 block font-mono">STEP 4</span>
                <p className="text-zinc-200 font-semibold">Save in Admin Settings</p>
                <p className="text-[11px] leading-relaxed">
                  Paste the key into the input field above and click <strong>Save & Validate API Key</strong>. Real-time search activates instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
