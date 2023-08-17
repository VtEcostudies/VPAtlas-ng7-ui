import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { User, Auth } from '@app/_models';
import { AuthenticationService, AlertService, UtilService } from '@app/_services';

@Component({ templateUrl: 'emailtimer.component.html' })
export class EmailTimerComponent implements OnInit, OnDestroy {
    emailTimerForm: UntypedFormGroup;
    currentUserSubscription: Subscription;
    currentUser = null;
    userIsAdmin = false;
    loading = false;
    submitted = false;
    timers = <any> [];
    types = ['second','minute','hour','day','week'];
    seconds = {second:1, minute:60, hour:3600, day:86400, week:604800};
    returnUrl = '/';

    constructor(
        private formBuilder: UntypedFormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private timerService: UtilService
    ) {
      this.currentUserSubscription = this.authenticationService.currentUser.subscribe(user => {
        this.currentUser = user;
        if (this.currentUser) {
          this.userIsAdmin = this.currentUser.user.userrole == 'admin';
        }
      });
    }

    ngOnInit() {
      this.authenticationService.check()
        .catch(error => {
          console.log('emailTimer.component.ts::ngOnInit | authenticationService.check() ERROR', error);
          this.router.navigate(['/login']);
        })

      this.alertService.clear();

      //NOTE: do not disable form fields until after their values are set
      this.emailTimerForm = this.formBuilder.group({
          email: ['', [Validators.required, Validators.email]],
          intervalType: ['week', Validators.required],
          intervalCount: [1, Validators.required]
      });

      this.getEmailTimers();
    }

    ngOnDestroy() {
        // unsubscribe to ensure no memory leaks
        this.currentUserSubscription.unsubscribe();
    }

    // convenience getter for easy access to form fields
    get f() { return this.emailTimerForm.controls; }

    selectEmail(email) {
      console.log('selectEmail', email);
      this.emailTimerForm.controls['email'].setValue(email);
    }

    getEmailTimers(email='') {

        this.timerService.get(email).pipe(first()).subscribe(timers => {
            console.log('emailTimer.component::loadTimers|', timers);
            this.timers = timers;
        },
        error => {
          console.log('emailTimer.component::loadTimers() |', error);
          this.alertService.error(error);
        });
    }

    setEmailTimer() {
      this.alertService.clear();
      this.submitted = true;

      // stop here if form is invalid
      if (this.emailTimerForm.invalid) {return;}

      let email = this.f.email.value;
      let type = this.f.intervalType.value;
      let count = this.f.intervalCount.value;
      let interval = count * this.seconds[type];
      if (interval > 2147483647) {interval = 2147483647;}

      //alert(`email: ${email}, type:${type}, count:${count}, interval:${interval}`);

      this.loading = true;
      this.timerService.set(email, interval)
        .pipe(first())
        .subscribe(
            data => {
              this.loading = false;
              //this.alertService.success(data.message);
              this.getEmailTimers();
            },
            error => {
              this.loading = false;
              this.alertService.error(error);
            });
    }

    deleteEmailTimer() {
      this.alertService.clear();
      // stop here if form is invalid
      //if (this.emailTimerForm.invalid) {return;}

      let email = this.f.email.value;

      this.loading = true;
      this.timerService.delete(email)
        .pipe(first())
        .subscribe(
            data => {
              this.loading = false;
              this.alertService.success(data.message);
              this.getEmailTimers();
            },
            error => {
              this.loading = false;
              this.alertService.error(error);
            });
    }

    cancel() {
      this.router.navigate([this.returnUrl]);
    }
}
