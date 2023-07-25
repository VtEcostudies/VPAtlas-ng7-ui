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
  templateUrl: 'vpvisit.s123load.component.html',
  styleUrls: ['vpvisit.styles.css']
})
export class vpVisitS123LoadComponent implements OnInit {
    update = false; //flag for html config that we are editing an existing visit, not creating a new one
    currentUser = null;
    userIsAdmin = false;
    userIsOwner = false;
    returnUrl = '/visit/list';
    visitForm: UntypedFormGroup = this.formBuilder.group({});
    upLoading = false; //flag that the form data is loading
    submitted = false; //flag that the form was submitted
    itemType = 'Visit123 Load Visit';
    visitDialogText = visitDialogText; //amazing but true... set this class var to the import type...
    s123counts = <any> {};
    s123results = <any> [];
    s123errors = <any> [];
    maxOffset = 500;
    maxLimit = 100;

    s123services = <any> [{visitServiceId:'New Service ID',visitObjectId:-1}]; //vpvisit S123 services previously used to load data from S123->VPAtlas
    serviceId = '';
    objectId = 1;
    s123uploads = <any> []; //vpvisit S123 uploads previously loaded from S123->VPAtlas for a serviceId

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
        this.authenticationService.check().catch(err => {console.log('authService.check error in vpvisit.s123load.')});
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
      console.log('vpvisit.s123load.copmonenent | returnUrl:', this.route.snapshot.queryParams);
      this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/visit/list';

      await this.createFormControls();
      this.GetS123VisitServices()
        .then(res => {
          this.GetS123VisitUploads(this.serviceId);
        })
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
        visitS123ServiceId: [],
        visitS123LoadUpdate: [false],
        visitS123LoadOffset: [this.objectId],
        visitS123LoadLimit: [1],
        visitS123LoadAbort: [false]
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
    get r() { return this.visitForm.controls; }

    SetSelectedServiceId(serviceId) {
      let objService = this.s123services.find(o => {return o.visitServiceId == serviceId;});
      this.visitForm.controls['visitS123ServiceId'].setValue(objService?objService:null);
      this.serviceId = objService.visitServiceId;
      this.objectId = objService.visitObjectId+1;
      this.visitForm.controls['visitS123LoadOffset'].setValue(this.objectId);
    }

    /*
      Query vpvisit for previously-loaded S123 serviceId endpoints
      Display these in a drop-down list with the latest used as default
    */
    GetS123VisitServices() {
      return new Promise((resolve, reject) => {
        this.vpVisitService.getS123Services()
          .pipe(first())
          .subscribe(
              data => {
                this.s123services = data.rows;
                this.s123services.push({visitServiceId:'Enter New Service ID',visitObjectId:-1});
                this.serviceId = this.s123services[0].visitServiceId;
                this.objectId = this.s123services[0].visitObjectId+1;
                this.visitForm.controls['visitS123LoadOffset'].setValue(this.objectId);
                this.SetSelectedServiceId(this.serviceId);
                console.log(`GetS123VisitServices`, this.s123services);
                resolve(this.s123services);
              },
              error => {
                this.alertService.error(error);
                reject([]);
              });
      });
    }

    HandleServiceIdSelect() {
      let serviceSelected = this.visitForm.controls['visitS123ServiceId'].value;
      if (serviceSelected.visitObjectId < 0) {
        let servicePrompt = prompt("Please enter a new S123 Visit ServiceId", "service_");
        if (servicePrompt != null) {
          this.s123services.push({visitServiceId:servicePrompt,visitObjectId:0});
          this.SetSelectedServiceId(servicePrompt);
          this.GetS123VisitUploads(servicePrompt);
        }
      } else {
        this.GetS123VisitUploads(serviceSelected.visitServiceId);
        this.SetSelectedServiceId(serviceSelected.visitServiceId);
      }
    }

    /*
      Query vpvisit for previously-loaded S123 Visits
    */
    GetS123VisitUploads(serviceId) {
      return new Promise((resolve, reject) => {
        this.vpVisitService.getS123Uploads(serviceId)
          .pipe(first())
          .subscribe(
              data => {
                this.s123uploads = data.rows;
                console.log(`GetS123VisitUploads`, this.s123uploads);
                this.s123counts = {
                  success: this.s123uploads.length,
                  errors: null,
                  target: null,
                  total: this.s123uploads.length,
                  aborted: null
                };
                this.s123results = [];
                this.s123errors = [];
                this.alertService.clear();
                resolve(this.s123uploads);
          },
              error => {
                this.alertService.error(error);
                reject([]);
              });
      });
    }
  
    UploadS123Visits() {
      var objArgs:any = {}; //target object to copy all form-object data to for submitting to API
      Object.assign(objArgs, this.visitForm.getRawValue());
      const service = objArgs.visitS123ServiceId;
      const update = this.visitForm.get('visitS123LoadUpdate').value;
      const offset = this.visitForm.get('visitS123LoadOffset').value;
      const limit = this.visitForm.get('visitS123LoadLimit').value;
      console.log('UploadS123Visits | service:', service);
      var confirmLoad = 1;
      if (confirmLoad && (!service || !service.visitServiceId)) {
        alert('Please select an S123 Service ID to proceed.')
        confirmLoad = 0;
      }
      if (confirmLoad && offset > this.maxOffset) {
        if (!confirm(`There are not more than ${this.maxOffset} visits to load. Are you sure you want to load Object ID ${offset}?`)) {
          confirmLoad = 0;
        }
      }
      if (confirmLoad && limit > this.maxLimit) {
        if (!confirm(`${limit} is a lot of visits to load. Are you sure you want to proceed?`)) {
          confirmLoad = 0;
        }
      }
      if (confirmLoad) {
        this.init();
        this.upLoading = true;
        this.vpVisitService.s123LoadData(objArgs, service.visitServiceId, update, offset, limit)
            .pipe(first())
            .subscribe(
                data => {
                    console.log(`vpvisit.s123load.component::uploadVisit=>data:`, data);
                    this.upLoading = false;
                    this.s123counts = data.counts;
                    this.s123results = data.results;
                    this.s123errors = data.errors;
                    this.s123uploads = [];
                    var msg = `Loaded ${data.counts.success}/${data.counts.target} S123 Visits.`;
                    if (data.counts.errors) {msg += ` There were ${data.counts.errors} errors.`;}
                    if (data.errors[0] && !data.errors[0].hint) {data.errors[0].hint = data.errors[0].message;}
                    if (data.counts.aborted) {msg += ` You aborted the S123 load at ${data.counts.total}/${data.counts.target}.`}
                    this.alertService.success(msg);
                },
                error => {
                    console.log(`vpvisit.s123load.component::uploadVisit=>error:`, error);
                    this.upLoading = false;
                    this.alertService.error(error);
                });
      }
    }

    AbortS123Load() {
      console.log('CancelS123Load');
      var objArgs:any = {};
      this.vpVisitService.s123AbortLoad(objArgs)
          .pipe(first())
          .subscribe(
              data => {
                  console.log(`vpvisit.s123load.component::abortS123Load=>data:`, data);
                  this.upLoading = false;
                  this.alertService.success(data.rows[0].message);
              },
              error => {
                  console.log(`vpvisit.s123load.component::abortS123Load=>data:`, error);
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
