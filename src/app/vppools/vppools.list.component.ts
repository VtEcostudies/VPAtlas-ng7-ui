import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpMappedService, vpPoolsService } from '@app/_services';
import { UxValuesService } from '@app/_global';
import { vpMapped, vpVisit } from '@app/_models';
import { poolsDialogText } from '@app/vppools/dialogText';
import { ModalService } from '@app/_modal';
import * as Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/

//@add_component_here
@Component({
  templateUrl: 'vppools.list.component.html',
  styleUrls: ['vppools.styles.css']
})
export class vpListComponent implements OnInit {
    currentUser = null;
    userIsAdmin = false;
    filterForm: FormGroup;
    loading = null;
    stats = { total:0, total_data:0, potential:0, probable:0, confirmed:0, eliminated:0, duplicate:0, visited:0, monitored:0 }; //need a default to prevent pre-load errors?
    page = 1;
    pageSize = 10;
    loadAllRec = true; //flag to load by page or to load all at once
    last = 1;
    count: number = 1;
    filter: string = '';
    search: any = {};
    mapPoints = true; //flag to plot pools on map as circleMarkers, passed to map via [mapPoints]="mapPoints"
    pools: vpMapped[] = []; //data array from db having lat and lon values to plot on map
    itemType = 'List Pools/Visits'; //used by leaflet map to format popup content, etc.
    mapView = true; //flag to toggle between table and map view - TODO: setting should persist across data loads
    seconds = 0;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        public uxValuesService: UxValuesService,
        private vpMappedService: vpMappedService,
        private vpPoolsService: vpPoolsService,
        private modalService: ModalService
    ) {
      if (this.authenticationService.currentUserValue) {
        this.currentUser = this.authenticationService.currentUserValue.user;
        this.userIsAdmin = this.currentUser.userrole == 'admin';
      } else {
        this.userIsAdmin = false;
      }
    }

    // convenience getter for easy access to form fields
    get f() { return this.filterForm.controls; }

    async ngOnInit() {
      //these are the pool search filter fields
      this.filterForm = this.formBuilder.group({
          visitId: [''],
          poolId: [''],
          userName: [''],
          town: [{townId:0, townName:"All", townCountyId:0, townCentroid:null, townBorder:null}],
          mappedMethod: [''],
          mappedPoolStatus: ['All'],
          visitedPool: [],
          review: [],
          monitoredPool: []
      });
      this.uxValuesService.loadTowns();
      await this.loadPoolStats();
      //and load page 1 (or all if loadAllRec defaults to true)
      await this.loadPools(1);
    }

    openModal(id: string, infoId=null, e=null) {
        if (e) {e.stopPropagation();}
        console.log('id, infoId', id, infoId);
        this.modalService.open(id, poolsDialogText[infoId]);
    }

    closeModal(id: string) {
        this.modalService.close(id);
    }

    //how to handle UI changes from checkbox input when NOT a formControl in a formGroup:
    //https://stackoverflow.com/questions/47068222/angular-4-checkbox-change-value?rq=1
    //https://stackoverflow.com/questions/50697456/checkbox-not-working-in-angular-4
    //https://stackoverflow.com/questions/51453322/cant-uncheck-programatically-after-manual-check-on-a-checkbox-angular
    checkBoxValueChanged(e) {
        //console.log('checkBoxValueChanged: ', e.target.checked);
        this.loadAllRec = e.target.checked;
        this.loadPools();
    }

    checkBoxSetValue(value=true) {
      this.loadAllRec = value;
      this.loadPools();
    }

    setStatusLoadPools(status="") {
      this.filterForm.get("visitedPool").setValue(false);
      this.filterForm.get("monitoredPool").setValue(false);
      this.filterForm.get("userName").setValue(null);
      this.filterForm.get("review").setValue(false);

      if (status=="Visited") {
        this.filterForm.get("visitedPool").setValue(true);
        //console.log('setStatusLoadPools | visitedPool', this.filterForm.value.visitedPool);
      } else if (status=="Monitored") {
        this.filterForm.get("monitoredPool").setValue(true);
        //console.log('setStatusLoadPools | monitoredPool', this.filterForm.value.monitoredPool);
      } else if (status=="Mine") {
        this.filterForm.get("userName").setValue(this.currentUser ? this.currentUser.username : null);
        //console.log('setStatusLoadPools | myPools', this.filterForm.value.userName);
      } else if (status=="Review") {
        this.filterForm.get("review").setValue(true);
        //console.log('setStatusLoadPools | review', this.filterForm.value.review);
      }

      this.loadPools();
    }

    getType() {
      var type='all';
      if (this.filterForm.value.visitedPool) type='visi';
      if (this.filterForm.value.monitoredPool) type='moni';
      if (this.filterForm.value.userName) type='mine';
      if (this.filterForm.value.review) type='revu';
      return type;
    }

    loadPools(page=0) {
      var type = this.getType()
      this.alertService.clear();
      if (this.loadAllRec) {
        //this.loadAll();
        this.loadUpdated(this.getType());
      } else {
        if (page) {this.page = page;}
        //this.loadPage(this.page);
        this.loadUpdated(this.getType(), this.page);
      }
    }

    /*
      Construct an SQL WHERE clause search filter to be passed to vpvisit.services
      to filter db query results.
      Put the value of that fileter into the class variable.
    */

    /*
      We have a problem with Search and the combined UX of Pools and Visits.
      We are looking up into 2 tables, both of which have userNames, poolIds,
      and more duplicate values. How do we handle this? There are lots of ways,
      and they're all a lot of work.

      NOTE: Implemented this on both ends by removing the default AND condition
      and requiring logical operators be sent as below. Not easy.
    */
    getFilter() {
      this.filter = ''; //must clear first to undo filters
      var i = 0;

      if (this.f.visitId.value) {
        this.filter += `visitId=${this.f.visitId.value}`;
      }
      if (this.f.poolId.value) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        this.filter += `logical${++i}=(`;
        //this.filter += `&mappedPoolId|LIKE=%${this.f.poolId.value}%`;
        this.filter += `&mappedPoolId=${this.f.poolId.value}`; //exact match
        this.filter += `&logical${++i}=OR`;
        //this.filter += `&visitPoolId|LIKE=%${this.f.poolId.value}%`;
        this.filter += `&visitPoolId=${this.f.poolId.value}`;
        this.filter += `&logical${++i}=)`;
      }

      if (this.f.userName.value) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        // TODO: add ability to send OR filter conditions
        //this.filter += `visitUserName|LIKE=%${this.f.userName.value}%`;
        //this.filter += `mappedByUser|LIKE=%${this.f.userName.value}%`;
        this.filter += `logical${++i}=(`;
        this.filter += `&mappedByUser|LIKE=%${this.f.userName.value}%`;
        this.filter += `&logical${++i}=OR`;
        this.filter += `&visitUserName|LIKE=%${this.f.userName.value}%`;
        this.filter += `&logical${++i}=)`;
      }

      if (this.f.town.value) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        this.filter += `logical${++i}=(`;
        this.filter += `&mappedtown."townName"|LIKE=%${this.f.town.value}%`;
        this.filter += `&logical${++i}=OR`;
        this.filter += `&visittown."townName"|LIKE=%${this.f.town.value}%`;
        this.filter += `&logical${++i}=)`;
      }

      if (this.f.mappedMethod.value) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        this.filter += `mappedMethod=${this.f.mappedMethod.value}`;
      }

      //hidden field, populated from code
      /*
        NOTE: there IS a way to send multiple values for one selector in http:
        send multiple instances of that same field in the query param lists
        node express parses them into an array for us. We are not using this
        previously unknown feature, yet.
      */
      if (this.f.mappedPoolStatus.value) {
        //exclude search items which are not pool statuses
        if (this.f.mappedPoolStatus.value!="All" &&
            this.f.mappedPoolStatus.value!="Visited" &&
            this.f.mappedPoolStatus.value!="Monitored" &&
            this.f.mappedPoolStatus.value!="Mine" &&
            this.f.mappedPoolStatus.value!="Review"
          ) {
          if (this.filter) {
            this.filter += `&logical${++i}=AND&`;
          }
          this.filter += `mappedPoolStatus=${this.f.mappedPoolStatus.value}`;
          //this.filter += `mappedPoolStatus|IN=${this.f.mappedPoolStatus.value}`;
        }
      }

      //hidden field, populated from code: 'visited'
      //console.log('getFilter | visitedPool', this.f.visitedPool.value);
      if (this.f.visitedPool.value == true) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        this.filter += `visitPoolId|!=NULL`;
      }

      //hidden field, populated from code: 'review'
      //console.log('getFilter | review', this.f.review.value);
      if (this.f.review.value == true) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        this.filter += `reviewId=NULL&logical${++i}=AND&visitId|!=NULL`;
      }

      /*
        filter hidden pools if user is not admin
        filter hidden pools for admins by default
      */
      //console.log('mappedPoolStatus', this.f.mappedPoolStatus.value);
      if (!this.userIsAdmin || (this.userIsAdmin && (this.f.mappedPoolStatus.value=="All" || this.f.visitedPool.value == true))) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        this.filter += `mappedPoolStatus|NOT IN=Eliminated`;
        this.filter += `&`;
        this.filter += `mappedPoolStatus|NOT IN=Duplicate`;
      }

      //console.log('vppools.list.getfilter()', this.filter);
    }

    firstPage() {
        this.page=1
        //this.loadPage(this.page);
        this.loadUpdated(this.getType(), this.page);
    }

    nextPage() {
        this.page++;
        if (this.page > this.last) this.page = this.last;
        //this.loadPage(this.page);
        this.loadUpdated(this.getType(), this.page);
    }

    prevPage() {
      this.page--; if (this.page < 1) this.page = 1;
      //this.loadPage(this.page);
      this.loadUpdated(this.getType(), this.page);
    }

    lastPage() {
      this.page = this.last;
      //this.loadPage(this.page);
      this.loadUpdated(this.getType(), this.page);
    }

    setLast() {
      this.last = this.count/this.uxValuesService.pageSize;

      if (this.last > Math.floor(this.last)) {
          this.last = Math.floor(this.last) + 1;
      } else {
          this.last = Math.floor(this.last);
      }
    }

    async loadPage(page) {
      this.loading = true;
      this.getFilter();
      if (this.page < 1) this.page = 1;
      if (this.page > this.last) this.page = this.last;
      this.vpPoolsService.getPage(this.page, this.filter)
          .pipe(first())
          .subscribe(
              data => {
                this.pools = data.rows;
                this.count = data.rows[0] ? data.rows[0].count : data.rowCount;
                this.setLast();
                this.loading = false;
              },
              error => {
                  this.alertService.error(error);
                  this.loading = false;
              });
    }

    async loadAll() {
      this.loading = true;
      this.getFilter();
      this.vpPoolsService.getAll(this.filter)
          .pipe(first())
          .subscribe(
              data => {
                this.pools = data.rows;
                this.count = data.rowCount;
                this.setLast();
                this.loading = false;
              },
              error => {
                this.alertService.error(error);
                this.loading = false;
              });
    }

    /*
      retrieve values of search filter items to pass to loadUpdated
    */
    getSearch() {
      this.search={};
      if (this.f.visitId.value) this.search.visitId=this.f.visitId.value;
      if (this.f.poolId.value) this.search.poolId=this.f.poolId.value;
      if (this.f.userName.value) this.search.userName=this.f.userName.value;
      if (this.f.town.value && this.f.town.value.townName!='All') this.search.town=this.f.town.value.townName;
      if (this.f.mappedMethod.value) this.search.mappedMethod=this.f.mappedMethod.value;
    }

    async loadUpdated(type='all', page=0) {
      //console.log('vppools.list.component::loadUpdated');
      await this.getSearch();
      this.loading = true;
      this.uxValuesService.loadUpdated(type, this.search, page)
        .then((data:any) => {
          this.pools = data.pools;
          this.count = data.count;
          if (data.changed) this.loadPoolStats();
          this.setLast();
          this.loading = false;
        })
        .catch(err => {
          this.loading = false;
        })
    }

    /*
    Just load pool stats.
    */
    async loadPoolStats() {
      //this.loading = true;
      this.vpMappedService.getStats(this.currentUser ? this.currentUser.username : null)
          .pipe(first())
          .subscribe(
              data => {
                this.stats = data.rows[0];
                //this.loading = false;
              },
              error => {
                this.alertService.error(error);
                //this.loading = false;
              });
    }

    //// TODO: distinguish btw viewing mapped pool and pool visit
    viewPoolVisit(visitId) {
      this.router.navigate([`/pools/view/${visitId}`]);
    }

    //// TODO: distinguish btw viewing mapped pool and pool visit
    viewMappedPool(poolId) {
      this.router.navigate([`/pools/mapped/view/${poolId}`]);
    }

    GetVisitReviews(visitId) {
      this.router.navigate([`review/list/${visitId}`], {queryParams:{returnUrl:this.router.url, visitId:visitId}});
    }

    async showMap() {
      if (this.loadAllRec == false) {
        this.loadAllRec = true;
        await this.loadPools();
      }
      this.mapView = true;
    }

    async showTable() {
      if (this.loadAllRec == true) { //table view is slow - don't default to 'Load All'
        this.loadAllRec = false;
        await this.loadPools();
      }
      this.mapView = false;
    }

    clearTown() {
      this.filterForm.get("town").setValue(null);
      this.loadPools();
    }
}
