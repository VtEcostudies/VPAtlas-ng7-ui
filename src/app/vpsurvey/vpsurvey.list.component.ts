import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpSurveyService } from '@app/_services';
import { UxValuesService } from '@app/_global';
import Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/

@Component({
  templateUrl: 'vpsurvey.list.component.html',
  styleUrls: ['vpsurvey.styles.css']
})

export class vpSurveyListComponent implements OnInit {
  currentUser = null;
  userIsAdmin = false;
  userIsOwner = false;
  returnUrl = "/pools/list";
  surveys = [];
  surveyPoolIds = [];
  surveyYears = [];
  surveyTypes = []; //['All',1,2,3,4,9];
  surveyUsers = [];
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

    //After all that, if there are no route or query params, then we arrived here unconstrained, and we use
    //uxValuesService values.
    if (Object.keys(this.loadParams).length === 0) {
      this.loadParams = this.uxValuesService.surveyListParams;
    }

    console.log('loadParams AFTER |', this.loadParams);

    this.filterForm = this.formBuilder.group({
        surveyId: [null],
        surveyPoolId: [null],
        surveyType: [null],
        surveyYear: [null],
        surveyDateBeg: [null],
        surveyDateEnd: [null],
        surveyUser: [null],
        surveyObserver: [null]
      });
    this.LoadSurveyPoolIds()
      .then(res => {
        this.LoadSurveyYears()
          .then(res => {
            this.LoadSurveyTypes()
              .then(async res => {
                //this.LoadSurveyUsers()
                  //.then(async res => {
                    await this.setFilterFormValues();
                    this.LoadSurveys();
                  //})
              })
          })
      })
  }

  //NOTE: It's a project to set the value of a SELECT-OPTION populated with an array of object. The
  //below works. This simple solution came from trying everything else. Don't mess with it.
  setFilterFormValues() {
    this.filterForm.controls['surveyId'].setValue(this.loadParams.surveyId);

    let objPool = this.surveyPoolIds.find(o => {return o.surveyPoolId == this.loadParams.surveyPoolId;});
    this.filterForm.controls['surveyPoolId'].setValue(objPool?objPool:null);

    let objType = this.surveyTypes.find(o => {return +o.surveyTypeId == +this.loadParams.surveyType;});
    this.filterForm.controls['surveyType'].setValue(objType?objType:null);

    let objYear = this.surveyYears.find(o => {return o.surveyYear == this.loadParams.surveyYear;});
    this.filterForm.controls['surveyYear'].setValue(objYear?objYear:null);

    this.filterForm.controls['surveyDateBeg'].setValue(this.loadParams.surveyDateBeg);
    this.filterForm.controls['surveyDateEnd'].setValue(this.loadParams.surveyDateEnd);

    let objUser = this.surveyUsers.find(o => {return o.surveyUserName == this.loadParams.surveyUser;});
    this.filterForm.controls['surveyUser'].setValue(objUser?objUser:null);
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

  async Init() {
    this.loadParams['surveyId']=null;
    this.loadParams['surveyPoolId']='All';
    this.loadParams['surveyType']=0;
    this.loadParams['surveyYear']='All';
    this.loadParams['surveyDateBeg']=null;
    this.loadParams['surveyDateEnd']=null;
    this.loadParams['surveyUser']='All';
    this.loadParams['surveyObserver']='All';
    await this.setFilterFormValues();
    this.LoadSurveys();
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

  async LoadSurveys() {
    return new Promise(async (resolve, reject) => {
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
    });
  }

  LoadSurveyPoolIds() {
    return new Promise((resolve, reject) => {
      this.surveyService.getPoolIds()
        .pipe(first())
        .subscribe(
            data => {
              this.surveyPoolIds = [{surveyPoolId:'All'}];
              data.rows.forEach(pool => {
                this.surveyPoolIds.push(pool);
              });
              resolve(this.surveyPoolIds.length);
            },
            error => {
              this.alertService.error(error);
              reject(0);
            });
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
    });
  }

  LoadSurveyUsers() {
    return new Promise((resolve, reject) => {
      this.surveyService.getObservers()
        .pipe(first())
        .subscribe(
            data => {
              this.surveyUsers = [{surveyUserName:'All'}];
              data.rows.forEach(user => {
                this.surveyUsers.push(user);
              });
              resolve(this.surveyUsers.length);
            },
            error => {
              this.alertService.error(error);
              reject(0)
            });
    });
  }

  LoadSurveyYears() {
    return new Promise((resolve, reject) => {
      this.surveyService.getYears()
        .pipe(first())
        .subscribe(
            data => {
              this.surveyYears = [{surveyYear:'All'}];
              data.rows.forEach(year => {
                this.surveyYears.push(year);
              });
              resolve(this.surveyYears.length);
            },
            error => {
              this.alertService.error(error);
              reject(0);
            });
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

    //NOTE: we search and use parameters by surveyUserName, but we query by surveyUserEmail
    if (this.f.surveyUser.value && this.f.surveyUser.value.surveyUserName != 'All') {
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
    this.router.navigate(['/survey/s123load']);
  }
  Clear() {
    this.Init()
  }
  Cancel() {
    this.router.navigate([this.returnUrl]);
  }
}
