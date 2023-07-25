import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '@environments/environment';

import { vpVisit } from '@app/_models';
import { pgFields } from '@app/_models';
import { pgApiResults  } from '@app/_models';

//return values are pgApiResults - the format of node-postgres query result from nodejs server
@Injectable({ providedIn: 'root' })
export class vpVisitService {
    constructor(private http: HttpClient) { }

    getOverview(filter: string) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/visit/overview?${filter}`);
    }

    getAll(filter: string) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/visit?${filter}`);
    }

    getPage(page: number, filter: string) {
        const url = `${environment.apiUrl}/pools/visit/page/${page}?${filter}`;
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

    uploadFile(file: any, update: boolean = false) {
        return this.http.post<any>(`${environment.apiUrl}/pools/visit/upload?update=${update}`, file);
    }

    getS123Services() {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/visit/s123/services`);
    }

    getS123Uploads(serviceId: string) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/visit/s123/uploads?visitServiceId=${serviceId}`);
    }

    s123LoadData(args:any = {}, serviceId:string=null, update:boolean = false, offset:number = 1, limit:number = 1) {
        return this.http.post<any>(`${environment.apiUrl}/pools/visit/s123/all?serviceId=${serviceId}&update=${update}&offset=${offset}&limit=${limit}`, args);
    }

    s123AbortLoad(args:any = {}) {
        return this.http.post<any>(`${environment.apiUrl}/pools/visit/s123/abort`, args);
    }
}
