﻿import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '@environments/environment';

import { vpVisit } from '@app/_models';
import { pgFields } from '@app/_models';
import { pgApiResults  } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class vpVisitService {
    constructor(private http: HttpClient) { }

    getAll(filter: string) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/visit?${filter}`);
    }

    getPage(page: number, filter: string) {
        //return value is pgApiResults - the format of node-postgres query result from nodejs server
        const url = `${environment.apiUrl}/pools/visit/page/${page}?${filter}`;
        console.log(`vpvisit.service.getPage | url:`, url);
        return this.http.get<pgApiResults>(url);
    }

    getById(id: number) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/visit/${id}`);
    }

    getCount(filter: string) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/visit/count?${filter}`);
    }

    getStats() {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/visit/stats`);
    }

    createOrUpdate(update: boolean, visitId: number, visit: vpVisit) {
      if (update) {return this.update(visitId, visit);}
      else {return this.create(visit);}
    }

    create(vpvisit: vpVisit) {
        return this.http.post<pgApiResults>(`${environment.apiUrl}/pools/visit`, vpvisit);
    }

    update(visitId: number, vpvisit: vpVisit) {
        return this.http.put<pgApiResults>(`${environment.apiUrl}/pools/visit/${visitId}`, vpvisit);
    }

    delete(visitId: number) {
        return this.http.delete<pgApiResults>(`${environment.apiUrl}/pools/visit/${visitId}`);
    }
}
