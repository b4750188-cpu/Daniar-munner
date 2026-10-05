import type { DiscoveryRunReport, DiscoveryQuery, ChannelRecord } from '../../types/index.ts';
import { db } from '../db/store.ts';
import { YouTubeProvider } from '../providers/youtubeProvider.ts';
import { WebSourceProvider } from '../providers/webSourceProvider.ts';
import { InstagramProvider } from '../providers/instagramProvider.ts';
import { XProvider } from '../providers/xProvider.ts';
import { SnapchatProvider } from '../providers/snapchatProvider.ts';
import { deduplicator } from './deduplicator.ts';

export type JobType =
  | 'DAILY_DISCOVERY'
  | 'WEEKLY_DEEP_SCAN'
  | 'MANUAL_SCAN'
  | 'SOURCE_SPECIFIC_SCAN'
  | 'HISTORICAL_RESCAN';

export interface ScanOptions {
  jobType?: JobType;
  targetProvider?: string;
  queryFamily?: 'CORE' | 'DRAMA' | 'INTERVIEW' | 'APPEARANCE' | 'HISTORICAL' | 'RECENT';
  customQuery?: string;
}

export class DiscoveryScheduler {
  private isRunning = false;
  private youtube = new YouTubeProvider();
  private web = new WebSourceProvider();
  private instagram = new InstagramProvider();
  private x = new XProvider();
  private snapchat = new SnapchatProvider();

  public isScanActive(): boolean {
    return this.isRunning;
  }

  /**
   * Executes a discovery scan across active providers and query sets
   */
  public async executeScan(options: ScanOptions = {}): Promise<DiscoveryRunReport> {
    if (this.isRunning) {
      throw new Error('A discovery scan is already currently in progress. Please wait for it to complete.');
    }

    this.isRunning = true;
    const startTime = Date.now();
    const startedAt = new Date().toISOString();
    const runId = `run-${Date.now()}`;
    const jobType = options.jobType || 'MANUAL_SCAN';

    const errors: string[] = [];
    let queriesExecuted = 0;
    let sourcesContacted = 0;
    let sourcesUnavailable = 0;
    let rawDiscovered = 0;
    let uniqueNew = 0;
    let duplicatesDetected = 0;
    let rejectedCount = 0;
    let needsVerificationCount = 0;
    let verifiedCount = 0;

    try {
      // 1. Determine active queries to run from DB
      const allQueries: DiscoveryQuery[] = db.getDiscoveryQueries();
      let selectedQueries = allQueries.filter(q => q.enabled);

      if (options.customQuery) {
        selectedQueries = [{ id: 'q-custom', query: options.customQuery, family: 'CORE', enabled: true }];
      } else if (options.queryFamily) {
        selectedQueries = selectedQueries.filter(q => q.family === options.queryFamily);
      } else if (jobType === 'DAILY_DISCOVERY') {
        selectedQueries = selectedQueries.filter(q => q.family === 'RECENT' || q.family === 'CORE');
      } else if (jobType === 'HISTORICAL_RESCAN') {
        selectedQueries = selectedQueries.filter(q => q.family === 'HISTORICAL' || q.family === 'DRAMA');
      }

      const queryStrings = selectedQueries.map(q => q.query);

      // 2. Identify target providers
      const providerList = [
        { name: 'YouTube', instance: this.youtube },
        { name: 'WebSource', instance: this.web },
        { name: 'Instagram', instance: this.instagram },
        { name: 'X', instance: this.x },
        { name: 'Snapchat', instance: this.snapchat }
      ];

      const activeProviders = options.targetProvider
        ? providerList.filter(p => p.name.toLowerCase() === options.targetProvider!.toLowerCase())
        : providerList;

      for (const p of activeProviders) {
        if (!p.instance.isConfigured()) {
          sourcesUnavailable++;
          continue;
        }

        sourcesContacted++;

        try {
          if (p.name === 'YouTube') {
            const ytResult = await this.youtube.discover(queryStrings, jobType === 'WEEKLY_DEEP_SCAN' ? 3 : 1);
            queriesExecuted += ytResult.queriesExecuted;
            if (ytResult.error) errors.push(ytResult.error);

            // Register channels
            for (const ch of ytResult.channels) {
              db.upsertChannel(ch);
            }

            // Ingest items
            for (const item of ytResult.items) {
              rawDiscovered++;
              const dupMatch = deduplicator.findMatch(item, db.getAllContentRaw());

              if (dupMatch) {
                duplicatesDetected++;
                db.mergeDuplicates(dupMatch.matchedId, item.id, item);
              } else {
                if (item.relevanceClassification === 'IRRELEVANT') {
                  rejectedCount++;
                } else {
                  db.addContentItem(item);
                  uniqueNew++;
                  if (item.verificationStatus === 'VERIFIED') {
                    verifiedCount++;
                  } else {
                    needsVerificationCount++;
                  }
                }
              }
            }
          } else if (p.name === 'WebSource') {
            queriesExecuted++;
            const webResult = await this.web.discover();
            if (webResult.error) errors.push(webResult.error);

            for (const item of webResult.items) {
              rawDiscovered++;
              const dupMatch = deduplicator.findMatch(item, db.getAllContentRaw());

              if (dupMatch) {
                duplicatesDetected++;
                db.mergeDuplicates(dupMatch.matchedId, item.id, item);
              } else {
                db.addContentItem(item);
                uniqueNew++;
                verifiedCount++;
              }
            }
          } else {
            // Instagram / X / Snapchat
            queriesExecuted++;
            const res = await p.instance.discover();
            if (res.error) errors.push(res.error);

            for (const item of res.items) {
              rawDiscovered++;
              const dupMatch = deduplicator.findMatch(item, db.getAllContentRaw());
              if (dupMatch) {
                duplicatesDetected++;
                db.mergeDuplicates(dupMatch.matchedId, item.id, item);
              } else {
                db.addContentItem(item);
                uniqueNew++;
                needsVerificationCount++;
              }
            }
          }
        } catch (provErr) {
          errors.push(`Error executing scan on ${p.name}: ${(provErr as Error).message}`);
        }
      }

      const completedAt = new Date().toISOString();
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);

      const report: DiscoveryRunReport = {
        id: runId,
        jobType,
        targetProvider: options.targetProvider,
        startedAt,
        completedAt,
        durationSeconds,
        status: errors.length > 0 && uniqueNew === 0 && duplicatesDetected === 0 ? 'PARTIAL' : 'COMPLETED',
        queriesExecuted,
        sourcesContacted,
        sourcesUnavailable,
        rawDiscovered,
        uniqueNew,
        duplicatesDetected,
        rejected: rejectedCount,
        needsVerification: needsVerificationCount,
        verified: verifiedCount,
        errors
      };

      // Record in historical table
      db.recordDiscoveryRun(report);

      return report;
    } finally {
      this.isRunning = false;
    }
  }
}

export const scheduler = new DiscoveryScheduler();
