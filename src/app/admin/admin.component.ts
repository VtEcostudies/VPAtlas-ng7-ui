import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import { User, Auth } from '@app/_models';
import { AlertService, UserService, AuthenticationService } from '@app/_services';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
    templateUrl: 'admin.component.html',
    styleUrls: ['styles.css']
  })
export class AdminComponent implements OnInit, OnDestroy {
    currentUser: Auth;
    returnUrl = "/";
    userIsAdmin: boolean = false;
    currentUserSubscription: Subscription;
    users: User[] = [];
    count = 0;
    filterForm: FormGroup = this.formBuilder.group({});
    filter = '';
    statuses = ['All', 'registration', 'reset', 'new_email', 'confirmed', 'invalid'];
    roles = ['All', 'admin', 'user'];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private userService: UserService,
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
            firstname: [this.route.snapshot.queryParams['firstname']],
            lastname: [this.route.snapshot.queryParams['lastname']],
            email: [this.route.snapshot.queryParams['email']],
            alias: [this.route.snapshot.queryParams['alias']],
            status: [this.route.snapshot.queryParams['status']],
            role: [this.route.snapshot.queryParams['role']]
          });
        if (this.userIsAdmin) {this.LoadUsers();}
        else {this.router.navigate(['/']);}
    }

    ngOnDestroy() {
        // unsubscribe to ensure no memory leaks
        this.currentUserSubscription.unsubscribe();
    }

    addUser() {
      if (this.userIsAdmin) {
        this.router.navigate(['user/profile/create']);
      }
    }

    deleteUser(id: number, username: string) {
      if (confirm(`Are you sure you want to delete the user '${username}'?'`)) {
        this.userService.delete(id).pipe(first()).subscribe(
          data => {
              this.alertService.success('Delete successful', true);
              this.LoadUsers()
          },
          error => {
              this.alertService.error(error);
          });
      }
    }

    async LoadUsers() {
      await this.getFilter();
      this.userService.getAll(this.filter).pipe(first()).subscribe(users => {
          this.users = users;
          this.count = users.length;
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
      if (this.f.firstname.value) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        var filterValue = `${this.f.firstname.value}`;
        if (filterValue.includes('*')) {
          this.filter += `firstname|LIKE=${filterValue.replace(/\*/g,'%')}`; //partial match
        } else {
          this.filter += `firstname=${filterValue}`; //exact match
        }
      }
      if (this.f.lastname.value) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        var filterValue = `${this.f.lastname.value}`;
        if (filterValue.includes('*')) {
          this.filter += `lastname|LIKE=${filterValue.replace(/\*/g,'%')}`; //partial match
        } else {
          this.filter += `lastname=${filterValue}`; //exact match
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
/*
      if (this.f.alias.value) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        var filterValue = `${this.f.alias.value}`;
        this.filter += `${filterValue}|ANY=(alias)`; //exact match within array of values
      }
*/
      if (this.f.status.value && 'All' != this.f.status.value) {
        this.filter += `status=${this.f.status.value}`;
      }
      if (this.f.role.value && 'All' != this.f.role.value) {
        this.filter += `userrole=${this.f.role.value}`;
      }
      console.log(this.filter);
    }
}
