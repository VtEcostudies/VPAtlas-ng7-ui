import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { User, Auth } from '@app/_models';
import { AlertService, UserService, AuthenticationService } from '@app/_services';

@Component({ templateUrl: 'profile.component.html' })
export class ProfileComponent implements OnInit, OnDestroy {
    profileForm: FormGroup;
    currentUser = null;
    userIsAdmin = false;
    proUser = {id:'',email:'',username:'',userrole:''};
    new_email = false; //flag a new_email when email changes
    loading = false;
    submitted = false;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private userService: UserService,
        private alertService: AlertService
    ) {
      if (this.authenticationService.currentUserValue) {
        this.currentUser = this.authenticationService.currentUserValue.user;
        this.userIsAdmin = this.currentUser.userrole == 'admin';
      }
    }

    ngOnInit() {
      this.profileForm = this.formBuilder.group({
          id: [''],
          username: ['', Validators.required],
          email: ['', [Validators.required, Validators.email]],
          firstname: ['', Validators.required],
          lastname: ['', Validators.required],
          middleName: [''],
          credentials: [''],
          alias: [''],
          userrole: ['']
      });

      this.loadProUser(this.route.snapshot.params.userId);
    }

    ngOnDestroy() {
        // unsubscribe to ensure no memory leaks
        this.currentUserSubscription.unsubscribe();
    }

    // convenience getter for easy access to form fields
    get f() { return this.profileForm.controls; }

    private loadProUser(userId) {
        this.userService.getById(userId).pipe(first()).subscribe
        (proUser => {
            this.proUser = proUser;
            Object.keys(this.proUser).forEach(key => {
              if (key in this.profileForm.value) {
                console.log('key', key, this.proUser[key]);
                this.profileForm.controls[key].setValue(this.proUser[key]);
              }
            })
        }),
        (error => {
          console.log(error);
        });
    }

    update() {
        this.submitted = true;

        // stop here if form is invalid
        if (this.profileForm.invalid) {return;}

        if (this.profileForm.value["email"] != this.proUser.email) {
          this.new_email = true;
          if (confirm(
`You have changed your email address. This requires an email confirmation
process. Are you sure you want to change your email address?`)) {
          } else {
            return;
          }
        }

        this.loading = true;
        this.userService.update(this.profileForm.value)
            .pipe(first())
            .subscribe(
                data => {
                    this.alertService.success(`Update to ${this.profileForm.value['username']} profile successful.`, false);
                    if (this.new_email) {
                    this.userService.new_email(this.profileForm.value["id"], {email:this.profileForm.value["email"]})
                      .pipe(first())
                      .subscribe(
                          data => {
                            this.alertService.success(`A new_email token was sent to ${this.profileForm.value["email"]}.`, true);
                            if (this.currentUser.id == this.profileForm.value["id"]) {
                              this.authenticationService.logout();
                            } else {
                              this.loading=false;
                              this.router.navigate(['/admin']);
                            }
                          },
                          error => {
                            this.alertService.error(error);
                            this.loading=false;
                          });
                      } else {
                        this.loading=false;
                        this.router.navigate(['/admin']);
                      }
                },
                error => {
                    this.alertService.error(error);
                    this.loading=false;
                });
    }
}
