// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
/*
  NOTE: Further discussion on custom build environments found here:

    https://angular.io/guide/build

    To use a specific build env, do something like this:

      ng build --configuration={configuration name}

    Configuration names are found in angular.json, under "configurations". There
    are 3: development (no arg), dev-remote, and production. To build this one
    use:

      ng build
*/
export const environment = {
  production: false,
  bannerMessage: 'Local Development Server',
  uiHost: 'http://localhost:4200',
  apiUrl: 'http://localhost:4000',
  s3PhotoBucket: 'vpatlas.data',
  s3SoundBucket: 'vpatlas.data'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
//import 'zone.js/dist/zone-error';  // Included with Angular CLI.
