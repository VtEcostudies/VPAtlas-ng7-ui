import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '@environments/environment';
import { User } from '@app/_models';
//import { pgVpMappedApi  } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class UserService {
    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<User[]>(`${environment.apiUrl}/users`);
    }

    getPage(page: number) {
        return this.http.get<User[]>(`${environment.apiUrl}/users/${page} `);
    }

    getById(id: number) {
        return this.http.get<User>(`${environment.apiUrl}/users/${id}`);
    }

    register(user: User) {
        return this.http.post(`${environment.apiUrl}/users/register`, user);
    }

    reset(email: Object) {
        return this.http.post(`${environment.apiUrl}/users/reset`, email);
    }

    verify(token: Object) {
        return this.http.post(`${environment.apiUrl}/users/verify`, token);
    }

    confirm(confirm: Object) {
        return this.http.post(`${environment.apiUrl}/users/confirm`, confirm);
    }

    new_email(id:number, email: Object) {
        return this.http.post(`${environment.apiUrl}/users/new_email/${id}`, email);
    }

    update(user: User) {
        return this.http.put(`${environment.apiUrl}/users/${user.id}`, user);
    }

    delete(id: number) {
        return this.http.delete(`${environment.apiUrl}/users/${id}`);
    }
}
