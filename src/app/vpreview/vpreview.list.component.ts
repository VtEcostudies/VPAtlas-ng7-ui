import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpReviewService } from '@app/_services';
import { UxValuesService } from '@app/_global';
import Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/

@Component({
  templateUrl: 'vpreview.list.component.html'
})

export class vpReviewListComponent implements OnInit {
  currentUser = null;
  userIsAdmin = false;
  userIsOwner = false;
  returnUrl = "/pools/list";
  reviews = [];
  count = 0;
  dataLoading = false;
  filterForm: FormGroup = this.formBuilder.group({});
  filter = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
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
        visitId: [visitId],
        poolId: [this.route.snapshot.queryParams['poolId']],
        QAPerson: [this.route.snapshot.queryParams['QAPerson']]
      });
    this.LoadReviews();
  }

  async LoadReviews() {
    await this.getFilter();
    this.dataLoading = true;
    //console.log('vpveview.create.component.LoadReview:', reviewId);
    this.reviewService.getAll(this.filter)
        .pipe(first())
        .subscribe(
            data => {
              this.reviews = data.rows;
              this.count = data.rowCount;
              this.dataLoading = false;
            },
            error => {
                this.alertService.error(error);
                this.dataLoading = false;
            });
  }

  // convenience getter for easy access to form fields
  get f() { return this.filterForm.controls; }

  getFilter() {
    this.filter = ''; //must clear first to undo filters
    var i = 0;

    if (this.f.visitId.value) {
      this.filter += `reviewVisitId=${this.f.visitId.value}`;
    }
    if (this.f.poolId.value) {
      if (this.filter) {
        this.filter += `&logical${++i}=AND&`;
      }
      this.filter += `&reviewPoolId=${this.f.poolId.value}`; //exact match
    }
    if (this.f.userName.value) {
      if (this.filter) {
        this.filter += `&logical${++i}=AND&`;
      }
      this.filter += `reviewUserName|LIKE=%${this.f.userName.value}%`;
    }
    if (this.f.QAPerson.value) {
      if (this.filter) {
        this.filter += `&logical${++i}=AND&`;
      }
      this.filter += `reviewQAPerson|LIKE=%${this.f.QAPerson.value}%`;
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
