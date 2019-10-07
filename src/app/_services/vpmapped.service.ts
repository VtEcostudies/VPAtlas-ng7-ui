import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '@environments/environment';

import { vpMapped } from '@app/_models';
import { pgFields } from '@app/_models';
import { pgApiResults } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class vpMappedService {
    constructor(private http: HttpClient) { }

    getAll(filter: string) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/mapped?${filter}`);
    }

    getPage(page: number, filter: string) {
        //return value is pgApiResults - the format of node-postgres query result from nodejs server
        const url = `${environment.apiUrl}/pools/mapped/page/${page}?${filter}`;
        console.log(`vpmapped.service.getPage | url:`, url);
        return this.http.get<pgApiResults>(url);
    }

    getById(id: number) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/mapped/${id}`);
    }

    getCount(filter: string) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/mapped/count?${filter}`);
    }

    getStats(username: string =  null) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/mapped/stats?username=${username}`);
    }

    createOrUpdate(update: boolean, poolId: string, vpmap: vpMapped) {
      if (update) {return this.update(poolId, vpmap);}
      else {return this.create(vpmap);}
    }

    create(vpmap: vpMapped) {
        return this.http.post<pgApiResults>(`${environment.apiUrl}/pools/mapped`, vpmap);
    }

    update(mappedPoolId: string, vpmap: vpMapped) {
        return this.http.put<pgApiResults>(`${environment.apiUrl}/pools/mapped/${mappedPoolId}`, vpmap);
    }

    delete(mappedPoolId: string) {
        return this.http.delete<pgApiResults>(`${environment.apiUrl}/pools/mapped/${mappedPoolId}`);
    }
}
