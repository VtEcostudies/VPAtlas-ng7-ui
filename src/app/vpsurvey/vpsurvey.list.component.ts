import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpSurveyService } from '@app/_services';
import { UxValuesService } from '@app/_global';
import Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/

@Component({
  templateUrl: 'vpsurvey.list.component.html',
  styleUrls: ['styles.css']
})

export class vpSurveyListComponent implements OnInit {
  currentUser = null;
  userIsAdmin = false;
  userIsOwner = false;
  returnUrl = "/pools/list";
  surveys = [];
  surveyPoolIds = [];
  surveyObs = [];
  surveyYears = [];
  surveyTypes = []; //['All',1,2,3,4,9];
  count = 0;
  dataLoading = false;
  filterForm: FormGroup = this.formBuilder.group({});
  filter = '';
  routeParams: any = {};
  queryParams: any = {};
  loadParams: any = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private authenticationService: AuthenticationService,
    private alertService: AlertService,
    private surveyService: vpSurveyService
  ) {
    if (this.authenticationService.currentUserValue) {
      this.currentUser = this.authenticationService.currentUserValue.user;
      this.userIsAdmin = this.currentUser.userrole == 'admin';
    }
  }

  async ngOnInit() {
    console.log('route.snapshot.params', this.route.snapshot.params);
    this.routeParams = this.route.snapshot.params; //only this arg is allowed. see app.routing.ts
    this.queryParams = this.route.snapshot.queryParams
    console.log('routeParams', this.routeParams);
    console.log('queryParams', this.queryParams);
    //NOTE:surveyId can be passed as a route param (survey/list/1234) or a query param (survey/list?surveyId=1234)
    //NOTE: we can have both route and query params, so we need to join those into a single object...
    Object.assign(this.loadParams, this.routeParams, this.queryParams);

    console.log('loadParams', this.loadParams);

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/pools/list';

    this.filterForm = this.formBuilder.group({
        surveyId: [this.loadParams.surveyId],
        surveyPoolId: [{surveyPoolId:this.loadParams.surveyPoolId}],
        surveyUserEmail: [this.loadParams.surveyUserEmail],
        surveyTypeId: [this.loadParams.surveyTypeId],
        surveyObserver: [this.loadParams.surveyObserver],
        surveyYear: [this.loadParams.surveyYear],
        surveyDateBeg: [this.loadParams.surveyDateBeg],
        surveyDateEnd: [this.loadParams.surveyDateEnd]
      });
    await this.setFilterFormValues();
    await this.LoadSurveyPoolIds(); //these are needed to process loadParams
    await this.LoadSurveyTypes();
    await this.LoadSurveyObervers();
    await this.LoadSurveyYears();

    this.LoadSurveys();
  }

  setFilterFormValues() {
    this.filterForm.controls['surveyId'].setValue(this.loadParams.surveyId);
    this.filterForm.controls['surveyPoolId'].setValue({surveyPoolId:this.loadParams.surveyPoolId||'All'});
    this.filterForm.controls['surveyUserEmail'].setValue(this.loadParams.surveyUserEmail);
    this.filterForm.controls['surveyTypeId'].setValue(this.loadParams.surveyTypeId);
    this.filterForm.controls['surveyObserver'].setValue({surveyObserver:this.loadParams.surveyObserver||'All'});
    this.filterForm.controls['surveyYear'].setValue({surveyYear:this.loadParams.surveyYear||'All'});
    this.filterForm.controls['surveyDateBeg'].setValue(this.loadParams.surveyDateBeg);
    this.filterForm.controls['surveyDateEnd'].setValue(this.loadParams.surveyDateEnd);
  }

  filterRow(row:any) {
    if (row.surveyAmphib) {
      row.surveyAmphib = JSON.stringify(row.surveyAmphib);
    }
    if (row.surveyMacros) {
      row.surveyMacros = JSON.stringify(row.surveyMacros);
    }
    return row;
  }

  async LoadSurveys() {
    await this.getFilter();
    this.dataLoading = true;
    this.alertService.clear();
    this.surveyService.getAll(this.filter)
        .pipe(first())
        .subscribe(
            data => {
              this.surveys = data.rows.filter(row => this.filterRow(row));
              this.count = data.rowCount;
              this.dataLoading = false;
            },
            error => {
                this.alertService.error(error);
                this.dataLoading = false;
            });
  }

  LoadSurveyPoolIds() {
    this.surveyService.getPoolIds()
        .pipe(first())
        .subscribe(
            data => {
              this.surveyPoolIds = [{surveyPoolId:'All'}];
              data.rows.forEach(pool => {
                this.surveyPoolIds.push(pool);
              })
            },
            error => {
                this.alertService.error(error);
            });
  }

  LoadSurveyTypes() {
    this.surveyService.getTypes()
        .pipe(first())
        .subscribe(
            data => {
              this.surveyTypes = [{surveyTypeId:'All', surveyTypeName:'All'}];
              data.rows.forEach(type => {
                this.surveyTypes.push(type);
              })
            },
            error => {
                this.alertService.error(error);
            });
  }

  LoadSurveyObervers() {
    this.surveyService.getObservers()
        .pipe(first())
        .subscribe(
            data => {
              this.surveyObs = [{surveyObserver:'All'}];
              data.rows.forEach(obs => {
                this.surveyObs.push(obs);
              })
            },
            error => {
                this.alertService.error(error);
            });
  }

  LoadSurveyYears() {
    this.surveyService.getYears()
        .pipe(first())
        .subscribe(
            data => {
              this.surveyYears = [{surveyYear:'All'}];
              data.rows.forEach(year => {
                this.surveyYears.push(year);
              })
            },
            error => {
                this.alertService.error(error);
            });
  }

  // convenience getter for easy access to form fields
  get f() { return this.filterForm.controls; }

  getFilter() {
    this.filter = ''; //must clear first to undo filters
    var i = 0;

    if (this.f.surveyId.value) {
      this.filter += `surveyId=${this.f.surveyId.value}`;
    }
    if (this.f.surveyPoolId.value && this.f.surveyPoolId.value.surveyPoolId != 'All') {
      if (this.filter) {
        this.filter += `&logical${++i}=AND&`;
      }
      this.filter += `surveyPoolId=${this.f.surveyPoolId.value.surveyPoolId}`; //exact match
    }
    if (this.f.surveyUserEmail.value) {
      if (this.filter) {this.filter += `&logical${++i}=AND&`;}
      var filterValue = `${this.f.surveyUserEmail.value}`;
      if (filterValue.includes('*')) {
        this.filter += `surveyUserEmail|LIKE=${filterValue.replace(/\*/g,'%')}`; //partial match
      } else {
        this.filter += `surveyUserEmail=${filterValue}`; //exact match
      }
    }
    if (this.f.surveyTypeId.value && this.f.surveyTypeId.value.surveyTypeId != 'All') {
      if (this.filter) {
        this.filter += `&logical${++i}=AND&`;
      }
      this.filter += `surveyTypeId=${this.f.surveyTypeId.value.surveyTypeId}`;
    }
    /*
      There is no 'surveyObserver' in vpsurvey. Instead, there is 'surveyAmphibObsEmail' and
      'surveyAmphibObsId' in vpsurvey_amphib. Standard table search doesn't support table
      joins without custom code.
    */
    if (this.f.surveyObserver.value && this.f.surveyObserver.value.surveyObserver != 'All') {
      if (this.filter) {this.filter += `&logical${++i}=AND&`;}
      var filterValue = `${this.f.surveyObserver.value.surveyObserver}`;
      if (filterValue.includes('*')) {
        this.filter += `surveyObserver|LIKE=${filterValue.replace(/\*/g,'%')}`; //partial match
      } else {
        this.filter += `surveyObserver=${filterValue}`; //exact match
      }
    }
    if (this.f.surveyYear.value && this.f.surveyYear.value.surveyYear != 'All') {
      if (this.filter) {this.filter += `&logical${++i}=AND&`;}
      var filterValue = `${this.f.surveyYear.value.surveyYear}`;
      this.filter += `surveyYear=${filterValue}`; //exact match
    }
    if (this.f.surveyDateBeg.value && this.f.surveyDateEnd.value) {
      if (this.filter) {
        this.filter += `&`; //`&logical${++i}=AND&`;
      }
      //this.filter += `surveyDate|BETWEEN='${this.f.surveyDateBeg.value}' AND '${this.f.surveyDateEnd.value}'`;
      this.filter += `surveyDateBeg=${this.f.surveyDateBeg.value}&`;
      this.filter += `surveyDateEnd=${this.f.surveyDateEnd.value}`;
    }
    console.log('vpsurvey.list.component::getFilter', this.filter);
  }

  ShowJson(data) {
    console.log(data);
    var disp = '';
    if (typeof data != 'object') {
      data = JSON.parse(data);
    }
    Object.keys(data).forEach(key => {
      if (typeof data[key] == 'object') {
        var obj = data[key];
        Object.keys(obj).forEach(cay => {
          disp += `${key} - ${cay}: ${obj[cay]}\n`;
        })
      } else {
        disp += `${key}: ${data[key]}\n`;
      }
    })
    alert(disp);
  }

  Add() {
    this.router.navigate(['/survey/upload']);
  }

  Cancel() {
    this.router.navigate([this.returnUrl]);
  }

}
