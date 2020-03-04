import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

import { User, Auth } from '@app/_models';
import { AlertService, UserService, AuthenticationService } from '@app/_services';

@Component({ templateUrl: 'admin.component.html' })
export class AdminComponent implements OnInit, OnDestroy {
    currentUser: Auth;
    currentUserSubscription: Subscription;
    users: User[] = [];

    constructor(
        private authenticationService: AuthenticationService,
        private userService: UserService,
        private alertService: AlertService
    ) {
        this.currentUserSubscription = this.authenticationService.currentUser.subscribe(user => {
            this.currentUser = user;
        });
    }

    ngOnInit() {
        this.loadAllUsers();
    }

    ngOnDestroy() {
        // unsubscribe to ensure no memory leaks
        this.currentUserSubscription.unsubscribe();
    }

    deleteUser(id: number) {
        this.userService.delete(id).pipe(first()).subscribe(
          data => {
              this.alertService.success('Delete successful', true);
              this.loadAllUsers()
          },
          error => {
              this.alertService.error(error);
          });
    }

    private loadAllUsers() {
        this.userService.getAll().pipe(first()).subscribe(users => {
            //console.log('admin.component.loadAllUsers | users:', users)
            this.users = users;
        }),
        (error => {
          console.log(error);
        });
    }
}
