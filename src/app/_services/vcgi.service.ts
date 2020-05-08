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

class vcgiResult {
  displayFieldName: string; //eg. "SOURCENAME"
  fieldAliases: {};
  geometryType:string; //eg. "esriGeometryPolygon"
  spatialReference: {};
  fields: [];
  features: [];
};

@Injectable({ providedIn: 'root' })
export class vcgiService {
    apiUrl = 'https://maps.vcgi.vermont.gov/arcgis/rest/services/EGC_services/OPENDATA_VCGI_CADASTRAL_SP_NOCACHE_v1/MapServer/17/query';
    query = `?where=TOWN=STRAFFORD`;
    fields = `&outFields=*`;
    spatialRef = `&outSR=4326&f=geojson`;

    constructor(private http: HttpClient) {}

    getParcels(type:string="TOWN", value:string="STRAFFORD") {
        this.query = `?where=${type}='${value}'`;
        var text = `${this.apiUrl}${this.query}${this.fields}${this.spatialRef}`;
        //console.log(text);
        return this.http.get<vcgiResult>(text);
    }

    getTownParcel(townName:string) {
      townName = townName.toUpperCase()
      return this.http.get<pgApiResult>(`${environment.apiUrl}/parcel/townName/${townName}`);
    }
}
