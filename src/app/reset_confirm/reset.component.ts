import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AppComponent } from '@app/app.component';
import { AlertService, UserService } from '@app/_services';

@Component({templateUrl: 'reset.component.html'})
export class ResetComponent implements OnInit {
    resetForm: FormGroup;
    loading = false;
    submitted = false;
    success = false; //flag a successful reset

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private userService: UserService,
        private alertService: AlertService,
        private appComponent: AppComponent
    ) {}

    ngOnInit() {
        this.resetForm = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    // convenience getter for easy access to form fields
    get f() { return this.resetForm.controls; }

    reset() {
        this.submitted = true;

        // stop here if form is invalid
        if (this.resetForm.invalid) {
            return;
        }

        this.loading = true;
        this.userService.reset(this.resetForm.value)
            .pipe(first())
            .subscribe(
                data => {
                    this.loading = false;
                    this.success = true;
                },
                error => {
                    this.alertService.error(error);
                    this.loading = false;
                });
    }
}
