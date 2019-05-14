import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AlertService, AuthenticationService, vpMappedService } from '@app/_services';

@Component({templateUrl: 'vpmap.create.component.html'})
export class vpMapCreateComponent implements OnInit {
    vpMappedForm: FormGroup;
    loading = false;
    submitted = false;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private vpMappedService: vpMappedService
    ) {
        // redirect to vpMapped if already logged in
        if (this.authenticationService.currentUserValue) {
            this.router.navigate(['/pools/mapped/create']);
        }
    }

    ngOnInit() {
        this.vpMappedForm = this.formBuilder.group({
            mappedPoolId: ['AAA1', Validators.required],
            mappedShape: ['Point', Validators.required],
            mappedSource: ['NRCS', Validators.required],
            mappedSourceTwo: ['OTHER', Validators.required],
            mappedDateText: ['1/1/2019', Validators.required],
            mappedByUser: ['AW', Validators.required],
            mappedPhotoNumber: ['1234-99Z', Validators.required],
            mappedConfidence: ['MH', Validators.required],
            mappedLocationAccuracy: ['L', Validators.required],
            mappedComments: ['Some comments...', Validators.required],
            mappedLatitude: ['44.5', Validators.required],
            mappedLongitude: ['-72.5', Validators.required]
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

        this.loading = true;
        this.vpMappedService.create(this.vpMappedForm.value)
            .pipe(first())
            .subscribe(
                data => {
                    console.log(`vpmap.create=>data ${data}`);
                    this.alertService.success('Successfully mapped vernal pool.', true);
                    this.router.navigate(['/pools/mapped/view']);
                },
                error => {
                    console.log(`vpmap.create=>error: ${error}`);
                    this.alertService.error(error);
                    this.loading = false;
                });
    }
}
