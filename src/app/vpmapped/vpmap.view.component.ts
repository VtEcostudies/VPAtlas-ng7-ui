import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { vpMapped } from '@app/_models';
import { vpMapLeafletComponent } from './vpmap.leaflet.component';

import { AlertService, AuthenticationService, vpMappedService } from '@app/_services';

@Component({templateUrl: 'vpmap.view.component.html'})
export class vpMapViewComponent implements OnInit {
    vpMappedForm: FormGroup;
    dataLoading = false;
    pool = {};
    vpmap: vpMapped[];

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private vpMappedService: vpMappedService
    ) {}

    ngOnInit() {
      console.log('vpmap.view.ngOnInit route.snapshot params: ', this.route.snapshot.params.mappedPoolId);
      this.loadPage(this.route.snapshot.params.mappedPoolId);
    }

    loadPage(mappedPoolId) {
      this.dataLoading = true; //this forces a map update, which plots a point
      console.log('vpmpap.view.componenet.ts::loadPage:', mappedPoolId);
      this.vpMappedService.getById(mappedPoolId)
          .pipe(first())
          .subscribe(
              data => {
                console.log('vpmap.view.componenent.loadPage result:', data);
                this.pool = data.rows[0];
                this.vpmap = data.rows; //one-element array of pools used by mapView
                this.dataLoading = false; //this forces a map update, which plots a point
              },
              error => {
                  this.alertService.error(error);
                  this.dataLoading = false; //this forces a map update, which plots a point
              });

    }
}
