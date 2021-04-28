/*
  NOTE: Further discussion on custom build environments found here:

    https://angular.io/guide/build

  To use a specific build env, do something like this:

    ng build --configuration=dev-remote
*/
export const environment = {
  production: true,
  apiUrl: 'https://vpatlas.org:4322',
  s3PhotoBucket: 'vpatlas.photos',
  s3SoundBucket: 'vpatlas.sounds'
};
