import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, UserService, AuthenticationService, vpMappedService } from '@app/_services';
import { UxValuesService } from '@app/_global';

//import { vpMapped } from '@app/_models';
//import { pgFields, pgApiResults  } from '@app/_models';

//@add_component_here
@Component({templateUrl: 'vpmap.list.component.html'})
export class vpMapListComponent implements OnInit {
    filterForm: FormGroup;
    loading = false;
    page = 1;
    pageSize = 10;
    loadAllRec = true; //flag to load by page or to load all at once
    last = 1;
    count: number = 1;
    filter = '';
    mapPoints = true; //flag to plot pools on map as circleMarkers, passed to map via [mapPoints]="mapPoints"
    pools = []; //data array from db
    itemType = 'List Mapped Pool';
    //pools: vpMapped = [];
    //pgApi: pgApiResults;
    mapView = true; //flag to toggle between table and map view - TODO: setting should persist across data loads

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private authenticationService: AuthenticationService,
        private uxValuesService: UxValuesService,
        private alertService: AlertService,
        private vpMappedService: vpMappedService
    ) {
      if (this.authenticationService.currentUserValue) {
        this.currentUser = this.authenticationService.currentUserValue.user;
        this.userIsAdmin = this.currentUser.userrole == 'admin';
      } else {
        // redirect to home if user not logged-in
        this.router.navigate(['/']);
      }
    }

    // convenience getter for easy access to form fields
    get f() { return this.filterForm.controls; }

    ngOnInit() {
      this.authenticationService.check();
      console.log('vpmap.list.ngOnInit');
      //these are the pool search filter fields
      this.filterForm = this.formBuilder.group({
          mappedPoolId: [''],
          mappedByUser: [''],
          mappedTown: [{townId:0, townName:"All", townCountyId:0, townCentroid:null, townBorder:null}],
          mappedMethod: [''],
          mappedConfidence: ['']
      });
      this.uxValuesService.loadTowns();
      //and load page 1
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

    loadPools(page=0) {
      if (this.loadAllRec) {
        this.loadAll();
      } else {
        if (page) {this.page = page;}
        this.loadPage(this.page);
      }
    }

    /*
      Construct an SQL WHERE clause search filter to be passed to vpmapped.services
      to filter db query results.
      Put the value of that fileter into the class variable.
    */
    getFilter() {
      this.filter = ''; //must clear first to undo filters
      var i = 0;

      if (this.f.mappedPoolId.value) {
        this.filter += `mappedPoolId=${this.f.mappedPoolId.value}`;
      }

      if (this.f.mappedByUser.value) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        this.filter += `mappedByUser=${this.f.mappedByUser.value}`;
      }

      if (this.f.mappedTown.value && this.f.mappedTown.value.townName != 'All') {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        this.filter += `vptown."townName"=${this.f.mappedTown.value.townName}`;
      }

      if (this.f.mappedConfidence.value) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        this.filter += `mappedConfidence=${this.f.mappedConfidence.value}`;
      }

      if (this.f.mappedMethod.value) {
        if (this.filter) {
          this.filter += `&logical${++i}=AND&`;
        }
        this.filter += `mappedMethod=${this.f.mappedMethod.value}`;
      }

      console.log('vpmap.list.components.ts::getfilter()', this.filter);
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

    private loadPage(page) {
      //this.loadAllRec = false;
      this.loading = true;
      this.getFilter();
      if (this.page < 1) this.page = 1;
      if (this.page > this.last) this.page = this.last;
      this.vpMappedService.getPage(this.page, this.filter)
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

    private loadAll() {
      //this.loadAllRec = true;
      this.loading = true;
      this.getFilter();
      this.vpMappedService.getAll(this.filter)
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

    viewPool (mappedPoolId) {
      this.router.navigate([`/pools/mapped/view/${mappedPoolId}`]);
    }

    showMap() {
      if (this.loadAllRec == false) {
        this.loadAllRec = true;
        this.loadPools();
      }
      this.mapView = true;
    }

    showTable() {
      if (this.loadAllRec == true) { //table view is slow - don't default to 'Load All'
        this.loadAllRec = false;
        this.loadPools();
      }
      this.mapView = false;
    }

    clearTown() {
      this.filterForm.get("mappedTown").setValue(null);
      this.loadPools();
    }
}
