import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

import { User } from '@app/_models';
import { AlertService, AuthenticationService, vpMappedService } from '@app/_services';

//import { vpMapped } from '@app/_models';
//import { pgFields, pgVpMappedApi  } from '@app/_models';

@Component({ templateUrl: 'home.component.html' })
export class HomeComponent implements OnInit, OnDestroy {
  loading = false;
  count = { mapped:0, visited:0, monitored:0 };
  vpmap = [];
  //vpmap: vpMapped = [];
  //pgApi: pgVpMappedApi;

    constructor(
        private router: Router,
        private alertService: AlertService,
        private authenticationService: AuthenticationService,
        private vpMappedService: vpMappedService
    ) {
      // redirect to home if user not logged in - the API can't handle no-token access (yet)
      if (!this.authenticationService.currentUserValue) {
          this.router.navigate(['/login']);
      }
    }

    ngOnInit() {
      this.loadAllPools();
    }

    ngOnDestroy() {
      delete this.vpmap;
    }

    private loadAllPools() {
      this.loading = true;
      this.vpMappedService.getAll('')
          .pipe(first())
          .subscribe(
              data => {
                this.vpmap = data.rows;
                this.count.mapped = data.rowCount;
                this.loading = false;
              },
              error => {
                this.alertService.error(error);
                this.loading = false;
              });
    }
}
