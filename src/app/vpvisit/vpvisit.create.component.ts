import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpVisitService, vtInfoService } from '@app/_services';
import * as Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/
import * as L from "leaflet";
import { vpVisit } from '@app/_models';
import { vtTown } from '@app/_models';

@Component({templateUrl: 'vpvisit.create.component.html'})
export class vpVisitCreateComponent implements OnInit {
    update = false; //flag for html config that this is create (vpvisit.create.component.html is used by vpvisit.create..ts and vpvisit.update..ts)
    userIsAdmin = false;
    vpLandOwnForm: FormGroup;
    vpVisitForm: FormGroup;
    towns = [];
    townCount = 0;
    dataLoading = false;
    submitted = false;
    visitId = null;
    visit: vpVisit = new vpVisit();
    visitUpdateLocation = new L.LatLng(43.6962, -72.3197);
    mapMarker = true;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private vpVisitService: vpVisitService,
        private townService: vtInfoService
    ) {
      if (this.authenticationService.currentUserValue) {
        let currentUser = this.authenticationService.currentUserValue.user;
        console.log('vpvisit.create.component.ngOnInit | currentUser.userrole:', currentUser.userrole);
        this.userIsAdmin = currentUser.userrole == 'admin';
      } else {
        this.userIsAdmin = false;
        // redirect to visit search if user not logged-in
        this.router.navigate(['/visits/visit/list']);
      }
      this.loadTowns();
    }

    ngOnInit() {

      //get visitId from route params and load visit data from db
      console.log('vpvisit.create.ngOnInit route.snapshot params: ', this.route.snapshot.params.visitId);
      this.visitId = this.route.snapshot.params.visitId;

      if (this.visitId) {
        this.update = true;
        this.loadPage(this.visitId);
      } else {
        this.update = false;
        this.visit.visitUserName = this.authenticationService.currentUserValue.user.username;
        this.visit.visitDate = Moment().format('MM/DD/YYYY');
        this.visit.visitLatitude = 43.916944;
        this.visit.visitLongitude = -72.668056;
      }

      //create a separate form for landowner data, to be nested within vpVisitForm
      this.vpLandOwnForm = this.formBuilder.group({
        visitLandownerName: [{value: '', disabled: false}, Validators.required], //flip to enabled if Permission
        visitLandownerAddress: [{value: '', disabled: false}, Validators.required], //flip to enabled if Permission
        visitLandownerTown: [{value: '', disabled: false}, Validators.required], //flip to enabled if Permission
        visitLandownerStateAbbrev: [{value: '', disabled: false}, Validators.required], //flip to enabled if Permission
        visitLandownerZip5: [{value: '', disabled: false}, Validators.required], //flip to enabled if Permission
        visitLandownerPhone: [{value: '', disabled: false}, Validators.required], //flip to enabled if Permission
        visitLandownerEmail: [{value: '', disabled: false}, Validators.required], //flip to enabled if Permission
      });

      this.vpVisitForm = this.formBuilder.group({

        visitId: [this.visit.visitId, Validators.required],
        visitUserName: [this.visit.visitUserName, Validators.required],
        visitDate: [this.visit.visitDate, Validators.required],
        visitLatitude: [this.visit.visitLatitude, Validators.required],
        visitLongitude: [this.visit.visitLongitude, Validators.required],
        visitTown: [this.visit.visitTown, new FormControl(this.towns[this.townCount])],
/*
        visitTownId: [this.visit.visitTownId], //non-display field set when the form is submitted
        visitLandownerPermission: [this.visit.visitLandownerPermission, Validators.nullValidator],

        visitLandowner: [{disabled: true}, this.vpLandOwnForm],

        visitLandownerInfo: ['', Validators.nullValidator],
        visitLocationUncertainty: ['50', new FormControl(this.locUncs[3], Validators.required)],
        visitComments: ['', Validators.nullValidator],
*/
      });

      //how to handle UI changes from checkbox input:
      //https://www.infragistics.com/community/blogs/b/infragistics/posts/how-to-do-conditional-validation-on-valuechanges-method-in-angular-reactive-forms-
      this.formControlValueChanged();
    }

    visitMapUpdate(visitLoc: L.LatLng) {
      this.visitUpdateLocation = visitLoc;
      this.vpVisitForm.controls['visitLatitude'].setValue(visitLoc.lat);
      this.vpVisitForm.controls['visitLongitude'].setValue(visitLoc.lng);
    }

    // convenience getter for easy access to form fields
    get f() { return this.vpVisitForm.controls; }

    // convenience getter for easy access to form fields
    get l() { return this.vpLandOwnForm.controls; }

    /*
      Update form fields with values loaded from db.
      // TODO: make this work in one line of code with an object
    */
    afterLoad() {
      this.vpVisitForm.controls['visitId'].setValue(this.visit.visitId);
      this.vpVisitForm.controls['visitUserName'].setValue(this.visit.visitUserName);
      this.vpVisitForm.controls['visitDate'].setValue(this.visit.visitDate);
      this.vpVisitForm.controls['visitLatitude'].setValue(this.visit.visitLatitude);
      this.vpVisitForm.controls['visitLongitude'].setValue(this.visit.visitLongitude);

      //https://angular.io/api/forms/SelectControlValueAccessor#customizing-option-selection
      //https://www.concretepage.com/angular/angular-select-option-reactive-form#comparewith
      this.vpVisitForm.controls['visitTown'].setValue(this.visit.visitTown);
/*
      this.vpVisitForm.controls['visitLandownerPermission'].setValue(this.visit.visitLandownerPermission);

      this.vpLandOwnForm.controls['visitLandownerName'].setValue(this.visit.visitLandownerName);
      this.vpLandOwnForm.controls['visitLandownerAddress'].setValue(this.visit.visitLandownerAddress);
      this.vpLandOwnForm.controls['visitLandownerTown'].setValue(this.visit.visitLandownerTown);
      this.vpLandOwnForm.controls['visitLandownerStateAbbrev'].setValue(this.visit.visitLandownerStateAbbrev);
      this.vpLandOwnForm.controls['visitLandownerZip5'].setValue(this.visit.visitLandownerZip5);
      this.vpLandOwnForm.controls['visitLandownerPhone'].setValue(this.visit.visitLandownerPhone);
      this.vpLandOwnForm.controls['visitLandownerEmail'].setValue(this.visit.visitLandownerEmail);

      this.vpVisitForm.controls['visitLandownerInfo'].setValue(this.visit.visitLandownerInfo);
      this.vpVisitForm.controls['visitLocationUncertainty'].setValue(this.visit.visitLocationUncertainty);
      this.vpVisitForm.controls['visitComments'].setValue(this.visit.visitComments);
*/
      //On update, disable visitUser, which will prevent its being altered and exclude
      //it from the formGroup values.
      if (this.update) {
        this.vpVisitForm.get('visitId').disable();
        this.vpVisitForm.get('visitUser').disable();
      }

      console.dir(this.vpVisitForm.value);
    }

    /*
      On update, load an existing visit and populate the fields
    */
    loadPage(visitId) {
      this.dataLoading = true;
      console.log('vpvisit.create.component.loadPage:', visitId);
      this.vpVisitService.getById(visitId)
          .pipe(first())
          .subscribe(
              data => {
                console.log('vpvisit.create.component.loadPage result:', data);
                this.visit = data.rows[0];
                this.dataLoading = false; //this forces a map update, which plots a point
                this.afterLoad(); //update form fields with values loaded from db
              },
              error => {
                  this.alertService.error(error);
                  this.dataLoading = false;
              });

    }

    onSubmit() {

        console.log(`vpvisit.create.onSubmit`);

        this.submitted = true;

        //kluge to get around disabled fields not being included in form values
        //and not having an easy validator for requiring visitUser = logon user
        if (!this.update && this.vpVisitForm.value.visitUser != this.authenticationService.currentUserValue.user.username) {
          this.alertService.error("Visit User must be your username.");
          return;
        }

        if (Number(this.vpVisitForm.value.visitLatitude) < 42.3 || Number(this.vpVisitForm.value.visitLatitude) > 45.1) {
          this.alertService.error("Latitude must be between 42.3 and 45.1 to be in Vermont.");
          return;
        }

        if (Number(this.vpVisitForm.value.visitLongitude) > -71.5 || Number(this.vpVisitForm.value.visitLongitude) < -73.5) {
          this.alertService.error("Longitude must be between 71.5 and 73.5 to be in Vermont.");
          return;
        }

        //console.log('vpvisit.create.component.onSubmit | visitTown',this.vpVisitForm.value.visitTown);
        //our method to extract townId from townObject is to have a non-display formControl and
        //assign its value here. the API expects a db column name with a single value, and we
        //choose to add that complexity here rather than parse requests in API code.
        this.vpVisitForm.value.visitTownId = this.vpVisitForm.value.visitTown.townId;

        // stop here if form is invalid
        if (this.vpVisitForm.invalid) {
          console.log(`vpVisitForm.invalid`);
          return;
        }

        //flatten the object before posting. the visitLandowner nested form
        //is passed, but the API can't parse it. (to-do: handle that?)
        if (this.vpVisitForm.value.visitLandownerPermission) {
          Object.assign(this.vpVisitForm.value, this.vpLandOwnForm.value);
          delete this.vpVisitForm.value.visitLandowner;
        }

        this.dataLoading = true;
        this.vpVisitService.createOrUpdate(this.update, this.visitId, this.vpVisitForm.value)
            .pipe(first())
            .subscribe(
                data => {
                    console.log(`vpvisit.create=>data:`, data);
                    this.alertService.success('Successfully visit vernal visit.', true);
                    this.dataLoading = false;
                    if (data.rows[0]) {this.visitId = data.rows[0].visitId;}
                    else {this.visitId = this.vpVisitForm.value.visitId}
                    this.router.navigate([`/visits/visit/view/${this.visitId}`]);
                },
                error => {
                    console.log(`vpvisit.create=>error: ${error}`);
                    this.alertService.error(error);
                    this.dataLoading = false;
                });
    }

    deleteVisit() {
      if (confirm(`Are you sure you want to delete visit ${this.visit.visitId}?`)) {
        this.vpVisitService.delete(this.visit.visitId)
          .pipe(first())
          .subscribe(
              data => {
                  console.log(`vpvisit.create.deleteVisit=>data:`, data);
                  this.alertService.success('Successfully deleted vernal visit.', true);
                  this.router.navigate([`/visits/visit/list`]);
              },
              error => {
                  console.log(`vpvisit.create.deleteVisit=>error: `, error);
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
    //console.log('compareTownFn t1:', t1, ' t2:', t2);
    return t1 && t2 ? t1.townId === t2.townId : t1 === t2;
  }

  //how to handle UI changes from checkbox input:
  //https://blog.grossman.io/real-world-angular-reactive-forms/
  //https://netbasal.com/angular-custom-form-controls-made-easy-4f963341c8e2
  //https://www.technouz.com/4725/disable-angular-reactiveform-input-based-selection/
  //https://www.infragistics.com/community/blogs/b/infragistics/posts/how-to-do-conditional-validation-on-valuechanges-method-in-angular-reactive-forms-

  formControlValueChanged() {
/*
    this.vpVisitForm.get('visitLandownerPermission').valueChanges.subscribe(
      (mode: boolean) => {
      this.permission = mode;

      if (this.permission) {
        this.vpVisitForm.get('visitLandowner').enable();
      } else {
        this.vpVisitForm.get('visitLandowner').disable();
      }
    });
*/
  }

}
