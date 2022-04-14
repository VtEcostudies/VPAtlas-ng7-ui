#https://stackoverflow.com/questions/43931986/how-to-upgrade-angular-cli-to-the-latest-version
..tried all that, which I'd done before.

Problem: package.json corrupt or missing
Solution: go get a previous working version from Github
****NOTE: USE THE CORRECT BRANCH!!!!

reinstalled proper package.json

npm install
ng version
Angular CLI: 13.3.3
Node: 16.14.2
Package Manager: npm 8.5.0
OS: win32 x64

Angular: 13.3.3
... animations, cdk, cli, common, compiler, compiler-cli, core
... forms, language-service, platform-browser
... platform-browser-dynamic, router

Package                         Version
---------------------------------------------------------
@angular-devkit/architect       0.1303.3
@angular-devkit/build-angular   13.3.3
@angular-devkit/core            13.3.3
@angular-devkit/schematics      13.3.3
@schematics/angular             13.3.3
rxjs                            6.6.7
typescript                      4.6.3
npm install -g @angular/cli@latest (this showed nothing new with 'ng version')
npm install --save-dev @angular/cli@latest (this showed nothing new with 'ng version')
ng serve
...worked
