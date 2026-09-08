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

const INITIAL_ANALYTIC_TYPES: Omit<AnalyticType, 'createdAt' | 'updatedAt'>[] = [
  { id: 'at-01', name: 'Complete Blood Count (CBC)', price: 120 },
  { id: 'at-02', name: 'Lipid Profile', price: 200 },
  { id: 'at-03', name: 'Fasting Blood Glucose (FBG)', price: 60 },
  { id: 'at-04', name: 'HbA1c', price: 180 },
  { id: 'at-05', name: 'Liver Function Tests (ALT/AST)', price: 150 },
  { id: 'at-06', name: 'Kidney Function (Creatinine/Urea)', price: 140 },
  { id: 'at-07', name: 'Thyroid Profile (TSH, FT3, FT4)', price: 350 },
  { id: 'at-08', name: 'Urine Analysis', price: 50 },
  { id: 'at-09', name: 'ESR (Erythrocyte Sedimentation Rate)', price: 40 },
  { id: 'at-10', name: 'CRP (C-Reactive Protein)', price: 100 },
  { id: 'at-11', name: 'Prothrombin Time (PT/INR)', price: 90 },
  { id: 'at-12', name: 'Serum Ferritin', price: 130 },
  { id: 'at-13', name: 'Vitamin D (25-OH)', price: 250 },
  { id: 'at-14', name: 'Calcium & Phosphorus', price: 110 },
  { id: 'at-15', name: 'High-Sensitivity Troponin I', price: 300 },
];

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
