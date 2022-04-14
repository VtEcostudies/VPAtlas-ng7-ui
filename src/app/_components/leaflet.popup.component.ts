import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '@app/_services';
/*
  Leaflet Popup Component - this is used instead of the standard Leaflet popup because we
  want to use Angular routing, not html href routing, to preserve uxValues across
  page-loads. This allows us to keep the UX performant.

  Links are created in popup.component.html.
  popup list items are created in buildPopupList, and that html is injected into

  Use createLeafletPopup(...) to invoke.
*/
@Component({
    selector: 'leaflet-popup',
    templateUrl: 'popup.component.html',
    styleUrls: ['popup.component.css']
})

export class LeafletPopupComponent {
  currentUser = null;
  userIsAdmin = false;
  userIsOwner = false; //not used here... yet.
  itemType = '';
  poolObj: any = {};
  visits: any = [];
  reviews: any = [];
  surveys: any = [];

  constructor (
    private authenticationService: AuthenticationService,
    private router: Router
  ) {
    if (this.authenticationService.currentUserValue) {
      this.currentUser = this.authenticationService.currentUserValue.user;
      this.userIsAdmin = this.currentUser.userrole == 'admin';
    }
  }

  ViewMapped(poolId) {
    if (poolId) {this.router.navigate([`/pools/mapped/view/${poolId}`], { queryParams: { returnUrl: this.router.url }} );}
  }
  EditMapped(poolId) {
    if (poolId) {this.router.navigate([`/pools/mapped/update/${poolId}`], { queryParams: { returnUrl: this.router.url }} );}
  }
  ViewVisit(visitId, tab=0) {
    if (visitId) {
      //this.router.navigate([`/pools/visit/view/${visitId}`], { queryParams: { returnUrl: this.router.url }} );
      var url = `/pools/visit/view/${visitId}?returnUrl=${this.router.url}`;
      if (tab) {window.open(url, "_blank");}
      else {this.router.navigate([`/pools/visit/view/${visitId}`], { queryParams: { returnUrl: this.router.url }} );}
    }
  }
  EditVisit(visitId, tab=0) {
    if (visitId) {
      //this.router.navigate([`/pools/visit/update/${visitId}`], { queryParams: { returnUrl: this.router.url }} );
      var url = `/pools/visit/update/${visitId}?returnUrl=${this.router.url}`;
      if (tab) {window.open(url, "_blank");}
      else {this.router.navigate([`/pools/visit/update/${visitId}`], { queryParams: { returnUrl: this.router.url }} );}
    }
  }
  CreateVisit() {
    if (this.poolObj.poolId) {
      this.router.navigate([`/pools/visit/create/${this.poolObj.poolId}`], { queryParams: { returnUrl: this.router.url }} );
    }
  }
  ViewReview(reviewId) {
    if (reviewId) {this.router.navigate([`/review/view/${reviewId}`], { queryParams: { returnUrl: this.router.url }} );}
  }
  CreateReview(visitId) {
    if (visitId) {this.router.navigate([`/review/create/${visitId}`], { queryParams: { returnUrl: this.router.url }} );}
  }
  ViewSurvey(surveyId, tab=0) {
    //if (surveyId) {this.router.navigate([`/survey/list/${surveyId}`], { queryParams: { returnUrl: this.router.url }} );}
    if (surveyId) {this.router.navigate([`/survey/view/${surveyId}`], { queryParams: { returnUrl: this.router.url }} );}
  }
  ViewSurveyPool(surveyPoolId, tab=0) {
    if (surveyPoolId) {this.router.navigate([`/survey/pool/${surveyPoolId}`], { queryParams: { returnUrl: this.router.url }} );}
  }
}
