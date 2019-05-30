import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpMappedService, vtInfoService } from '@app/_services';
import * as Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/

@Component({templateUrl: 'vpmap.create.component.html'})
export class vpMapCreateComponent implements OnInit {
    update = false; //flag for html config that this is create (vpmap.create.component.html is used by vpmap.create..ts and vpmap.update..ts)
    userIsAdmin = false;
    vpMappedForm: FormGroup;
    locUncs = [50, 100, '>100']; //https://angular.io/api/forms/SelectControlValueAccessor
    towns = [];
    townCount = 0;
    dataLoading = false;
    submitted = false;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private vpMappedService: vpMappedService,
        private townService: vtInfoService
    ) {
      if (this.authenticationService.currentUserValue) {
        let currentUser = this.authenticationService.currentUserValue.user;
        console.log('vpmap.view.component.ngOnInit | currentUser.userrole:', currentUser.userrole);
        this.userIsAdmin = currentUser.userrole == 'admin';
      } else {
        this.userIsAdmin = false;
        // redirect to pool search if user not logged-in
        this.router.navigate(['/pools/mapped/list']);
      }
      this.loadTowns();
    }

    ngOnInit() {
        this.vpMappedForm = this.formBuilder.group({

            mappedPoolId: [`${this.authenticationService.currentUserValue.user.username}1`, Validators.required],
            //mappedByUser: [{value: this.authenticationService.currentUserValue.user.username, disabled: true}, Validators.required],
            mappedByUser: [this.authenticationService.currentUserValue.user.username, Validators.required],
            mappedDateText: [Moment().format('MM/DD/YYYY'), Validators.required],
            mappedLatitude: ['43.5', Validators.required],
            mappedLongitude: ['-72', Validators.required],

            mappedTown: [{townId: 0, townName: 'Unknown'}, new FormControl(this.towns[this.townCount])],
            mappedTownId: [],
            mappedLandownerKnown: [false, Validators.nullValidator],
            mappedLandownerInfo: ['', Validators.nullValidator],
            mappedLocationUncertainty: [50, new FormControl(this.locUncs[3], Validators.required)],
            mappedComments: ['', Validators.nullValidator],
        });
    }

    // convenience getter for easy access to form fields
    get f() { return this.vpMappedForm.controls; }

    onSubmit() {

        console.log(`vpmap.create.onSubmit`);

        this.submitted = true;

        //kluge to get around disabled fields not being included in form values
        //and not having an easy validator for requiring mappedByUser = logon user
        if (this.vpMappedForm.value.mappedByUser != this.authenticationService.currentUserValue.user.username) {
          this.alertService.error("Mapped By User must be your username.");
          return;
        }

        if (Number(this.vpMappedForm.value.mappedLatitude) < 42.3 || Number(this.vpMappedForm.value.mappedLatitude) > 45.1) {
          this.alertService.error("Latitude must be between 42.3 and 45.1 to be in Vermont.");
          return;
        }

        if (Number(this.vpMappedForm.value.mappedLongitude) > -71.5 || Number(this.vpMappedForm.value.mappedLongitude) < -73.5) {
          this.alertService.error("Longitude must be between 71.5 and 73.5 to be in Vermont.");
          return;
        }

        if (this.vpMappedForm.value.mappedLocationUncertainty == '>100') {
          this.vpMappedForm.value.mappedLocationUncertainty = 500;
        }

        if (Number(this.vpMappedForm.value.mappedLocationUncertainty) < 50) {
          this.alertService.error("Please enter Location Uncertainty.");
          return;
        }

        console.log('vpmap.create.component.onSubmit | mappedTown',this.vpMappedForm.value.mappedTown);
        //our method to extract townId from townObject is to have a non-display formControl and
        //assign its value here. the API expects a db column name with a single value, and we
        //choose to add that complexity here rather than parse requests in API code.
        this.vpMappedForm.value.mappedTownId = this.vpMappedForm.value.mappedTown.townId;

        // stop here if form is invalid
        if (this.vpMappedForm.invalid) {
          console.log(`vpMappedForm.invalid`);
            return;
        }

        this.dataLoading = true;
        this.vpMappedService.create(this.vpMappedForm.value)
            .pipe(first())
            .subscribe(
                data => {
                    console.log(`vpmap.create=>data:`, data);
                    this.alertService.success('Successfully mapped vernal pool.', true);
                    this.dataLoading = false;
                    this.router.navigate([`/pools/mapped/view/${data.rows[0].mappedPoolId}`]);
                },
                error => {
                    console.log(`vpmap.create=>error: ${error}`);
                    this.alertService.error(error);
                    this.dataLoading = false;
                });
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

}
