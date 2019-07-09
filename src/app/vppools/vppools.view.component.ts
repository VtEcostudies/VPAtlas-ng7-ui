import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpMappedService, vpVisitService, vtInfoService } from '@app/_services';
import * as Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/
import * as L from "leaflet";
import { vtTown, vpMapped, vpVisit, vpMappedEventInfo } from '@app/_models';
import { EmailOrPhone } from '@app/_helpers/email-or-phone.validator';

@Component({templateUrl: '../vpvisit/vpvisit.create.component.html'})
export class vpViewComponent implements OnInit {
    update = false; //flag for html config that we are editing an existing visit, not creating a new one
    userIsAdmin = false;
    visitObserverForm: FormGroup = this.formBuilder.group({});
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
    visitId = null; //visitId passed via routeParams- indicates an edit/update of an existing visit
    poolId = null; //poolId passed via routeParams - indicates the creation of a new visit
    visit: vpVisit = new vpVisit(); //not passed to map, used by the forms
    mapPoints = false; //flag to plot pools on map as circleMarkers, passed to map via [mapPoints]="mapPoints"
    pools = []; //passed to map via [mapValues]="pools" - plots extant pools as circleMarkers
    itemType = 'Visit'; //passed to map via [itemType]="itemType"
    visitUpdateLocation = new L.LatLng(43.6962, -72.3197);
    mapMarker = false; //flag to show marker, passed to map via [mapMarker]="mapMarker"- marker is moved to provide lat/long values via emitted events
    locMarker = null; //data to locate marker, passed to map via [locMarker]="locMarker"- marker location is plotted from these values
    mapShowing = true; //flag to show/hide map (NO LONGER USED)

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private vpMappedService: vpMappedService,
        private vpVisitService: vpVisitService,
        private townService: vtInfoService
    ) {
      if (this.authenticationService.currentUserValue) {
        let currentUser = this.authenticationService.currentUserValue.user;
        console.log('vppools.view.component.ngOnInit | currentUser.userrole:', currentUser.userrole);
        this.userIsAdmin = currentUser.userrole == 'admin';
      } else {
        this.userIsAdmin = false;
      }
      this.loadTowns();
    }

    async ngOnInit() {
      //get poolId or visitId or from route params and load visit data from db
      this.visitId = this.route.snapshot.params.visitId;
      this.poolId = this.route.snapshot.params.poolId;
      console.log('vppools.view.ngOnInit route.snapshot params: visitId:', this.visitId, 'poolId:', this.poolId);

      this.update = false;
      this.mapMarker = false;
      await this.createFormControls();

      if (this.visitId) { //update an existing visit - set all initial values in setFormValues()
        await this.loadPoolVisit(this.visitId);
      } else if (this.poolId) {
        await this.LoadMappedPool(this.poolId);
      } else { //redirect to pool list
        this.router.navigate(['/pools/list']);
      }
    } //end ngOnInit

    async createFormControls() { //Create formcontrols within formgroups

      this.visitObserverForm = this.formBuilder.group({
        //these values are always set from the context, so they're disabled by default
        visitId: [{value: '(New)', disabled: true}, Validators.nullValidator],
        visitUserName: [{value: this.visit.visitUserName, disabled: true}, Validators.required],
      });

      this.visitLocationForm = this.formBuilder.group({
        //2a Vernal Pool Location Information
        //if poolId was passed to form, visitPoolId is disabled
        visitPoolId: [],
        visitDate: [],
        visitPoolMapped: [],
        visitLocatePool: [],
        visitCertainty: [],
        visitLocationUncertainty: [],
        visitNavMethod: [],
        visitNavMethodOther: [],
        visitDirections: [],
        visitTown: [],
        visitTownId: [],
        visitLocationComments: [],
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
        visitWoodFrogNotes: [],

        visitSpsAdults: [],
        visitSpsLarvae: [],
        visitSpsEgg: [],
        visitSpsEggHow: [],
        visitSpsPhoto: [],
        visitSpsNotes: [],

        visitJesaAdults: [],
        visitJesaLarvae: [],
        visitJesaEgg: [],
        visitJesaEggHow: [],
        visitJesaPhoto: [],
        visitJesaNotes: [],

        visitBssaAdults: [],
        visitBssaLarvae: [],
        visitBssaEgg: [],
        visitBssaEggHow: [],
        visitBssaPhoto: [],
        visitBssaNotes: [],

        visitFairyShrimp: [],
        visitFairyShrimpPhoto: [],
        visitFairyShrimpNotes: [],

        visitFingerNailClams: [],
        visitFingerNailClamsPhoto: [],
        visitFingerNailClamsNotes: [],

        //visitSpeciesOther1: [], //legacy data. no longer used
        //visitSpeciesOther2: [], //legacy data. no longer used
        visitSpeciesOtherName: [],
        visitSpeciesOtherCount: [],
        visitSpeciesOtherPhoto: [],
        visitSpeciesOtherNotes: [],

        visitSpeciesComments: [],

        visitFish:[],
        visitFishCount: [],
        //visitFishSize:[], //legacy data. no longer used.

        visitPoolPhoto: [],
      });

      this.visitObserverForm.disable();
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
      //2a Vernal Pool Location Information
      this.visitLocationForm.controls['visitPoolId'].setValue(this.visit.visitPoolId);
      this.visitLocationForm.controls['visitDate'].setValue(Moment(this.visit.visitDate).format('MM/DD/YYYY'));
      this.visitLocationForm.controls['visitPoolMapped'].setValue(this.visit.visitPoolMapped.toString()); //radio button bool=>string
      const locatePool = this.visit.visitLocatePool ? this.visit.visitLocatePool.toString() : false; //radio button bool=>string
      this.visitLocationForm.controls['visitLocatePool'].setValue(locatePool);
      this.visitLocationForm.controls['visitCertainty'].setValue(this.visit.visitCertainty);
      this.visitLocationForm.controls['visitNavMethod'].setValue(this.visit.visitNavMethod);
      this.visitLocationForm.controls['visitNavMethodOther'].setValue(this.visit.visitNavMethodOther);
      this.visitLocationForm.controls['visitDirections'].setValue(this.visit.visitDirections);
      this.visitLocationForm.controls['visitTown'].setValue(this.visit.visitTown);
      this.visitLocationForm.controls['visitLocationComments'].setValue(this.visit.visitLocationComments);
      //2b Location of Pool
      this.visitLocationForm.controls['visitCoordSource'].setValue(this.visit.visitCoordSource);
      this.visitLocationForm.controls['visitLatitude'].setValue(this.visit.visitLatitude);
      this.visitLocationForm.controls['visitLongitude'].setValue(this.visit.visitLongitude);
      //2c Landowner Contact Information - add in vpvisit.alter.sql
      this.visitLocationForm.controls['visitUserIsLandowner'].setValue(this.visit.visitUserIsLandowner);
      this.visitLocationForm.controls['visitLandownerPermission'].setValue(this.visit.visitLandownerPermission);
      //this.visitLocationForm.controls['visitLandowner'].setValue(this.visit.visitLandowner);
      if (this.visit.visitLandowner) {
        this.visitLandOwnForm.controls['visitLandownerName'].setValue(this.visit.visitLandowner.landownerName);
        this.visitLandOwnForm.controls['visitLandownerAddress'].setValue(this.visit.visitLandowner.landownerAddress);
        //this.visitLandOwnForm.controls['visitLandownerTown'].setValue(this.visit.visitLandowner.landownerTown);
        //this.visitLandOwnForm.controls['visitLandownerStateAbbrev'].setValue(this.visit.visitLandowner.landownerStateAbbrev);
        //this.visitLandOwnForm.controls['visitLandownerZip5'].setValue(this.visit.visitLandowner.landownerZip5);
        this.visitLandOwnForm.controls['visitLandownerPhone'].setValue(this.visit.visitLandowner.landownerPhone);
        this.visitLandOwnForm.controls['visitLandownerEmail'].setValue(this.visit.visitLandowner.landownerEmail);
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
      this.visitIndicatorSpeciesForm.controls['visitWoodFrogNotes'].setValue(this.visit.visitWoodFrogNotes);

      this.visitIndicatorSpeciesForm.controls['visitSpsAdults'].setValue(this.visit.visitSpsAdults);
      this.visitIndicatorSpeciesForm.controls['visitSpsLarvae'].setValue(this.visit.visitSpsLarvae);
      this.visitIndicatorSpeciesForm.controls['visitSpsEgg'].setValue(this.visit.visitSpsEgg);
      this.visitIndicatorSpeciesForm.controls['visitSpsEggHow'].setValue(this.visit.visitSpsEggHow);
      this.visitIndicatorSpeciesForm.controls['visitSpsPhoto'].setValue(this.visit.visitSpsPhoto);
      this.visitIndicatorSpeciesForm.controls['visitSpsNotes'].setValue(this.visit.visitSpsNotes);

      this.visitIndicatorSpeciesForm.controls['visitJesaAdults'].setValue(this.visit.visitJesaAdults);
      this.visitIndicatorSpeciesForm.controls['visitJesaLarvae'].setValue(this.visit.visitJesaLarvae);
      this.visitIndicatorSpeciesForm.controls['visitJesaEgg'].setValue(this.visit.visitJesaEgg);
      this.visitIndicatorSpeciesForm.controls['visitJesaEggHow'].setValue(this.visit.visitJesaEggHow);
      this.visitIndicatorSpeciesForm.controls['visitJesaPhoto'].setValue(this.visit.visitJesaPhoto);
      this.visitIndicatorSpeciesForm.controls['visitJesaNotes'].setValue(this.visit.visitJesaNotes);

      this.visitIndicatorSpeciesForm.controls['visitBssaAdults'].setValue(this.visit.visitBssaAdults);
      this.visitIndicatorSpeciesForm.controls['visitBssaLarvae'].setValue(this.visit.visitBssaLarvae);
      this.visitIndicatorSpeciesForm.controls['visitBssaEgg'].setValue(this.visit.visitBssaEgg);
      this.visitIndicatorSpeciesForm.controls['visitBssaEggHow'].setValue(this.visit.visitBssaEggHow);
      this.visitIndicatorSpeciesForm.controls['visitBssaPhoto'].setValue(this.visit.visitBssaPhoto);
      this.visitIndicatorSpeciesForm.controls['visitBssaNotes'].setValue(this.visit.visitBssaNotes);

      this.visitIndicatorSpeciesForm.controls['visitFairyShrimp'].setValue(this.visit.visitFairyShrimp);
      this.visitIndicatorSpeciesForm.controls['visitFairyShrimpPhoto'].setValue(this.visit.visitFairyShrimpPhoto);
      this.visitIndicatorSpeciesForm.controls['visitFairyShrimpNotes'].setValue(this.visit.visitFairyShrimpNotes);

      this.visitIndicatorSpeciesForm.controls['visitFingerNailClams'].setValue(this.visit.visitFingerNailClams);
      this.visitIndicatorSpeciesForm.controls['visitFingerNailClamsPhoto'].setValue(this.visit.visitFingerNailClamsPhoto);
      this.visitIndicatorSpeciesForm.controls['visitFingerNailClamsNotes'].setValue(this.visit.visitFingerNailClamsNotes);

      //this.visitIndicatorSpeciesForm.controls['visitSpeciesOther1'].setValue(this.visit.visitSpeciesOther1);
      //this.visitIndicatorSpeciesForm.controls['visitSpeciesOther2'].setValue(this.visit.visitSpeciesOther2);

      this.visitIndicatorSpeciesForm.controls['visitSpeciesOtherName'].setValue(this.visit.visitSpeciesOtherName);
      this.visitIndicatorSpeciesForm.controls['visitSpeciesOtherCount'].setValue(this.visit.visitSpeciesOtherCount);
      this.visitIndicatorSpeciesForm.controls['visitSpeciesOtherPhoto'].setValue(this.visit.visitSpeciesOtherPhoto);
      this.visitIndicatorSpeciesForm.controls['visitSpeciesOtherNotes'].setValue(this.visit.visitSpeciesOtherNotes);

      this.visitIndicatorSpeciesForm.controls['visitSpeciesComments'].setValue(this.visit.visitSpeciesComments);

      this.visitIndicatorSpeciesForm.controls['visitFish'].setValue(this.visit.visitFish);
      this.visitIndicatorSpeciesForm.controls['visitFishCount'].setValue(this.visit.visitFishCount);
      //this.visitIndicatorSpeciesForm.controls['visitFishSize'].setValue(this.visit.visitFishSize);

      this.visitIndicatorSpeciesForm.controls['visitPoolPhoto'].setValue(this.visit.visitPoolPhoto);

    }

    onVisitPageSelect(visitPageIndex) {
      this.visitPage.index = visitPageIndex;
      //console.log('onVisitPageSelect', this.visitPage);
    }

    // convenience getters for easy access to form fields
    get observ() { return this.visitObserverForm.controls; }
    get locate() { return this.visitLocationForm.controls; }
    get landown() { return this.visitLandOwnForm.controls; }
    get fldVer() { return this.visitFieldVerificationForm.controls; }
    get indSpc() { return this.visitIndicatorSpeciesForm.controls; }

    /*
      When updating an existing Visit, load that visit and populate the fields
    */
    async loadPoolVisit(visitId) {
      this.dataLoading = true;
      console.log('vppools.view.component.loadPage:', visitId);
      this.vpVisitService.getById(visitId)
          .pipe(first())
          .subscribe(
              data => {
                console.log('vppools.view.component.loadPage result:', data);
                this.visit = data.rows[0];
                this.locMarker = {latitude: this.visit.latitude, longitude: this.visit.longitude};
                this.setFormValues();
                this.dataLoading = false;
              },
              error => {
                  this.alertService.error(error);
                  this.dataLoading = false;
              });
    }

    async LoadMappedPool(poolId) {
      this.dataLoading = true;
      this.vpMappedService.getById(poolId)
          .pipe(first())
          .subscribe(
              data => {
                  console.log(`vpvisit.LoadMappedPool=>data:`, data);
                  this.locMarker = data.rows[0];
                  this.dataLoading = false;
              },
              error => {
                  console.log(`vpvisit.LoadMappedPool=>error: ${error}`);
                  this.alertService.error(error);
                  this.dataLoading = false;
              });
    }

  private loadMappedPools() {
    this.poolsLoading = true;
    this.vpMappedService.getAll('')
        .pipe(first())
        .subscribe(
            data => {
              this.pools = data.rows;
              this.poolsLoading = false;
            },
            error => {
              this.alertService.error(error);
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

}
