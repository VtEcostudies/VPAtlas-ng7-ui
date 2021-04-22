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

    uploadFile(file: object, update: boolean = false) {
        return this.http.get<pgApiResults>(`${environment.apiUrl}/survey/upload?${update}`, file);
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
