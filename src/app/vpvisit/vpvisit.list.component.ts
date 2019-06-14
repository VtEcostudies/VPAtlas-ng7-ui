import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, UserService, AuthenticationService, vpVisitService } from '@app/_services';

//@add_component_here
@Component({templateUrl: 'vpvisit.list.component.html'})
export class vpVisitListComponent implements OnInit {
    filterForm: FormGroup;
    loading = false;
    page = 1;
    pageSize = 10;
    loadAllRec = false; //flag to load by page or to load all at once
    last = 1;
    count: number = 1;
    filter = '';
    vpvisit = []; //data array from db
    mapView = false; //flag to toggle between table and map view - TODO: setting should persist across data loads

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private vpVisitService: vpVisitService
    ) {
        // redirect to home if user not logged in - the API can't handle no-token access (yet)
        if (!this.authenticationService.currentUserValue) {
            //this.router.navigate(['/login']);
        }
    }

    // convenience getter for easy access to form fields
    get f() { return this.filterForm.controls; }

    ngOnInit() {
      //these are the pool search filter fields
      this.filterForm = this.formBuilder.group({
          visitId: [''],
          visitPoolId: [''],
          visitUser: [''],
          visitTown: [''],
      });
      //and load page 1
      this.firstPage();
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

    loadPools() {
      if (this.loadAllRec) {
        this.loadAll();
      } else {
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

      if (this.f.visitUser.value) {
        if (this.filter) {
          this.filter += '&';
        }
        this.filter += `visitUser|LIKE=%${this.f.visitUser.value}%`;
      }

      if (this.f.visitTown.value) {
        if (this.filter) {
          this.filter += '&';
        }
        this.filter += `vptown."townName"|LIKE=%${this.f.visitTown.value}%`;
      }

      console.log('vpvisit.list.components.ts::getfilter()', this.filter);
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
      this.loadAllRec = false;
      this.loading = true;
      this.getFilter();
      if (this.page < 1) this.page = 1;
      if (this.page > this.last) this.page = this.last;
      this.vpVisitService.getPage(this.page, this.filter)
          .pipe(first())
          .subscribe(
              data => {
                this.vpvisit = data.rows;
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
      this.loadAllRec = true;
      this.loading = true;
      this.getFilter();
      this.vpVisitService.getAll(this.filter)
          .pipe(first())
          .subscribe(
              data => {
                this.vpvisit = data.rows;
                this.count = data.rowCount;
                this.setLast();
                this.loading = false;
              },
              error => {
                this.alertService.error(error);
                this.loading = false;
              });

    }

    viewVisit (visitId) {
      this.router.navigate([`/pools/visit/view/${visitId}`]);
    }

    showMap() {
      this.mapView = true;
    }

    showTable() {
      this.mapView = false;
    }
}
