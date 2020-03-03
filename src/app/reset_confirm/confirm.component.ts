import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AppComponent } from '@app/app.component';
import { AlertService, UserService } from '@app/_services';
import { MustMatch } from '@app/_helpers/must-match.validator';

@Component({templateUrl: 'Confirm.component.html'})
export class ConfirmComponent implements OnInit {
    confirmForm: FormGroup;
    loading = false;
    submitted = false;
    token = null;
    invalid = false;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private userService: UserService,
        private alertService: AlertService,
        private appComponent: AppComponent
    ) {

    }

    ngOnInit() {
      this.confirmForm = this.formBuilder.group({
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      }, {
        validator: MustMatch('password', 'confirmPassword')
      });

      this.route.queryParams.subscribe(params => {
          console.log('query params', params);
          this.token = params.token;
        });

      this.verify();
    }

    // convenience getter for easy access to form fields
    get f() { return this.confirmForm.controls; }

    verify() {
        this.userService.verify({token:this.token})
            .pipe(first())
            .subscribe(
                data => {
                  //do nothing
                },
                error => {
                    this.alertService.error(error);
                    this.loading = false;
                    this.invalid = true;
                });
    }

    confirm() {
        this.submitted = true;

        // stop here if form is invalid
        if (this.confirmForm.invalid) {
            return;
        }

        this.loading = true;
        var confobj = {token:this.token, password:this.f.password.value};
        this.userService.confirm(confobj)
            .pipe(first())
            .subscribe(
                data => {
                    this.alertService.success('Password update successful. Please login.', true);
                    this.router.navigate(['/login']);
                },
                error => {
                    this.alertService.error(error);
                    this.loading = false;
                });
    }
}
