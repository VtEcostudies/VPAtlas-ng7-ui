import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpSurveyService } from '@app/_services';
import { UxValuesService } from '@app/_global';
import Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/

@Component({
  templateUrl: 'vpsurvey.list.component.html'
})

export class vpSurveyListComponent implements OnInit {
  currentUser = null;
  userIsAdmin = false;
  userIsOwner = false;
  returnUrl = "/pools/list";
  surveys = [];
  surveyPools = [];
  surveyTypes = ['All',1,2,3,4,9];
  count = 0;
  dataLoading = false;
  filterForm: FormGroup = this.formBuilder.group({});
  filter = '';

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

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/pools/list';
    //console.log('queryParams', this.route.snapshot.queryParams);
    //console.log('params', this.route.snapshot.params);
    //surveyId can be passed as a route param (survey/list/1234) or a query param (survey/list?surveyId=1234)
    var surveyId = this.route.snapshot.params['surveyId'];
    if (surveyId) surveyId=surveyId.split('?')[0];
    surveyId = surveyId ? surveyId : this.route.snapshot.queryParams['surveyId']
    this.filterForm = this.formBuilder.group({
        userName: [this.route.snapshot.queryParams['userName']],
        surveyId: [surveyId],
        poolId: [this.route.snapshot.queryParams['poolId']],
        surveyTypeId: [this.route.snapshot.queryParams['surveyTypeId']],
        surveyObserver: [this.route.snapshot.queryParams['surveyObserver']],
        surveyDateBeg: [],
        surveyDateEnd: []
      });
    this.LoadSurveyPools();
    this.LoadSurveys();
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
    //console.log('vpveview.create.component.LoadSurvey:', surveyId);
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

  async LoadSurveyPools() {
    this.surveyService.getPools()
        .pipe(first())
        .subscribe(
            data => {
              this.surveyPools = [{surveyPoolId:'All'}];
              data.rows.forEach(pool => {
                this.surveyPools.push(pool);
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
    if (this.f.poolId.value && this.f.poolId.value.surveyPoolId != 'All') {
      if (this.filter) {
        this.filter += `&logical${++i}=AND&`;
      }
      this.filter += `&surveyPoolId=${this.f.poolId.value.surveyPoolId}`; //exact match
    }
    if (this.f.userName.value) {
      if (this.filter) {
        this.filter += `&logical${++i}=AND&`;
      }
      this.filter += `surveyUserName|LIKE=%${this.f.userName.value}%`;
    }
    if (this.f.surveyTypeId.value && this.f.surveyTypeId.value != 'All') {
      if (this.filter) {
        this.filter += `&logical${++i}=AND&`;
      }
      this.filter += `surveyTypeId=${this.f.surveyTypeId.value}`;
    }
    if (this.f.surveyObserver.value) {
      if (this.filter) {
        this.filter += `&logical${++i}=AND&`;
      }
      this.filter += `surveyAmphibObsEmail|LIKE=%${this.f.surveyObserver.value}%`;
    }
    if (this.f.surveyDateBeg.value && this.f.surveyDateEnd.value) {
      if (this.filter) {
        this.filter += `&`; //`&logical${++i}=AND&`;
      }
      //this.filter += `surveyDate|BETWEEN='${this.f.surveyDateBeg.value}' AND '${this.f.surveyDateEnd.value}'`;
      this.filter += `surveyDateBeg=${this.f.surveyDateBeg.value}&`;
      this.filter += `surveyDateEnd=${this.f.surveyDateEnd.value}`;
    }
    console.log(this.filter);
  }

  ShowMacros(data) {
    var disp = '';
    data.split(',').forEach(ele => {
      disp += ele+'\n';
    })
    alert(disp);
  }
  ShowAmphib(data) {
    var disp = '';
    data.split(',').forEach(ele => {
      disp += ele+'\n';
    })
    alert(disp);
  }

  AddSurvey() {
    if (this.f.surveyId.value) {
      this.router.navigate([`/survey/create/${this.f.surveyId.value}`], {queryParams:{returnUrl:this.router.url}});
    } else {
      this.router.navigate([`/survey/create`], {queryParams:{returnUrl:this.router.url}});
    }
  }
  Cancel() {
    //this.router.navigate([this.returnUrl]);
  }

}
