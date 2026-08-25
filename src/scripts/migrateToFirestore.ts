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

// Export for use in console or admin panel
if (typeof window !== 'undefined') {
  (window as { migrateToFirestore?: typeof migratePatientsToFirestore; checkMigrationStatus?: typeof checkMigrationStatus }).migrateToFirestore = migratePatientsToFirestore;
  (window as { migrateToFirestore?: typeof migratePatientsToFirestore; checkMigrationStatus?: typeof checkMigrationStatus }).checkMigrationStatus = checkMigrationStatus;
  console.log('Migration functions available on window:');
  console.log('- migrateToFirestore(): Run migration');
  console.log('- checkMigrationStatus(): Check migration status');
}
