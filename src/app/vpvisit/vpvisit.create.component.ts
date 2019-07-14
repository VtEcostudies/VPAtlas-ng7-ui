﻿import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpMappedService, vpVisitService, vpPoolsService, vtInfoService } from '@app/_services';
import * as Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/
import * as L from "leaflet";
import { vtTown, vpMapped, vpVisit, vpMappedEventInfo } from '@app/_models';
import { EmailOrPhone } from '@app/_helpers/email-or-phone.validator';

@Component({templateUrl: 'vpvisit.create.component.html'})
export class vpVisitCreateComponent implements OnInit {
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
        private vpPoolsService: vpPoolsService,
        private townService: vtInfoService
    ) {
      if (this.authenticationService.currentUserValue) {
        let currentUser = this.authenticationService.currentUserValue.user;
        console.log('vpvisit.create.component.ngOnInit | currentUser.userrole:', currentUser.userrole);
        this.userIsAdmin = currentUser.userrole == 'admin';
      } else {
        this.userIsAdmin = false;
        // redirect to visit search if user not logged-in
        this.router.navigate(['/visits/visit/list']);
      }
      this.loadTowns();
    }

    async ngOnInit() {
      //get poolId or visitId or from route params and load visit data from db
      this.visitId = this.route.snapshot.params.visitId;
      this.poolId = this.route.snapshot.params.poolId;
      console.log('vpvisit.create.ngOnInit route.snapshot params: visitId:', this.visitId, 'poolId:', this.poolId);

      if (this.visitId) { //update an existing visit - set all initial values in setFormValues()
        this.update = true;
        this.mapMarker = true;
        await this.createFormControls();
        await this.loadPage(this.visitId);
      } else { //create a new visit - set a few necessary initial values
        this.update = false;
        this.mapMarker = false;
        this.visit.visitId = 0;
        this.visit.visitPoolId = this.poolId; //null or valid
        this.visit.visitUserName = this.authenticationService.currentUserValue.user.username;
        this.visit.visitDate = Moment().format('MM/DD/YYYY');
        this.visit.visitLatitude = 43.916944;
        this.visit.visitLongitude = -72.668056;
        this.visit.visitTown = new vtTown(); //instantiates town object to enable default value for town drop-down
        await this.createFormControls();
        if (this.poolId) {
          this.mapMarker =  true;
          await this.LoadMappedPool(this.poolId);
        }
      }
    } //end ngOnInit

    async createFormControls() { //Create formcontrols within formgroups

      this.visitObserverForm = this.formBuilder.group({
        //these values are always set from the context, so they're disabled by default
        visitId: [{value: '(New)', disabled: true}, Validators.nullValidator],
        visitUserName: [{value: this.visit.visitUserName, disabled: true}, Validators.required],
      });

      //create a separate form for landowner data, to be nested within visitLocationForm
      //NOTE: these formdata to be rolled into a JSON oject and stored in a single field: visitLandowner
      this.visitLandOwnForm = this.formBuilder.group({
        visitLandownerName: ['', Validators.required],
        visitLandownerAddress: ['', Validators.nullValidator],
        //visitLandownerTown: ['', Validators.nullValidator],
        //visitLandownerStateAbbrev: ['', Validators.nullValidator],
        //visitLandownerZip5: ['', Validators.nullValidator],
        visitLandownerPhone: ['', Validators.nullValidator],
        visitLandownerEmail: ['', Validators.email],
      });
      this.visitLandOwnForm.disable();
      /*
      , { //this was created but designers decided NOT to use it. leave it here in case it regains favor.
          validator: EmailOrPhone('visitLandownerPhone', 'visitLandownerEmail')
      });
      */

      this.visitLocationForm = this.formBuilder.group({
        //2a Vernal Pool Location Information
        //if poolId was passed to form, visitPoolId is disabled
        visitPoolId: [{value: this.poolId, disabled: this.poolId != null || this.visitId != null }, Validators.required], //conditionally disabled in afterLoad
        visitDate: [Moment().format('MM/DD/YYYY'), Validators.required],
        visitPoolMapped: [{value: this.poolId != null ? 'true' : null, disabled: this.poolId != null || this.visitId != null}, Validators.required], //if poolId was passed to form, visitPoolMapped is TRUE
        visitLocatePool: ['', Validators.nullValidator],
        visitCertainty: ['', Validators.nullValidator],
        visitLocationUncertainty: ['', Validators.nullValidator],
        visitNavMethod: ['', Validators.nullValidator],
        visitNavMethodOther: ['', Validators.nullValidator],
        visitDirections: ['', Validators.nullValidator],
        visitTown: [new vtTown(), new FormControl(this.towns[this.townCount]), Validators.required], //displayed form-only value - a selectable list of towns
        visitTownId: [], //non-display db-only value set when the form is submitted
        visitLocationComments: ['', Validators.nullValidator],
        //2b Location of Pool
        visitCoordSource: ['', Validators.nullValidator],
        visitLatitude: ['', Validators.required],
        visitLongitude: ['', Validators.required],
        //2c Landowner Contact Information
        visitUserIsLandowner: [false, Validators.nullValidator],
        visitLandownerPermission: [false, Validators.nullValidator],
        //// TODO: set the landOwnForm from JSON object
        visitLandowner: [{disabled: true}, this.visitLandOwnForm], //non-display db-only value (JSON column) set when the form is submitted
        //see below separate formGroup for landowner contact info
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

      this.formControlValueChanged();
    } //end createFormControls()

    //how to handle UI changes from checkbox input:
    //https://blog.grossman.io/real-world-angular-reactive-forms/
    //https://netbasal.com/angular-custom-form-controls-made-easy-4f963341c8e2
    //https://www.technouz.com/4725/disable-angular-reactiveform-input-based-selection/
    //https://www.infragistics.com/community/blogs/b/infragistics/posts/how-to-do-conditional-validation-on-valuechanges-method-in-angular-reactive-forms-
    formControlValueChanged() {
      this.visitLocationForm.get('visitLandownerPermission').valueChanges.subscribe(
        (mode: boolean) => {
        console.log('vpvisit.create.fomrControlValueChanged.visitLandownerPermisssion', mode);
        this.permission = mode;
        if (this.permission) {
          this.visitLocationForm.get('visitLandowner').enable();
          this.visitLandOwnForm.enable();
        } else {
          this.visitLocationForm.get('visitLandowner').disable();
          this.visitLandOwnForm.disable();
        }
      });

      this.visitLocationForm.get('visitPoolMapped').valueChanges.subscribe(
        (mode: string) => {
          console.log('vpvisit.create.formControlValueChanged.visitPoolMapped', mode);
          if (mode == 'true') { //enable/disable to conditionally include this field in POST
            this.visitLocationForm.get('visitLocatePool').enable();
          } else {
            this.visitLocationForm.get('visitLocatePool').disable();
          }
      });
    }

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
      this.visitLocationForm.controls['visitLocationUncertainty'].setValue(this.visit.visitLocationUncertainty);
      this.visitLocationForm.controls['visitNavMethod'].setValue(this.visit.visitNavMethod);
      this.visitLocationForm.controls['visitNavMethodOther'].setValue(this.visit.visitNavMethodOther);
      this.visitLocationForm.controls['visitDirections'].setValue(this.visit.visitDirections);
      console.log('vpvisit.create.setFormValues | visitTown: ', this.visit.visitTown);
      //if visitTown from the db is null, we must set a default value here
      this.visitLocationForm.controls['visitTown'].setValue(this.visit.visitTown || new vtTown()); //set whole object, uses compare fn to match drop-down
      this.visitLocationForm.controls['visitTownId'].setValue(this.visit.visitTownId);
      this.visitLocationForm.controls['visitLocationComments'].setValue(this.visit.visitLocationComments);
      //2b Location of Pool
      this.visitLocationForm.controls['visitCoordSource'].setValue(this.visit.visitCoordSource);
      this.visitLocationForm.controls['visitLatitude'].setValue(this.visit.visitLatitude);
      this.visitLocationForm.controls['visitLongitude'].setValue(this.visit.visitLongitude);
      //2c Landowner Contact Information - add in vpvisit.alter.sql
      this.visitLocationForm.controls['visitUserIsLandowner'].setValue(this.visit.visitUserIsLandowner);
      this.visitLocationForm.controls['visitLandownerPermission'].setValue(this.visit.visitLandownerPermission);
      console.log('vpvisit.create.setFormValues | visitLandownerPermission: ', this.visit.visitLandownerPermission);
      if (this.visit.visitLandownerPermission) {
        console.log('vpvisit.create.setFormValues | visitLandowner: ', this.visit.visitLandowner);
        this.visitLocationForm.get('visitLandowner').enable();
        this.visitLocationForm.controls['visitLandowner'].setValue(this.visit.visitLandowner);
        this.visitLandOwnForm.enable();
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

    /*
      Receive a markerLocationUpdate event emitted from the map when the map Marker is moved.
    */
    markerLocationUpdate(visitLoc: L.LatLng) {
      this.visitUpdateLocation = visitLoc;
      this.visitLocationForm.controls['visitLatitude'].setValue(visitLoc.lat);
      this.visitLocationForm.controls['visitLongitude'].setValue(visitLoc.lng);
    }

    /*
      Receive a markerSelected event emitted from the map when a mapped pool marker is clicked.
    */
    markerSelected(itemInfo: vpMappedEventInfo) {
      console.log('vpvisit.create.markerSelected()', itemInfo);
      this.visitLocationForm.controls['visitPoolId'].setValue(itemInfo.poolId);
      this.visitLocationForm.controls['visitLatitude'].setValue(itemInfo.latLng.lat);
      this.visitLocationForm.controls['visitLongitude'].setValue(itemInfo.latLng.lng);
    }

    mapShowingChange(e) {
      console.log('mapShowingChange', e);
      this.mapShowing = e.target.checked;
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
    async loadPage(visitId) {
      this.dataLoading = true;
      console.log('vpvisit.create.component.loadPage:', visitId);
      this.vpPoolsService.getByVisitId(visitId)
          .pipe(first())
          .subscribe(
              data => {
                console.log('vpvisit.create.component.loadPage result:', data);
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

    /*
    This callback will update the map by showing the selected Pool ID, somehow.
    */
    visitPoolIdChanged(e) {
      console.log(this.visitLocationForm.value.visitPoolId);
    }

    /*
     This is called in response to a click on one of the radio buttons for the
     column visitPoolMapped.
    */
    visitModeChanged(e) {
      console.log(this.visitLocationForm.value.visitPoolMapped);
      if (this.visitLocationForm.value.visitPoolMapped == 'true') {
        this.visitLocationForm.controls['visitPoolId'].setValue('');
        this.visitLocationForm.controls['visitPoolId'].enable();
        this.itemType = "Visit Mapped Pool"; //must use this itemType to signal map to send poolId via event
        this.mapMarker = false;
        this.mapPoints = true;
        this.loadMappedPools();
      }
      if (this.visitLocationForm.value.visitPoolMapped == 'false') {
        this.visitLocationForm.controls['visitPoolId'].setValue('NEW*');
        this.visitLocationForm.controls['visitPoolId'].disable();
        this.itemType = "Visit New Pool";
        this.mapMarker = true;
        this.mapPoints = true;
        this.loadMappedPools();
      }
    }

    async LoadMappedPool(poolId) {
      this.dataLoading = true;
      this.vpMappedService.getById(poolId)
          .pipe(first())
          .subscribe(
              data => {
                  console.log(`vpvisit.LoadMappedPool=>data:`, data);
                  this.locMarker = data.rows[0];
                  this.visitLocationForm.controls['visitLatitude'].setValue(this.locMarker.latitude);
                  this.visitLocationForm.controls['visitLongitude'].setValue(this.locMarker.longitude);
                  this.dataLoading = false;
              },
              error => {
                  console.log(`vpvisit.LoadMappedPool=>error: ${error}`);
                  this.alertService.error(error);
                  this.dataLoading = false;
              });
    }

    /*
      Create a mapped pool from visit data:
      - copy observer and location data to a newly-instantiated vpMapped Object
      - call vpMappedService.create with that object
    */
    CreateMappedPool() {
      var mappedPool = <any>{};

      this.submitted = true;

      console.log(`vpvisit.create.CreateMappedPool`);

      mappedPool.mappedByUser = this.visitObserverForm.value.visitUserName;

      //mappedPoolId value should be 'NEW*' to indicate to the db server that we need to generate a poolId
      //because visitPoolId is disabled, the value is underfined. argh.
      mappedPool.mappedPoolId = 'NEW*'; //this.visitLocationForm.value.visitPoolId;
      mappedPool.mappedDateText = this.visitLocationForm.value.visitDate;
      mappedPool.mappedLocationUncertainty = this.visitLocationForm.value.visitLocationUncertainty;
      mappedPool.mappedlocationInfoDirections = this.visitLocationForm.value.visitDirections;
      mappedPool.mappedTownId = this.visitLocationForm.value.visitTown.townId;
      mappedPool.mappedComments = this.visitLocationForm.value.visitLocationComments;

      mappedPool.mappedLatitude = this.visitLocationForm.value.visitLatitude;
      mappedPool.mappedLongitude = this.visitLocationForm.value.visitLongitude;
      mappedPool.mappedMethod = 'Visit';

      mappedPool.mappedLandownerPermission = this.visitLocationForm.value.visitLandownerPermission;
      mappedPool.mappedLandownerName = this.visitLocationForm.value.visitLandownerName;
      mappedPool.mappedLandownerAddress = this.visitLocationForm.value.visitLandownerAddress;
      mappedPool.mappedLandownerPhone = this.visitLocationForm.value.visitLandownerPhone;
      mappedPool.mappedLandownerEmail = this.visitLocationForm.value.visitLandownerEmail;

      console.log(`vpvisit.create.CreateMappedPool | mappedPool:`, mappedPool);

      if (this.visitLocationForm.invalid) {
        console.log(`visitLocationForm.invalid`);
        this.setPage(0);
        return;
      }

      this.dataLoading = true;
      this.vpMappedService.create(mappedPool)
          .pipe(first())
          .subscribe(
              data => {
                  console.log(`vpvisit.CreateMappedPool=>data:`, data);
                  this.dataLoading = false;
                  //this.visitLocationForm.value.visitPoolId = this.poolId;
                  this.poolId = data.rows[0].mappedPoolId; //this is used when poolId form value is null due to being disabled
                  this.visitLocationForm.controls['visitPoolId'].setValue(this.poolId);
                  this.itemType = "Visit Mapped Pool"; //we now have a Mapped Pool and can proceed to Visit data, must set itemType='Visit Mapped Pool' to signal map to send poolId via event
                  this.visitLocationForm.get('visitPoolMapped').disable(); //must disable this selector after saving NEW* pool, or too confusing
              },
              error => {
                  console.log(`vpvisit.CreateMappedPool=>error: ${error}`);
                  this.alertService.error(error);
                  this.dataLoading = false;
              });
    }

    //validate fields and create the visit
    CreateVisit() {

        console.log(`vpvisit.create.CreateVisit`);

        this.submitted = true;

        //kluge to get around disabled fields not being included in form values
        //and not having an easy validator for requiring visitUser = logon user
        if (!this.update && this.visitObserverForm.value.visitUserName != this.authenticationService.currentUserValue.user.username) {
          this.alertService.error("Visit User must be your username.");
          this.setPage(0);
          return;
        }

        if (Number(this.visitLocationForm.value.visitLatitude) < 42.3 || Number(this.visitLocationForm.value.visitLatitude) > 45.1) {
          this.alertService.error("Latitude must be between 42.3 and 45.1 to be in Vermont.");
          this.setPage(0);
          return;
        }

        if (Number(this.visitLocationForm.value.visitLongitude) > -71.5 || Number(this.visitLocationForm.value.visitLongitude) < -73.5) {
          this.alertService.error("Longitude must be between 71.5 and 73.5 to be in Vermont.");
          this.setPage(0);
          return;
        }

        //console.log('vpvisit.create.component.CreateVisit | visitTown',this.visitLocationForm.value.visitTown);
        //our method to extract townId from townObject is to have a non-display formControl and
        //assign its value here. the API expects a db column name with a single value, and we
        //choose to add that complexity here rather than parse requests in API code.
        console.log('vpvisit.create.createVisit | visitTownId: ', this.visitLocationForm.value.visitTown.townId);
        if (typeof(this.visitLocationForm.value.visitTown) != undefined && this.visitLocationForm.value.visitTown) {
          this.visitLocationForm.controls['visitTownId'].setValue(this.visitLocationForm.value.visitTown.townId);
        } else {
          this.alertService.error('Please select a Town for this Visit.')
          this.setPage(0);
          return;
        }

        // stop here if form is invalid - navigate to the earliest page missing data
        if (this.visitObserverForm.invalid) {
          console.log(`visitObserverForm.invalid`,this.visitObserverForm.invalid);
          this.setPage(0);
          return;
        }
        if (this.visitLocationForm.invalid) {
          console.log(`visitLocationForm.invalid`,this.visitLocationForm.invalid);
          this.setPage(0);
          return;
        }
        if (this.visitLandOwnForm.enabled && this.visitLandOwnForm.invalid) {
          console.log(`visitLandOwnForm.invalid`, this.visitLandOwnForm.invalid);
          this.setPage(1);
          return;
        }
        if (this.visitFieldVerificationForm.invalid) {
          console.log(`visitFieldVerificationForm.invalid`,this.visitFieldVerificationForm.invalid);
          this.setPage(2);
          return;
        }
        if (this.visitPoolCharacteristicsForm.invalid) {
          console.log(`visitPoolCharacteristicsForm.invalid`,this.visitPoolCharacteristicsForm.invalid);
          this.setPage(3);
          return;
        }
        if (this.visitIndicatorSpeciesForm.invalid) {
          console.log(`visitIndicatorSpeciesForm.invalid`,this.visitIndicatorSpeciesForm.invalid);
          this.setPage(4);
          return;
        }

        //if the form value of visitPoolId is null (due to being disabled) use this.poolId
        if (!this.visitLocationForm.value.visitPoolId) {
          this.visitLocationForm.value.visitPoolId = this.poolId;
        }

        //flatten the POSTed object before posting. the visitLandowner nested form
        //is passed, but the API can't parse it. (to-do: handle that?)
        // TODO: roll landowner data into json object for db JSONB column
        if (this.visitLocationForm.value.visitLandownerPermission) {
          //Object.assign(this.visitLocationForm.value, this.visitLandOwnForm.value);
          //delete this.visitLocationForm.value.visitLandowner; //JSON object on Location Form...
          console.log('LocationForm.visitLandowner: ', this.visitLocationForm.value.visitLandowner);
          console.log('LandownForm.visitLandowner: ', this.visitLandOwnForm.value);
          this.visitLocationForm.controls['visitLandowner'].setValue(this.visitLandOwnForm.value);
        }
        //have to convert true/false radio buttons from string to boolean
        this.visitLocationForm.value.visitPoolMapped = this.visitLocationForm.value.visitPoolMapped == 'true';
        this.visitLocationForm.value.visitLocatePool = this.visitLocationForm.value.visitLocatePool == 'true';

        //visitObserverForm
        Object.assign(this.visitLocationForm.value, this.visitObserverForm.value);

        //visitFieldVerificationForm
        Object.assign(this.visitLocationForm.value, this.visitFieldVerificationForm.value);

        //visitPoolCharacteristicsForm
        Object.assign(this.visitLocationForm.value, this.visitPoolCharacteristicsForm.value);

        //visitIndicatorSpeciesForm
        Object.assign(this.visitLocationForm.value, this.visitIndicatorSpeciesForm.value);

        //remove visitId from the POST data if creating a New pool
        if (!this.update) {
          delete this.visitLocationForm.value.visitId;
        }

        this.dataLoading = true;
        this.vpVisitService.createOrUpdate(this.update, this.visitId, this.visitLocationForm.value)
            .pipe(first())
            .subscribe(
                data => {
                    console.log(`vpvisit.create=>data:`, data);
                    if (this.update) {
                      this.alertService.success(`Successfully updated Vernal Pool Visit ${this.visitId}.`, true);
                    } else {
                      this.alertService.success('Successfully added Vernal Pool Visit.', true);
                    }
                    this.dataLoading = false;
                    if (data.rows[0]) {this.visitId = data.rows[0].visitId;}
                    else {this.visitId = this.visitLocationForm.value.visitId}
                    this.router.navigate([`/pools/visit/view/${this.visitId}`]);
                },
                error => {
                    console.log(`vpvisit.create=>error: ${error}`);
                    this.alertService.error(error);
                    this.dataLoading = false;
                });
    }

    nextPage(direction) {
      this.visitPage.index += direction;
      if (this.visitPage.index < 0) this.visitPage.index = 0;
      if (this.visitPage.index > this.visitPage.values.length-1) this.visitPage.index = this.visitPage.values.length-1;
    }

    setPage(page) {
      this.visitPage.index = page;
    }

  cancelVisit() {
    var navUrl = null;
    var msgTxt = null;

    if (this.update) {
      msgTxt = `to Visit ${this.visitId}`
      navUrl = `/pools/visit/view/${this.visitId}`;
    } else if (this.poolId) {
      msgTxt = `of a New Visit to Pool ID ${this.poolId}`;
      navUrl = `/pools/mapped/view/${this.poolId}`;
    } else {
      msgTxt = `of a New Visit to a New Pool`;
      navUrl = `/pools/visit/list`;
    }

    if (confirm(`Are you sure you want to cancel edits ${msgTxt}?`)) {
      this.router.navigate([navUrl]);
    } else {
      console.log('visit NOT cancelled');
    }
  }

  deleteVisit() {
    if (confirm(`Are you sure you want to delete visit ${this.visit.visitId}?`)) {
      this.vpVisitService.delete(this.visit.visitId)
        .pipe(first())
        .subscribe(
            data => {
                console.log(`vpvisit.create.deleteVisit=>data:`, data);
                this.alertService.success('Successfully deleted Vernal Pool Visit.', true);
                this.router.navigate([`/pools/visit/list`]);
            },
            error => {
                console.log(`vpvisit.create.deleteVisit=>error: `, error);
                this.alertService.error(error);
                this.dataLoading = false;
            });
    }
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

  async loadTowns() {
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
    //console.log('vpvisit.create.compareTownFn t1:', t1, ' t2:', t2);
    return t1 && t2 ? t1.townId === t2.townId : t1 === t2;
  }

}
