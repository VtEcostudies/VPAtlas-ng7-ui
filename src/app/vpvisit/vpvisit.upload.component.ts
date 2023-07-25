import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpVisitService } from '@app/_services';
import { UxValuesService } from '@app/_global';
import { environment } from '@environments/environment';
import { visitDialogText } from '@app/vpvisit/dialogText';
import { ModalService } from '@app/_modal';

@Component({
  templateUrl: 'vpvisit.upload.component.html',
  styleUrls: ['vpvisit.styles.css']
})
export class vpVisitUploadComponent implements OnInit {
    create = false; //aka insert
    update = false; //flag for html config that we are editing an existing visit, not creating a new one
    currentUser = null;
    userIsAdmin = false;
    userIsOwner = false;
    returnUrl = '/visit/list';
    visitForm: UntypedFormGroup = this.formBuilder.group({});
    upLoading = false; //flag that the form data is loading
    submitted = false; //flag that the form was submitted
    itemType = 'Upload Visit';
    visitDialogText = visitDialogText; //amazing but true... set this class var to the import type...

    visitIds = [];
    visitUploadFile = {};
    visitUploadFileName = '';

    constructor(
        private formBuilder: UntypedFormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private uxValuesService: UxValuesService,
        private vpVisitService: vpVisitService,
        private modalService: ModalService
    ) {
        this.authenticationService.check().catch(err => {console.log('authService.check error in vpvisit.create.')});
        if (this.authenticationService.currentUserValue) {
          this.currentUser = this.authenticationService.currentUserValue.user;
          this.userIsAdmin = this.currentUser.userrole == 'admin';
        }
        if (!this.userIsAdmin) {
          this.router.navigate(['/']);
        }
    }

    async ngOnInit() {

      // get return url from route parameters or default to '/visit/list'
      console.log('vpvisit.create.copmonenent | returnUrl:', this.route.snapshot.queryParams);
      this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/visit/list';

      await this.createFormControls();
    } //end ngOnInit

    openModal(id: string, infoId=null) {
        console.log('infoId', infoId);
        this.modalService.open(id, visitDialogText[infoId]);
    }

    closeModal(id: string) {
        this.modalService.close(id);
    }

    async createFormControls() { //Create formcontrols within formgroups

      this.visitForm = this.formBuilder.group({
        visitUserName: [{value: this.currentUser.username, disabled: true}, Validators.required],
        visitUploadUpdate: [false],
        visitUploadFile: [null]
      });
    } //end createFormControls()

    async setFormValues() {
    }

    private init() {
      this.visitIds = [];
      this.alertService.clear();
    }

    // convenience getters for easy access to form fields
    get r() { return this.visitForm.controls; }

    /*
      NOTE: see http://expressjs.com/en/resources/middleware/multer.html
      Multer processes multipart/form-data POST request into express req.body
      and req.file. To do this, the incoming request must have a form field name
      which matches the value used by MULTER to parse the request.

      This is weird, but that's how http was written. A POST http method includes
      form-data for various text fields and file data in a single request. MULTER
      needs the name of the 'Upload File' field within the request to know which
      field to process as a multipart file.

      Therefore our form name here, 'visitUploadFile', is the field name expected
      by MULTER in the express API that receives this request.

      When using POSTMAN, POST body must include the 'Key' 'visitUploadFile', whose
      'type' is 'File', and whose value is any filename.
    */
    FileUploadEvent(e) {
      this.init();
      const file = (e.target).files[0];
      console.log('FileUploadEvent | file selected:', file);
      this.visitForm.patchValue({
          visitUploadFile: file
        });
      this.visitForm.get('visitUploadFile').updateValueAndValidity();
    }

    UploadVisit() {
      this.init();
      this.upLoading = true;
      this.update = this.visitForm.get('visitUploadUpdate').value;
      var formData: any = new FormData();
      formData.append("visitUploadFile", this.visitForm.get('visitUploadFile').value);
      console.log('UploadVisit | formData', formData);
      this.vpVisitService.uploadFile(formData, this.update)
          .pipe(first())
          .subscribe(
              data => {
                  console.log(`vpvisit.upload.component::uploadVisit=>data:`, data);
                  this.upLoading = false;
                  this.visitIds = data; //NOTE: the return from POST => INSERT/UPDATE is different from GET (ie. no rows[])
                  this.alertService.success(`Successfully uploaded ${data.length} rows of Visit data.`);
              },
              error => {
                  console.log(`vpvisit.upload.component::uploadVisit=>error:`, error);
                  this.upLoading = false;
                  this.alertService.error(error);
              });
    }

    CancelUpload() {
      console.log('CancelUpload');
      this.router.navigate([this.returnUrl]);
    }
}
