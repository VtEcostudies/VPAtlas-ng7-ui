import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpReviewService } from '@app/_services';
import { UxValuesService } from '@app/_global';
import Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/

@Component({
  templateUrl: 'vpreview.list.component.html',
  styleUrls: ['vpreview.styles.css']
})

export class vpReviewListComponent implements OnInit {
  currentUser = null;
  userIsAdmin = false;
  userIsOwner = false;
  returnUrl = "/pools/list";
  reviews = [];
  count = 0;
  singleVisit = null; //if the lookup resolves to a single visitId, set this value
  dataLoading = false;
  filterForm: UntypedFormGroup = this.formBuilder.group({});
  filter = '';
  statuses = ['All','Eliminated','Duplicate','Potential','Probable','Confirmed'];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: UntypedFormBuilder,
    private authenticationService: AuthenticationService,
    private alertService: AlertService,
    private reviewService: vpReviewService
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

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/pools/list';
    //console.log('queryParams', this.route.snapshot.queryParams);
    //console.log('params', this.route.snapshot.params);
    var visitId = this.route.snapshot.params['visitId']; if (visitId) visitId=visitId.split('?')[0];
    visitId = visitId ? visitId : this.route.snapshot.queryParams['visitId']
    this.filterForm = this.formBuilder.group({
        userName: [this.route.snapshot.queryParams['userName']],
        reviewId: [this.route.snapshot.queryParams['reviewId']],
        visitId: [visitId],
        poolId: [this.route.snapshot.queryParams['poolId']],
        QAPerson: [this.route.snapshot.queryParams['QAPerson']],
        status: [this.route.snapshot.queryParams['poolStatus']]
      });
    this.LoadReviews();
  }

  async LoadReviews() {
    await this.getFilter();
    this.dataLoading = true;
    console.log('vpreview.create.component.LoadReviews');
    this.reviewService.getAll(this.filter)
        .pipe(first())
        .subscribe(
            data => {
              this.reviews = data.rows;
              this.count = data.rowCount;
              this.dataLoading = false;
              this.singleVisit = (1==this.count) ? data.rows[0].visitId : null;
            },
            error => {
                this.alertService.error(error);
                this.dataLoading = false;
            });
  }

  // convenience getter for easy access to form fields
  get f() { return this.filterForm.controls; }

  getFilter() {
    this.alertService.clear();
    this.filter = ''; //must clear first to undo filters
    var i = 0;

    if (this.f.reviewId.value) {
      this.filter += `reviewId=${this.f.reviewId.value}`;
    }
    if (this.f.visitId.value) {
      this.filter += `reviewVisitId=${this.f.visitId.value}`;
    }
    if (this.f.poolId.value) {
      if (this.filter) {
        this.filter += `&logical${++i}=AND&`;
      }
      var filterValue = `${this.f.poolId.value}`;
      if (filterValue.includes('*')) { //handle wildcard character '*'
        this.filter += `reviewPoolId|LIKE=${filterValue.replace(/\*/g,'%')}`; //partial match
      } else {
        this.filter += `reviewPoolId=${this.f.poolId.value}`; //exact match
      }
    }
    if (this.f.userName.value) {
      if (this.filter) {
        this.filter += `&logical${++i}=AND&`;
      }
      var filterValue = `${this.f.userName.value}`;
      if (filterValue.includes('*')) {
        this.filter += `reviewUserName|LIKE=${filterValue.replace(/\*/g,'%')}`; //partial match
      } else {
        this.filter += `reviewUserName=${filterValue}`; //exact match
      }
    }
    if (this.f.QAPerson.value) {
      if (this.filter) {
        this.filter += `&logical${++i}=AND&`;
      }
      var filterValue = `${this.f.QAPerson.value}`;
      if (filterValue.includes('*')) {
        this.filter += `reviewQAPerson|LIKE=${filterValue.replace(/\*/g,'%')}`; //partial match
      } else {
        this.filter += `reviewQAPerson=${filterValue}`; //exact match
      }
    }
    if (this.f.status.value && 'All' != this.f.status.value) {
      this.filter += `reviewPoolStatus=${this.f.status.value}`;
    }
    console.log(this.filter);
  }

  AddReview() {
    if (this.f.visitId.value) {
      this.router.navigate([`/review/create/${this.f.visitId.value}`], {queryParams:{returnUrl:this.router.url}});
    } else {
      this.router.navigate([`/review/create`], {queryParams:{returnUrl:this.router.url}});
    }
  }
  Cancel() {
    this.router.navigate([this.returnUrl]);
  }

}
