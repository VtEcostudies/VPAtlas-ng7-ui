import { Injectable } from '@angular/core';
﻿import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpMappedService, vpVisitService, vpPoolsService, vtInfoService } from '@app/_services';
import { UxValuesService } from '@app/_global';
import Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/
import L from "leaflet";
import { vtTown, vpMapped, vpVisit, vpMappedEventInfo } from '@app/_models';
import { EmailOrPhone } from '@app/_helpers/email-or-phone.validator';
import { visitDialogText} from '@app/vpvisit/visitDialogText';
import { environment } from '@environments/environment';
import { ModalService } from '@app/_modal';

@Component({
  selector: 'pool-data-view',
  templateUrl: '../vpvisit/vpvisit.create.component.html'
})

@Injectable({providedIn: 'root'}) //this makes a component single-instance, which applies to services, as well.

export class vpViewComponent implements OnInit {
    update = false; //flag for html config that we are editing an existing visit, not creating a new one
    currentUser = null;
    userIsAdmin = false;
    userIsOwner = false;
    visitObserverForm: FormGroup = this.formBuilder.group({});
    visitPoolMappedForm: FormGroup = this.formBuilder.group({});
    visitLocationForm: FormGroup = this.formBuilder.group({});
    visitLandOwnForm: FormGroup = this.formBuilder.group({});
    visitFieldVerificationForm: FormGroup = this.formBuilder.group({});
    visitPoolCharacteristicsForm: FormGroup = this.formBuilder.group({});
    visitIndicatorSpeciesForm:FormGroup = this.formBuilder.group({});
    visitPage = {index: 0, values: [
                  {name:"Pool-Location"},
                  {name:"Landowner-Info"},
                  {name:"Field-Verification"},
                  {name:"Pool-Characteristics"},
                  {name:"Indicator-Species"}
                ]};
    towns = [];
    townCount = 0;
    dataLoading = false; //flag that the form data is loading
    poolsLoading = false; //flag that mapped pools are loading pending a map update
    submitted = false; //flag that the form was submitted to create/update a visit
    permission = false; //flag that landowner permission was obtained. used to show/hide actions buttons
    @Input() reviewVisitId = null; //passed via @Input when this form is included as tag <pool-data-view/>
    visitId = null; //visitId passed via routeParams- indicates a view/edit/update of an existing visit
    poolId = null; //poolId passed via routeParams - indicates the creation of a new visit
    visit: vpVisit = new vpVisit(); //not passed to map, used by the forms
    mapPoints = false; //flag to plot pools on map as circleMarkers, passed to map via [mapPoints]="mapPoints"
    pools = []; //passed to map via [mapValues]="pools" - plots extant pools as circleMarkers
    @Input() itemType = 'View Visit'; //passed to map via [itemType]="itemType"
    visitUpdateLocation = new L.LatLng(43.6962, -72.3197);
    mapMarker = false; //flag to show marker, passed to map via [mapMarker]="mapMarker"- marker is moved to provide lat/long values via emitted events
    locMarker = null; //data to locate marker, passed to map via [locMarker]="locMarker"- marker location is plotted from these values
    mapShowing = true; //flag to show/hide map (NO LONGER USED)
    visitDialogText = visitDialogText; //amazing but true... set this class var to the import type...
    showImage = false;
    s3PhotoBucket = environment.s3PhotoBucket; //used in html links
    modalText: string;
    modalTitle: string;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private uxValuesService: UxValuesService,
        private vpMappedService: vpMappedService,
        private vpVisitService: vpVisitService,
        private vpPoolsService: vpPoolsService,
        private townService: vtInfoService,
        private modalService: ModalService
    ) {
      if (this.authenticationService.currentUserValue) {
        this.currentUser = this.authenticationService.currentUserValue.user;
        this.userIsAdmin = this.currentUser.userrole == 'admin';
      } else {
        this.userIsAdmin = false;
      }
      this.loadTowns();
      console.log('*********@Input in vppools.view.componenet::constructor | reviewVistiId:', this.reviewVisitId);
    }

    async ngOnInit() {
      console.log('*********@Input in vppools.view.componenet::ngOnInit | reviewVistiId:', this.reviewVisitId);
      //get poolId or visitId or from route params and load visit data from db
      this.visitId = this.route.snapshot.params.visitId;
      this.poolId = this.route.snapshot.params.poolId;
      console.log('vppools.view.ngOnInit route.snapshot params: visitId:', this.visitId, 'poolId:', this.poolId);

      this.update = false; //view only
      this.mapMarker = false; //no mapMarker - it's for updating pool Location
      this.mapPoints = true; //for viewing, we map a single point, mapped or visit
      await this.createFormControls();

      if (this.visitId) { //view an existing visit - load all initial values and display
        await this.loadPoolVisit(this.visitId);
        this.setPage(this.uxValuesService.visitPageIndex); //navigate to the previous pool page
      } else if (this.poolId) {
        await this.LoadMappedPool(this.poolId);
      } else if (this.reviewVisitId) { //passed via @Input from vpreview.view or vpreview.create...
        //this.itemType = 'Review Visit';
        await this.loadPoolVisit(this.reviewVisitId);
      } else { //redirect to pool list
        //this.router.navigate(['/pools/list']);
      }
    } //end ngOnInit

    openModal(id: string, infoId=null) {
        //another way to set modal content - use static definitions in html tag
        this.modalTitle='Info'; //this can be a value passed to this function
        this.modalText=infoId;
        console.log('infoId', infoId);
        this.modalService.open(id, visitDialogText[infoId]);
    }

    closeModal(id: string) {
        this.modalService.close(id);
    }

    async createFormControls() { //Create formcontrols within formgroups

      this.visitObserverForm = this.formBuilder.group({
        //these values are always set from the context, so they're disabled by default
        visitId: [],
        visitUserName: [],
        visitObserverUserName: [],
      });

      this.visitPoolMappedForm = this.formBuilder.group({
        visitPoolMapped: [],
      });

      this.visitLocationForm = this.formBuilder.group({
        //2a Vernal Pool Location Information
        //if poolId was passed to form, visitPoolId is disabled
        visitPoolId: [],
        visitDate: [],
        //visitPoolMapped: [],
        visitLocatePool: [],
        visitCertainty: [],
        visitLocationUncertainty: [],
        visitNavMethod: [],
        visitNavMethodOther: [],
        visitDirections: [],
        //visitTown: [],
        //visitTownId: [],
        visitTownName: [],
        visitLocationComments: [],
        visitPoolPhoto: [],
        //2b Location of Pool
        visitCoordSource: [],
        visitLatitude: [],
        visitLongitude: [],
        //2c Landowner Contact Information
        visitUserIsLandowner: [],
        visitLandownerPermission: [],
        //// TODO: set the landOwnForm from JSON object
        visitLandowner: [{disabled: true}, this.visitLandOwnForm], //non-display db-only value (JSON column) set when the form is submitted
        //see below separate formGroup for landowner contact info
      });

      //create a separate form for landowner data, to be nested within visitLocationForm
      //NOTE: these formdata to be rolled into a JSON oject and stored in a single field: visitLandowner
      this.visitLandOwnForm = this.formBuilder.group({
        visitLandownerName: [],
        visitLandownerAddress: [],
        //visitLandownerTown: [],
        //visitLandownerStateAbbrev: [],
        //visitLandownerZip5: [],
        visitLandownerPhone: [],
        visitLandownerEmail: [],
      });

      this.visitFieldVerificationForm = this.formBuilder.group({
        visitVernalPool: [],
        visitPoolType: [],
        visitPoolTypeOther: [],
        visitInletType: [],
        visitOutletType: [],
        visitForestUpland: [],
        visitForestCondition: [],
        visitHabitatAgriculture: [],
        visitHabitatLightDev: [],
        visitHabitatHeavyDev: [],
        visitHabitatPavedRd: [],
        visitHabitatDirtRd: [],
        visitHabitatPowerline: [],
        visitHabitatOther: [],
        visitHabitatComment: [],
      });

      this.visitPoolCharacteristicsForm = this.formBuilder.group({
        //4a ENUM Type
        visitMaxDepth: [],
        //4b ENUM Type Water Level at Time of Survey
        visitWaterLevelObs: [],
        //4c ENUM Type
        visitHydroPeriod: [],
        //4d INTEGER feet
        visitMaxWidth: [],
        visitMaxLength: [],
        //4e % values - use REAL or NUMERIC
        visitPoolTrees: [],
        visitPoolShrubs: [],
        visitPoolEmergents: [],
        visitPoolFloatingVeg: [],
        //4f ENUM Type w/ other
        visitSubstrate: [],
        visitSubstrateOther: [],
        //4g ENUM Type w/ other
        visitDisturbDumping: [],
        visitDisturbSiltation: [],
        visitDisturbVehicleRuts: [],
        visitDisturbRunoff: [],
        visitDisturbDitching: [],
        visitDisturbOther: [],
      });

      this.visitIndicatorSpeciesForm = this.formBuilder.group({
        visitWoodFrogAdults: [],
        visitWoodFrogLarvae: [],
        visitWoodFrogEgg: [],
        visitWoodFrogEggHow: [],
        visitWoodFrogPhoto: [],
        visitWoodFrogiNat: [],
        visitWoodFrogNotes: [],

        visitSpsAdults: [],
        visitSpsLarvae: [],
        visitSpsEgg: [],
        visitSpsEggHow: [],
        visitSpsPhoto: [],
        visitSpsiNat: [],
        visitSpsNotes: [],

        visitJesaAdults: [],
        visitJesaLarvae: [],
        visitJesaEgg: [],
        visitJesaEggHow: [],
        visitJesaPhoto: [],
        visitJesaiNat: [],
        visitJesaNotes: [],

        visitBssaAdults: [],
        visitBssaLarvae: [],
        visitBssaEgg: [],
        visitBssaEggHow: [],
        visitBssaPhoto: [],
        visitBssaiNat: [],
        visitBssaNotes: [],

        visitFairyShrimp: [],
        visitFairyShrimpPhoto: [],
        visitFairyShrimpiNat: [],
        visitFairyShrimpNotes: [],

        visitFingerNailClams: [],
        visitFingerNailClamsPhoto: [],
        visitFingerNailClamsiNat: [],
        visitFingerNailClamsNotes: [],

        //visitSpeciesOther1: [], //legacy data. no longer used
        //visitSpeciesOther2: [], //legacy data. no longer used
        visitSpeciesOtherName: [],
        visitSpeciesOtherCount: [],
        visitSpeciesOtherPhoto: [],
        visitSpeciesOtheriNat: [],
        visitSpeciesOtherNotes: [],

        visitSpeciesComments: [],

        visitFish:[],
        visitFishCount: [],
        //visitFishSize:[], //legacy data. no longer used.
      });

      //disable all at the formGroup level for viewing only
      this.visitObserverForm.disable();
      this.visitPoolMappedForm.disable();
      this.visitLocationForm.disable();
      this.visitLandOwnForm.disable();
      this.visitFieldVerificationForm.disable();
      this.visitPoolCharacteristicsForm.disable();
      this.visitIndicatorSpeciesForm.disable();

    } //end createFormControls()

    async setFormValues() {
      //1a Observer Information
      this.visitObserverForm.controls['visitId'].setValue(this.visit.visitId);
      this.visitObserverForm.controls['visitUserName'].setValue(this.visit.visitUserName);
      this.visitObserverForm.controls['visitObserverUserName'].setValue(this.visit.visitObserverUserName);
      //2a Vernal Pool Location Information
      this.visitLocationForm.controls['visitPoolId'].setValue(this.visit.visitPoolId);
      this.visitLocationForm.controls['visitDate'].setValue(Moment(this.visit.visitDate).format('YYYY-MM-DD')); //NOTE: format must be YYYY-MM-DD to set value of input type="date"
      //this.visitLocationForm.controls['visitPoolMapped'].setValue(this.visit.visitPoolMapped.toString()); //radio button bool=>string
      this.visitPoolMappedForm.controls['visitPoolMapped'].setValue(this.visit.visitPoolMapped.toString()); //radio button bool=>string
      const locatePool = this.visit.visitLocatePool ? this.visit.visitLocatePool.toString() : false; //radio button bool=>string
      this.visitLocationForm.controls['visitLocatePool'].setValue(locatePool);
      this.visitLocationForm.controls['visitCertainty'].setValue(this.visit.visitCertainty);
      this.visitLocationForm.controls['visitLocationUncertainty'].setValue(this.visit.visitLocationUncertainty);
      this.visitLocationForm.controls['visitNavMethod'].setValue(this.visit.visitNavMethod);
      this.visitLocationForm.controls['visitNavMethodOther'].setValue(this.visit.visitNavMethodOther);
      this.visitLocationForm.controls['visitDirections'].setValue(this.visit.visitDirections);
      //console.log('vppools.view.setFormValues | visitTown: ', this.visit.visitTown);
      //this.visitLocationForm.controls['visitTown'].setValue(this.visit.visitTown);
      this.visitLocationForm.controls['visitTownName'].setValue(this.visit.townName);
      this.visitLocationForm.controls['visitLocationComments'].setValue(this.visit.visitLocationComments);
      //2b Location of Pool
      this.visitLocationForm.controls['visitCoordSource'].setValue(this.visit.visitCoordSource);
      this.visitLocationForm.controls['visitLatitude'].setValue(this.visit.visitLatitude);
      this.visitLocationForm.controls['visitLongitude'].setValue(this.visit.visitLongitude);
      //2c Landowner Contact Information - add in vpvisit.alter.sql
      this.visitLocationForm.controls['visitUserIsLandowner'].setValue(this.visit.visitUserIsLandowner);
      this.visitLocationForm.controls['visitLandownerPermission'].setValue(this.visit.visitLandownerPermission);
      this.visitLocationForm.controls['visitLandowner'].setValue(this.visit.visitLandowner);
      this.visitLocationForm.controls['visitPoolPhoto'].setValue(this.visit.visitPoolPhoto);
      this.permission = this.visit.visitLandownerPermission; //flag view to display landowner info
      if (this.visit.visitLandowner && (this.userIsAdmin || (this.currentUser && this.currentUser.username==this.visit.visitUserName))) {
        this.visitLandOwnForm.controls['visitLandownerName'].setValue(this.visit.visitLandowner.visitLandownerName);
        this.visitLandOwnForm.controls['visitLandownerAddress'].setValue(this.visit.visitLandowner.visitLandownerAddress);
        //this.visitLandOwnForm.controls['visitLandownerTown'].setValue(this.visit.visitLandowner.visitLandownerTown);
        //this.visitLandOwnForm.controls['visitLandownerStateAbbrev'].setValue(this.visit.visitLandowner.visitLandownerStateAbbrev);
        //this.visitLandOwnForm.controls['visitLandownerZip5'].setValue(this.visit.visitLandowner.visitLandownerZip5);
        this.visitLandOwnForm.controls['visitLandownerPhone'].setValue(this.visit.visitLandowner.visitLandownerPhone);
        this.visitLandOwnForm.controls['visitLandownerEmail'].setValue(this.visit.visitLandowner.visitLandownerEmail);
      }
      //3 Vernal Pool Field-Verification Informtion
      //3a Pool Type
      this.visitFieldVerificationForm.controls['visitVernalPool'].setValue(this.visit.visitVernalPool);
      this.visitFieldVerificationForm.controls['visitPoolType'].setValue(this.visit.visitPoolType);
      this.visitFieldVerificationForm.controls['visitPoolTypeOther'].setValue(this.visit.visitPoolTypeOther);
      //3b Presence of Inlet and/or Outlet
      this.visitFieldVerificationForm.controls['visitInletType'].setValue(this.visit.visitInletType);
      this.visitFieldVerificationForm.controls['visitOutletType'].setValue(this.visit.visitOutletType);
      //3c Surrounding Habitat
      this.visitFieldVerificationForm.controls['visitForestUpland'].setValue(this.visit.visitForestUpland);
      this.visitFieldVerificationForm.controls['visitForestCondition'].setValue(this.visit.visitForestCondition);
      this.visitFieldVerificationForm.controls['visitHabitatAgriculture'].setValue(this.visit.visitHabitatAgriculture);
      this.visitFieldVerificationForm.controls['visitHabitatLightDev'].setValue(this.visit.visitHabitatLightDev);
      this.visitFieldVerificationForm.controls['visitHabitatHeavyDev'].setValue(this.visit.visitHabitatHeavyDev);
      this.visitFieldVerificationForm.controls['visitHabitatPavedRd'].setValue(this.visit.visitHabitatPavedRd);
      this.visitFieldVerificationForm.controls['visitHabitatDirtRd'].setValue(this.visit.visitHabitatDirtRd);
      this.visitFieldVerificationForm.controls['visitHabitatPowerline'].setValue(this.visit.visitHabitatPowerline);
      this.visitFieldVerificationForm.controls['visitHabitatOther'].setValue(this.visit.visitHabitatOther);
      this.visitFieldVerificationForm.controls['visitHabitatComment'].setValue(this.visit.visitHabitatComment);
      //4 Pool Characteristics
      //4a Approximate Maximum Pool Depth
      this.visitPoolCharacteristicsForm.controls['visitMaxDepth'].setValue(this.visit.visitMaxDepth);
      this.visitPoolCharacteristicsForm.controls['visitWaterLevelObs'].setValue(this.visit.visitWaterLevelObs);
      this.visitPoolCharacteristicsForm.controls['visitHydroPeriod'].setValue(this.visit.visitHydroPeriod);
      this.visitPoolCharacteristicsForm.controls['visitMaxWidth'].setValue(this.visit.visitMaxWidth);
      this.visitPoolCharacteristicsForm.controls['visitMaxLength'].setValue(this.visit.visitMaxLength);
      //4e
      this.visitPoolCharacteristicsForm.controls['visitPoolTrees'].setValue(this.visit.visitPoolTrees);
      this.visitPoolCharacteristicsForm.controls['visitPoolShrubs'].setValue(this.visit.visitPoolShrubs);
      this.visitPoolCharacteristicsForm.controls['visitPoolEmergents'].setValue(this.visit.visitPoolEmergents);
      this.visitPoolCharacteristicsForm.controls['visitPoolFloatingVeg'].setValue(this.visit.visitPoolFloatingVeg);
      //4f - ENUM TYPE w/other
      this.visitPoolCharacteristicsForm.controls['visitSubstrate'].setValue(this.visit.visitSubstrate);
      this.visitPoolCharacteristicsForm.controls['visitSubstrateOther'].setValue(this.visit.visitSubstrateOther);
      this.visitPoolCharacteristicsForm.controls['visitDisturbDumping'].setValue(this.visit.visitDisturbDumping);
      this.visitPoolCharacteristicsForm.controls['visitDisturbSiltation'].setValue(this.visit.visitDisturbSiltation);
      this.visitPoolCharacteristicsForm.controls['visitDisturbVehicleRuts'].setValue(this.visit.visitDisturbVehicleRuts);
      this.visitPoolCharacteristicsForm.controls['visitDisturbRunoff'].setValue(this.visit.visitDisturbRunoff);
      this.visitPoolCharacteristicsForm.controls['visitDisturbDitching'].setValue(this.visit.visitDisturbDitching);
      this.visitPoolCharacteristicsForm.controls['visitDisturbOther'].setValue(this.visit.visitDisturbOther);

      //5 Indicator Species
      this.visitIndicatorSpeciesForm.controls['visitWoodFrogAdults'].setValue(this.visit.visitWoodFrogAdults);
      this.visitIndicatorSpeciesForm.controls['visitWoodFrogLarvae'].setValue(this.visit.visitWoodFrogLarvae);
      this.visitIndicatorSpeciesForm.controls['visitWoodFrogEgg'].setValue(this.visit.visitWoodFrogEgg);
      this.visitIndicatorSpeciesForm.controls['visitWoodFrogEggHow'].setValue(this.visit.visitWoodFrogEggHow);
      this.visitIndicatorSpeciesForm.controls['visitWoodFrogPhoto'].setValue(this.visit.visitWoodFrogPhoto);
      this.visitIndicatorSpeciesForm.controls['visitWoodFrogiNat'].setValue(this.visit.visitWoodFrogiNat);
      this.visitIndicatorSpeciesForm.controls['visitWoodFrogNotes'].setValue(this.visit.visitWoodFrogNotes);

      this.visitIndicatorSpeciesForm.controls['visitSpsAdults'].setValue(this.visit.visitSpsAdults);
      this.visitIndicatorSpeciesForm.controls['visitSpsLarvae'].setValue(this.visit.visitSpsLarvae);
      this.visitIndicatorSpeciesForm.controls['visitSpsEgg'].setValue(this.visit.visitSpsEgg);
      this.visitIndicatorSpeciesForm.controls['visitSpsEggHow'].setValue(this.visit.visitSpsEggHow);
      this.visitIndicatorSpeciesForm.controls['visitSpsPhoto'].setValue(this.visit.visitSpsPhoto);
      this.visitIndicatorSpeciesForm.controls['visitSpsiNat'].setValue(this.visit.visitSpsiNat);
      this.visitIndicatorSpeciesForm.controls['visitSpsNotes'].setValue(this.visit.visitSpsNotes);

      this.visitIndicatorSpeciesForm.controls['visitJesaAdults'].setValue(this.visit.visitJesaAdults);
      this.visitIndicatorSpeciesForm.controls['visitJesaLarvae'].setValue(this.visit.visitJesaLarvae);
      this.visitIndicatorSpeciesForm.controls['visitJesaEgg'].setValue(this.visit.visitJesaEgg);
      this.visitIndicatorSpeciesForm.controls['visitJesaEggHow'].setValue(this.visit.visitJesaEggHow);
      this.visitIndicatorSpeciesForm.controls['visitJesaPhoto'].setValue(this.visit.visitJesaPhoto);
      this.visitIndicatorSpeciesForm.controls['visitJesaiNat'].setValue(this.visit.visitJesaiNat);
      this.visitIndicatorSpeciesForm.controls['visitJesaNotes'].setValue(this.visit.visitJesaNotes);

      this.visitIndicatorSpeciesForm.controls['visitBssaAdults'].setValue(this.visit.visitBssaAdults);
      this.visitIndicatorSpeciesForm.controls['visitBssaLarvae'].setValue(this.visit.visitBssaLarvae);
      this.visitIndicatorSpeciesForm.controls['visitBssaEgg'].setValue(this.visit.visitBssaEgg);
      this.visitIndicatorSpeciesForm.controls['visitBssaEggHow'].setValue(this.visit.visitBssaEggHow);
      this.visitIndicatorSpeciesForm.controls['visitBssaPhoto'].setValue(this.visit.visitBssaPhoto);
      this.visitIndicatorSpeciesForm.controls['visitBssaiNat'].setValue(this.visit.visitBssaiNat);
      this.visitIndicatorSpeciesForm.controls['visitBssaNotes'].setValue(this.visit.visitBssaNotes);

      this.visitIndicatorSpeciesForm.controls['visitFairyShrimp'].setValue(this.visit.visitFairyShrimp);
      this.visitIndicatorSpeciesForm.controls['visitFairyShrimpPhoto'].setValue(this.visit.visitFairyShrimpPhoto);
      this.visitIndicatorSpeciesForm.controls['visitFairyShrimpiNat'].setValue(this.visit.visitFairyShrimpiNat);
      this.visitIndicatorSpeciesForm.controls['visitFairyShrimpNotes'].setValue(this.visit.visitFairyShrimpNotes);

      this.visitIndicatorSpeciesForm.controls['visitFingerNailClams'].setValue(this.visit.visitFingerNailClams);
      this.visitIndicatorSpeciesForm.controls['visitFingerNailClamsPhoto'].setValue(this.visit.visitFingerNailClamsPhoto);
      this.visitIndicatorSpeciesForm.controls['visitFingerNailClamsiNat'].setValue(this.visit.visitFingerNailClamsiNat);
      this.visitIndicatorSpeciesForm.controls['visitFingerNailClamsNotes'].setValue(this.visit.visitFingerNailClamsNotes);

      //this.visitIndicatorSpeciesForm.controls['visitSpeciesOther1'].setValue(this.visit.visitSpeciesOther1);
      //this.visitIndicatorSpeciesForm.controls['visitSpeciesOther2'].setValue(this.visit.visitSpeciesOther2);

      this.visitIndicatorSpeciesForm.controls['visitSpeciesOtherName'].setValue(this.visit.visitSpeciesOtherName);
      this.visitIndicatorSpeciesForm.controls['visitSpeciesOtherCount'].setValue(this.visit.visitSpeciesOtherCount);
      this.visitIndicatorSpeciesForm.controls['visitSpeciesOtherPhoto'].setValue(this.visit.visitSpeciesOtherPhoto);
      this.visitIndicatorSpeciesForm.controls['visitSpeciesOtheriNat'].setValue(this.visit.visitSpeciesOtheriNat);
      this.visitIndicatorSpeciesForm.controls['visitSpeciesOtherNotes'].setValue(this.visit.visitSpeciesOtherNotes);

      this.visitIndicatorSpeciesForm.controls['visitSpeciesComments'].setValue(this.visit.visitSpeciesComments);

      this.visitIndicatorSpeciesForm.controls['visitFish'].setValue(this.visit.visitFish);
      this.visitIndicatorSpeciesForm.controls['visitFishCount'].setValue(this.visit.visitFishCount);
      //this.visitIndicatorSpeciesForm.controls['visitFishSize'].setValue(this.visit.visitFishSize);
    }

    onVisitPageSelect(visitPageIndex) {
      this.visitPage.index = visitPageIndex;
      //console.log('vpvisit.view.onVisitPageSelect', this.visitPage.index);
      this.uxValuesService.visitPageIndex = visitPageIndex;
    }

    // convenience getters for easy access to form fields
    get observ() { return this.visitObserverForm.controls; }
    get mapped() { return this.visitPoolMappedForm.controls; }
    get locate() { return this.visitLocationForm.controls; }
    get landown() { return this.visitLandOwnForm.controls; }
    get fldVer() { return this.visitFieldVerificationForm.controls; }
    get indSpc() { return this.visitIndicatorSpeciesForm.controls; }

    /*
      For View Visit, load pool and visit data in one go
    */
    async loadPoolVisit(visitId) {
      this.dataLoading = true;
      this.poolsLoading = true;
      //console.log('vppools.view.component.loadPage:', visitId);
      //this.vpPoolsService.getByVisitId(visitId)
      this.vpVisitService.getById(visitId)
          .pipe(first())
          .subscribe(
              data => {
                //console.log('vppools.view.component.loadPage result:', data);
                this.pools = data.rows[0]; //sets map data
                this.visit = data.rows[0]; //sets form data
                this.poolId = this.visit.poolId; //needed for photos
                this.setFormValues();
                this.dataLoading = false;
                this.poolsLoading = false;
                this.userIsOwner = !this.currentUser ? false : (this.currentUser.username === this.visit.visitUserName);
              },
              error => {
                  this.alertService.error(error);
                  this.dataLoading = false;
                  this.poolsLoading = false;
              });
    }

    /*
      For View Mapped Pool, load pool data, and (somehow, TBD), apply that to visit data form values...
    */
    async LoadMappedPool(poolId) {
      this.dataLoading = true;
      this.poolsLoading = true;
      this.vpMappedService.getById(poolId)
          .pipe(first())
          .subscribe(
              data => {
                  //console.log(`vppools.LoadMappedPool=>data:`, data);
                  this.pools = data.rows[0]; //sets map data
                  this.visit = data.rows[0]; // TODO: not sure what this means for a mapped-only pool...
                  this.visitId = this.visit.visitId; //needed for the display of photos
                  //this.userIsOwner = (this.currentUser.username === this.pools.mappedByUser);
                  this.dataLoading = false;
                  this.poolsLoading = false;
              },
              error => {
                  //console.log(`vppools.LoadMappedPool=>error: ${error}`);
                  this.alertService.error(error);
                  this.dataLoading = false;
                  this.poolsLoading = false;
              });
    }

  private loadTowns() {
    this.dataLoading = true;
    this.townService.getTowns()
        .pipe(first())
        .subscribe(
            data => {
              this.towns = data.rows;
              this.townCount = data.rowCount;
              this.dataLoading = false;
            },
            error => {
              this.alertService.error(error);
              this.dataLoading = false;
            });

  }

  //https://angular.io/api/forms/SelectControlValueAccessor#customizing-option-selection
  //https://www.concretepage.com/angular/angular-select-option-reactive-form#comparewith
  compareTownFn(t1: vtTown, t2: vtTown) {
    //console.log('compareTownFn t1:', t1, ' t2:', t2);
    return t1 && t2 ? t1.townId === t2.townId : t1 === t2;
  }

  ToEditMode() {
    this.router.navigate([`/pools/visit/update/${this.visitId}`]);
  }

  nextPage(direction) {
    this.visitPage.index += direction;
    if (this.visitPage.index < 0) this.visitPage.index = 0;
    if (this.visitPage.index > this.visitPage.values.length-1) this.visitPage.index = this.visitPage.values.length-1;
    if (this.visitPage.index===1 && (!this.userIsAdmin && !this.userIsOwner)) this.visitPage.index += direction;
    //console.log('vpvisit.view.nextPage', this.visitPage.index);
    this.uxValuesService.visitPageIndex = this.visitPage.index;
  }

  setPage(page) {
    this.visitPage.index = page;
    //console.log('vpvisit.view.setPage', this.visitPage.index);
    this.uxValuesService.visitPageIndex = this.visitPage.index;
  }

  cancelVisit() {
    var navUrl = `/pools/list`;
    this.router.navigate([navUrl]);
  }

  PhotoFileEvent(e) {
    console.log('NOTE: PhotoFileEvent(e) - photos are NOT uploadable from View Visit');
  }

}
