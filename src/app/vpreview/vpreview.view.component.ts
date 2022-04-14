import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService } from '@app/_services';
import { UxValuesService } from '@app/_global';
import { vpReviewService, vpMappedService, vpVisitService, vpPoolsService, vtInfoService } from '@app/_services';
import { ModalService } from '@app/_modal';
import { environment } from '@environments/environment';
import { reviewDialogText } from '@app/vpreview/dialogText';
import Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/
//import { vpVisitViewComponent } from '@app/vpvisit';

@Component({
  templateUrl: 'vpreview.component.html',
  styleUrls: ['styles.css']
})
export class vpReviewViewComponent implements OnInit {
  view = true;
  create = false
  update = false; //flag for html config that we are editing an existing visit, not creating a new one
  currentUser = null;
  userIsAdmin = false;
  userIsOwner = false;
  returnUrl = '/review/list';
  reviewForm: FormGroup = this.formBuilder.group({});
  towns = [];
  townCount = 0;
  dataLoading = false; //flag that the form data is loading
  submitted = false; //flag that the form was submitted to create/update a visit
  itemType = 'Review Visit';
  review: any = {};
  reviewId = null; //reviewId passed via routeParams- indicates an edit/update of an existing visit
  visitId = null;
  poolId = null; //poolId passed via routeParams - indicates the creation of a new visit
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
          private modalService: ModalService
    ) {
      this.authenticationService.check();
      if (this.authenticationService.currentUserValue) {
        this.currentUser = this.authenticationService.currentUserValue.user;
        this.userIsAdmin = this.currentUser.userrole == 'admin';
      }
      if (!this.userIsAdmin) {
        this.router.navigate(['/']);
      }
    }

    async ngOnInit() {

      console.log('vpreview.view.componenent::ngOnInit | queryParams:', this.route.snapshot.queryParams);
      this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/review/list';

      this.reviewId = this.route.snapshot.params.reviewId;

      await this.createFormControls();

      if (this.reviewId) {
        this.LoadReview(this.reviewId);
      }
    }

    openModal(id: string, infoId=null) {
        console.log('infoId', infoId);
        this.modalService.open(id, reviewDialogText[infoId]);
    }

    closeModal(id: string) {
        this.modalService.close(id);
    }

    createFormControls() { //Create formcontrols within formgroups

      this.reviewForm = this.formBuilder.group({
        reviewId: [''],
        reviewUserName: [''],
        reviewPoolId: [''],
        reviewVisitId: [''],
        reviewQACode: [''],
        reviewQAAlt: [''],
        reviewQAPerson: [''],
        reviewQANotes: [''],
        reviewQADate: [''],
        reviewPoolStatus: [''],
        reviewPoolLocator: [''],
        reviewUpdatedAt: ['']
      });

      this.reviewForm.disable();
    }

    setFormValues() {
      this.reviewForm.controls['reviewId'].setValue(this.review.reviewId);
      this.reviewForm.controls['reviewUserName'].setValue(this.review.reviewUserName);
      this.reviewForm.controls['reviewPoolId'].setValue(this.review.reviewPoolId);
      this.reviewForm.controls['reviewVisitId'].setValue(this.review.reviewVisitId);
      this.reviewForm.controls['reviewQACode'].setValue(this.review.reviewQACode);
      this.reviewForm.controls['reviewQAAlt'].setValue(this.review.reviewQAAlt);
      this.reviewForm.controls['reviewQAPerson'].setValue(this.review.reviewQAPerson);
      this.reviewForm.controls['reviewQANotes'].setValue(this.review.reviewQANotes);
      this.reviewForm.controls['reviewQADate'].setValue(Moment(this.review.reviewQADate).format('YYYY-MM-DD')); //NOTE: format must be YYYY-MM-DD to set value of input type="date"
      this.reviewForm.controls['reviewPoolStatus'].setValue(this.review.reviewPoolStatus);
      this.reviewForm.controls['reviewPoolLocator'].setValue(this.review.reviewPoolLocator);
      this.reviewForm.controls['reviewUpdatedAt'].setValue(Moment(this.review.reviewUpdatedAt).format('YYYY-MM-DD'));//NOTE: format must be YYYY-MM-DD to set value of input type="date"
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
                this.visitId = this.review.reviewVisitId; //this triggers <pool-data-view> tag to load via @Input
                this.setFormValues();
                this.dataLoading = false;
              },
              error => {
                  this.alertService.error(error);
                  this.dataLoading = false;
              });
    }

    ToEditMode() {
      this.router.navigate([`/review/update/${this.reviewId}`]);
    }

    CancelReview() {
      this.router.navigate([this.returnUrl]);
    }
}
