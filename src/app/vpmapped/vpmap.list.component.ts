import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, UserService, AuthenticationService, vpMappedService } from '@app/_services';

//import { vpMapped } from '@app/_models';
//import { pgFields, pgVpMappedApi  } from '@app/_models';

//@add_component_here
@Component({templateUrl: 'vpmap.list.component.html'})
export class vpMapListComponent implements OnInit {
    filterForm: FormGroup;
    loading = false;
    page = 1;
    pageSize = 10;
    last = 1;
    count: number = 1;
    filter = '';
    vpmap = []; //data array from db
    //vpmap: vpMapped = [];
    //pgApi: pgVpMappedApi;
    mapView = false; //flag to toggle between table and map view - TODO: setting should persist across data loads

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private vpMappedService: vpMappedService
    ) {
        // redirect to home if user not logged in - the API can't handle no-token access (yet)
        if (!this.authenticationService.currentUserValue) {
            this.router.navigate(['/login']);
        }
    }

    // convenience getter for easy access to form fields
    get f() { return this.filterForm.controls; }

    ngOnInit() {
      this.filterForm = this.formBuilder.group({
          mappedPoolId: [''],
          mappedByUser: [''],
          mappedConfidence: [''],
          mappedLocation: [{value: '', disabled: true}]
      });
      //and load page 1
      this.firstPage();
    }

    /*
      Construct an SQL WHERE clause search filter to be passed to vpmapped.services
      to filter db query results.
      Put the value of that fileter into the class variable.
    */
    getFilter() {
      this.filter = ''; //must clear first to undo filters

      if (this.f.mappedPoolId.value) {
        this.filter += `mappedPoolId|LIKE=%${this.f.mappedPoolId.value}%`;
      }

      if (this.f.mappedByUser.value) {
        if (this.filter) {
          this.filter += '&';
        }
        this.filter += `mappedByUser|LIKE=%${this.f.mappedByUser.value}%`;
      }

      if (this.f.mappedConfidence.value) {
        if (this.filter) {
          this.filter += '&';
        }
        this.filter += `mappedConfidence=${this.f.mappedConfidence.value}`;
      }

      if (this.f.mappedLocation.value) {
        if (this.filter) {
          this.filter += '&';
        }
        this.filter += `mappedLocation=${this.f.mappedLocation.value}`;
      }

      console.log('vpmap.list.components.ts::getfilter()', this.filter);
    }

    //a stub that does nothing for now
    filterLocation() {

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
      this.loading = true;
      this.getFilter();
      if (this.page < 1) this.page = 1;
      if (this.page > this.last) this.page = this.last;
      this.vpMappedService.getPage(this.page, this.filter)
          .pipe(first())
          .subscribe(
              data => {
                this.vpmap = data.rows;
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
      this.loading = true;
      this.getFilter();
      this.vpMappedService.getAll(this.filter)
          .pipe(first())
          .subscribe(
              data => {
                this.vpmap = data.rows;
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
      this.mapView = true;
    }

    showTable() {
      this.mapView = false;
    }
}
