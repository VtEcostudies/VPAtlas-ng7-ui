import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpMappedService, vtInfoService } from '@app/_services';
import Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/
import L from "leaflet";
import { vpMapped } from '@app/_models';
import { vtTown } from '@app/_models';
import { EmailOrPhone } from '@app/_helpers/email-or-phone.validator';

@Component({templateUrl: 'vpmap.component.html'})
export class vpMapCreateComponent implements OnInit {
    update = false; //flag for html config that this is create (vpmap.create.component.html is used by vpmap.create..ts and vpmap.update..ts)
    currentUser = null;
    userIsAdmin = false;
    vpLandOwnForm: FormGroup;
    vpMappedForm: FormGroup;
    locUncs = ['10', '50', '100', '>100']; //https://angular.io/api/forms/SelectControlValueAccessor
    methods = ['Aerial', 'Known', 'Visit', 'Survey']; //https://angular.io/api/forms/SelectControlValueAccessor
    statuses = ['Potential', 'Probable', 'Confirmed', 'Eliminated', 'Duplicate'];
    towns = [];
    townCount = 0;
    dataLoading = false;
    submitted = false;
    permission = false;
    poolId = null;
    mapPoints = false; //flag to plot pools on map as circleMarkers, passed to map via [mapPoints]="mapPoints"
    pool: vpMapped = new vpMapped();
    poolUpdateLocation = new L.LatLng(43.6962, -72.3197);
    mapMarker = true; //flag to show marker, passed to map via [mapMarker]="mapMarker"- marker is moved to provide lat/long values via emitted events
    locMarker = null; //data to locate marker, passed to map via [locMarker]="locMarker"- marker location is plotted from these values
    itemType = "Edit Mapped Pool";
    viewOnly = false; //flag that this is edit-mode (update or create)

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private vpMappedService: vpMappedService,
        private townService: vtInfoService
    ) {
      if (this.authenticationService.currentUserValue) {
        this.currentUser = this.authenticationService.currentUserValue.user;
        this.userIsAdmin = this.currentUser.userrole == 'admin';
      } else {
        // redirect to pool search if user not logged-in
        this.router.navigate(['/pools/mapped/list']);
      }
      this.loadTowns();
    }

    ngOnInit() {
      this.authenticationService.check();

      //get mappedPoolId from route params and load pool data from db
      console.log('vpmap.create.ngOnInit route.snapshot params: ', this.route.snapshot.params.mappedPoolId);
      this.poolId = this.route.snapshot.params.mappedPoolId;

      if (this.poolId) {
        this.update = true;
        this.loadPage(this.poolId);
      } else { //Adding new pool...
        this.update = false;
        this.pool.mappedPoolId = 'NEW*'; //`${this.authenticationService.currentUserValue.user.username}1`;
        this.pool.mappedByUser = this.authenticationService.currentUserValue.user.username;
        this.pool.mappedObserverUserName = this.authenticationService.currentUserValue.user.username;
        this.pool.mappedDateText = Moment().format('YYYY-MM-DD');
        this.pool.mappedLatitude = 43.916944;
        this.pool.mappedLongitude = -72.668056;
        //this.pool.mappedTown = new vtTown(); //instantiates town object to enable default value for town drop-down
        this.pool.mappedPoolStatus = 'Potential';
      }

      //create a separate form for landowner data, to be nested within vpMappedForm
      this.vpLandOwnForm = this.formBuilder.group({
        mappedLandownerName: [{value: '', disabled: false}, Validators.required],
        mappedLandownerAddress: ['', Validators.nullValidator],
        //mappedLandownerTown: [{value: '', disabled: false}, Validators.nullValidator],
        //mappedLandownerStateAbbrev: [{value: '', disabled: false}, Validators.nullValidator],
        //mappedLandownerZip5: [{value: '', disabled: false}, Validators.nullValidator],
        mappedLandownerPhone: ['', Validators.nullValidator],
        mappedLandownerEmail: ['', Validators.email], //flip to enabled if Permission
      });
      /*
      , { //this was created but the designers decided NOT to use it. leave it here in case it regains favor.
          validator: EmailOrPhone('mappedLandownerPhone', 'mappedLandownerEmail')
      });
      */

      this.vpMappedForm = this.formBuilder.group({

        mappedPoolId: [this.pool.mappedPoolId, Validators.required],
        mappedByUser: [{value: this.pool.mappedByUser, disabled: true}, Validators.required],
        mappedObserverUserName: [this.pool.mappedObserverUserName, Validators.required],
        mappedDateText: [Moment(this.pool.mappedDateText).format('YYYY-MM-DD'), Validators.required],
        mappedLatitude: [this.pool.mappedLatitude, Validators.required],
        mappedLongitude: [this.pool.mappedLongitude, Validators.required],
        //mappedTown: [this.pool.mappedTown, new FormControl(this.towns[this.townCount])],
        mappedTownId: [this.pool.mappedTownId], //non-display field set when the form is submitted
        mappedLandownerPermission: [this.pool.mappedLandownerPermission, Validators.nullValidator],

        mappedLandowner: [{disabled: true}, this.vpLandOwnForm],

        mappedLandownerInfo: ['', Validators.nullValidator],
        mappedLocationUncertainty: ['50', new FormControl(this.locUncs[4], Validators.required)],
        mappedMethod: ['Visit', new FormControl(this.methods[4], Validators.required)],
        mappedPoolStatus: ['Potential', new FormControl(this.statuses[5], Validators.required)],
        mappedComments: ['', Validators.nullValidator],
      });
      //Reactive form controls cannot be properly disabled with markup
      if (!this.userIsAdmin) {this.vpMappedForm.get('mappedPoolStatus').disable();}

      //how to handle UI changes from checkbox input:
      //https://www.infragistics.com/community/blogs/b/infragistics/posts/how-to-do-conditional-validation-on-valuechanges-methods-in-angular-reactive-forms-
      this.formControlValueChanged();
    }

    poolMapUpdate(poolLoc: L.LatLng) {
      this.poolUpdateLocation = poolLoc;
      this.vpMappedForm.controls['mappedLatitude'].setValue(poolLoc.lat);
      this.vpMappedForm.controls['mappedLongitude'].setValue(poolLoc.lng);
    }

    // convenience getter for easy access to form fields
    get f() { return this.vpMappedForm.controls; }

    // convenience getter for easy access to form fields
    get l() { return this.vpLandOwnForm.controls; }

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

      //https://angular.io/api/forms/SelectControlValueAccessor#customizing-option-selection
      //https://www.concretepage.com/angular/angular-select-option-reactive-form#comparewith
      //this.vpMappedForm.controls['mappedTown'].setValue(this.pool.mappedTown);
      this.vpMappedForm.controls['mappedLandownerPermission'].setValue(this.pool.mappedLandownerPermission);

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

      /* these fields are not displayed on new pool entry
      this.vpMappedForm.controls['mappedSource'].setValue(this.pool.mappedSource);
      this.vpMappedForm.controls['mappedSource2'].setValue(this.pool.mappedSource2);
      this.vpMappedForm.controls['mappedPhotoNumber'].setValue(this.pool.mappedPhotoNumber);
      this.vpMappedForm.controls['mappedShape'].setValue(this.pool.mappedShape);
      */

      //On update, disable mappedPoolId and mappedByUser, which will prevent their being altered and exclude
      //them from the formGroup values.
      if (this.update) {
        this.vpMappedForm.get('mappedPoolId').disable();
        this.vpMappedForm.get('mappedByUser').disable();
      }

      console.dir(this.vpMappedForm.getRawValue());
    }

    /*
      On update, load an existing pool and populate the fields
    */
    loadPage(mappedPoolId) {
      this.dataLoading = true;
      console.log('vpmpap.create.component.loadPage:', mappedPoolId);
      this.vpMappedService.getById(mappedPoolId)
          .pipe(first())
          .subscribe(
              data => {
                console.log('vpmap.create.component.loadPage result:', data);
                this.pool = data.rows[0];
                this.locMarker = {poolId: this.pool.mappedPoolId, latitude: this.pool.latitude, longitude: this.pool.longitude};
                this.dataLoading = false; //this forces a map update, which plots a point
                this.afterLoad(); //update form fields with values loaded from db
              },
              error => {
                  this.alertService.error(error);
                  this.dataLoading = false;
              });
    }

    onSubmit() {

        console.log(`vpmap.create.onSubmit`);

        this.submitted = true;

        //kluge to get around disabled fields not being included in form values
        //and not having an easy validator for requiring mappedByUser = logon user
        if (!this.update && this.vpMappedForm.getRawValue().mappedByUser != this.authenticationService.currentUserValue.user.username) {
          this.alertService.error("Mapped By User must be your username.");
          return;
        }
/*
        if (Number(this.vpMappedForm.value.mappedLatitude) < 42.3 || Number(this.vpMappedForm.value.mappedLatitude) > 45.1) {
          this.alertService.error("Latitude must be between 42.3 and 45.1 to be in Vermont.");
          return;
        }

        if (Number(this.vpMappedForm.value.mappedLongitude) > -71.5 || Number(this.vpMappedForm.value.mappedLongitude) < -73.5) {
          this.alertService.error("Longitude must be between 71.5 and 73.5 to be in Vermont.");
          return;
        }
*/
        if (!this.vpMappedForm.value.mappedMethod) {
          this.alertService.error("Please enter Mapped Method.");
          return;
        }

        if (!this.vpMappedForm.value.mappedLocationUncertainty) {
          this.alertService.error("Please enter Location Uncertainty.");
          return;
        }

        //console.log('vpmap.create.component.onSubmit | mappedTown',this.vpMappedForm.value.mappedTown);
        //our method to extract townId from townObject is to have a non-display formControl and
        //assign its value here. the API expects a db column name with a single value, and we
        //choose to add that complexity here rather than parse requests in API code.
        //this.vpMappedForm.get("mappedTownId").setValue(this.vpMappedForm.value.mappedTown.townId);
        this.vpMappedForm.get("mappedTownId").setValue(0);

        // stop here if form is invalid
        if (this.vpMappedForm.invalid) {
          console.log(`vpMappedForm.invalid`);
          return;
        }
        // stop here if form is invalid
        if (this.permission && this.vpLandOwnForm.invalid) {
          console.log(`vpLandOwnForm.invalid`);
          return;
        }

        //flatten the object before posting. the mappedLandowner nested form
        //is passed, but the API can't parse it. (to-do: handle that?)
        if (this.vpMappedForm.value.mappedLandownerPermission) {
          Object.assign(this.vpMappedForm.value, this.vpLandOwnForm.value);
          delete this.vpMappedForm.value.mappedLandowner;
        }

        this.dataLoading = true;
        this.vpMappedService.createOrUpdate(this.update, this.poolId, this.vpMappedForm.getRawValue())
            .pipe(first())
            .subscribe(
                data => {
                    console.log(`vpmap.create=>data:`, data);
                    if (this.update) {
                      this.alertService.success(`Successfully updated vernal pool ${this.poolId}.`, true);
                    } else {
                      this.alertService.success('Successfully mapped vernal pool.', true);
                    }
                    this.dataLoading = false;
                    if (data.rows[0]) {this.poolId = data.rows[0].mappedPoolId;}
                    //else {this.poolId = this.vpMappedForm.value.mappedPoolId}
                    this.router.navigate([`/pools/mapped/view/${this.poolId}`]);
                },
                error => {
                    console.log(`vpmap.create=>error: ${error}`);
                    this.alertService.error(error);
                    this.dataLoading = false;
                });
    }

    cancelMappedPool() {
      var navUrl = null;
      var msgTxt = null;

      if (this.update) {
        msgTxt = `edits to Pool ${this.poolId}`
        navUrl = `/pools/mapped/view/${this.poolId}`;
      } else {
        msgTxt = `creation of a New Pool`;
        navUrl = `/pools/mapped/list`;
      }

      if (confirm(`Are you sure you want to cancel ${msgTxt}?`)) {
        this.router.navigate([navUrl]);
      } else {
        console.log('Mapped Pool NOT cancelled');
      }
    }

    deletePool() {
      if (confirm(`Are you sure you want to delete pool ${this.pool.mappedPoolId}?`)) {
        this.vpMappedService.delete(this.pool.mappedPoolId)
          .pipe(first())
          .subscribe(
              data => {
                  console.log(`vpmap.create.deletePool=>data:`, data);
                  this.alertService.success('Successfully deleted vernal pool.', true);
                  this.router.navigate([`/pools/mapped/list`]);
              },
              error => {
                  console.log(`vpmap.create.deletePool=>error: `, error);
                  this.alertService.error(error);
                  this.dataLoading = false;
              });
      }
    }

  private loadTowns() {
    this.dataLoading = true;
    this.townService.getTowns()
        .pipe(first())
        .subscribe(
            data => {
              this.towns = data.rows;
              this.townCount = data.rowCount;
              this.dataLoading = false;
            },
            error => {
              this.alertService.error(error);
              this.dataLoading = false;
            });
  }

  //https://angular.io/api/forms/SelectControlValueAccessor#customizing-option-selection
  //https://www.concretepage.com/angular/angular-select-option-reactive-form#comparewith
  compareTownFn(t1: vtTown, t2: vtTown) {
    //console.log('vpmap.create.compareTownFn t1:', t1, ' t2:', t2);
    return t1 && t2 ? t1.townId === t2.townId : t1 === t2;
  }

  //how to handle UI changes from checkbox input:
  //https://blog.grossman.io/real-world-angular-reactive-forms/
  //https://netbasal.com/angular-custom-form-controls-made-easy-4f963341c8e2
  //https://www.technouz.com/4725/disable-angular-reactiveform-input-based-selection/
  //https://www.infragistics.com/community/blogs/b/infragistics/posts/how-to-do-conditional-validation-on-valuechanges-method-in-angular-reactive-forms-
  formControlValueChanged() {
    this.vpMappedForm.get('mappedLandownerPermission').valueChanges.subscribe(
      (mode: boolean) => {
      this.permission = mode;

      if (this.permission) {
        this.vpMappedForm.get('mappedLandowner').enable();
      } else {
        this.vpMappedForm.get('mappedLandowner').disable();
      }
    });
  }

}
