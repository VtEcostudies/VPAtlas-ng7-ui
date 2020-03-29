import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

class pgApiResult {
  command: string;
  rowCount: number;
  oid: string;
  rows: [];
  fields: [];
  _parsers: [];
  RowCtor: string;
  rowAsArray: boolean;
};

@Injectable({ providedIn: 'root' })
export class vtInfoService {
    constructor(private http: HttpClient) {}

    getTowns() {
        return this.http.get<pgApiResult>(`${environment.apiUrl}/vtinfo/towns`);
    }

    getCounties() {
        return this.http.get<pgApiResult>(`${environment.apiUrl}/vtinfo/counties`);
    }
}
