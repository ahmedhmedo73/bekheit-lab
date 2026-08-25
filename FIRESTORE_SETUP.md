# Firestore Integration Setup Guide

This document explains how to set up Firestore as the backend database for the Bekheit Medical Laboratories application.

## Prerequisites

1. A Firebase project created at [Firebase Console](https://console.firebase.google.com/)
2. Firestore Database enabled in your Firebase project

## Setup Steps

### 1. Install Dependencies

The Firebase dependencies have been added to `package.json`. Run:

```bash
npm install
```

### 2. Configure Firebase

1. Go to your Firebase project settings
2. Navigate to "Your apps" section
3. Add a web app or use existing one
4. Copy the Firebase configuration object

### 3. Set Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Update the `.env` file with your actual Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_actual_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
```

### 4. Configure Firestore Security Rules

In the Firebase Console, go to Firestore Database > Rules and set appropriate rules. For development, you can start with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Important:** Change these rules for production to secure your data properly.

### 5. Run Migration

To migrate existing patient data from localStorage to Firestore:

1. Start the development server: `npm run dev`
2. Open browser console
3. Run: `await migrateToFirestore()`
4. Confirm the migration when prompted

Or check migration status first: `await checkMigrationStatus()`

## Architecture

### Files Created/Modified

- **`src/config/firebase.ts`** - Firebase initialization and configuration
- **`src/services/firestoreService.ts`** - Firestore CRUD operations for patients
- **`src/scripts/migrateToFirestore.ts`** - Migration script from localStorage to Firestore
- **`src/services/patientService.ts`** - Updated to support both localStorage and Firestore
- **`src/types/patient.ts`** - Updated with Firestore timestamp fields

### Data Storage Toggle

The `PatientService` includes a flag `USE_FIRESTORE` in `src/services/patientService.ts`:

```typescript
const USE_FIRESTORE = true; // Set to false to use localStorage
```

Set this to `false` if you want to fall back to localStorage.

### Firestore Collection Structure

**Collection:** `patients`

**Document Structure:**
```typescript
{
  id: string;              // Firestore document ID
  patientId: string;       // e.g., "PAT-1001"
  name: string;
  age: number;
  phone: string;
  jobTitle: string;
  subtitle: string;
  gender?: 'Male' | 'Female' | 'Other';
  status: PatientStatus;
  registeredDate: string;
  avatarColor?: string;
  notes?: string;
  createdAt: string;        // ISO timestamp
  updatedAt: string;       // ISO timestamp
}
```

## Features

### Firestore Service Methods

- `getAllPatients()` - Fetch all patients
- `getPatientById(id)` - Fetch single patient
- `createPatient(data)` - Create new patient
- `updatePatient(id, updates)` - Update patient
- `deletePatient(id)` - Delete patient
- `filterPatients(options)` - Filter with search, status, sorting, pagination
- `getStats()` - Get patient statistics
- `migratePatients(patients)` - Batch migration

## Troubleshooting

### TypeScript Errors

If you see "Cannot find module 'firebase/...'" errors:

1. Ensure dependencies are installed: `npm install`
2. Restart your TypeScript server/IDE
3. Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Firebase Connection Issues

1. Check your `.env` file has correct values
2. Ensure Firestore is enabled in Firebase Console
3. Check Firestore security rules allow read/write
4. Verify your Firebase project is in the correct region

### Migration Issues

1. Check browser console for error messages
2. Verify Firebase connection is working
3. Ensure localStorage has patient data to migrate

## Production Considerations

1. **Security Rules:** Implement proper Firestore security rules
2. **Indexing:** Create Firestore indexes for complex queries
3. **Error Handling:** Add proper error handling for network issues
4. **Offline Support:** Consider adding offline persistence
5. **Data Validation:** Add validation before saving to Firestore

## Switching Back to localStorage

If you need to switch back to localStorage:

1. Set `USE_FIRESTORE = false` in `src/services/patientService.ts`
2. Restart the development server
3. Your data will be stored in localStorage again
