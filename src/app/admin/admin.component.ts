import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import { User, Auth } from '@app/_models';
import { AlertService, UserService, AuthenticationService } from '@app/_services';

@Component({ templateUrl: 'admin.component.html' })
export class AdminComponent implements OnInit, OnDestroy {
    currentUser: Auth;
    userIsAdmin: boolean = false;
    currentUserSubscription: Subscription;
    users: User[] = [];

    constructor(
        private router: Router,
        private authenticationService: AuthenticationService,
        private userService: UserService,
        private alertService: AlertService
    ) {
        this.currentUserSubscription = this.authenticationService.currentUser.subscribe(user => {
            this.currentUser = user;
            if (this.currentUser) {
              this.userIsAdmin = this.currentUser.user.userrole == 'admin';
            }
        });
    }

    ngOnInit() {
        if (this.userIsAdmin) {this.loadAllUsers();}
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
              this.loadAllUsers()
          },
          error => {
              this.alertService.error(error);
          });
      }
    }

    private loadAllUsers() {
        this.userService.getAll().pipe(first()).subscribe(users => {
            this.users = users;
        }),
        (error => {
          console.log(error);
        });
    }
}
