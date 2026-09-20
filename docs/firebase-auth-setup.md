# Firebase staff sign-in setup

The app signs in with Firebase Authentication Email/Password. It grants app access only when the authenticated email matches a non-suspended document in the Firestore `staff` collection. A browser-local staff record or old saved session cannot grant access.

1. Enable **Email/Password** in Firebase Console → Authentication → Sign-in method.
2. Create an Email/Password user in Firebase Console → Authentication → Users for each staff member who needs access. Use the same email stored in that person's Firestore `staff` document. Creating a staff profile in the app does not create a Firebase Authentication user.
3. Make sure the matching staff document has the appropriate role and is not `Suspended`. For the initial administrator, create both the Firebase Authentication user and Firestore staff document in the Firebase Console before switching users to the new login.
4. Configure Firestore Security Rules for authenticated access and restrict staff-profile writes to trusted administrators. Client-side login checks alone do not protect Firestore data.

The login page uses Firebase password reset emails. **Remember Me** keeps Firebase's session across browser restarts; when unchecked, the session ends when the browser session closes. If Email/Password is disabled or Firestore staff records cannot be read, sign-in fails closed with an error message.
