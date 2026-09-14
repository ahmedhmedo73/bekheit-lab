import { ANALYTIC_CATALOG } from '../data/analyticCatalog';
/**
 * Run the analytic types migration directly via Node.js
 * This script uses the Firebase Admin-like approach through the app's own modules.
 * 
 * Usage: Open http://localhost:5173 in your browser, then open the 
 * developer console (F12) and run: migrateAnalyticTypes()
 */

// Since this is a browser-based app, we need to run the migration from the browser.
// This file provides instructions and an auto-migration approach.

import { FirestoreService } from '../services/firestoreService';
import type { AnalyticType } from '../types/analyticType';

const INITIAL_ANALYTIC_TYPES = ANALYTIC_CATALOG;

/**
 * Auto-migrate: seed analytic types if the collection is empty.
 * Called automatically when the app loads.
 */
export async function autoMigrateAnalyticTypes() {
  try {
    const existing = await FirestoreService.getAllAnalyticTypes();
    if (existing.length > 0) {
      console.log(`[AutoMigrate] Firestore already has ${existing.length} analytic types. Skipping seed.`);
      return;
    }

    console.log('[AutoMigrate] No analytic types found — seeding initial data...');
    const result = await FirestoreService.migrateAnalyticTypes(INITIAL_ANALYTIC_TYPES as AnalyticType[]);
    console.log(`[AutoMigrate] ✅ Successfully seeded ${result.count} analytic types into Firestore.`);
  } catch (error) {
    console.warn('[AutoMigrate] Could not auto-seed analytic types:', error);
  }
}

// Run auto-migration when this module is imported
autoMigrateAnalyticTypes();
