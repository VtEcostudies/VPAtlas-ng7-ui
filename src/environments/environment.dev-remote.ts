/*
  NOTE: Further discussion on custom build environments found here:

    https://angular.io/guide/build

    To use a specific build env, do something like this:

      ng build --configuration={configuration name}

    Configuration names are found in angular.json, under "configurations". There
    are 3: development (no arg), dev-remote, and production. To build this one
    use:

      ng build --configuration=dev-remote
*/
export const environment = {
  production: false,
  bannerMessage: 'Remote Staging Server',
  uiHost: 'https://dev.vpatlas.org',
  apiUrl: 'https://dev.vpatlas.org:4322',
  s3PhotoBucket: 'vpatlas.data',
  s3SoundBucket: 'vpatlas.data'
};
