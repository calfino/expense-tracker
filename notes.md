Open src/config/firebase.ts and replace the placeholder values with your actual Firebase project config:

Go to console.firebase.google.com
Create project → Enable Authentication (Email/Password) + Firestore
Project Settings → Your apps → Web app → copy the config object
Paste values into firebase.ts
Then paste the Firestore Security Rules from the plan into your Firebase Console → Firestore → Rules tab.