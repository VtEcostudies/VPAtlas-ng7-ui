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
            mappedPoolId: ['', Validators.required],
            mappedShape: ['', Validators.required],
            mappedSource: ['', Validators.required],
            mappedSourceTwo: ['', Validators.required],
            mappedDateText: ['', Validators.required],
            mappedByUser: ['', Validators.required],
            mappedPhotoNumber: ['', Validators.required],
            mappedConfidence: ['', Validators.required],
            mappedLocationAccuracy: ['', Validators.required],
            mappedComments: ['', Validators.required],
            mappedLatitude: ['', Validators.required],
            mappedLongitude: ['', Validators.required]
        });
    }

    // convenience getter for easy access to form fields
    get f() { return this.vpMappedForm.controls; }

    onSubmit() {
        this.submitted = true;

        // stop here if form is invalid
        if (this.vpMappedForm.invalid) {
            return;
        }

        this.loading = true;
        this.vpMappedService.create(this.vpMappedForm.value)
            .pipe(first())
            .subscribe(
                data => {
                    this.alertService.success('Successfully mappped vernal pool.', true);
                    this.router.navigate(['/pools/mapped/view']);
                },
                error => {
                    this.alertService.error(error);
                    this.loading = false;
                });
    }
}
