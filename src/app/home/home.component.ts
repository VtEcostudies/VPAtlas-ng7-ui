import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

import { User } from '@app/_models';
import { AlertService, AuthenticationService, vpMappedService, vpPoolsService } from '@app/_services';
import { UxValuesService } from '@app/_global';

@Component({ templateUrl: 'home.component.html' })
export class HomeComponent implements OnInit, OnDestroy {
  currentUser = null;
  userIsAdmin = false;
  loading = false;
  filter = '';
  stats = { total:0, total_data:0, potential:0, probable:0, confirmed:0, eliminated:0, duplicate:0, visited:0, monitored:0 };
  pools = [];
  mapPoints = true; //flag to plot pools on map as circleMarkers, passed to map via [mapPoints]="mapPoints"
  itemType = "Home";
  imagePath = '../assets/images/vp_splash.jpg';
  vceLogoPath = '../assets/images/vce logo new clr w tag_225.jpg'; //C:\Users\jloomis\Documents\VCE\VPAtlas\vpAtlas-ng7-ui\src\assets\images\vce logo new clr w tag.jpg
  fNwLogoPath = 'https://vtfishandwildlife.com/sites/fishandwildlife/files/vfw-crest.png';
  VPAtlasPath = 'https://val.vtecostudies.org/projects/vermont-vernal-pool-atlas/';
  VPMonPath = 'https://vtecostudies.org/projects/forests/vernal-pool-conservation/vermont-vernal-pool-monitoring-project/';

    constructor(
        private router: Router,
        private alertService: AlertService,
        private authenticationService: AuthenticationService,
        private vpMappedService: vpMappedService,
        private vpPoolsService: vpPoolsService,
        private uxValuesService: UxValuesService
    ) {
      /*
        API handles this UI route's (/home) API route calls (/pools/mapped)
        without authentication.
        Leave this code stub here for future use.
      */
      if (this.authenticationService.currentUserValue) {
        this.currentUser = this.authenticationService.currentUserValue.user;
        this.userIsAdmin = this.currentUser.userrole == 'admin';
      } else {
        this.userIsAdmin = false;
      }
    }

    ngOnInit() {
      //this.loadPoolStats(); //calls loadAllPools when done
      //this.loadPools(); //don't need stats on Home page anymore
      this.loadUpdated();
    }

    ngOnDestroy() {
      delete this.stats;
      delete this.pools;
    }

    private loadPoolStats() {
      this.loading = true;
      this.vpMappedService.getStats(this.currentUser.username)
          .pipe(first())
          .subscribe(
              data => {
                this.stats = data.rows[0];
                //this.loadPools(); //chain data-loads together
                this.loadUpdated();
                //this.loading = false;
              },
              error => {
                this.alertService.error(error);
                this.loading = false;
              });
    }

    setStatusLoadPools(status=null) {
      if (status=="Monitored") {
        this.alertService.error("Monitored Pools are not implemented in VPAtlas yet.");
        return;
      }
      if (status) {
        this.filter = `mappedPoolStatus=${status}`;
      }
      //this.loadPools();
      this.loadUpdated();
    }

    getFilter() {
      var i = 0;
      //filter hidden pools for all users
      if (this.filter) {
        this.filter += `&logical${++i}=AND&`;
      }
      this.filter += `mappedPoolStatus|NOT IN=Eliminated`;
      this.filter += `&`;
      this.filter += `mappedPoolStatus|NOT IN=Duplicate`;
    }

    private loadPools(filter='') {
      this.loading = true;
      this.getFilter();
      this.vpPoolsService.getAll(this.filter)
          .pipe(first())
          .subscribe(
              data => {
                this.pools = data.rows;
                this.loading = false;
              },
              error => {
                this.alertService.error(error);
                this.loading = false;
              });
    }

    loadUpdated(type='all') {
      console.log('home.component::loadUpdated');
      this.loading = true;
      this.uxValuesService.loadUpdated(type)
        .then((data:any) => {
          this.pools = data.pools;
          this.loading = false;
        })
        .catch(err => {
          this.loading = false;
        })
    }
}
