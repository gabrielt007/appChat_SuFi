// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebase : {
    apiKey: "AIzaSyAU50U74brMpAd2txuV3vV0ROu1ZpEex7w",
    authDomain: "appchat-sufi.firebaseapp.com",
    projectId: "appchat-sufi",
    storageBucket: "appchat-sufi.firebasestorage.app",
    messagingSenderId: "180195751001",
    appId: "1:180195751001:web:eb8180d57b0e47ad1f2d48",
    measurementId: "G-K82J2G7Y66"
  },
  supabase: {
    url: 'TU_SUPABASE_URL', 
    anonKey: 'TU_ANON_KEY'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
