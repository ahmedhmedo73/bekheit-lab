import { ANALYTIC_CATALOG } from '../data/analyticCatalog';
/**
 * Migration Script: Move existing patient data from localStorage to Firestore
 * 
 * This script reads patient data from localStorage and migrates it to Firestore.
 * Run this script once after setting up your Firebase configuration.
 */

import { FirestoreService } from '../services/firestoreService';
import { StorageService } from '../services/storage';

export async function migratePatientsToFirestore() {
  console.log('Starting migration to Firestore...');
  
  try {
    // 1. Get existing patients from localStorage
    const existingPatients = StorageService.getPatientData();
    console.log(`Found ${existingPatients.length} patients in localStorage`);
    
    if (existingPatients.length === 0) {
      console.log('No patients to migrate. Migration complete.');
      return { success: true, count: 0, message: 'No patients to migrate' };
    }
    
    // 2. Check if Firestore already has data
    try {
      const firestorePatients = await FirestoreService.getAllPatients();
      if (firestorePatients.length > 0) {
        console.warn(`Firestore already contains ${firestorePatients.length} patients.`);
        const shouldContinue = confirm(
          'Firestore already has patient data. Do you want to continue with migration? ' +
          'This may create duplicates. Cancel to abort migration.'
        );
        if (!shouldContinue) {
          return { success: false, count: 0, message: 'Migration aborted by user' };
        }
      }
    } catch {
      console.log('Firestore is empty or not accessible, proceeding with migration...');
    }
    
    // 3. Migrate patients to Firestore
    console.log('Migrating patients to Firestore...');
    const result = await FirestoreService.migratePatients(existingPatients);
    
    if (result.success) {
      console.log(`Successfully migrated ${result.count} patients to Firestore`);
      
      // 4. Optionally clear localStorage after successful migration
      const shouldClear = confirm(
        'Migration successful! Do you want to clear patient data from localStorage?'
      );
      if (shouldClear) {
        localStorage.removeItem('patientData');
        console.log('localStorage cleared');
      }
      
      return { 
        success: true, 
        count: result.count, 
        message: `Successfully migrated ${result.count} patients` 
      };
    }
    
    return { success: false, count: 0, message: 'Migration failed' };
    
  } catch (error) {
    console.error('Migration error:', error);
    return { 
      success: false, 
      count: 0, 
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

// Function to check migration status
export async function checkMigrationStatus() {
  try {
    const localPatients = StorageService.getPatientData();
    const firestorePatients = await FirestoreService.getAllPatients();
    
    return {
      localStorageCount: localPatients.length,
      firestoreCount: firestorePatients.length,
      needsMigration: localPatients.length > 0 && firestorePatients.length === 0,
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return {
      localStorageCount: StorageService.getPatientData().length,
      firestoreCount: 0,
      needsMigration: true,
      error: 'Could not connect to Firestore',
    };
  }
}

// Migrate initial analytic types to Firestore
export async function migrateAnalyticTypesToFirestore() {
  console.log('Starting analytic types migration to Firestore...');

  const INITIAL_ANALYTIC_TYPES = ANALYTIC_CATALOG;

  try {
    // Check if Firestore already has analytic types
    try {
      const existingTypes = await FirestoreService.getAllAnalyticTypes();
      if (existingTypes.length > 0) {
        console.log(`Firestore already contains ${existingTypes.length} analytic types. Skipping migration.`);
        return { success: true, count: 0, message: 'Analytic types already exist in Firestore' };
      }
    } catch {
      console.log('Firestore analytic types collection not accessible, proceeding with seed...');
    }

    const result = await FirestoreService.migrateAnalyticTypes(INITIAL_ANALYTIC_TYPES);
    console.log(`Successfully seeded ${result.count} analytic types to Firestore`);
    return {
      success: true,
      count: result.count,
      message: `Successfully seeded ${result.count} analytic types`,
    };
  } catch (error) {
    console.error('Analytic types migration error:', error);
    return {
      success: false,
      count: 0,
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Migrate staff to Firestore
export async function migrateStaffToFirestore() {
  console.log('Starting staff migration to Firestore...');
  try {
    const existingStaff = StorageService.getStaffData();
    if (existingStaff.length === 0) {
      console.log('No staff to migrate.');
      return { success: true, count: 0, message: 'No staff to migrate' };
    }

    try {
      const firestoreStaff = await FirestoreService.getAllStaff();
      if (firestoreStaff.length > 0) {
        console.log(`Firestore already contains ${firestoreStaff.length} staff members.`);
        return { success: true, count: 0, message: 'Staff already exists in Firestore' };
      }
    } catch {
      console.log('Firestore staff collection empty or inaccessible, proceeding...');
    }

    const result = await FirestoreService.migrateStaff(existingStaff);
    console.log(`Successfully migrated ${result.count} staff members to Firestore`);
    return {
      success: true,
      count: result.count,
      message: `Successfully migrated ${result.count} staff members`,
    };
  } catch (error) {
    console.error('Staff migration error:', error);
    return {
      success: false,
      count: 0,
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Unified function: Migrate EVERYTHING to Firestore
export async function migrateEverythingToFirestore() {
  console.log('==================================================');
  console.log('🚀 MIGRATING EVERYTHING TO FIRESTORE (PATIENTS, TESTS, STAFF)...');
  console.log('==================================================');

  const staffResult = await migrateStaffToFirestore();
  const typesResult = await migrateAnalyticTypesToFirestore();
  const patientsResult = await migratePatientsToFirestore();

  const summary = {
    staff: staffResult,
    analyticTypes: typesResult,
    patients: patientsResult,
    timestamp: new Date().toISOString(),
  };

  console.log('✅ Full migration completed:', summary);
  return summary;
}

// Export for use in console or admin panel
if (typeof window !== 'undefined') {
  const w = window as any;
  w.migrateEverything = migrateEverythingToFirestore;
  w.migrateAll = migrateEverythingToFirestore;
  w.migrateStaff = migrateStaffToFirestore;
  w.migrateToFirestore = migratePatientsToFirestore;
  w.checkMigrationStatus = checkMigrationStatus;
  w.migrateAnalyticTypes = migrateAnalyticTypesToFirestore;

  console.log('🔥 Bakhet Lab Firestore Migration Suite Available:');
  console.log('- migrateEverything(): Migrate patients, analytic types & staff in one click');
  console.log('- migrateToFirestore(): Migrate patients');
  console.log('- migrateAnalyticTypes(): Seed analytic types');
  console.log('- migrateStaff(): Migrate medical staff');
  console.log('- checkMigrationStatus(): Check database status');
}

