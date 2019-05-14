import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '@environments/environment';

import { vpMapped } from '@app/_models';
import { pgFields } from '@app/_models';
import { pgVpMappedApi  } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class vpMappedService {
    constructor(private http: HttpClient) { }

    getAll(filter: string) {
        //return this.http.get<vpMapped[]>(`${environment.apiUrl}/pools/mapped?${filter}`);
        return this.http.get<pgVpMappedApi>(`${environment.apiUrl}/pools/mapped?${filter}`);
    }

    getPage(page: number, filter: string) {
        //return this.http.get<vpMapped[]>(`${environment.apiUrl}/pools/mapped/page/${page}?${filter}`);
        return this.http.get<pgVpMappedApi>(`${environment.apiUrl}/pools/mapped/page/${page}?${filter}`);
    }

    getById(id: number) {
        return this.http.get<pgVpMappedApi>(`${environment.apiUrl}/pools/mapped/${id}`);
    }

    getCount(filter: string) {
        return this.http.get<pgVpMappedApi>(`${environment.apiUrl}/pools/mapped/count?${filter}`);
    }

    create(vpmap: vpMapped) {
    //create(vpmap: {}) {
        console.log(`vpmapped.service.ts | vpmap:`);
        console.dir(vpmap);
        console.log(`post to url: ${environment.apiUrl}/pools/mapped`);
        return this.http.post<pgVpMappedApi>(`${environment.apiUrl}/pools/mapped`, vpmap);
    }

    update(vpmap: vpMapped) {
        return this.http.put(`${environment.apiUrl}/pools/mapped/${vpmap.mappedPoolId}`, vpmap);
    }

    delete(id: number) {
        return this.http.delete(`${environment.apiUrl}/pools/mapped/${id}`);
    }
}
