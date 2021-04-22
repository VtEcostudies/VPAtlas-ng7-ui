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
    uploadFile = '';
    uploadFileName = '';

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
        //these values are always set from the context, so they're disabled by default
        surveyUserName: [{value: this.currentUser.username, disabled: true}, Validators.required],
      });
    } //end createFormControls()

    async setFormValues() {
    }

    // convenience getters for easy access to form fields
    get r() { return this.surveyForm.controls; }

    FileUploadEvent(e) {
      console.log('FileUploadEvent | file selected:', e.target.files[0]);
      this.uploadFile = e.target.files[0];
    }

    UploadSurvey() {
      this.upLoading = true;
      console.log('UploadSurvey', this.uploadFile);
      this.vpSurveyService.uploadFile(this.uploadFile, this.update)
          .pipe(first())
          .subscribe(
              data => {
                  console.log(`vpsurvey.upload.component::uploadSurvey=>data:`, data);
                  this.upLoading = false;
                  this.surveyIds = data.rows;
              },
              error => {
                  console.log(`vpsurvey.upload.component::uploadSurvey=>error: ${error}`);
                  this.upLoading = false;
                  this.alertService.error(error);
              });
    }

    CancelUpload() {
      console.log('CancelUpload');
      this.router.navigate([this.returnUrl]);
    }
}
