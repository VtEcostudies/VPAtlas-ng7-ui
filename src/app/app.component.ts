import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthenticationService } from './_services';
import { User, Auth } from './_models';

@Component({ selector: 'app', templateUrl: 'app.component.html' })
export class AppComponent {
    currentUserSubscription: Subscription;
    currentUser: Auth; //type Auth is {token: string, user: User}
    userIsAdmin = false;
    vceLogoPath = '../assets/images/vce logo new clr w tag_225.jpg';
    vceIconPath = '../assets/images/vce_favicon.png';
    fNwLogoPath = 'https://vtfishandwildlife.com/sites/fishandwildlife/files/vfw-crest.png';
    bannerMessage = null;

    constructor(
        private router: Router,
        private authenticationService: AuthenticationService
    ) {
        this.currentUserSubscription = this.authenticationService.currentUser.subscribe(user => {
          this.currentUser = user;
          if (this.currentUser) {
            this.userIsAdmin = this.currentUser.user.userrole == 'admin';
          }
        });
        this.onLogin();
    }

    ngOnDestroy() {
        // unsubscribe to ensure no memory leaks
        this.currentUserSubscription.unsubscribe();
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

    profile() {
      this.router.navigate([`/user/profile/view/${this.currentUser.user.id}`]);
    }

}
