import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { vpMapped } from '@app/_models';
import { vtTown } from '@app/_models';
import { AlertService, AuthenticationService, vpMappedService } from '@app/_services';
import * as Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/

@Component({templateUrl: 'vpmap.create.component.html'})
export class vpMapViewComponent implements OnInit {
    currentUser = null;
    userIsAdmin = false;
    update = false;
    vpMappedForm: FormGroup;
    vpLandOwnForm: FormGroup;
    locUncs = ['10', '50', '100', '>100']; //https://angular.io/api/forms/SelectControlValueAccessor
    methods = ['Aerial', 'Known', 'Visited', 'Monitored']; //https://angular.io/api/forms/SelectControlValueAccessor
    statuses = ['Potential', 'Probable', 'Confirmed', 'Eliminated', 'Duplicate'];
    towns = [];
    townCount = 0;
    dataLoading = false;
    submitted = false;
    permission = false;
    mapPoints = true; //flag to plot pools on map as circleMarkers, passed to map via [mapPoints]="mapPoints"
    pool: vpMapped = new vpMapped(); //data to plot pool on map
    mapMarker = false; //flag to show/hide a moveable mapMarker. In view mode, this is always false.
    locMarker = null; //data to locate moveable mapMmarker, passed to map via [locMarker]="locMarker" - null when mapMarker not shown.
    itemType = "Mapped Pool";
    viewOnly = true; //flag that this is view-mode

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
        this.currentUser = this.authenticationService.currentUserValue.user;
        console.log('vpmap.view.component.ngOnInit | currentUser.userrole:', this.currentUser.userrole);
        this.userIsAdmin = this.currentUser.userrole == 'admin';
      } else { this.userIsAdmin = false;}
      console.log('vpmap.view.compoenent.ngOnInit | route.snapshot params: ', this.route.snapshot.params.mappedPoolId);
      this.pool.mappedTown = {townName:"Unknown", townId:0, townCountyId:0, townCentroid:null, townBorder:null}; //kluge to get around issue with class object vpMapped

      //create a separate form for landowner data, to be nested within vpMappedForm
      this.vpLandOwnForm = this.formBuilder.group({
        mappedLandownerName: [],
        mappedLandownerAddress: [],
        mappedLandownerPhone: [],
        mappedLandownerEmail: []
      });

      this.vpMappedForm = this.formBuilder.group({

        mappedPoolId: [],
        mappedByUser: [],
        mappedObserverUserName: [],
        mappedDateText: [],
        mappedLatitude: [],
        mappedLongitude: [],
        mappedTown: [],
        mappedLocationUncertainty: [],
        mappedMethod: [],
        mappedPoolStatus: [],
        mappedComments: [],
        mappedLandownerPermission: [],
        mappedLandowner: [{disabled: true}, this.vpLandOwnForm],
        mappedLandownerInfo: [],
      });

      //Reactive form controls cannot be properly disabled with markup
      this.vpMappedForm.disable();

      this.loadPage(this.route.snapshot.params.mappedPoolId);
    }

    /*
      Update form fields with values loaded from db.
    */
    afterLoad() {
      this.vpMappedForm.controls['mappedPoolId'].setValue(this.pool.mappedPoolId);
      this.vpMappedForm.controls['mappedByUser'].setValue(this.pool.mappedByUser);
      this.vpMappedForm.controls['mappedObserverUserName'].setValue(this.pool.mappedObserverUserName);
      this.vpMappedForm.controls['mappedDateText'].setValue(Moment(this.pool.mappedDateText).format('YYYY-MM-DD'));
      this.vpMappedForm.controls['mappedLatitude'].setValue(this.pool.mappedLatitude);
      this.vpMappedForm.controls['mappedLongitude'].setValue(this.pool.mappedLongitude);

      //kluge to create array of towns equal to one town
      this.towns = [{townName:this.pool.mappedTown.townName, townId:this.pool.mappedTown.townId}];
      this.townCount = 1;

      //https://angular.io/api/forms/SelectControlValueAccessor#customizing-option-selection
      //https://www.concretepage.com/angular/angular-select-option-reactive-form#comparewith
      this.vpMappedForm.controls['mappedTown'].setValue(this.pool.mappedTown);
      this.vpMappedForm.controls['mappedLandownerPermission'].setValue(this.pool.mappedLandownerPermission);

      this.permission = this.pool.mappedLandownerPermission;

      this.vpLandOwnForm.controls['mappedLandownerName'].setValue(this.pool.mappedLandownerName);
      this.vpLandOwnForm.controls['mappedLandownerAddress'].setValue(this.pool.mappedLandownerAddress);
      //this.vpLandOwnForm.controls['mappedLandownerTown'].setValue(this.pool.mappedLandownerTown);
      //this.vpLandOwnForm.controls['mappedLandownerStateAbbrev'].setValue(this.pool.mappedLandownerStateAbbrev);
      //this.vpLandOwnForm.controls['mappedLandownerZip5'].setValue(this.pool.mappedLandownerZip5);
      this.vpLandOwnForm.controls['mappedLandownerPhone'].setValue(this.pool.mappedLandownerPhone);
      this.vpLandOwnForm.controls['mappedLandownerEmail'].setValue(this.pool.mappedLandownerEmail);

      this.vpMappedForm.controls['mappedLandownerInfo'].setValue(this.pool.mappedLandownerInfo);
      this.vpMappedForm.controls['mappedLocationUncertainty'].setValue(this.pool.mappedLocationUncertainty);
      this.vpMappedForm.controls['mappedMethod'].setValue(this.pool.mappedMethod);
      this.vpMappedForm.controls['mappedPoolStatus'].setValue(this.pool.mappedPoolStatus);
      this.vpMappedForm.controls['mappedComments'].setValue(this.pool.mappedComments);
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
                //this.pool.mappedDateText = Moment(this.pool.mappedDateText) as any;
                //this.pool.updatedAt = Moment(this.pool.updatedAt) as any;
                this.dataLoading = false; //this forces a map update, which plots a point
                this.afterLoad();
              },
              error => {
                  this.alertService.error(error);
                  this.dataLoading = false; //this forces a map update, which plots a point
              });
    }

    // convenience getter for easy access to form fields
    get f() { return this.vpMappedForm.controls; }

    // convenience getter for easy access to form fields
    get l() { return this.vpLandOwnForm.controls; }

    cancelMappedPool() {
      this.router.navigate(['/pools/mapped/list']);
    }

    //https://angular.io/api/forms/SelectControlValueAccessor#customizing-option-selection
    //https://www.concretepage.com/angular/angular-select-option-reactive-form#comparewith
    compareTownFn(t1: vtTown, t2: vtTown) {
      //console.log('vpmap.create.compareTownFn t1:', t1, ' t2:', t2);
      return t1 && t2 ? t1.townId === t2.townId : t1 === t2;
    }

}
