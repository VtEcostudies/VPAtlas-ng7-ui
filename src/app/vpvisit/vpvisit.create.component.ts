import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService, AuthenticationService, vpVisitService, vtInfoService } from '@app/_services';
import * as Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/
import * as L from "leaflet";
import { vpVisit } from '@app/_models';
import { vtTown } from '@app/_models';

@Component({templateUrl: 'vpvisit.create.component.html'})
export class vpVisitCreateComponent implements OnInit {
    update = false; //flag for html config that this is create (vpvisit.create.component.html is used by vpvisit.create..ts and vpvisit.update..ts)
    userIsAdmin = false;
    visitObserverForm: FormGroup = this.formBuilder.group({});
    visitLocationForm: FormGroup = this.formBuilder.group({});
    visitLandOwnForm: FormGroup = this.formBuilder.group({});
    visitFieldVerificationForm: FormGroup = this.formBuilder.group({});
    visitPoolCharacteristicsForm: FormGroup = this.formBuilder.group({});
    visitIndicatorSpeciesForm:FormGroup = this.formBuilder.group({});
    visitPage = {index: 0, values: [
                  {name:"Pool-Location"},
                  {name:"Field-Verification"},
                  {name:"Pool-Characteristics"},
                  {name:"Indicator-Species"}
                ]};
    towns = [];
    townCount = 0;
    dataLoading = false;
    submitted = false;
    permission = false; //flag: landowner permission obtained
    visitId = null; //visitId passed via routeParams- indicates an edit/update of an existing visit
    poolId = null; //poolId passed via routeParams - indicates the creation of a new visit
    //visit: vpVisit = new vpVisit();
    visit = new vpVisit();
    visitUpdateLocation = new L.LatLng(43.6962, -72.3197);
    mapShowing = true;
    mapMarker = true;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private vpVisitService: vpVisitService,
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

      if (this.visitId) { //update an existing visit - set all initial values in afterLoad()
        this.update = true;
        //this.loadPage(this.visitId); //calls createFormControls() after loading data
        await this.createFormControls();
        await this.loadPage(this.visitId);
      } else { //create a new visit - set a few necessary initial values
        this.update = false;
        this.visit.visitId = 0;
        this.visit.visitPoolId = this.poolId;
        this.visit.visitUserName = this.authenticationService.currentUserValue.user.username;
        this.visit.visitDate = Moment().format('MM/DD/YYYY');
        this.visit.visitLatitude = 43.916944;
        this.visit.visitLongitude = -72.668056;
        this.visit.visitTown = new vtTown(); //instantiates town object to enable default value for town drop-down
        this.createFormControls();
      }
    } //end ngOnInit

    async createFormControls() { //Create formcontrols within formgroups

      this.visitObserverForm = this.formBuilder.group({
        //these values always set from the context, so they're disabled by default
        visitId: [{value: '(New)', disabled: true}, Validators.nullValidator],
        visitUserName: [{value: this.visit.visitUserName, disabled: true}, Validators.required],
      });

      this.visitLocationForm = this.formBuilder.group({
        //2a Vernal Pool Location Information
        visitPoolId: [this.visit.visitPoolId, Validators.required], //conditionally disabled in afterLoad
        visitDate: [Moment(this.visit.visitDate).format('MM/DD/YYYY'), Validators.required],
        visitPoolMapped: [this.visit.visitPoolMapped, Validators.nullValidator],
        visitLocatePool: [this.visit.visitLocatePool, Validators.nullValidator],
        visitCertainty: [this.visit.visitCertainty, Validators.nullValidator],
        visitNavMethod: [this.visit.visitNavMethod, Validators.nullValidator],
        visitDirections: [this.visit.visitDirections, Validators.nullValidator],
        visitTown: [this.visit.visitTown, new FormControl(this.towns[this.townCount])], //displayed form-only value - a selectable list of towns
        visitTownId: [this.visit.visitTownId], //non-display db-only value set when the form is submitted
        visitLocationComments: [this.visit.visitLocationComments, Validators.nullValidator],
        //2b Location of Pool
        visitCoordSource: [this.visit.visitCoordSource, Validators.nullValidator],
        visitLatitude: [this.visit.visitLatitude, Validators.required],
        visitLongitude: [this.visit.visitLongitude, Validators.required],
        //2c Landowner Contact Information
        visitUserIsLandowner: [this.visit.visitUserIsLandowner, Validators.nullValidator],
        visitLandownerPermission: [this.visit.visitLandownerPermission, Validators.nullValidator],
        //// TODO: set the landOwnForm from JSON object
        visitLandowner: [{disabled: true}, this.visitLandOwnForm], //non-display db-only value (JSON column) set when the form is submitted
        //see below separate formGroup for landowner contact info
      });

      //create a separate form for landowner data, to be nested within visitLocationForm
      //NOTE: these formdata to be rolled into a JSON oject and stored in a single field: visitLandowner
      this.visitLandOwnForm = this.formBuilder.group({
        visitLandownerName: ['', Validators.required], //flip to enabled if Permission
        visitLandownerAddress: ['', Validators.required], //flip to enabled if Permission
        visitLandownerTown: ['', Validators.required], //flip to enabled if Permission
        visitLandownerStateAbbrev: ['', Validators.required], //flip to enabled if Permission
        visitLandownerZip5: ['', Validators.required], //flip to enabled if Permission
        visitLandownerPhone: ['', Validators.required], //flip to enabled if Permission
        visitLandownerEmail: ['', Validators.required], //flip to enabled if Permission
      });

      this.visitFieldVerificationForm = this.formBuilder.group({
        visitVernalPool: [],
        visitPoolType: [],
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

        visitSpeciesOther1: [],
        visitSpeciesOther2: [],

        visitSpeciesComments: [],

        visitFish:[],
        visitFishCount: [],
        visitFishSize:[],

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
        this.permission = mode;
        if (this.permission) {
          this.visitLocationForm.get('visitLandowner').enable();
        } else {
          this.visitLocationForm.get('visitLandowner').disable();
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
      this.visitLocationForm.controls['visitDate'].setValue(this.visit.visitDate);
      this.visitLocationForm.controls['visitPoolMapped'].setValue(this.visit.visitPoolMapped.toString()); //radio button bool=>string
      const locatePool = this.visit.visitLocatePool ? this.visit.visitLocatePool.toString() : false; //radio button bool=>string
      this.visitLocationForm.controls['visitLocatePool'].setValue(locatePool);
      this.visitLocationForm.controls['visitCertainty'].setValue(this.visit.visitCertainty);
      this.visitLocationForm.controls['visitNavMethod'].setValue(this.visit.visitNavMethod);
      this.visitLocationForm.controls['visitDirections'].setValue(this.visit.visitDirections);
      this.visitLocationForm.controls['visitTown'].setValue(this.visit.visitTown  );
      this.visitLocationForm.controls['visitLocationComments'].setValue(this.visit.visitLocationComments);
      //2b Location of Pool
      this.visitLocationForm.controls['visitCoordSource'].setValue(this.visit.visitCoordSource);
      this.visitLocationForm.controls['visitLatitude'].setValue(this.visit.visitLatitude);
      this.visitLocationForm.controls['visitLongitude'].setValue(this.visit.visitLongitude);
      //2c Landowner Contact Information - add in vpvisit.alter.sql
      this.visitLocationForm.controls['visitUserIsLandowner'].setValue(this.visit.visitUserIsLandowner);
      this.visitLocationForm.controls['visitLandownerPermission'].setValue(this.visit.visitLandownerPermission);
      this.visitLocationForm.controls['visitLandowner'].setValue(this.visit.visitLandowner);
      //3 Vernal Pool Field-Verification Informtion
      //3a Pool Type
      this.visitFieldVerificationForm.controls['visitVernalPool'].setValue(this.visit.visitVernalPool);
      this.visitFieldVerificationForm.controls['visitPoolType'].setValue(this.visit.visitPoolType);
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

/*
      visitSpeciesOther1: [],
      visitSpeciesOther2: [],
*/
      // TODO: move this to set boolean value within formControl creation statement above
      if (this.update || this.poolId) {
        //this.visitLocationForm.get('visitPoolId').disable();
        //this.visitLocationForm.get('visitUserName').disable();
      }
    }

    onVisitPageSelect(visitPageIndex) {
      this.visitPage.index = visitPageIndex;
      //console.log('onVisitPageSelect', this.visitPage);
    }

    markerLocationUpdate(visitLoc: L.LatLng) {
      this.visitUpdateLocation = visitLoc;
      this.visitLocationForm.controls['visitLatitude'].setValue(visitLoc.lat);
      this.visitLocationForm.controls['visitLongitude'].setValue(visitLoc.lng);
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
      On update, load an existing visit and populate the fields
    */
    async loadPage(visitId) {
      this.dataLoading = true;
      console.log('vpvisit.create.component.loadPage:', visitId);
      this.vpVisitService.getById(visitId)
          .pipe(first())
          .subscribe(
              data => {
                console.log('vpvisit.create.component.loadPage result:', data);
                this.visit = data.rows[0];
                //await this.createFormControls(); //create form fields after data is loaded to initialize with values
                this.setFormValues();
                this.dataLoading = false; //this forces a map update, which plots a point
              },
              error => {
                  this.alertService.error(error);
                  this.dataLoading = false;
              });
    }

    onSubmit() {

        console.log(`vpvisit.create.onSubmit`);

        this.submitted = true;

        //kluge to get around disabled fields not being included in form values
        //and not having an easy validator for requiring visitUser = logon user
        if (!this.update && this.visitObserverForm.value.visitUserName != this.authenticationService.currentUserValue.user.username) {
          this.alertService.error("Visit User must be your username.");
          return;
        }

        if (Number(this.visitLocationForm.value.visitLatitude) < 42.3 || Number(this.visitLocationForm.value.visitLatitude) > 45.1) {
          this.alertService.error("Latitude must be between 42.3 and 45.1 to be in Vermont.");
          return;
        }

        if (Number(this.visitLocationForm.value.visitLongitude) > -71.5 || Number(this.visitLocationForm.value.visitLongitude) < -73.5) {
          this.alertService.error("Longitude must be between 71.5 and 73.5 to be in Vermont.");
          return;
        }

        //console.log('vpvisit.create.component.onSubmit | visitTown',this.visitLocationForm.value.visitTown);
        //our method to extract townId from townObject is to have a non-display formControl and
        //assign its value here. the API expects a db column name with a single value, and we
        //choose to add that complexity here rather than parse requests in API code.
        this.visitLocationForm.value.visitTownId = this.visitLocationForm.value.visitTown.townId;

        // stop here if form is invalid - navigate to the earliest page missing data
        if (this.visitObserverForm.invalid) {
          console.log(`visitObserverForm.invalid`);
          this.setPage(0);
          return;
        }
        if (this.visitLocationForm.invalid) {
          console.log(`visitLocationForm.invalid`);
          this.setPage(0);
          return;
        }
        if (this.visitLocationForm.invalid) {
          console.log(`visitFieldVerificationForm.invalid`);
          this.setPage(1);
          return;
        }
        if (this.visitPoolCharacteristicsForm.invalid) {
          console.log(`visitPoolCharacteristicsForm.invalid`);
          this.setPage(2);
          return;
        }
        if (this.visitIndicatorSpeciesForm.invalid) {
          console.log(`visitIndicatorSpeciesForm.invalid`);
          this.setPage(3);
          return;
        }

        //flatten the POSTed object before posting. the visitLandowner nested form
        //is passed, but the API can't parse it. (to-do: handle that?)
        // TODO: roll landowner data into json object for db JSONB column
        if (this.visitLocationForm.value.visitLandownerPermission) {
          Object.assign(this.visitLocationForm.value, this.visitLandOwnForm.value);
          delete this.visitLocationForm.value.visitLandowner;
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
      //this.visitPage.index = (this.visitPage.index > 3) ? this.visitPage.index++ : 0;
      this.visitPage.index += direction;
      if (this.visitPage.index < 0) this.visitPage.index = 0;
      if (this.visitPage.index > 3) this.visitPage.index = 3;
      //console.log('vpvisit.create.nextPage() | visitPage:', this.visitPage);
    }

    setPage(page) {
      this.visitPage.index = page;
    }

    deleteVisit() {
      if (confirm(`Are you sure you want to delete visit ${this.visit.visitId}?`)) {
        this.vpVisitService.delete(this.visit.visitId)
          .pipe(first())
          .subscribe(
              data => {
                  console.log(`vpvisit.create.deleteVisit=>data:`, data);
                  this.alertService.success('Successfully deleted Vernal Pool Visit.', true);
                  this.router.navigate([`/visits/visit/list`]);
              },
              error => {
                  console.log(`vpvisit.create.deleteVisit=>error: `, error);
                  this.alertService.error(error);
                  this.dataLoading = false;
              });
      }
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
