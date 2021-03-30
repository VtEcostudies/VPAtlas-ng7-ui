import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpMappedService, vpPoolsService } from '@app/_services';
import { UxValuesService } from '@app/_global';
import { vpMapped, vpVisit } from '@app/_models';
import { poolsDialogText } from '@app/vppools/dialogText';
import { ModalService } from '@app/_modal';
import Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/

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
    zoomTo = {option:'Vermont', value:{}};
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
        private modalService: ModalService,
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
          poolDataType: [this.uxValuesService.poolDataType],
          visitId: [this.uxValuesService.filterVisitId],
          poolId: [this.uxValuesService.filterPoolId],
          userName: [this.uxValuesService.filterUserName],
          town: [this.uxValuesService.filterTown],
          mappedMethod: [this.uxValuesService.filterMappedMethod]
      });
      this.mapView = this.uxValuesService.mapView;
      this.loadAllRec = this.uxValuesService.loadAllRec;
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
      this.uxValuesService.loadAllRec = this.loadAllRec;
      this.loadPools();
    }

    checkBoxSetValue(value=true) {
      this.loadAllRec = value;
      this.uxValuesService.loadAllRec = this.loadAllRec;
      this.loadPools();
    }

    setDataTypeLoadPools(dataType="") {
      this.filterForm.get("userName").setValue(null);

      if (dataType=="Mine") {
        this.filterForm.get("userName").setValue(this.currentUser ? this.currentUser.username : null);
      }

      this.uxValuesService.poolDataType = dataType;

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

    townSelected() { //deprecated. logic moved to loadPools().
      this.loadPools(1);
      let townName = this.f.town.value.townName;
      if ('All' == townName) {
          this.zoomTo = {option:'Vermont', value:{}};
      } else {
        this.zoomTo = {option:'Town', value:townName};
      }
    }

    loadPools(page=0) {
      this.alertService.clear();
      this.uxValuesService.filterPoolId = this.f.poolId.value;
      this.uxValuesService.filterVisitId = this.f.visitId.value;
      this.uxValuesService.filterUserName = this.f.userName.value;
      this.uxValuesService.filterTown = this.f.town.value;
      this.uxValuesService.filterMappedMethod = this.f.mappedMethod.value;
      if (this.loadAllRec) {
        //this.loadAll();
        this.loadUpdated(this.getType());
      } else {
        if (page) {this.page = page;}
        //this.loadPage(this.page);
        this.loadUpdated(this.getType(), this.page);
      }
      //handle special behavior of a selected town.
      //zoomTo sends message to leaflet map's ngOnChanges to zoom to town, etc.
      let townName = this.f.town.value.townName;
      if ('All' == townName) {
          this.zoomTo = {option:'Vermont', value:{}};
      } else {
        this.zoomTo = {option:'Town', value:townName};
      }

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
      this.uxValuesService.getFilter(this.getType());
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
      this.uxValuesService.getFilter(this.getType());
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
      await this.getSearch();
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
      this.router.navigate([`review/list/${visitId}`], {queryParams:{returnUrl:this.router.url}});
    }

    async showMap() {
      if (this.loadAllRec == false) {
        this.loadAllRec = true;
        await this.loadPools();
      }
      this.mapView = true;
      this.uxValuesService.mapView = this.mapView;
    }

    async showTable() {
      if (this.loadAllRec == true) { //table view is slow - don't default to 'Load All'
        this.loadAllRec = false;
        await this.loadPools();
      }
      this.mapView = false;
      this.uxValuesService.mapView = this.mapView;
    }

    clearTown() {
      this.filterForm.get("town").setValue(null);
      this.zoomTo = {option:'Vermont', value:{}};
      this.loadPools();
    }

    ClearFilters() {
      this.filterForm.controls['visitId'].setValue('');
      this.filterForm.controls['poolId'].setValue('');
      this.filterForm.controls['userName'].setValue('');
      this.filterForm.controls['town'].setValue({townId:0, townName:"All", townCountyId:0});
      this.filterForm.controls['mappedMethod'].setValue('');
      this.loadPools(1);
    }
}
