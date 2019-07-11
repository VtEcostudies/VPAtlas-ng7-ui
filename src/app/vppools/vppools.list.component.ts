import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, UserService, AuthenticationService, vpMappedService, vpPoolsService } from '@app/_services';
import { vpMapped, vpVisit } from '@app/_models';

//@add_component_here
@Component({templateUrl: 'vppools.list.component.html'})
export class vpListComponent implements OnInit {
    filterForm: FormGroup;
    loading = false;
    stats = null;
    page = 1;
    pageSize = 10;
    loadAllRec = true; //flag to load by page or to load all at once
    last = 1;
    count: number = 1;
    filter = '';
    mapPoints = true; //flag to plot pools on map as circleMarkers, passed to map via [mapPoints]="mapPoints"
    pools: vpMapped[] = []; //data array from db having lat and lon values to plot on map
    itemType = 'Pools/Visits'; //used by leaflet map to format popup content, etc.
    mapView = true; //flag to toggle between table and map view - TODO: setting should persist across data loads

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private vpMappedService: vpMappedService,
        private vpPoolsService: vpPoolsService
    ) {}

    // convenience getter for easy access to form fields
    get f() { return this.filterForm.controls; }

    async ngOnInit() {
      //these are the pool search filter fields
      this.filterForm = this.formBuilder.group({
          visitId: [''],
          visitPoolId: [''],
          visitUserName: [''],
          visitTown: [''],
          mappedPoolStatus: ['']
      });
      await this.loadPoolStats();
      //and load page 1 (or all if loadAllRec defaults to true)
      this.loadPools(1);
    }

    //how to handle UI changes from checkbox input when NOT a formControl in a formGroup:
    //https://stackoverflow.com/questions/47068222/angular-4-checkbox-change-value?rq=1
    //https://stackoverflow.com/questions/50697456/checkbox-not-working-in-angular-4
    //https://stackoverflow.com/questions/51453322/cant-uncheck-programatically-after-manual-check-on-a-checkbox-angular
    checkBoxValueChanged(e) {
        console.log('checkBoxValueChanged: ', e.target.checked);
        this.loadAllRec = e.target.checked;
        this.loadPools();
    }

    setStatusLoadPools(status="") {
      if (status=="Monitored") {
        this.alertService.error("Monitored Pools are not implemented in VPAtlas yet.");
        return;
      }
      this.filterForm.get("mappedPoolStatus").setValue(status);
      this.loadPools();
    }

    loadPools(page=0) {
      this.alertService.clear();
      if (this.loadAllRec) {
        this.loadAll();
      } else {
        if (page) {this.page = page;}
        this.loadPage(this.page);
      }
    }

    /*
      Construct an SQL WHERE clause search filter to be passed to vpvisit.services
      to filter db query results.
      Put the value of that fileter into the class variable.
    */
    getFilter() {
      this.filter = ''; //must clear first to undo filters

      if (this.f.visitId.value) {
        this.filter += `visitId=${this.f.visitId.value}`;
      }

      if (this.f.visitPoolId.value) {
        if (this.filter) {
          this.filter += '&';
        }
        this.filter += `visitPoolId|LIKE=%${this.f.visitPoolId.value}%`;
      }

      if (this.f.visitUserName.value) {
        if (this.filter) {
          this.filter += '&';
        }
        this.filter += `visitUserName|LIKE=%${this.f.visitUserName.value}%`;
      }

      if (this.f.visitTown.value) {
        if (this.filter) {
          this.filter += '&';
        }
        this.filter += `vptown."townName"|LIKE=%${this.f.visitTown.value}%`;
      }

      if (this.f.mappedPoolStatus.value) {
        if (this.filter) {
          this.filter += '&';
        }
        this.filter += `mappedPoolStatus=${this.f.mappedPoolStatus.value}`;
      }

      console.log('vppools.list.getfilter()', this.filter);
    }

    firstPage() {
        this.page=1
        this.loadPage(this.page);
    }

    nextPage() {
        this.loadPage(++this.page);
    }

    prevPage() {
      this.loadPage(--this.page);
    }

    lastPage() {
      this.page = this.last;
      this.loadPage(this.page);
    }

    setLast() {
      this.last = this.count/this.pageSize;

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

    async loadPoolStats() {
      this.loading = true;
      this.vpMappedService.getStats()
          .pipe(first())
          .subscribe(
              data => {
                this.stats = data.rows[0];
                this.loading = false;
              },
              error => {
                this.alertService.error(error);
                this.loading = false;
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

    showMap() {
      this.mapView = true;
    }

    showTable() {
      this.mapView = false;
    }
}
