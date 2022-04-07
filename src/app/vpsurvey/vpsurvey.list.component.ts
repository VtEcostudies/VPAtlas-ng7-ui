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

  surveyTypeId = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private authenticationService: AuthenticationService,
    private alertService: AlertService,
    public uxValuesService: UxValuesService,
    private surveyService: vpSurveyService
  ) {
    if (this.authenticationService.currentUserValue) {
      this.currentUser = this.authenticationService.currentUserValue.user;
      this.userIsAdmin = this.currentUser.userrole == 'admin';
    }
  }

  async ngOnInit() {
    //console.log('route.snapshot.params', this.route.snapshot.params);
    this.routeParams = this.route.snapshot.params; //only this arg is allowed. see app.routing.ts
    this.queryParams = this.route.snapshot.queryParams
    console.log('routeParams', this.routeParams);
    console.log('queryParams', this.queryParams);
    //NOTE:surveyId can be passed as a route param (survey/list/1234) or a query param (survey/list?surveyId=1234)
    //NOTE: we can have both route and query params, so we need to join those into a single object...
    Object.assign(this.loadParams, this.routeParams, this.queryParams);

    console.log('loadParams BEFORE |', this.loadParams);

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/pools/list';

    if (Object.keys(this.loadParams).length === 0) {
      this.loadParams = this.uxValuesService.surveyListParams;
    }

    console.log('loadParams AFTER |', this.loadParams);

    this.filterForm = this.formBuilder.group({
        surveyId: [null], //[this.loadParams.surveyId],
        surveyPoolId: [null], //[{this.loadParams.surveyPoolId}],
        surveyType: [null], //[this.loadParams.surveyType],
        surveyYear: [null], //[this.loadParams.surveyYear],
        surveyDateBeg: [null], //[this.loadParams.surveyDateBeg],
        surveyDateEnd: [null], //[this.loadParams.surveyDateEnd],
        surveyUser: [null], //[this.loadParams.surveyUser],
        surveyObserver: [null] //[this.loadParams.surveyObserver]
      });
    await this.LoadSurveyPoolIds(); //these are needed to process loadParams
    await this.LoadSurveyObervers();
    await this.LoadSurveyYears();
    await this.LoadSurveyTypes()
      .then(count => {
        this.setFilterFormValues();
        this.LoadSurveys();
      })
  }

  setFilterFormValues() {
    this.filterForm.controls['surveyId'].setValue(this.loadParams.surveyId);

    console.log('setFilterFormValues | surveyPoolIds:', this.surveyPoolIds);
    let objPool = this.surveyPoolIds.find(o => {return o.surveyPoolId == this.loadParams.surveyPoolId;});
    this.filterForm.controls['surveyPoolId'].setValue(objPool?objPool:null);
    console.log('setFilterFormValues | surveyPoolId object search result:', objPool);

    let objType = this.surveyTypes.find(o => {return +o.surveyTypeId == +this.loadParams.surveyType;});
    this.filterForm.controls['surveyType'].setValue(objType?objType:null);
/*
    console.log('setFilterFormValues | surveyYears:', this.surveyYears);
    let objYear = this.surveyYears.find(o => {return +o.surveyYear == +this.loadParams.surveyYear;});
    this.filterForm.controls['surveyYear'].setValue(objYear?objYear:null);
    console.log('setFilterFormValues | surveyYear object search result:', objYear);
*/
    this.filterForm.controls['surveyDateBeg'].setValue(this.loadParams.surveyDateBeg);
    this.filterForm.controls['surveyDateEnd'].setValue(this.loadParams.surveyDateEnd);
    this.filterForm.controls['surveyUser'].setValue({surveyUserEmail:(this.loadParams.surveyUser||'All')});
    this.filterForm.controls['surveyObserver'].setValue({surveyObserverEmail:(this.loadParams.surveyObserver||'All')});
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

  setUxValues() {
    this.uxValuesService.surveyListParams.surveyId = this.f.surveyId.value;
    this.uxValuesService.surveyListParams.surveyPoolId = this.f.surveyPoolId.value?this.f.surveyPoolId.value.surveyPoolId:null;
    this.uxValuesService.surveyListParams.surveyType = this.f.surveyType.value?this.f.surveyType.value.surveyTypeId:0 ;
    this.uxValuesService.surveyListParams.surveyYear = this.f.surveyYear.value?this.f.surveyYear.value.surveyYear:'All';
    this.uxValuesService.surveyListParams.surveyDateBeg = this.f.surveyDateBeg.value;
    this.uxValuesService.surveyListParams.surveyDateEnd = this.f.surveyDateEnd.value;
    this.uxValuesService.surveyListParams.surveyUser = this.f.surveyUser.value?this.f.surveyUser.value.surveyUserEmail:null;
    this.uxValuesService.surveyListParams.surveyObserver = this.f.surveyObserver.value?this.f.surveyObserver.value.surveyObserverEmail:null;
  }

  SurveyTypeChange() {
    console.log('surveyTypeChange |', this.f.surveyType.value, this.f.surveyType.value.surveyTypeId);
    //this.uxValuesService.surveyListParams.surveyType = this.f.surveyType.value.surveyTypeId;
    this.LoadSurveys();
  }

  async LoadSurveys() {
    this.setUxValues();
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
  return new Promise((resolve, reject) => {
    this.surveyService.getTypes()
        .pipe(first())
        .subscribe(
            data => {
              this.surveyTypes = [{surveyTypeId:0, surveyTypeName:'All', surveyTypeDesc:'All Survey Types'}];
              data.rows.forEach(type => {
                this.surveyTypes.push(type);
              });
              resolve(this.surveyTypes.length);
            },
            error => {
                this.alertService.error(error);
                reject(0);
            });
    })
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
              console.log('LoadSurveyYears | surveyYears:', this.surveyYears);
              let objYear = this.surveyYears.find(o => {return o.surveyYear == this.loadParams.surveyYear;});
              this.filterForm.controls['surveyYear'].setValue(objYear?objYear:null);
              console.log('LoadSurveyYears | surveyYear object search result:', objYear);
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
    if (this.f.surveyType.value && this.f.surveyType.value.surveyTypeId != 0) {
      if (this.filter) {
        this.filter += `&logical${++i}=AND&`;
      }
      this.filter += `surveyTypeId=${this.f.surveyType.value.surveyTypeId}`;
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

    if (this.f.surveyUser.value && this.f.surveyUser.value.surveyUserEmail != 'All') {
      if (this.filter) {this.filter += `&logical${++i}=AND&`;}
      var filterValue = `${this.f.surveyUser.value.surveyUserEmail}`;
      if (filterValue.includes('*')) {
        this.filter += `surveyUserEmail|LIKE=${filterValue.replace(/\*/g,'%')}`; //partial match
      } else {
        this.filter += `surveyUserEmail=${filterValue}`; //exact match
      }
    }
    /*
      There is no 'surveyObserver' in vpsurvey. Instead, there is 'surveyAmphibObsEmail' and
      'surveyAmphibObsId' in vpsurvey_amphib. Standard table search doesn't support table
      joins without custom code.
    */
    if (this.f.surveyObserver.value && this.f.surveyObserver.value.surveyObserverEmail != 'All') {
      if (this.filter) {this.filter += `&logical${++i}=AND&`;}
      var filterValue = `${this.f.surveyObserver.value.surveyObserverEmail}`;
      if (filterValue.includes('*')) {
        this.filter += `surveyObserverEmail|LIKE=${filterValue.replace(/\*/g,'%')}`; //partial match
      } else {
        this.filter += `surveyObserverEmail=${filterValue}`; //exact match
      }
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

  comparePoolIdFn(p1: any, p2: string) {
    console.log('vpsurvey.list.comparePoolIdFn p1:', p1, ' p2:', p2);
    //return p1 && p2 ? p1.surveyPoolId === p2 : p1 === p2;
    console.log('p1 type:', typeof p1, 'p2 type:', typeof p2, p1.surveyTypeId ==- p2, p1.surveyTypeId == p2, `${p1.surveyPoolId}` === `${p2}`);
    return `${p1.surveyPoolId}` === `${p2}`;
  }

}
