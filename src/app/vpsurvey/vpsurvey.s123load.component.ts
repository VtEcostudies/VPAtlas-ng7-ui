import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpSurveyService } from '@app/_services';
import { UxValuesService } from '@app/_global';
import { environment } from '@environments/environment';
import { surveyDialogText } from '@app/vpsurvey/dialogText';
import { ModalService } from '@app/_modal';

@Component({
  templateUrl: 'vpsurvey.s123load.component.html',
  styleUrls: ['vpsurvey.styles.css']
})
export class vpSurveyS123LoadComponent implements OnInit {
    update = false; //flag for html config that we are editing an existing visit, not creating a new one
    currentUser = null;
    userIsAdmin = false;
    userIsOwner = false;
    returnUrl = '/survey/list';
    surveyForm: UntypedFormGroup = this.formBuilder.group({});
    upLoading = false; //flag that the form data is loading
    submitted = false; //flag that the form was submitted
    itemType = 'Survey123 Load Survey';
    surveyDialogText = surveyDialogText; //amazing but true... set this class var to the import type...
    s123counts = <any> {};
    s123results = <any> [];
    s123errors = <any> [];
    maxOffset = 1000;
    maxLimit = 100;

    constructor(
        private formBuilder: UntypedFormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private uxValuesService: UxValuesService,
        private vpSurveyService: vpSurveyService,
        private modalService: ModalService
    ) {
        this.authenticationService.check().catch(err => {console.log('authService.check error in vpsurvey.s123load.')});
        if (this.authenticationService.currentUserValue) {
          this.currentUser = this.authenticationService.currentUserValue.user;
          this.userIsAdmin = this.currentUser.userrole == 'admin';
        }
        if (!this.userIsAdmin) {
          this.router.navigate(['/']);
        }
    }

    async ngOnInit() {

      // get return url from route parameters or default to '/survey/list'
      console.log('vpsurvey.s123load.copmonenent | returnUrl:', this.route.snapshot.queryParams);
      this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/survey/list';

      await this.createFormControls();
    } //end ngOnInit

    openModal(id: string, infoId=null) {
        console.log('infoId', infoId);
        this.modalService.open(id, surveyDialogText[infoId]);
    }

    closeModal(id: string) {
        this.modalService.close(id);
    }

    async createFormControls() { //Create formcontrols within formgroups

      this.surveyForm = this.formBuilder.group({
        surveyUserName: [{value: this.currentUser.username, disabled: true}, Validators.required],
        surveyS123LoadUpdate: [false],
        surveyS123LoadOffset: [1],
        surveyS123LoadLimit: [1],
        surveyS123LoadAbort: [false]
      });
    } //end createFormControls()

    async setFormValues() {
    }

    private init() {
      this.s123counts = {success:0, errors:0, target:0, total:0, aborted:0};
      this.s123results = [];
      this.s123errors = [];
      this.alertService.clear();
    }

    // convenience getters for easy access to form fields
    get r() { return this.surveyForm.controls; }


    S123LoadSurveys() {
      var objArgs:any = {}; //target object to copy all form-object data to for submitting to API
      Object.assign(objArgs, this.surveyForm.getRawValue());
      const update = this.surveyForm.get('surveyS123LoadUpdate').value;
      const offset = this.surveyForm.get('surveyS123LoadOffset').value;
      const limit = this.surveyForm.get('surveyS123LoadLimit').value;
      var confirmLoad = 1;
      if (confirmLoad && offset > this.maxOffset) {
        if (!confirm(`There are not more than ${this.maxOffset} surveys to load. Are you sure you want to load Object ID ${offset}?`)) {
          confirmLoad = 0;
        }
      }
      if (confirmLoad && limit > this.maxLimit) {
        if (!confirm(`${limit} is a lot of surveys to load. Are you sure you want to proceed?`)) {
          confirmLoad = 0;
        }
      }
      if (confirmLoad) {
        this.init();
        this.upLoading = true;
        this.vpSurveyService.s123LoadData(objArgs, update, offset, limit)
            .pipe(first())
            .subscribe(
                data => {
                    console.log(`vpsurvey.s123load.component::uploadSurvey=>data:`, data);
                    this.upLoading = false;
                    this.s123counts = data.counts;
                    this.s123results = data.results;
                    this.s123errors = data.errors;
                    var msg = `Loaded ${data.counts.success}/${data.counts.target} S123 Surveys.`;
                    if (data.counts.errors) {msg += ` There were ${data.counts.errors} errors.`;}
                    if (data.counts.aborted) {msg += ` You aborted the S123 load at ${data.counts.total}/${data.counts.target}.`}
                    this.alertService.success(msg);
                },
                error => {
                    console.log(`vpsurvey.s123load.component::uploadSurvey=>error:`, error);
                    this.upLoading = false;
                    this.alertService.error(error);
                });
      }
    }

    AbortS123Load() {
      console.log('CancelS123Load');
      var objArgs:any = {};
      this.vpSurveyService.s123AbortLoad(objArgs)
          .pipe(first())
          .subscribe(
              data => {
                  console.log(`vpsurvey.s123load.component::abortS123Load=>data:`, data);
                  this.upLoading = false;
                  this.alertService.success(data.rows[0].message);
              },
              error => {
                  console.log(`vpsurvey.s123load.component::abortS123Load=>data:`, error);
                  this.upLoading = false;
                  this.alertService.error(error);
              });
    }

    CancelS123Load() {
      console.log('CancelS123Load');
      this.router.navigate([this.returnUrl]);
    }

    Alert(detail, where) {
      //console.log('Alert', detail, where);
      alert(`Detail:${detail}\nWhere:${where}`);
    }
}
