import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import { Upload, Auth } from '@app/_models';
import { AlertService, UploadService, AuthenticationService } from '@app/_services';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
    templateUrl: 'upload.component.html',
    styleUrls: ['styles.css']
  })
export class UploadComponent implements OnInit, OnDestroy {
    currentUser: Auth;
    returnUrl = "/";
    userIsAdmin: boolean = false;
    currentUserSubscription: Subscription;
    uploads: any = [];
    count = 0;
    filterForm: FormGroup = this.formBuilder.group({});
    filter = '';
    types = ['vpvisit_upload', 'vpsurvey_upload'];
    statuses = ['All', 'registration', 'reset', 'new_email', 'confirmed', 'invalid'];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private uploadService: UploadService,
        private alertService: AlertService,
        private formBuilder: FormBuilder
    ) {
        this.currentUserSubscription = this.authenticationService.currentUser.subscribe(user => {
            this.currentUser = user;
            if (this.currentUser) {
              this.userIsAdmin = this.currentUser.user.userrole == 'admin';
            }
        });
    }

    ngOnInit() {
        this.authenticationService.check();
        this.filterForm = this.formBuilder.group({
            username: [this.route.snapshot.queryParams['username']],
            email: [this.route.snapshot.queryParams['email']],
            status: [this.route.snapshot.queryParams['status']]
          });
        if (this.userIsAdmin) {this.LoadUploads();}
        else {this.router.navigate(['/']);}
    }

    ngOnDestroy() {
        // unsubscribe to ensure no memory leaks
        this.currentUserSubscription.unsubscribe();
    }

    async LoadUploads() {
      await this.getFilter();
      this.uploadService.getAll(this.filter).pipe(first()).subscribe(uploads => {
          this.uploads = uploads;
          this.count = uploads.length;
      }),
      (error => {
        console.log(error);
      });
    }

    Cancel() {
      this.router.navigate([this.returnUrl]);
    }
    // convenience getter for easy access to form fields
    get f() { return this.filterForm.controls; }

    getFilter() {
      this.alertService.clear();
      this.filter = ''; //must clear first to undo filters
      var i = 0;

      if (this.f.username.value) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        var filterValue = `${this.f.username.value}`;
        if (filterValue.includes('*')) { //handle wildcard character '*'
          this.filter += `username|LIKE=${filterValue.replace(/\*/g,'%')}`; //partial match
        } else {
          this.filter += `username=${this.f.username.value}`; //exact match
        }
      }
      if (this.f.email.value) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        var filterValue = `${this.f.email.value}`;
        if (filterValue.includes('*')) {
          this.filter += `email|LIKE=${filterValue.replace(/\*/g,'%')}`; //partial match
        } else {
          this.filter += `email=${filterValue}`; //exact match
        }
      }
      if (this.f.status.value && 'All' != this.f.status.value) {
        this.filter += `status=${this.f.status.value}`;
      }
      console.log(this.filter);
    }
}
