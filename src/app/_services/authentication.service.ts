import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { User, Auth } from '@app/_models';

@Injectable({ providedIn: 'root' })

export class AuthenticationService {
    private currentUserSubject: BehaviorSubject<Auth>;
    public currentUser: Observable<Auth>;
    //public currentSettings: Observable<any>;

    constructor(
      private http: HttpClient,
      //private userService: UserService
    ) {
        this.currentUserSubject = new BehaviorSubject<Auth>(JSON.parse(localStorage.getItem('currentUser')));
        this.currentUser = this.currentUserSubject.asObservable();
    }

    public get currentUserValue(): Auth {
      return this.currentUserSubject.value;
    }

    login(username: string, password: string, token: string = null) {
        return this.http.post<Auth>(`${environment.apiUrl}/users/authenticate`, { username, password, token })
            .pipe(map(user => {
                // login successful if there's a jwt token in the response
                if (user && user.token) {
                    // store user details and jwt token in local storage to keep user logged in between page refreshes
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    this.currentUserSubject.next(user);
                }

                return user;
            }));
    }

    /*
      Only use this to check for an expired token on pages requiring authentication.
    */
    check() {
      return new Promise((resolve, reject) => {
        if (this.currentUser) {
          this.http.post(`${environment.apiUrl}/users/check`, {})
          .pipe(first())
          .subscribe(res => {
            console.log('authentication.service.ts::check | API /users/check | SUCCESS', res);
            resolve({"message": "valid token"});
          }, err => {
            console.log('authentication.service.ts::check | API /users/check | ERROR', err);
            reject({"message": "token INVALID"});
            this.logout();
          });
        } else {
          //resolve({"message": "No current user"});
          reject({"message": "No current user"});
        }
      });
    }

    logout() {
        // remove user from local storage to log user out
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
    }
}
