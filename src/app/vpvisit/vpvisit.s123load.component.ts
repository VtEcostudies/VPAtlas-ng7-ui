import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpVisitService } from '@app/_services';
import { UxValuesService } from '@app/_global';
import { environment } from '@environments/environment';
import { visitDialogText } from '@app/vpvisit/dialogText';
import { ModalService } from '@app/_modal';

@Component({
  templateUrl: 'vpvisit.s123load.component.html',
  styleUrls: ['styles.css']
})
export class vpVisitS123LoadComponent implements OnInit {
    update = false; //flag for html config that we are editing an existing visit, not creating a new one
    currentUser = null;
    userIsAdmin = false;
    userIsOwner = false;
    returnUrl = '/visit/list';
    visitForm: FormGroup = this.formBuilder.group({});
    upLoading = false; //flag that the form data is loading
    submitted = false; //flag that the form was submitted
    itemType = 'Visit123 Load Visit';
    visitDialogText = visitDialogText; //amazing but true... set this class var to the import type...
    s123counts = <any> {};
    s123results = <any> [];
    s123errors = <any> [];
    maxOffset = 500;
    maxLimit = 100;

    constructor(
        private formBuilder: FormBuilder,
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
        visitS123LoadUpdate: [false],
        visitS123LoadOffset: [1],
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


    S123LoadVisits() {
      var objArgs:any = {}; //target object to copy all form-object data to for submitting to API
      Object.assign(objArgs, this.visitForm.getRawValue());
      const update = this.visitForm.get('visitS123LoadUpdate').value;
      const offset = this.visitForm.get('visitS123LoadOffset').value;
      const limit = this.visitForm.get('visitS123LoadLimit').value;
      var confirmLoad = 1;
      if (confirmLoad && offset > this.maxOffset) {
        if (!confirm(`There are not more than ${this.maxOffset} visits to load. Are you sure you want to load Object ID ${offset}?`)) {
          confirmLoad = 0;
        }
      }
      if (confirmLoad && limit > this.maxLimit) {
        if (!confirm(`${this.maxLimit} is a lot of visits to load. Are you sure you want to load proceed?`)) {
          confirmLoad = 0;
        }
      }
      if (confirmLoad) {
        this.init();
        this.upLoading = true;
        this.vpVisitService.s123LoadData(objArgs, update, offset, limit)
            .pipe(first())
            .subscribe(
                data => {
                    console.log(`vpvisit.s123load.component::uploadVisit=>data:`, data);
                    this.upLoading = false;
                    this.s123counts = data.counts;
                    this.s123results = data.results;
                    this.s123errors = data.errors;
                    var msg = `Loaded ${data.counts.success}/${data.counts.target} S123 Visits.`;
                    if (data.counts.errors) {msg += ` There were ${data.counts.errors} errors.`;}
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
