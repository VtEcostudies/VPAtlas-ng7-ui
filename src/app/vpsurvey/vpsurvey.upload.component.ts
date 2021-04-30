import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpSurveyService } from '@app/_services';
import { UxValuesService } from '@app/_global';
import Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/
import L from "leaflet";
import { vpVisit } from '@app/_models';
import { environment } from '@environments/environment';
import { surveyDialogText } from '@app/vpsurvey/dialogText';
import { ModalService } from '@app/_modal';

@Component({
  templateUrl: 'vpsurvey.component.html',
  styleUrls: ['styles.css']
})
export class vpSurveyUploadComponent implements OnInit {
    create = false; //aka insert
    update = false; //flag for html config that we are editing an existing visit, not creating a new one
    currentUser = null;
    userIsAdmin = false;
    userIsOwner = false;
    returnUrl = '/survey/list';
    surveyForm: FormGroup = this.formBuilder.group({});
    upLoading = false; //flag that the form data is loading
    submitted = false; //flag that the form was submitted
    itemType = 'Upload Survey';
    surveyDialogText = surveyDialogText; //amazing but true... set this class var to the import type...

    surveyIds = [];
    surveyUploadFile = {};
    surveyUploadFileName = '';

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private uxValuesService: UxValuesService,
        private vpSurveyService: vpSurveyService,
        private modalService: ModalService
    ) {
        this.authenticationService.check().catch(err => {console.log('authService.check error in vpsurvey.create.')});
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
      console.log('vpsurvey.create.copmonenent | returnUrl:', this.route.snapshot.queryParams);
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
        surveyUploadUpdate: [false],
        surveyUploadFile: [null]
      });
    } //end createFormControls()

    async setFormValues() {
    }

    private init() {
      this.surveyIds = [];
      this.alertService.clear();
    }

    // convenience getters for easy access to form fields
    get r() { return this.surveyForm.controls; }

    /*
      NOTE: see http://expressjs.com/en/resources/middleware/multer.html
      Multer processes multipart/form-data POST request into express req.body
      and req.file. To do this, the incoming request must have a form field name
      which matches the value used my MULTER to parse the request.

      This is weird, but that's how http was written. A POST http method includes
      form-data for various text fields and file data in a single request. MULTER
      needs the name of the 'Upload File' field within the request to know which
      field to process as a multipart file.

      Therefore our form name here, 'surveyUploadFile', is the field name expected
      by MULTER in the express API that receives this request.

      When using POSTMAN, POST body must include the 'Key' 'surveyUploadFile', whose
      'type' is 'File', and whose value is any filename.
    */
    FileUploadEvent(e) {
      this.init();
      const file = (e.target).files[0];
      console.log('FileUploadEvent | file selected:', file);
      this.surveyForm.patchValue({
          surveyUploadFile: file
        });
      this.surveyForm.get('surveyUploadFile').updateValueAndValidity();
    }

    UploadSurvey() {
      this.init();
      this.upLoading = true;
      this.update = this.surveyForm.get('surveyUploadUpdate').value;
      var formData: any = new FormData();
      formData.append("surveyUploadFile", this.surveyForm.get('surveyUploadFile').value);
      console.log('UploadSurvey | formData', formData);
      this.vpSurveyService.uploadFile(formData, this.update)
          .pipe(first())
          .subscribe(
              data => {
                  console.log(`vpsurvey.upload.component::uploadSurvey=>data:`, data);
                  this.upLoading = false;
                  this.surveyIds = data; //NOTE: the return from POST => INSERT/UPDATE is different from GET (ie. no rows[])
                  this.alertService.success(`Successfully uploaded ${data.length} rows of Survey data.`);
              },
              error => {
                  console.log(`vpsurvey.upload.component::uploadSurvey=>error:`, error);
                  this.upLoading = false;
                  this.alertService.error(error);
              });
    }

    CancelUpload() {
      console.log('CancelUpload');
      this.router.navigate([this.returnUrl]);
    }
}
