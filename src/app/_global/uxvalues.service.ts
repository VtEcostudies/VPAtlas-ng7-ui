import { Injectable } from '@angular/core';
import { first } from 'rxjs/operators';
import * as Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/
import { AuthenticationService, AlertService, vpPoolsService, vtInfoService } from '@app/_services';
import { vtTown } from '@app/_models';

@Injectable({ providedIn: 'root' }) //this makes a service single-instance?

export class UxValuesService {
    currentUser = null;
    userIsAdmin = false;

    public visitPageIndex = 0;
    public baseLayerIndex = 0;
    public pointColorIndex = 0;

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
    public data:any = {
      all:{timestamp:Moment('1970-01-01').format(), pools:[], count:0},
      mine:{timestamp:Moment('1970-01-01').format(), pools:[], count:0},
      revu:{timestamp:Moment('1970-01-01').format(), pools:[], count:0},
      visi:{timestamp:Moment('1970-01-01').format(), pools:[], count:0},
      moni:{timestamp:Moment('1970-01-01').format(), pools:[], count:0}
      };
    public towns:any = [];

    constructor(
      private authenticationService: AuthenticationService,
      private vpPoolsService: vpPoolsService,
      private InfoService: vtInfoService,
      private alertService: AlertService
    ) {
      if (this.authenticationService.currentUserValue) {
        this.currentUser = this.authenticationService.currentUserValue.user;
        this.userIsAdmin = this.currentUser.userrole == 'admin';
      }
      console.log('****************************UXVALUES CONSTRUCTOR****************************')
    }

    updateData(type='all', pools:any) {
      console.log('uxValuesService::updateData | incoming pool count:', pools.length);
      if (this.data[type].pools.length == 0) { //initial load
        this.data[type].timestamp = Moment().format();
        this.data[type].pools = pools;
        this.data[type].count = pools.length;
      } else {
        this.data[type].timestamp = Moment().format();
        // TODO: update existing array with new data using array.filter like below
        pools.forEach(row => {
          var found = false;
          console.log(`searching ${type} for ${row.mappedPoolId}/${row.visitId}/${row.reviewId}`);
          this.data[type].pools.find((pool, index, arr) => {
            var match = true;
            match = match && (row.mappedPoolId==pool.mappedPoolId);
            match = match && (row.visitId==pool.visitId);
            match = match && (row.reviewId==pool.reviewId);
            if (match) {
              found = true; //flag that we found a match so we don't duplicate it.
              console.log(`Found ${row.mappedPoolId}/${row.visitId}/${row.reviewId}. Updating.`);
              this.data[type].pools[index] = row; //update row
            }
            return match;
          })
          if (!found) { //searched all rows for the current incoming value. not found. add it.
            console.log(`Adding ${row.mappedPoolId}/${row.visitId}/${row.reviewId}`);
            this.data[type].pools.push(row); //add row
          }
        });
      }
    }

    filterData(row:any) {
      var srch:any = this.search;
      var keep:boolean = true;
      if (srch.visitId) keep = keep&&(srch.visitId==row.visitId);
      if (srch.poolId) keep = keep&&(srch.poolId==row.poolId);
      if (srch.userName) keep = keep&&((srch.userName==row.mappedByUser)||(srch.userName==row.visitUserName));
      if (srch.mappedMethod) keep = keep&&(srch.mappedMethod==row.mappedMethod);
      if (srch.town) keep = keep&&((row.mappedTown&&srch.town==row.mappedTown.townName)||(row.visitTown&&srch.town==row.visitTown.townName));
      if (!this.userIsAdmin) keep = keep&&(row.mappedPoolStatus!='Eliminated')&&(row.mappedPoolStatus!='Duplicate');
      // TODO: add search by date here: //if (srch.begDate) keep = keep&&((row.mappedDateText>=srch.begDate)||(row.visitDate>=srch.begDate));
      // TODO: add review, monitored, etc. here and drop getFilter()... //if (srch.revu) keep =
      if (row.mappedDateText) row.mappedDateText = Moment(row.mappedDateText).format('YYYY-MM-DD');
      if (row.visitDate) row.visitDate = Moment(row.visitDate).format('YYYY-MM-DD');
      if (row.reviewQADate) row.reviewQADate = Moment(row.reviewQADate).format('YYYY-MM-DD');
      if (row.mappedLatitude) row.mappedLatitude = Number(row.mappedLatitude).toFixed(5);
      if (row.mappedLongitude) row.mappedLongitude = Number(row.mappedLongitude).toFixed(5);
      if (row.visitLatitude) row.visitLatitude = Number(row.visitLatitude).toFixed(5);
      if (row.visitLongitude) row.visitLongitude = Number(row.visitLongitude).toFixed(5);
      return keep;
    }

    public async loadUpdated(type='all', search:any={}, page=0) {
      //console.log('uxvalues.service::loadUpdated | type', type);
      console.log(`uxvalues.service::loadUpdated(${type})`, this.data[type].timestamp, search);
      this.search = search;
      await this.getFilter(type); //, search); only filter db results by type now that we have fast search here...
      return new Promise((resolve, reject) => {
        var result;
        if (type=='revu') {result = this.vpPoolsService.getReview(this.data[type].timestamp, this.filter);}
        else {result = this.vpPoolsService.getUpdated(this.data[type].timestamp, this.filter);}
        result.pipe(first()).subscribe(
            async data => {
              await this.updateData(type, data.rows);
              var res = this.data[type].pools.filter(row => this.filterData(row));
              var len = res.length;
              var chg = this.data[type].pools.length == 0 && data.rowCount;
              if (page) {resolve({pools:res.slice(this.pageSize*(page-1), this.pageSize*page), count:len, changed: chg});}
              else {resolve({pools:res, count:len, changed: chg});}
            },
            error => {
              this.alertService.error(error);
              reject(error);
            });
      });
    }


    /*
      Construct an SQL WHERE clause search filter to be passed to vppools.service
      API route to filter db query results.

      We have a problem with Search and the combined UX of Pools and Visits.
      We are looking up into 2 tables, both of which have userNames, poolIds,
      and more duplicate values. How do we handle this? There are lots of ways,
      and they're all a lot of work.

      NOTE: Implemented this on both ends by removing the default AND condition
      and requiring logical operators be sent as below. Not easy.
    */
    getFilter(type='all', search:any={}) {
      this.filter = ''; //must clear first to undo filters
      var i = 0;

      if (search.visitId) {
        this.filter += `visitId=${search.visitId}`;
      }
      if (search.poolId) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        this.filter += `logical${++i}=(`;
        this.filter += `&mappedPoolId=${search.poolId}`; //exact match
        this.filter += `&logical${++i}=OR`;
        this.filter += `&visitPoolId=${search.poolId}`;
        this.filter += `&logical${++i}=)`;
      }

      if (type=='mine' && this.currentUser) {search.username=this.currentUser.username;}

      if (search.username) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        this.filter += `logical${++i}=(`;
        this.filter += `&mappedByUser|LIKE=%${search.username}%`;
        this.filter += `&logical${++i}=OR`;
        this.filter += `&visitUserName|LIKE=%${search.username}%`;
        this.filter += `&logical${++i}=)`;
      }

      if (search.town) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        this.filter += `logical${++i}=(`;
        this.filter += `&mappedtown."townName"|LIKE=%${search.town}%`;
        this.filter += `&logical${++i}=OR`;
        this.filter += `&visittown."townName"|LIKE=%${search.town}%`;
        this.filter += `&logical${++i}=)`;
      }

      if (search.mappedMethod) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        this.filter += `mappedMethod=${search.mappedMethod}`;
      }

      //hidden field, populated from code
      /*
        NOTE: there IS a way to send multiple values for one selector in http:
        send multiple instances of that same field in the query param lists
        node express parses them into an array for us. We are not using this
        previously unknown feature, yet.
      */
      if (search.mappedPoolStatus) {
        //exclude search items which are not pool statuses
        if (search.mappedPoolStatus!="All" &&
            search.mappedPoolStatus!="Visited" &&
            search.mappedPoolStatus!="Monitored" &&
            search.mappedPoolStatus!="Mine" &&
            search.mappedPoolStatus!="Review"
          ) {
          if (this.filter) {
            this.filter += `&logical${++i}=AND&`;
          }
          this.filter += `mappedPoolStatus=${search.mappedPoolStatus}`;
          //this.filter += `mappedPoolStatus|IN=${search.mappedPoolStatus}`;
        }
      }

      //visited pools
      if (type == 'visi') {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        this.filter += `visitPoolId|!=NULL`;
      }

      //review pools
      if (type == 'revu') {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        this.filter += `reviewId=NULL&logical${++i}=AND&visitId|!=NULL`;
      }

      /*
        filter hidden pools if user is not admin
        this is not necessary with new map control UX
      */
      if (!this.userIsAdmin) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        this.filter += `mappedPoolStatus|NOT IN=Eliminated`;
        this.filter += `&`;
        this.filter += `mappedPoolStatus|NOT IN=Duplicate`;
      }

      //console.log('uxvalues.service.getfilter()', this.filter);
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

    loadTowns() {
      this.InfoService.getTowns()
          .pipe(first())
          .subscribe(
              data => {
                //this.towns = data.rows;
                var all = {townId:0, townName:"All", townCountyId:0, townCentroid:null, townBorder:null};
                this.towns.push(all);
                data.rows.forEach(row => {
                  this.towns.push(row);
                });
              },
              error => {
                this.alertService.error(error);
              });
    }
    //https://angular.io/api/forms/SelectControlValueAccessor#customizing-option-selection
    //https://www.concretepage.com/angular/angular-select-option-reactive-form#comparewith
    compareTownFn(t1: vtTown, t2: vtTown) {
      //console.log('vpvisit.create.compareTownFn t1:', t1, ' t2:', t2);
      return t1 && t2 ? t1.townId === t2.townId : t1 === t2;
    }
}
