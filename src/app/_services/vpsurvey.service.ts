import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '@environments/environment';

//import { vpSurvey } from '@app/_models';
import { pgFields } from '@app/_models';
import { pgApiResults  } from '@app/_models';

//return values are pgApiResults - the format of node-postgres query result from nodejs server
@Injectable({ providedIn: 'root' })
export class vpSurveyService {
    constructor(private http: HttpClient) { }

    s123LoadData(args:any = {}, update:boolean = false, offset:number = 1, limit:number = 1) {
        return this.http.post<any>(`${environment.apiUrl}/survey/s123/all?update=${update}&offset=${offset}&limit=${limit}`, args);
    }

    s123AbortLoad(args:any = {}) {
        return this.http.post<any>(`${environment.apiUrl}/survey/s123/abort`, args);
    }

    uploadFile(file: any, email: string, update: boolean = false) {
        return this.http.post<any>(`${environment.apiUrl}/survey/upload?surveyUserEmail=${email}&update=${update}`, file);
    }

    getPool(poolId: string) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/survey/pool/${poolId}`);
    }

    getPoolIds() { //a simple list of Pool IDs for eg. drop-down lists
        return this.http.get<pgApiResults>(`${environment.apiUrl}/survey/poolids`);
    }

    getTypes() { //a simple list of Types for eg. drop-down lists
        return this.http.get<pgApiResults>(`${environment.apiUrl}/survey/types`);
    }

    getObservers(poolId: string = '') { //a simple list of Observers for eg. drop-down lists
        var poolFilter = poolId?`?surveyPoolId=${poolId}`:'';
        return this.http.get<pgApiResults>(`${environment.apiUrl}/survey/observers${poolFilter}`);
    }

    getYears(poolId: string = '') { //a simple list of Years for eg. drop-down lists
        var poolFilter = poolId?`?surveyPoolId=${poolId}`:'';
        return this.http.get<pgApiResults>(`${environment.apiUrl}/survey/years${poolFilter}`);
    }

    getAll(filter: string) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/survey?${filter}`);
    }

    getById(id: number) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/survey/${id}`);
    }

    getCount(filter: string) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/survey/count?${filter}`);
    }
}
