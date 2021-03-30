﻿import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { pgApiResults  } from '@app/_models';

//return values are pgApiResults - the format of node-postgres query result from nodejs server
@Injectable({ providedIn: 'root' })
export class vpPoolsService {
    constructor(private http: HttpClient) { }

    getOverview(timestamp: string, filter: string) { //This is used for map/table list views - limited data for speed
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/overview?timestamp=${timestamp}&${filter}`);
    }

    getReview(timestamp: string, filter: string) { //calls getPoolsNeedReview API endpoint
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/review?timestamp=${timestamp}&${filter}`);
    }

    getAll(filter: string) { //This should not be used. All fields are slow to load.
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools?${filter}`);
    }

    getPage(page: number, filter: string) {
        const url = `${environment.apiUrl}/pools/page/${page}?${filter}`;
        return this.http.get<pgApiResults>(url);
    }

    getCount(filter: string) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/count?${filter}`);
    }

    getByPoolId(poolId: string) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/poolId/${poolId}`);
    }

    getByVisitId(visitId: number) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/pools/visitId/${visitId}`);
    }
}
