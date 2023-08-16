import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class UtilService {
    constructor(private http: HttpClient) { }

    //http://localhost:4000/utils/timer?email=jloomis@vtecostudies.org
    get(email: string) {
        return this.http.get<any>(`${environment.apiUrl}/utils/timer?email=${email}`);
    }

    //http://localhost:4000/utils/timer?interval=604800&email=jloomis@vtecostudies.org
    set(email: string, interval: number) {
        return this.http.post<any>(`${environment.apiUrl}/utils/timer?email=${email}&interval=${interval}`, {email:email, interval:interval});
    }

    delete(email: string) {
        return this.http.delete<any>(`${environment.apiUrl}/utils/timer?email=${email}`);
    }
}