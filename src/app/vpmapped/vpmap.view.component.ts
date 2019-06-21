import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { vpMapped } from '@app/_models';
import { AlertService, AuthenticationService, vpMappedService } from '@app/_services';
import * as Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/

@Component({templateUrl: 'vpmap.view.component.html'})
export class vpMapViewComponent implements OnInit {
    poolUser = null;
    userIsAdmin = false;
    vpMappedForm: FormGroup;
    dataLoading = false;
    pool: vpMapped = new vpMapped();
    itemType = "Mapped Pool";

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private vpMappedService: vpMappedService
    ) {}

    ngOnInit() {
      if (this.authenticationService.currentUserValue) {
        this.poolUser = this.authenticationService.currentUserValue.user;
        console.log('vpmap.view.component.ngOnInit | currentUser.userrole:', this.poolUser.userrole);
        this.userIsAdmin = this.poolUser.userrole == 'admin';
      } else { this.userIsAdmin = false;}
      console.log('vpmap.view.compoenent.ngOnInit | route.snapshot params: ', this.route.snapshot.params.mappedPoolId);
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
                this.pool.mappedDateText = Moment(this.pool.mappedDateText) as any;
                this.pool.updatedAt = Moment(this.pool.updatedAt) as any;
                this.dataLoading = false; //this forces a map update, which plots a point
              },
              error => {
                  this.alertService.error(error);
                  this.dataLoading = false; //this forces a map update, which plots a point
              });
    }

}
