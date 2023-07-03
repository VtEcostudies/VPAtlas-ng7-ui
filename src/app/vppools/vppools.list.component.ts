import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpMappedService, vpPoolsService } from '@app/_services';
import { UxValuesService } from '@app/_global';
import { vpMapped, vpVisit } from '@app/_models';
import { poolsDialogText } from '@app/vppools/dialogText';
import { ModalService } from '@app/_modal';
//NOTE: since Moment is a PITA in Angular, for dates use eg. new Date().toISOString() for timestamp now.
//With all dates formatted as ISO strings (which postgres does, as well), it's easy to parse. eg. timestamp.split('T')[0] is date parsed
//import Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/

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
    zoomFilter = true; //flag to Zoom to selected filters, not filter data. See uxvalues.service.ts for initialization.
    hasIndicators = false;
    last = 1;
    count: number = 1;
    filter: string = '';
    search: any = {};
    mapPoints = true; //flag to plot pools on map as circleMarkers, passed to map via [mapPoints]="mapPoints"
    pools: vpMapped[] = []; //data array from db having lat and lon values to plot on map
    itemType = 'List Pools/Visits'; //used by leaflet map to format popup content, etc.
    zoomTo = {option:'Vermont', value:{}};
    mapView = true; //flag to toggle between table and map view. This value is always set to the uxValuesService value so it's consisitent across page loads.77
    seconds = 0;
    routeParams: any = {};
    queryParams: any = {};
    loadParams: any = {};

    constructor (
        private formBuilder: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        public uxValuesService: UxValuesService,
        private vpMappedService: vpMappedService,
        //private vpPoolsService: vpPoolsService,
        private modalService: ModalService,
    ) {
      console.log('****************************VPPOOLS.LIST CONSTRUCTOR****************************')
      if (this.authenticationService.currentUserValue) {
        this.currentUser = this.authenticationService.currentUserValue.user;
        this.userIsAdmin = this.currentUser.userrole == 'admin';
      } else {
        this.userIsAdmin = false;
      }
    }

    // convenience getter for easy access to form fields
    get f() { 
      let ffc = this.filterForm.controls;
      //console.log(`getter-f controls:`, ffc);
      return ffc; 
    }

    ngOnInit() {

      this.routeParams = this.route.snapshot.params; //only this arg is allowed. see app.routing.ts
      this.queryParams = this.route.snapshot.queryParams;
      Object.assign(this.loadParams, this.routeParams, this.queryParams);

      if (this.loadParams.zoomFilter) {this.loadParams.zoomFilter = ("true" == this.loadParams.zoomFilter);}
      else {this.loadParams.zoomFilter = this.uxValuesService.filterParams.zoomFilter;}
      if (this.loadParams.mapView) {this.loadParams.mapView = ("true" == this.loadParams.mapView);}
      else {this.loadParams.mapView = this.uxValuesService.filterParams.mapView;}
      if (this.loadParams.loadAllRec) {this.loadParams.loadAllRec = ("true" == this.loadParams.loadAllRec);}
      else {this.loadParams.loadAllRec = this.uxValuesService.filterParams.loadAllRec;}
      if (this.loadParams.hasIndicators) {this.loadParams.hasIndicators = ("true" == this.loadParams.hasIndicators);}
      else {this.loadParams.hasIndicators = this.uxValuesService.filterParams.hasIndicators;}

      //initialize filterFrom *outside* of town lookup below...these are the pool search filter fields
      //setting filterForm ***MUST*** be done ahead of town lookup, below, else it causes errors!
      this.filterForm = this.formBuilder.group({
        poolDataType: [this.loadParams.poolDataType || this.uxValuesService.filterParams.poolDataType],
        poolId: [this.loadParams.poolId || this.uxValuesService.filterParams.poolId],
        userName: [this.loadParams.userName || this.uxValuesService.filterParams.userName],
        town: [this.uxValuesService.filterParams.town], //initialize this to something known, modify below
      });

      console.log('vppools.list.component.ts::ngOnInit | loadParams', this.loadParams);
      var towns = [];
      let townPromise = this.uxValuesService.loadTowns(); //need to load these for logic below
      townPromise.then((res:any) => {
        towns = res.slice(); //copy array by value
        if (this.loadParams.townName) { //match incoming townName to towns array element object's town.townName and retrieve town object...
          this.loadParams.town = towns.find(t => {return t.townName.toLowerCase() == this.loadParams.townName.toLowerCase();});
          console.log('vppools::ngOnInit Matched loadParam Town:', this.loadParams.town);
        }
        else {
          this.loadParams.town = this.uxValuesService.filterParams.town;
          this.loadParams.townName = this.uxValuesService.filterParams.town.townName;
        }
        //just set filterForm's town after town object lookup from townName query param
        this.filterForm.controls['town'].setValue(this.loadParams.town);
        this.mapView = this.loadParams.mapView;
        this.loadAllRec = this.loadParams.loadAllRec;
        this.zoomFilter = this.loadParams.zoomFilter;
        this.hasIndicators = this.loadParams.hasIndicators;
        console.log(`vppools.list.component.ts | filterForm.value:`, this.filterForm.value); //debug
        this.loadPoolStats();
        //and load page 1 (or all if loadAllRec defaults to true)
        this.loadPools(1)
      });
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
    loadAllRecChecked(e) {
      //console.log('loadAllRecChecked: ', e.target.checked);
      this.loadAllRec = e.target.checked;
      this.uxValuesService.filterParams.loadAllRec = this.loadAllRec;
      this.loadPools();
    }

    loadAllRecSetValue(value=true) {
      this.loadAllRec = value;
      this.uxValuesService.filterParams.loadAllRec = this.loadAllRec;
      this.loadPools();
    }

    setDataTypeLoadPools(dataType="") {
      this.filterForm.get("userName").setValue(null);

      if (dataType=="Mine") {
        this.filterForm.get("userName").setValue(this.currentUser ? this.currentUser.username : null);
      }

      this.uxValuesService.filterParams.poolDataType = dataType;
      console.log('setDataTypeLoadPools')
      this.loadPools(1); //MUST init Page to 1 when changing dataset to avoid trying to show page=10 when only 3 pages.
    }

    getType() {
      var type='all';
      if (this.f.poolDataType.value=="Visited") type='visi';
      if (this.f.poolDataType.value=="Monitored") type='moni';
      if (this.f.poolDataType.value=="Mine") type='mine';
      if (this.f.poolDataType.value=="Review") type='revu';
      return type;
    }

    //respond to a click on the 'Zoom Only' checkbox
    filterZoom(e) {
      this.zoomFilter = e.target.checked;
      this.uxValuesService.filterParams.zoomFilter = this.zoomFilter;
      console.log('filterZoom')
      this.loadPools(1);
    }

    //respond to a click on the 'Has Species' checkbox
    hasIndicatorsChecked(e) {
      this.hasIndicators = e.target.checked;
      this.uxValuesService.filterParams.hasIndicators = this.hasIndicators;
      console.log('hasIndicatorsChecked')
      this.loadPools(1);
    }
    hasIndicatorsSetValue(value=true) {
      this.hasIndicators = value;
      this.uxValuesService.filterParams.hasIndicators = this.hasIndicators;
    }

/*
TypeError: t is undefined - AngularFixing
Jul 7, 2022 Solution Usually when you get the TypeError: t is undefined error in your console it's because the script 
can't process one or more of the variables that it's tried to create based on the input field you've targeted. Most 
of the time this is due to targeting the incorrect element (i.e. targeting the parent container instead of the actual input).

ERROR TypeError: Cannot read properties of undefined (reading '_rawValidators')
https://stackoverflow.com/questions/69028717/typeerror-cannot-read-property-rawvalidators-of-null-after-ng-build
*/
    loadPools(page=0) {
      console.log(`loadPools | values:`, this.f.poolId.value, this.f.town.value.townName, this.f.userName.value);

      this.alertService.clear();
      this.uxValuesService.filterParams.poolId = this.f.poolId.value;
      this.uxValuesService.filterParams.town = this.f.town.value;
      this.uxValuesService.filterParams.userName = this.f.userName.value;

      if (this.loadAllRec) {
        this.loadUpdated(this.getType());
      } else {
        if (page) {this.page = page;}
        this.loadUpdated(this.getType(), this.page);
      }
      // Handle special zoomTo behavior of a selected town or Pool
      // zoomTo sends message to leaflet map's ngOnChanges to zoom to town, etc.
      let townName = this.f.town.value.townName;
      
      if ('All' == townName) {
          this.zoomTo = {option:'Vermont', value:{}};
      } else {
        this.zoomTo = {option:'Town', value:townName};
      }
      if (this.f.poolId.value) {
        this.zoomTo = {option:'Pool', value: this.f.poolId.value};
      }
    }

    firstPage() {
        this.page=1
        this.loadUpdated(this.getType(), this.page);
    }

    nextPage() {
        this.page++;
        if (this.page > this.last) this.page = this.last;
        this.loadUpdated(this.getType(), this.page);
    }

    prevPage() {
      this.page--; if (this.page < 1) this.page = 1;
      this.loadUpdated(this.getType(), this.page);
    }

    lastPage() {
      this.page = this.last;
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

    /*
      retrieve values of search filter items to pass to loadUpdated
    */
    getSearch() {
      this.search = {};
      if (!this.zoomFilter) {
        if (this.f.poolId.value) this.search.poolId=this.f.poolId.value;
        if (this.f.town.value && this.f.town.value.townName!='All') this.search.town=this.f.town.value.townName;
      }
      if (this.f.userName.value) this.search.userName=this.f.userName.value;
      this.search.hasIndicators=this.hasIndicators; //variable tracks checkbox value
      
      console.log('getSearch | ', this.search);
    }

    setQuery() {
      let query = <any> {};
      Object.assign(query, this.uxValuesService.filterParams);
      delete query.town;
      query.townName =  this.uxValuesService.filterParams.town.townName;
      console.log('setQuery', query);
      this.router.navigate([`/pools/list`], {queryParams: query, relativeTo: this.route});
    }

    loadUpdated(type='all', page=0) {
      this.getSearch();
      this.setQuery();
      console.log('vppools.list.component::loadUpdated | SEARCH', this.search);
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
    loadPoolStats() {
      this.vpMappedService.getStats(this.currentUser ? this.currentUser.username : null)
        .pipe(first())
        .subscribe(
          data => {
            this.stats = data.rows[0];
          },
          error => {
            this.alertService.error(error);
          });
    }

    ViewVisit(visitId) {
      if (visitId) this.router.navigate([`/pools/visit/view/${visitId}`], {queryParams: {returnUrl: this.router.url.split('?')[0] }});
    }
    CreateVisit(poolId) {
      if (poolId) this.router.navigate([`/pools/visit/create/${poolId}`], {queryParams: {returnUrl: this.router.url.split('?')[0] }});
    }
    ViewPoolVisits(poolId) {
      //if (poolId) {this.router.navigate([`/pools/list/${poolId}`], {queryParams: {'mapView':false, 'zoomFilter':false, 'returnUrl': this.router.url.split('?')[0]}});}
      if (poolId) {
        this.f.poolId.setValue(poolId);
        this.loadPools(1);
      }
    }

    //// TODO: distinguish btw viewing mapped pool and pool visit
    viewMappedPool(poolId) {
      this.router.navigate([`/pools/mapped/view/${poolId}`], {queryParams: {returnUrl: this.router.url.split('?')[0] }});
    }

    GetVisitReviews(visitId) {
      if (visitId) this.router.navigate([`review/list/${visitId}`], {queryParams: {returnUrl: this.router.url.split('?')[0] }});
    }
    ViewReview(reviewId) {
      if (reviewId) {this.router.navigate([`/review/view/${reviewId}`], {queryParams: {returnUrl: this.router.url.split('?')[0] }});}
    }
    CreateReview(visitId) {
      if (visitId) {this.router.navigate([`/review/create/${visitId}`], {queryParams: {returnUrl: this.router.url.split('?')[0] }});}
    }
    
    ViewSurvey(surveyId) {
      if (surveyId) {this.router.navigate([`/survey/view/${surveyId}`], {queryParams: {returnUrl: this.router.url.split('?')[0]  }});}
    }
    ViewPoolSurveys(surveyPoolId) {
      if (surveyPoolId) {this.router.navigate([`/survey/pool/${surveyPoolId}`], {queryParams: {returnUrl: this.router.url.split('?')[0] }});}
    }

    showMap() {
      if (this.loadAllRec == false) {
        this.loadAllRec = true;
        this.loadPools();
      }
      this.mapView = true;
      this.uxValuesService.filterParams.mapView = this.mapView;
      //this.uxValuesService.filterParams.zoomFilter = this.mapView;
    }

    showTable() {
      if (this.loadAllRec == true) { //table view is slow - don't default to 'Load All'
        this.loadAllRec = false;
        this.loadPools(); //await this.loadPools();
      }
      this.mapView = false;
      this.uxValuesService.filterParams.mapView = this.mapView;
      //this.uxValuesService.filterParams.zoomFilter = this.mapView;
    }

    clearTown() {
      this.filterForm.get("town").setValue(null);
      this.zoomTo = {option:'Vermont', value:{}};
      this.loadPools();
    }

    //To-Do: reset uxValues as well, and figure out what this home page reset really looks like
    /*
    - Set the URL
    - Set form control values
    - Set global uxValues

    Setting all those values is actually needed for every change of view.

    There should be a way to call a single method that handles all that at once.
    */
    ClearFilters() {
      this.filterForm.controls['poolId'].setValue('');
      this.filterForm.controls['userName'].setValue('');
      this.filterForm.controls['town'].setValue({townId:0, townName:"All", townCountyId:0});
      this.hasIndicatorsSetValue(false);
      console.log('ClearFilters')
      //setUserContextListViewPageRoute()
      this.loadPools(1);
      this.router.navigate([`/pools/list`], {queryParams: {}, relativeTo: this.route});
    }

    // This can only be done when/if we force all PoolIDs to be upper case.
    filterPoolId(e) {
      //this.filterForm.patchValue({poolId: e.target.value.toUpperCase()})
    }
}
