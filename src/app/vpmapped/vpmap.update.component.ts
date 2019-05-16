import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AlertService, AuthenticationService, vpMappedService } from '@app/_services';

import { vpMapped } from '@app/_models';

@Component({templateUrl: 'vpmap.create.component.html'}) //attempt to reuse the create html. it's all the same
export class vpMapUpdateComponent implements OnInit {
    vpMappedForm: FormGroup;
    dataLoading = false;
    submitted = false;
    update = true;
    poolId = null;
    pool: vpMapped;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private vpMappedService: vpMappedService
    ) {
        // redirect to vpMapped if already logged in
        if (this.authenticationService.currentUserValue) {
            this.router.navigate(['/pools/mapped/update']);
        }
    }

    ngOnInit() {
      this.poolId = this.route.snapshot.params.mappedPoolId;
      console.log('vpmap.update.ngOnInit route.snapshot params: ', this.route.snapshot.params.mappedPoolId);
      this.loadPage(this.route.snapshot.params.mappedPoolId);

      this.vpMappedForm = this.formBuilder.group({
          mappedPoolId: [{value: this.poolId, disabled: true}, Validators.required],
          mappedByUser: ['', Validators.required],
          mappedSource: ['', Validators.required],
          mappedSource2: ['', Validators.required],
          mappedDateText: ['', Validators.required],
          mappedPhotoNumber: ['', Validators.required],
          mappedShape: ['', Validators.required],
          mappedConfidence: ['', Validators.required],
          mappedLocationAccuracy: ['', Validators.required],
          mappedComments: ['', Validators.required],
          mappedLatitude: ['', Validators.required],
          mappedLongitude: ['', Validators.required]
      });
    }

    afterLoad() {
      //this.vpMappedForm.controls['mappedPoolId'].setValue(this.pool.mappedPoolId);
      this.vpMappedForm.controls['mappedByUser'].setValue(this.pool.mappedByUser);
      this.vpMappedForm.controls['mappedSource'].setValue(this.pool.mappedSource);
      this.vpMappedForm.controls['mappedSource2'].setValue(this.pool.mappedSource2);
      this.vpMappedForm.controls['mappedDateText'].setValue(this.pool.mappedDateText);
      this.vpMappedForm.controls['mappedPhotoNumber'].setValue(this.pool.mappedPhotoNumber);
      this.vpMappedForm.controls['mappedShape'].setValue(this.pool.mappedShape);
      this.vpMappedForm.controls['mappedConfidence'].setValue(this.pool.mappedConfidence);
      this.vpMappedForm.controls['mappedLocationAccuracy'].setValue(this.pool.mappedLocationAccuracy);
      this.vpMappedForm.controls['mappedComments'].setValue(this.pool.mappedComments);
      this.vpMappedForm.controls['mappedLatitude'].setValue(this.pool.mappedLatitude);
      this.vpMappedForm.controls['mappedLongitude'].setValue(this.pool.mappedLongitude);

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
                this.afterLoad();
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
}
