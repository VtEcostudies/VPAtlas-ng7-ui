import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { pgApiResults  } from '@app/_models';

//return values are pgApiResults - the format of node-postgres query result from nodejs server
@Injectable({ providedIn: 'root' })
export class vpPoolsService {
    constructor(private http: HttpClient) { }

    getAll(filter: string) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools?${filter}`);
    }

    getPage(page: number, filter: string) {
        const url = `${environment.apiUrl}/pools/page/${page}?${filter}`;
        return this.http.get<pgApiResults>(url);
    }

    getCount(filter: string) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/count?${filter}`);
    }

    getByPoolId(id: number) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/mapped/${id}`);
    }

    getByVisitId(id: number) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/visit/${id}`);
    }
}
