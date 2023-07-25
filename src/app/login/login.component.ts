import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AppComponent } from '@app/app.component';

import { AlertService, UserService, AuthenticationService } from '@app/_services';

@Component({templateUrl: 'login.component.html'})
export class LoginComponent implements OnInit {
    loginForm: UntypedFormGroup;
    loading = false;
    submitted = false;
    returnUrl: string;
    invalid = false;
    token = null;

    constructor(
        private formBuilder: UntypedFormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private userService: UserService,
        private appComponent: AppComponent
    ) {
    }

    ngOnInit() {
        this.loginForm = this.formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });

        // get return url from route parameters or default to '/'
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

        this.route.queryParams.subscribe(params => {
            console.log('query params', params);
            this.token = params.token;
          });

        if (this.token) { //incoming token (registration or new_email)
          console.log('login.component.ts::ngOnInit | token detected')
          this.verify(); //verify token is still valid
          if (this.authenticationService.currentUserValue) { //log the user out
              this.authenticationService.logout();
          }
        } else { //normal login procedure
          // redirect to home if already logged in
          if (this.authenticationService.currentUserValue) {
              this.router.navigate(['/']);
          }
        }
    }

    // convenience getter for easy access to form fields
    get f() { return this.loginForm.controls; }

    //verify a reset/registration/new_email token is valid
    verify() {
        this.userService.verify({token:this.token})
            .pipe(first())
            .subscribe(
                data => {
                  //do nothing
                  console.log('Registration confirmation token verified.')
                },
                error => {
                    this.alertService.error(error);
                    this.loading = false;
                    this.invalid = true;
                });
    }

    onSubmit() {
        this.submitted = true;

        // stop here if form is invalid
        if (this.loginForm.invalid) {
            return;
        }

        this.loading = true;
        this.authenticationService.login(this.f.username.value, this.f.password.value, this.token)
            .pipe(first())
            .subscribe(
                data => {
                    this.appComponent.onLogin();
                    this.router.navigate([this.returnUrl]);
                },
                error => {
                    this.alertService.error(error);
                    this.loading = false;
                });
    }
}
