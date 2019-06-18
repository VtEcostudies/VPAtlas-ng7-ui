import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { vpMapped, vpVisit } from '@app/_models';
import { AlertService, AuthenticationService, vpVisitService } from '@app/_services';
import * as Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/
import { LeafletComponent } from '@app/_components/leaflet.component';

@Component({templateUrl: 'vpvisit.view.component.html'})
export class vpVisitViewComponent implements OnInit {
    visitUser = null;
    userIsAdmin = false;
    vpVisitForm: FormGroup;
    dataLoading = false;
    //visit: vpVisit;
    visit;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private vpVisitService: vpVisitService
    ) {}

    ngOnInit() {
      if (this.authenticationService.currentUserValue) {
        this.visitUser = this.authenticationService.currentUserValue.user;
        console.log('visit.view.component.ngOnInit | currentUser.userrole:', this.visitUser.userrole);
        this.userIsAdmin = this.visitUser.userrole == 'admin';
      } else { this.userIsAdmin = false;}
      console.log('visit.view.compoenent.ngOnInit | route.snapshot params: ', this.route.snapshot.params.visitId);
      this.loadPage(this.route.snapshot.params.visitId);
    }

    loadPage(visitId) {
      this.dataLoading = true; //this forces a map update, which plots a point
      console.log('vpmpap.view.componenet.ts::loadPage:', visitId);
      this.vpVisitService.getById(visitId)
          .pipe(first())
          .subscribe(
              data => {
                console.log('visit.view.componenent.loadPage result:', data);
                this.visit = data.rows[0]; //one-element array of pools used by mapView
                this.visit.mappedDateText = Moment(this.visit.mappedDateText);
                this.visit.visitUpdatedAt = Moment(this.visit.visitUpdatedAt);
                this.dataLoading = false; //this forces a map update, which plots a point
              },
              error => {
                  this.alertService.error(error);
                  this.dataLoading = false; //this forces a map update, which plots a point
              });
    }

}
