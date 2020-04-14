import { Injectable } from '@angular/core';
﻿import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { vpVisit } from '@app/_models';
import { AlertService, AuthenticationService, vpVisitService } from '@app/_services';
import Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/
import { LeafletComponent } from '@app/_components/leaflet.component';
import { ModalService } from '@app/_modal';

@Component({
  selector: 'visit-view',
  templateUrl: 'vpvisit.view.component.html'
})
export class vpVisitViewComponent implements OnInit {
    visitUser = null;
    userIsAdmin = false;
    vpVisitForm: FormGroup;
    dataLoading = false;
    //visit: vpVisit = new vpVisit();
    visit: any = new vpVisit(); //cast thype to any to prevent typeScript build errors on fields not in vpVisit
    mapPoints = true; //flag to plot pools on map as circleMarkers, passed to map via [mapPoints]="mapPoints"
    itemType = 'Visit';
    modalText: string;
    modalTitle: string;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private vpVisitService: vpVisitService,
        private modalService: ModalService
    ) {}

    async ngOnInit() {
      if (this.authenticationService.currentUserValue) {
        this.visitUser = this.authenticationService.currentUserValue.user;
        console.log('vpvisit.view.ngOnInit() | currentUser.userrole:', this.visitUser.userrole);
        this.userIsAdmin = this.visitUser.userrole == 'admin';
      } else { this.userIsAdmin = false;}
      console.log('vpvisit.view.ngOnInit | route.snapshot params: ', this.route.snapshot.params.visitId);
      await this.loadPage(this.route.snapshot.params.visitId);
    }

    openModal(id: string, infoId=null) {
        //another way to set modal content - use static definitions in html tag
        this.modalTitle='Info'; //this can be a value passed to this function
        this.modalText=infoId;
        console.log('infoId', infoId);
        this.modalService.open(id, null);
    }

    closeModal(id: string) {
        this.modalService.close(id);
    }

    loadPage(visitId) {
      this.dataLoading = true; //this forces a map update, which plots a point
      console.log('vpvisit.view.loadPage() | visitId:', visitId);
      this.vpVisitService.getById(visitId)
          .pipe(first())
          .subscribe(
              data => {
                console.log('vpvisit.view.loadPage() result:', data);
                this.visit = data.rows[0]; //one-element array of pools used by mapView
                this.visit.visitDate = Moment(this.visit.visitDate);
                this.visit.visitUpdatedAt = Moment(this.visit.visitUpdatedAt);
                this.dataLoading = false; //this forces a map update, which plots a point
              },
              error => {
                  this.alertService.error(error);
                  this.dataLoading = false; //this forces a map update, which plots a point
              });
    }

}
