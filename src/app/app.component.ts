﻿import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthenticationService } from './_services';
import { User, Auth } from './_models';
import { environment } from '@environments/environment';
import { UxValuesService } from '@app/_global';
@Component({ selector: 'app', templateUrl: 'app.component.html' })
export class AppComponent {
    currentUserSubscription: Subscription;
    currentUser: Auth; //type Auth is {token: string, user: User}
    userIsAdmin = false;
    vceLogoPath = '../assets/images/vce logo new clr w tag_225.jpg';
    vceIconPath = '../assets/images/vce_favicon.png';
    fNwLogoPath = 'https://vtfishandwildlife.com/sites/fishandwildlife/files/vfw-crest.png';
    bannerMessage = '****************** This is the VPAtlas Version 3 Staging Server ******************';
    apiUrl = environment.apiUrl;
    downloadParamsText = '';

    constructor(
        private router: Router,
        private authenticationService: AuthenticationService,
        public uxValuesService: UxValuesService
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

    download(fileType='csv', dataType=null) {
      if (!dataType) {
        let type = this.uxValuesService.type;
        if ('visi'==type) {dataType = 'visit';} else
        if ('moni'==type) {dataType = 'survey';} else
        {dataType='mapped';} //if ('all'==type || 'mine'==type)
      }
      let townName = this.uxValuesService.filterParams.town.townName; townName = townName ? (townName != 'All' ? townName : '') : '';
      let userName = this.uxValuesService.filterParams.userName; userName = userName ? (userName != 'Unknown' ? userName : '') : '';
      let poolId = this.uxValuesService.filterParams.poolId; poolId = poolId ? poolId : '';
      this.downloadParamsText = 'download=1';
      this.downloadParamsText += townName ? `&townName=${townName}` : '';
      this.downloadParamsText += userName ? `&username=${userName}` : '';
      this.downloadParamsText += poolId ? `&mappedPoolId=${poolId}` : '';
      if ('pools' == dataType) {this.downloadParamsText = '';} //this query can't easily handle query params b/c it queries many tables.

      if ('shapefile' == fileType) { //authUser used to create filesystem download by user to handle simultaneity
        this.downloadParamsText += `&authUser=${this.currentUser.user.username}`;
      }
      let url = `${this.apiUrl}/${dataType}/${fileType}?${this.downloadParamsText}`;
      window.open(url);
    }

    getQueryParams() {
      this.downloadParamsText += this.uxValuesService.filterParams.town.townName ? `&townName=${this.uxValuesService.filterParams.town.townName}` : '';
      this.downloadParamsText += this.uxValuesService.filterParams.userName ? `&username=${this.uxValuesService.filterParams.userName}` : '';
      this.downloadParamsText += this.uxValuesService.filterParams.poolId ? `&mappedPoolId=${this.uxValuesService.filterParams.poolId}` : '';
    }

}
