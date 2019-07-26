import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

import { User } from '@app/_models';
import { AlertService, AuthenticationService, vpMappedService, vpPoolsService } from '@app/_services';

@Component({ templateUrl: 'home.component.html' })
export class HomeComponent implements OnInit, OnDestroy {
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

    constructor(
        private router: Router,
        private alertService: AlertService,
        private authenticationService: AuthenticationService,
        private vpMappedService: vpMappedService,
        private vpPoolsService: vpPoolsService
    ) {
      /*
        API handles this UI route's (/home) API route calls (/pools/mapped)
        without authentication.
        Leave this code stub here for future use.
      */
      if (this.authenticationService.currentUserValue) {
        let currentUser = this.authenticationService.currentUserValue.user;
        this.userIsAdmin = currentUser.userrole == 'admin';
      } else {
        this.userIsAdmin = false;
      }
    }

    ngOnInit() {
      this.loadPoolStats(); //calls loadAllPools when done
    }

    ngOnDestroy() {
      delete this.stats;
    }

    private loadPoolStats() {
      this.loading = true;
      this.vpMappedService.getStats()
          .pipe(first())
          .subscribe(
              data => {
                this.stats = data.rows[0];
                this.loadPools(); //chain data-loads together
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
      this.loadPools();
    }

    getFilter() {
        var i = 0;
        //filter hidden pools if user is not admin
        if (!this.userIsAdmin) {
          if (this.filter) {
            this.filter += `&logical${++i}=AND&`;
          }
          this.filter += `mappedPoolStatus|NOT IN=Eliminated`;
          this.filter += `&`;
          this.filter += `mappedPoolStatus|NOT IN=Duplicate`;
        }
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
}
