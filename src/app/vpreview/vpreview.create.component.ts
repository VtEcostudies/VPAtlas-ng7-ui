import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpReviewService, vpVisitService } from '@app/_services';
import { UxValuesService } from '@app/_services';
import * as Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/
import * as L from "leaflet";
import { vpVisit } from '@app/_models';
import { environment } from '@environments/environment';
import { reviewDialogText } from '@app/vpreview/dialogText';
import { ModalService } from '@app/_modal';

@Component({
  templateUrl: 'vpreview.component.html'
})
export class vpReviewCreateComponent implements OnInit {
    view = false;
    create = false
    update = false; //flag for html config that we are editing an existing visit, not creating a new one
    currentUser = null;
    userIsAdmin = false;
    userIsOwner = false;
    returnUrl = null;
    reviewForm: FormGroup = this.formBuilder.group({});
    dataLoading = false; //flag that the form data is loading
    submitted = false; //flag that the form was submitted to create/update a visit
    review: any = {};
    reviewId = null; //reviewId passed via routeParams- indicates an edit/update of an existing visit
    visitId = null;
    poolId = null; //poolId passed via routeParams - indicates the creation of a new visit
    visit: vpVisit = new vpVisit(); //not passed to map, used by the forms
    pools = []; //passed to map via [mapValues]="pools" - plots extant pools as circleMarkers
    reviewDialogText = reviewDialogText; //amazing but true... set this class var to the import type...
    QACodes = [
      'PROB-OTHER',
      'PROB-VPMP',
      'NOT FOUND',
      'NOT POOL',
      'LANDOWNER',
      'DUPLICATE',
      'CONF',
      'ERROR',
      'ERROR-LocAcc',
      'ERROR-Eliminate'
      ];
    statuses = [
      'Potential',
      'Probable',
      'Confirmed',
      'Duplicate',
      'Eliminated'
    ]

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private uxValuesService: UxValuesService,
        private vpReviewService: vpReviewService,
        private vpVisitService: vpVisitService,
        private modalService: ModalService
    ) {
        this.authenticationService.check().catch(err => {console.log('authService.check error in vpreview.create.')});
        if (this.authenticationService.currentUserValue) {
          this.currentUser = this.authenticationService.currentUserValue.user;
          this.userIsAdmin = this.currentUser.userrole == 'admin';
        }
        if (!this.userIsAdmin) {
          this.router.navigate(['/']);
        }
    }

    async ngOnInit() {
      //get poolId, visitId or reviewId or from route params and load visit data from db
      this.reviewId = this.route.snapshot.params.reviewId;
      this.visitId = this.route.snapshot.params.visitId;
      this.poolId = this.route.snapshot.params.poolId;

      this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/review/list';

      if (this.reviewId) { //update an existing visit - set all initial values in setFormValues()
        this.update = true;
        await this.createFormControls();
        await this.LoadReview(this.reviewId);
      } else { //create a new review - set a few necessary initial values
        this.create = true;
        await this.createFormControls();
        if (this.visitId) {
          await this.LoadVisit(this.visitId);
        }
      }
    } //end ngOnInit

    openModal(id: string, infoId=null) {
        console.log('infoId', infoId);
        this.modalService.open(id, reviewDialogText[infoId]);
    }

    closeModal(id: string) {
        this.modalService.close(id);
    }

    async createFormControls() { //Create formcontrols within formgroups

      this.reviewForm = this.formBuilder.group({
        //these values are always set from the context, so they're disabled by default
        reviewId: [{value:'(New)', disabled:true}, Validators.required],
        reviewUserName: [{value: this.currentUser.username, disabled: true}, Validators.required],
        reviewVisitId: [{value:'', disabled:this.update}, Validators.required],
        reviewPoolId: [{value:'', disabled:this.update}, Validators.required],
        reviewQACode: ['', Validators.required],
        reviewQAAlt: [''],
        reviewQAPerson: [''],
        reviewQANotes: [''],
        reviewQADate: [(this.create?Moment().format('YYYY-MM-DD'):''), Validators.required],
        reviewPoolStatus: ['', Validators.required],
        reviewUpdatedAt: ['']
      });
    } //end createFormControls()

    async setFormValues() {
      this.reviewForm.controls['reviewId'].setValue(this.review.reviewId);
      this.reviewForm.controls['reviewUserName'].setValue(this.review.reviewUserName);
      this.reviewForm.controls['reviewVisitId'].setValue(this.review.reviewVisitId);
      this.reviewForm.controls['reviewPoolId'].setValue(this.review.reviewPoolId);
      this.reviewForm.controls['reviewQACode'].setValue(this.review.reviewQACode);
      this.reviewForm.controls['reviewQAAlt'].setValue(this.review.reviewQAAlt);
      this.reviewForm.controls['reviewQAPerson'].setValue(this.review.reviewQAPerson);
      this.reviewForm.controls['reviewQANotes'].setValue(this.review.reviewQANotes);
      this.reviewForm.controls['reviewQADate'].setValue(this.review.reviewQADate);
      this.reviewForm.controls['reviewPoolStatus'].setValue(this.review.reviewPoolStatus);
      this.reviewForm.controls['reviewUpdatedAt'].setValue(this.review.reviewUpdatedAt);
    }

    // convenience getters for easy access to form fields
    get r() { return this.reviewForm.controls; }

    LoadReview(reviewId) {
      this.dataLoading = true;
      this.vpReviewService.getById(reviewId)
          .pipe(first())
          .subscribe(
              data => {
                this.review = data.rows[0];
                this.visitId = data.rows[0].visitId;
                this.poolId = data.rows[0].poolId;
                this.setFormValues();
                this.dataLoading = false;
              },
              error => {
                  this.alertService.error(error);
                  this.dataLoading = false;
              });
    }

    LoadVisit(visitId) {
      this.dataLoading = true;
      this.vpVisitService.getById(visitId)
          .pipe(first())
          .subscribe(
              data => {
                  this.visit = data.rows[0];
                  this.poolId = this.visit.visitPoolId;
                  this.reviewForm.controls['reviewVisitId'].setValue(this.visit.visitId);
                  this.reviewForm.controls['reviewVisitId'].disable();
                  this.reviewForm.controls['reviewPoolId'].setValue(this.visit.visitPoolId);
                  this.reviewForm.controls['reviewPoolId'].disable();
                  this.dataLoading = false;
              },
              error => {
                  this.alertService.error(error);
                  this.dataLoading = false;
              });
    }

    //validate fields and create the visit
    CreateReview() {
        var objAll:any = {}; //target object to copy all form-object data to for submitting to API
        this.submitted = true; //this must go at the top - used by alertservice

        if (this.reviewForm.invalid) {console.log('reviewForm is invalid.'); return;}

        this.alertService.clear();

        console.dir(this.reviewForm.getRawValue());

        //reviewForm - some fields are disabled, so use getRawValue()
        Object.assign(objAll, this.reviewForm.getRawValue());

        //Remove reviewId from the POST data if creating a New pool. Its value is '(New)'.
        if (!this.update) {
          delete objAll.reviewId;
        }

        this.dataLoading = true;
        this.vpReviewService.createOrUpdate(this.update, this.reviewId, objAll)
            .pipe(first())
            .subscribe(
                data => {
                    if (this.update) {
                      this.alertService.success(`Successfully updated Vernal Pool Review ${this.reviewId}.`, true);
                    } else {
                      this.alertService.success('Successfully added Vernal Pool Review.', true);
                    }
                    this.dataLoading = false;
                    if (data.rows[0]) {this.reviewId = data.rows[0].reviewId;}
                    else {this.reviewId = this.reviewForm.value.reviewId}
                    this.router.navigate([this.returnUrl]); //[`/review/view/${this.reviewId}`]);
                },
                error => {
                    this.alertService.error(error);
                    this.dataLoading = false;
                });
    }

  CancelReview() {
    var navUrl = null;
    var msgTxt = null;

    if (this.update) {
      msgTxt = `to Review ${this.reviewId}`
      navUrl = `/review/view/${this.reviewId}`;
    } else {
      msgTxt = `of a New Review`;
      navUrl = this.returnUrl; //`/review/list`;
    }

    if (confirm(`Are you sure you want to cancel edits ${msgTxt}?`)) {
      this.router.navigate([navUrl]);
    } else {
      //console.log('visit NOT cancelled');
    }
  }

  DeleteReview() {
    if (confirm(`Are you sure you want to delete visit ${this.review.reviewId}?`)) {
      this.vpVisitService.delete(this.review.reviewId)
        .pipe(first())
        .subscribe(
            data => {
                //console.log(`vpveview.create.deleteReview=>data:`, data);
                this.alertService.success('Successfully deleted Vernal Pool Visit.', true);
                this.router.navigate([this.returnUrl]);
            },
            error => {
                //console.log(`vpveview.create.deleteReview=>error: `, error);
                this.alertService.error(error);
                this.dataLoading = false;
            });
    }
  }

}
