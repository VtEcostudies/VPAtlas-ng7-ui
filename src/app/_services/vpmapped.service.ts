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
        return this.http.get<pgVpMappedApi>(`${environment.apiUrl}/pools/mapped?${filter}`);
    }

    getPage(page: number, filter: string) {
        //return value is pgVpMappedApi - the format of node-postgres query result from nodejs server
        const url = `${environment.apiUrl}/pools/mapped/page/${page}?${filter}`;
        console.log(`vpmapped.service.getPage | url:`, url);
        return this.http.get<pgVpMappedApi>(url);
    }

    getById(id: number) {
        return this.http.get<pgVpMappedApi>(`${environment.apiUrl}/pools/mapped/${id}`);
    }

    getCount(filter: string) {
        return this.http.get<pgVpMappedApi>(`${environment.apiUrl}/pools/mapped/count?${filter}`);
    }

    createOrUpdate(update: boolean, poolId: string, vpmap: vpMapped) {
      if (update) {return this.update(poolId, vpmap);}
      else {return this.create(vpmap);}
    }

    create(vpmap: vpMapped) {
        return this.http.post<pgVpMappedApi>(`${environment.apiUrl}/pools/mapped`, vpmap);
    }

    update(mappedPoolId: string, vpmap: vpMapped) {
        return this.http.put<pgVpMappedApi>(`${environment.apiUrl}/pools/mapped/${mappedPoolId}`, vpmap);
    }

    delete(mappedPoolId: string) {
        return this.http.delete<pgVpMappedApi>(`${environment.apiUrl}/pools/mapped/${mappedPoolId}`);
    }
}
