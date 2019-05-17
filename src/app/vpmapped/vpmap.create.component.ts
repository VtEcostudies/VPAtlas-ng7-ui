import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AlertService, AuthenticationService, vpMappedService } from '@app/_services';

import * as Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/

@Component({templateUrl: 'vpmap.create.component.html'})
export class vpMapCreateComponent implements OnInit {
    vpMappedForm: FormGroup;
    dataLoading = false;
    submitted = false;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private vpMappedService: vpMappedService
    ) {
        console.log('currentUserValue:', this.authenticationService.currentUserValue);

        // redirect to vpMapped if already logged in
        if (this.authenticationService.currentUserValue) {
        } else {
          this.router.navigate(['/pools/mapped/list']);
        }
    }

    ngOnInit() {
        this.vpMappedForm = this.formBuilder.group({

            mappedPoolId: ['AAA1', Validators.required],
            mappedByUser: [this.authenticationService.currentUserValue.username, Validators.required],
            mappedDateText: [Moment().format('MM/DD/YYYY'), Validators.required],
            mappedConfidence: ['', Validators.required],
            mappedLatitude: ['', Validators.required],
            mappedLongitude: ['', Validators.required],

            mappedLocationAccuracy: ['', Validators.required],
            mappedSource: ['', Validators.required],
            mappedSource2: ['', Validators.nullValidator],
            mappedShape: ['Point', Validators.nullValidator],
            mappedPhotoNumber: ['', Validators.nullValidator],
            mappedComments: ['', Validators.nullValidator],
        });
    }

    // convenience getter for easy access to form fields
    get f() { return this.vpMappedForm.controls; }

    onSubmit() {

        console.log(`vpmap.create.onSubmit`);

        this.submitted = true;

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
}
