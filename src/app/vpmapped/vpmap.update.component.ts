import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AlertService, AuthenticationService, vpMappedService, vtInfoService } from '@app/_services';

import { vpMapped } from '@app/_models';
import { vtTown } from '@app/_models';

@Component({templateUrl: 'vpmap.create.component.html'}) //attempt to reuse the create html. it's all the same
export class vpMapUpdateComponent implements OnInit {
    update = true; //flag for html config that this is update (vpmap.create.component.html is used by vpmap.create..ts and vpmap.update..ts)
    currentUser = null;
    userIsAdmin = false;
    vpMappedForm: FormGroup;
    dataLoading = false;
    submitted = false;
    poolId = null;
    pool: vpMapped;
    locUncs = [50, 100, '>100'];
    towns = [];
    townCount = 0;

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
        console.log('vpmap.view.component.ngOnInit | currentUser.userrole:', this.currentUser.userrole);
        this.userIsAdmin = this.currentUser.userrole == 'admin';
      } else { this.userIsAdmin = false;}
       // redirect to pool search if user not admin
       // TO-DO: non-admin users can *edit* the pools they've created. Do that check upon load of a pool,
       // later. Again, if vpmapped.createdByUser != currentUser.user.username, navigate away from this page.
      if (!this.userIsAdmin) {
        this.router.navigate(['/pools/mapped/list']);
      }
      this.loadTowns();
    }

    ngOnInit() {

      //get mappedPoolId from route params and load pool data from db
      console.log('vpmap.update.ngOnInit route.snapshot params: ', this.route.snapshot.params.mappedPoolId);
      this.loadPage(this.route.snapshot.params.mappedPoolId);
      this.poolId = this.route.snapshot.params.mappedPoolId;

      this.vpMappedForm = this.formBuilder.group({
          mappedPoolId: [{value: this.poolId, disabled: true}, Validators.required],
          mappedByUser: ['', Validators.required],
          mappedDateText: ['', Validators.required],
          mappedLatitude: ['', Validators.required],
          mappedLongitude: ['', Validators.required],

          mappedTown: new FormControl(this.towns[this.townCount]),
          mappedTownId: [],
          mappedLandownerKnown: [Validators.nullValidator],
          mappedLandownerInfo: [Validators.nullValidator],
          mappedLocationUncertainty: new FormControl(this.locUncs[3]),
          mappedComments: [Validators.nullValidator],
          /*
          mappedLocationAccuracy: ['', Validators.required],
          mappedSource: ['', Validators.required],
          mappedSource2: ['', Validators.nullValidator],
          mappedPhotoNumber: ['', Validators.nullValidator],
          mappedShape: ['', Validators.nullValidator],
          mappedComments: ['', Validators.nullValidator],
          */
      });
    }

    /*
      Update form fields with values loaded from db.
    */
    afterLoad() {
      //this.vpMappedForm.controls['mappedPoolId'].setValue(this.pool.mappedPoolId);
      this.vpMappedForm.controls['mappedByUser'].setValue(this.pool.mappedByUser);
      this.vpMappedForm.controls['mappedDateText'].setValue(this.pool.mappedDateText);
      this.vpMappedForm.controls['mappedLatitude'].setValue(this.pool.mappedLatitude);
      this.vpMappedForm.controls['mappedLongitude'].setValue(this.pool.mappedLongitude);

      //https://angular.io/api/forms/SelectControlValueAccessor#customizing-option-selection
      //https://www.concretepage.com/angular/angular-select-option-reactive-form#comparewith
      this.vpMappedForm.controls['mappedTown'].setValue(this.pool.mappedTown);
      this.vpMappedForm.controls['mappedLandownerKnown'].setValue(this.pool.mappedLandownerKnown);
      this.vpMappedForm.controls['mappedLandownerInfo'].setValue(this.pool.mappedLandownerInfo);
      this.vpMappedForm.controls['mappedLocationUncertainty'].setValue(this.pool.mappedLocationUncertainty);
      this.vpMappedForm.controls['mappedComments'].setValue(this.pool.mappedComments);
      /*
      this.vpMappedForm.controls['mappedSource'].setValue(this.pool.mappedSource);
      this.vpMappedForm.controls['mappedSource2'].setValue(this.pool.mappedSource2);
      this.vpMappedForm.controls['mappedPhotoNumber'].setValue(this.pool.mappedPhotoNumber);
      this.vpMappedForm.controls['mappedShape'].setValue(this.pool.mappedShape);
      */

      console.dir(this.vpMappedForm.value);
    }

    loadPage(mappedPoolId) {
      this.dataLoading = true;
      console.log('vpmpap.update.component.loadPage:', mappedPoolId);
      this.vpMappedService.getById(mappedPoolId)
          .pipe(first())
          .subscribe(
              data => {
                console.log('vpmap.update.component.loadPage result:', data);
                this.pool = data.rows[0];
                this.dataLoading = false; //this forces a map update, which plots a point
                this.afterLoad(); //update form fields with values loaded from db
              },
              error => {
                  this.alertService.error(error);
                  this.dataLoading = false;
              });

    }

    // convenience getter for easy access to form fields
    get f() { return this.vpMappedForm.controls; }

    onSubmit() {

        console.log(`vpmap.update.onSubmit`);

        this.submitted = true;

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
        this.vpMappedService.update(this.pool.mappedPoolId, this.vpMappedForm.value)
            .pipe(first())
            .subscribe(
                data => {
                    console.log(`vpmap.update=>data ${data}`);
                    this.alertService.success('Successfully updated vernal pool.', true);
                    this.router.navigate([`/pools/mapped/view/${this.pool.mappedPoolId}`]);
                },
                error => {
                    console.log(`vpmap.update=>error: ${error}`);
                    this.alertService.error(error);
                    this.dataLoading = false;
                });
    }

    deletePool() {
      if (confirm(`Are you sure you want to delete pool ${this.pool.mappedPoolId}?`)) {
        this.vpMappedService.delete(this.pool.mappedPoolId)
          .pipe(first())
          .subscribe(
              data => {
                  console.log(`vpmap.delete=>data ${data}`);
                  this.alertService.success('Successfully deleted vernal pool.', true);
                  this.router.navigate([`/pools/mapped/list`]);
              },
              error => {
                  console.log(`vpmap.update=>error: ${error}`);
                  this.alertService.error(error);
                  this.dataLoading = false;
              });
      }
    }

    //https://angular.io/api/forms/SelectControlValueAccessor#customizing-option-selection
    //https://www.concretepage.com/angular/angular-select-option-reactive-form#comparewith
    compareTownFn(t1: vtTown, t2: vtTown) {
      //console.log('compareTownFn t1:', t1, ' t2:', t2);
      return t1 && t2 ? t1.townId === t2.townId : t1 === t2;
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
}
