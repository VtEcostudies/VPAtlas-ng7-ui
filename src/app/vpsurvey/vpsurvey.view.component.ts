import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { vpMapped } from '@app/_models';
import { vtTown } from '@app/_models';
import { AlertService, AuthenticationService, vpSurveyService } from '@app/_services';
import Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/

@Component({
  templateUrl: 'vpsurvey.view.component.html',
  styleUrls: ['styles.css']
})
export class vpSurveyViewComponent implements OnInit {
    currentUser = null;
    userIsAdmin = false;
    update = false;
    vpSurveyForm: FormGroup;
    towns = [];
    townCount = 0;
    dataLoading = false;
    submitted = false;
    survey: any = {};
    pool: vpMapped = new vpMapped();
    statuses = ['Potential', 'Probable', 'Confirmed', 'Eliminated', 'Duplicate'];
    mapPoints = true; //flag to plot pools on map as circleMarkers, passed to map via [mapPoints]="mapPoints"
    mapMarker = false; //flag to show/hide a moveable mapMarker. In view mode, this is always false.
    locMarker = null; //data to locate moveable mapMmarker, passed to map via [locMarker]="locMarker" - null when mapMarker not shown.
    itemType = "View Pool Survey";
    viewOnly = true; //flag that this is view-mode
    routeParams = {};
    returnUrl = null;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private vpSurveyService: vpSurveyService
    ) {
      if (this.authenticationService.currentUserValue) {
        this.currentUser = this.authenticationService.currentUserValue.user;
        this.userIsAdmin = this.currentUser.userrole == 'admin';
      } else {
        // redirect to survey list/search if user not logged-in
        //this.router.navigate(['/survey/list']);
      }
    }

    ngOnInit() {
      //this.authenticationService.check();

      console.log('route.snapshot.params', this.route.snapshot.params);
      this.routeParams = this.route.snapshot.params; //see app.routing.ts
      console.log('routeParams', this.routeParams);

      this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/survey/list';

      this.vpSurveyForm = this.formBuilder.group({

        surveyPoolId: [],
        surveyUserName: [],
        surveyDate: [],
        surveyTime: [],
        surveyLatitude: [],
        surveyLongitude: [],
        surveyType: [],
        poolStatus: [],
      });

      //Reactive form controls cannot be properly disabled with markup
      this.vpSurveyForm.disable();

      this.loadSurvey(this.route.snapshot.params.surveyId);
    }

    /*
      Update form fields with values loaded from db.
    */
    afterLoad() {
      this.vpSurveyForm.controls['surveyPoolId'].setValue(this.survey.surveyPoolId);
      this.vpSurveyForm.controls['surveyUserName'].setValue(this.survey.surveyUserName);
      this.vpSurveyForm.controls['surveyDate'].setValue(Moment(this.survey.surveyDate).format('YYYY-MM-DD'));
      this.vpSurveyForm.controls['surveyTime'].setValue(Moment(this.survey.surveyTime).format('HH:MM'));
      this.vpSurveyForm.controls['surveyLatitude'].setValue(this.survey.latitude);
      this.vpSurveyForm.controls['surveyLongitude'].setValue(this.survey.longitude);
      this.vpSurveyForm.controls['surveyType'].setValue(this.survey.surveyTypeName);
      this.vpSurveyForm.controls['poolStatus'].setValue(this.survey.poolStatus);
    }

    loadSurvey(surveyId) {
      this.dataLoading = true; //this forces a map update, which plots a point
      console.log('vpsurvey.view.component.ts::loadSurvey:', surveyId);
      this.vpSurveyService.getById(surveyId)
          .pipe(first())
          .subscribe(
              data => {
                console.log('vpsurvey.view.component.loadSurvey result:', data);
                this.survey = data[0];
                this.pool = data[0];
                this.dataLoading = false; //this forces a map update, which plots a point
                this.afterLoad();
              },
              error => {
                  this.alertService.error(error);
                  this.dataLoading = false; //this forces a map update, which plots a point
              });
    }

    // convenience getter for easy access to form fields
    get f() { return this.vpSurveyForm.controls; }

    ToEditMode() {
      this.router.navigate([`/pools/survey/update/${this.survey.surveyPoolId}`]);
    }

    cancel() {
      this.router.navigate(['/survey/list']);
    }

    //https://angular.io/api/forms/SelectControlValueAccessor#customizing-option-selection
    //https://www.concretepage.com/angular/angular-select-option-reactive-form#comparewith
    compareTownFn(t1: vtTown, t2: vtTown) {
      //console.log('vpsurvey.create.compareTownFn t1:', t1, ' t2:', t2);
      return t1 && t2 ? t1.townId === t2.townId : t1 === t2;
    }

}
