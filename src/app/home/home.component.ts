import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

import { User } from '@app/_models';
import { AlertService, AuthenticationService, vpMappedService, vpPoolsService } from '@app/_services';

@Component({ templateUrl: 'home.component.html' })
export class HomeComponent implements OnInit, OnDestroy {
  loading = false;
  stats = [{ potential:0, probable:0, confirmed:0, eliminated:0, monitored:0 }];
  pools = [];
  mapPoints = true; //flag to plot pools on map as circleMarkers, passed to map via [mapPoints]="mapPoints"
  itemType = "Home";
  imagePath = '../assets/images/vp_splash.jpg';

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
      if (!this.authenticationService.currentUserValue) {
          //this.router.navigate(['/login']);
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
      var filter = '';
      if (status=="Monitored") {
        this.alertService.error("Monitored Pools are not implemented in VPAtlas yet.");
        return;
      }
      if (status) {
        var filter = `mappedPoolStatus=${status}`;
      }
      this.loadPools(filter);
    }

    private loadPools(filter='') {
      this.loading = true;
      this.vpPoolsService.getAll(filter)
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
