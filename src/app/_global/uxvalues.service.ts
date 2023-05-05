import { Injectable } from '@angular/core';
import { first } from 'rxjs/operators';
import { Moment } from 'moment'; //https://momentjs.com/docs/#/use-it/typescript/
import { AuthenticationService, AlertService, vpPoolsService, vtInfoService } from '@app/_services';
import { vcgiService } from '@app/_services';
import { vtTown } from '@app/_models';

@Injectable({ providedIn: 'root' }) //this makes a service single-instance?

export class UxValuesService {
    private currentUser = null;
    private userIsAdmin = false;

    // Preserved UX values
    public visitPageIndex = 0;
    public baseLayerIndex = 0;
    public pointColorIndex = 0;
    public smRadius = 3; //plotted pool shape marker radius
    public autoRadius = 0; //flag automatic smRadius set from zoomLevel
    //filterParams is UX parameters for the primary view
    public filterParams = {
      poolDataType:'All', //radio button selection values set in 
      poolId:null,
      visitId:null,
      userName:null,
      town:{townId:0, townName:"All", townCountyId:0, townAlias:null},
      zoomFilter:false, //flag 'Zoom Only' handling of search filters: true: Show all pools, Zoom to pool/town, false: Show just pool/town, Zoom to pool/town
      hasIndicators:false, //flag filter-by-pools having indicator species, either from visits or surveys
      mapView:true, //true: Map View, false: Table View
      loadAllRec:true //true: Load All Records, false: Load 1 page of Records
    };
    //map component specific parameters
    public overlaySelected = {
      'potential':1, 'probable':1, 'confirmed':1, 'duplicate':0, 'eliminated':0, 
      'state':0, 'county':0, 'town':0, 'biophysical':0, 'parcel':0
      };
    public vtCenter = {lat:43.916944,lng:-72.668056};
    public prevZoomLevel = [8];
    public prevZoomCenter = [this.vtCenter];
    public zoomIndex = 0;
    public zoomCount = 0;
    public zoomUI = true; //flag a zoom event from map UI (not from zoomPrev or zoomNext)
    public moveUI = true; //flag a zoom event from map UI (not from zoomPrev or zoomNext)

    public pageSize = 12;
    public filter:string = '';
    public search:any = {};
    public type:any = {};
    public data:any = {timestamp:Moment.utc('1970-01-01').format(), pools:[], count:0};
    public towns:any = [];
    public parcels:any = {}; //an object of geoJson town parcel layers by town name
    public geoLayers:any = {}; //an object of geoJson useful boundaries by layer name (State, County, Town, Biophysical, ...)

    public surveyListParams = {
      "surveyId":null,
      "surveyPoolId":'All',
      "surveyType":0,
      "surveyYear":'All',
      "surveyDateBeg":null,
      "surveyDateEnd":null,
      "surveyUser":'All',
      "surveyObserver":'All'
    };

    public userContext:any = {};

    constructor(
      private authenticationService: AuthenticationService,
      private vpPoolsService: vpPoolsService,
      private InfoService: vtInfoService,
      private alertService: AlertService,
      private vcgiService: vcgiService
    ) {
      console.log('****************************UXVALUES CONSTRUCTOR****************************')
      if (this.authenticationService.currentUserValue) {
        this.currentUser = this.authenticationService.currentUserValue.user;
        this.userIsAdmin = this.currentUser.userrole == 'admin';
      }
      //this.getUserContext();
    }
/*
    public setUserContext() {
      this.userContext.smRadius = this.smRadius;
      localStorage.setItem('userContext', JSON.stringify(this.userContext));
    }
    public getUserContext() {
      this.userContext = JSON.parse(localStorage.getItem('userContext'));
      if (this.userContext) {
        this.updUserContext();
      } else {
        this.setUserContext();
        this.userContext = JSON.parse(localStorage.getItem('userContext'));
        this.updUserContext();
      }
    }
    public updUserContext() {
      this.smRadius = this.userContext.smRadius;
    }
*/
    /*
      updateData is called after loading 'updates' from the API
      transfer new and changed data in 'pools' to global this.data for use by the map/table
    */
    updateData(type='all', pools:any) {
      type = 'all';
      console.log(`uxValues.service::updateData(${type}) | incoming data count:`, pools.length, ` | timestamp: ${this.data.timestamp}`);
      if (this.data.pools.length == 0) { //initial load
        this.data.timestamp = Moment.utc().format();
        this.data.pools = pools;
        this.data.count = pools.length;
      } else {
        this.data.timestamp = Moment.utc().format();
        //update existing array with new data
        pools.forEach(upd => { //iterate over incoming rows, each as 'upd'
          var found = false; //flag that the incoming row, 'upd' was found in this pass through 'old' pools
          var match = {pool:false, visit:false, review:false, survey:false}; //instantaneous match of the idxth element
          var vpmap = [];
          console.log(`searching ${type} for ${upd.poolId}/${upd.visitId}/${upd.reviewId}`);
          this.data.pools.find((old, idx, arr) => {
            if (upd.poolId==old.poolId&&!old.visitId) {
              console.log(`FOUND Existing VPMap[${old.poolId}]=${idx}`);
              vpmap[old.poolId]=idx;}
            match = {
              pool: upd.poolId==old.poolId,
              visit: upd.visitId==old.visitId,
              review: upd.reviewId==old.reviewId,
              survey: upd.surveyId==old.surveyId
            };
            if ((match.pool && match.visit && match.review && match.survey)) {
              found = true; //flag that we found a match so we don't duplicate it.
              console.log(`FOUND match: ${match}. UPDATING.`);
              this.data.pools[idx] = upd; //update row
            }
            return found;
          })
          if (!found) { //searched all rows for the current incoming value. not found. add it.
            console.log(`ADDING ${upd.poolId}/${upd.visitId}/${upd.reviewId}`);
            this.data.pools.push(upd); //add row
          }
          if (upd.visitId && vpmap[upd.poolId]) { //if new row has visit delete old row without...
            console.log(`DELETING ${upd.poolId} from data.pools[${type}] at index ${vpmap[upd.poolId]}`);
            delete this.data.pools[vpmap[upd.poolId]];
          }
        });
      }
    }

    /*
      Filter client-side global this.data array after loading/updating. This replaces the API Query Filters by 'Search'.
      This is called after loading a dataSet by 'Type' (All, Visi, Mine, Revu, Moni)
    */
    filterData(row:any) {
      var srch:any = this.search;
      var keep:boolean = true;
      var user:string = this.currentUser ? this.currentUser.username : null;

      if (srch.visitId) keep = keep&&(srch.visitId==row.visitId);
      if (srch.poolId) keep = keep&&(srch.poolId==row.poolId);
      if (srch.userName) keep = keep&&((srch.userName==row.mappedByUser)||(srch.userName==row.visitUserName));
      if (srch.mappedMethod) keep = keep&&(srch.mappedMethod==row.mappedMethod);
      if (srch.town) keep = keep&&(row.townName&&srch.town==row.townName);
      if (srch.hasIndicators) keep = keep && (
          (row.speciesCount+0>0) ||
          (row.sumMacros+0>0) ||
          (row.sumAmphib&&row.sumAmphib[0]+0>0) ||
          (row.sumAmphib&&row.sumAmphib[1]+0>0)
        )
      if (!this.userIsAdmin) keep = keep&&(row.poolStatus!='Eliminated')&&(row.poolStatus!='Duplicate');
      // TODO: add search by date here: //if (srch.begDate) keep = keep&&((row.mappedDateText>=srch.begDate)||(row.visitDate>=srch.begDate));
      if (this.type=='revu') keep = keep &&
        (
          (row.visitId && !row.reviewId) ||
          //new db triggers update vpmapped when review saved, so this criterion is bad
          //row.mappedUpdatedAt > row.reviewUpdatedAt ||
          row.visitUpdatedAt > row.reviewUpdatedAt
        );
      /*
      if (row.poolId=='SDF791') {
        console.log(row.poolId, row.visitId, row.reviewId, row.mappedUpdatedAt, row.visitUpdatedAt, row.reviewUpdatedAt);
      }
      */
      if (this.type=='mine' && this.currentUser) keep = keep &&
        (user==row.mappedByUser ||
        user==row.visitUserName ||
        user==row.visitObserverUserName ||
        user==row.surveyUserName);
      if (this.type=='visi') keep = keep&&row.visitId;
      if (this.type=='moni') keep = keep&&row.surveyId;
      if (row.mappedDateText) row.mappedDateText = Moment(row.mappedDateText).format('YYYY-MM-DD');
      if (row.visitDate) row.visitDate = Moment(row.visitDate).format('YYYY-MM-DD');
      if (row.reviewQADate) row.reviewQADate = Moment(row.reviewQADate).format('YYYY-MM-DD');
      if (row.mappedLatitude) row.mappedLatitude = Number(row.mappedLatitude).toFixed(5);
      if (row.mappedLongitude) row.mappedLongitude = Number(row.mappedLongitude).toFixed(5);
      if (row.visitLatitude) row.visitLatitude = Number(row.visitLatitude).toFixed(5);
      if (row.visitLongitude) row.visitLongitude = Number(row.visitLongitude).toFixed(5);
      return keep;
    }

    /*
      Primary entrypoint for loading data.
    */
    public loadUpdated(type='all', search:any={}, page=0) {
      this.search = search;
      this.type = type;
      console.log(`uxvalues.service::loadUpdated(${type}) | timestamp:${this.data.timestamp} | filter:${this.filter} | search:`, search);
      return new Promise((resolve, reject) => {
        var result;
        result = this.vpPoolsService.getOverview(this.data.timestamp, this.filter);
        result.pipe(first()).subscribe(
            //async data => {
              //await this.updateData(type, data.rows); //sync old data with updates
              data => {
                this.updateData(type, data.rows); //sync old data with updates
                var res = this.data.pools.filter(row => this.filterData(row)); //filter global: 'data' by selectors, etc.
              var len = res.length;
              var chg = data.rowCount > 0;
              if (page) {resolve({pools:res.slice(this.pageSize*(page-1), this.pageSize*page), count:len, changed: chg});}
              else {resolve({pools:res, count:len, changed: chg});}
            },
            error => {
              this.alertService.error(error);
              reject(error);
            });
      });
    }

    addPrevZoom(level, center) {
      if (this.zoomUI) {
        //console.log('addPrevZoom');
        this.prevZoomLevel.push(level);
        this.prevZoomCenter.push(center);
        this.zoomIndex = this.prevZoomLevel.length-1;
        this.zoomCount = this.prevZoomLevel.length-1;
      }
    }

    addPrevMove(level, center) {
      if (this.moveUI) {
        //console.log('addPrevMove');
        this.prevZoomLevel.push(level);
        this.prevZoomCenter.push(center);
        this.zoomIndex = this.prevZoomLevel.length-1;
        this.zoomCount = this.prevZoomLevel.length-1;
      }
    }

    zoomPrev(map) {
      this.zoomUI=false;
      this.moveUI=false;
      this.zoomIndex--;
      if (this.zoomIndex < 0) this.zoomIndex = 0;
      map.setView(this.getZoomCenter(), this.getZoomLevel());
    }

    zoomNext(map) {
      this.zoomUI=false;
      this.moveUI=false;
      this.zoomIndex++;
      if (this.zoomIndex > this.prevZoomLevel.length-1) this.zoomIndex = this.prevZoomLevel.length-1;
      map.setView(this.getZoomCenter(), this.getZoomLevel());
    }

    getZoomLevel() {
      //console.log('getZoomLevel', this.zoomIndex, this.prevZoomLevel[this.zoomIndex])
      return this.prevZoomLevel[this.zoomIndex];
    }

    getZoomCenter() {
      //console.log('getZoomCenter', this.zoomIndex, this.prevZoomCenter[this.zoomIndex])
      return this.prevZoomCenter[this.zoomIndex];
    }

    InitZoom() {
      this.prevZoomLevel = [8];
      this.prevZoomCenter = [this.vtCenter];
      this.zoomIndex = this.prevZoomLevel.length-1;
      this.zoomCount = this.prevZoomLevel.length-1;
    }

    loadTowns() {
      return new Promise((resolve, reject) => {
        this.InfoService.getTowns()
          .pipe(first())
          .subscribe(
            data => {
              this.towns = [{townId:0, townName:"All", townCountyId:0, townAlias:null}];
              data.rows.forEach(row => {
                this.towns.push(row);
              });
              resolve(this.towns);
            },
            error => {
              this.alertService.error(error);
              reject(this.towns);
            });
      })
    }
    //https://angular.io/api/forms/SelectControlValueAccessor#customizing-option-selection
    //https://www.concretepage.com/angular/angular-select-option-reactive-form#comparewith
    compareTownFn(t1: vtTown, t2: vtTown) {
      //console.log('vpvisit.create.compareTownFn t1:', t1, ' t2:', t2);
      return t1 && t2 ? t1.townId === t2.townId : t1 === t2;
    }

    loadTownParcel(townName) {
      return new Promise((resolve, reject) => {
        this.vcgiService.getTownParcel(townName)
          .pipe(first())
          .subscribe((result:any) => {
            if (result.rowCount) {
              let parcel:object = result.rows[0].vcgiParcel;
              resolve (parcel);
            } else {
              console.log(`uxValuesService::loadTownParcel | Parcel data for ${townName} NOT Found.`);
              reject(new Error(`uxValuesService::loadTownParcel | Parcel data for ${townName} NOT Found.`));
            }
          }, error => {
            console.log('uxValuesService::loadTownParcel ERROR:', error);
            reject (error);
          });
      });
    }

    getParcelMap(townName) {
      return new Promise((resolve, reject) => {
        if (this.parcels[townName]) {
          console.log('uxValuesService::getParcelMap | already loaded', townName)
          resolve(this.parcels[townName]);
        } else {
          this.loadTownParcel(townName)
            .then(parcel => {
              console.log('uxValuesService::getParcelMap | newly loaded', townName)
              this.parcels[townName] = parcel;
              resolve(parcel);
            })
            .catch(error => {reject(error);});
        }
      });
    }

}
