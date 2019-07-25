import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthenticationService } from './_services';
import { User, Auth } from './_models';

@Component({ selector: 'app', templateUrl: 'app.component.html' })
export class AppComponent {
    currentUser: Auth;
    userIsAdmin = false;
    vceLogoPath = '../assets/images/vce logo new clr w tag_225.jpg';
    vceIconPath = '../assets/images/vce_favicon.png';
    fNwLogoPath = 'https://vtfishandwildlife.com/sites/fishandwildlife/files/vfw-crest.png';

    constructor(
        private router: Router,
        private authenticationService: AuthenticationService
    ) {
        this.authenticationService.currentUser.subscribe(x => this.currentUser = x);
        this.onLogin();
    }

    //call this on login to update navbar elements
    onLogin() {
      if (this.currentUser) {
        this.userIsAdmin = this.currentUser.user.userrole == 'admin';
      }
    }

    logout() {
        this.userIsAdmin = false;
        this.authenticationService.logout();
        this.router.navigate(['/']);
    }
}
