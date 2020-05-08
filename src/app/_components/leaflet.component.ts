﻿import { Injectable } from '@angular/core';
import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChange } from "@angular/core";
import { AuthenticationService, vpPoolsService } from '@app/_services';
import { vcgiService } from '@app/_services';
import { first } from 'rxjs/operators';
import { UxValuesService } from '@app/_global';
import { vpMappedEventInfo } from '@app/_models';
import Moment from "moment"; //https://momentjs.com/docs/#/use-it/typescript/
//import * as $ from "jquery";
//import * as LP from "leaflet.browser.print";

//for angular popup
import { Injector, ComponentFactoryResolver, ApplicationRef, ComponentRef, ChangeDetectorRef } from "@angular/core";
import { Router } from '@angular/router';
import './popup.component.css';

//import * as D3geo from "d3-geo";

//how to import leaflet module with extensions:
//https://stackoverflow.com/questions/51679056/add-beautifymarker-plugin-to-ngx-leaflet-project
//BUG: map marker not showing
//https://stackoverflow.com/questions/41144319/leaflet-marker-not-found-production-env
import "leaflet";
import "leaflet-svg-shape-markers";
declare let L;

import { icon, Marker } from 'leaflet';
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
Marker.prototype.options.icon = iconDefault;

import state from '@app/_geojson/Polygon_VT_State_Boundary.geo.json';
import counties from '@app/_geojson/Polygon_VT_County_Boundaries.geo.json';
import towns from '@app/_geojson/Polygon_VT_Town_Boundaries.geo.json';
import biophysical from '@app/_geojson/Polygon_VT_Biophysical_Regions.geo.json';
/*
  Popup Component - this is used instead of the standard Leaflet popup because we
  want to use Angular routing, not html href routing, to preserve uxValue across
  page-loads. This allows us to keep the UX performant.

  Use createLeafletPopup(...) to invoke.
*/
@Component({
    selector: 'popup',
    templateUrl: 'popup.component.html',
    styleUrls: ['popup.component.css']
})
export class PopupComponent {
  currentUser = null;
  userIsAdmin = false;
  userIsOwner = false; //not used here... yet.
  itemType = '';
  poolObj: any = {};
  visits: any = [];
  reviews: any = [];
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
  ViewVisit(visitId) {
    if (visitId) {this.router.navigate([`/pools/visit/view/${visitId}`], { queryParams: { returnUrl: this.router.url }} );}
  }
  EditVisit(visitId) {
    if (visitId) {this.router.navigate([`/pools/visit/update/${visitId}`], { queryParams: { returnUrl: this.router.url }} );}
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
}

/*
  Map Component
*/
@Component({
  selector: 'app-map-comp',
  templateUrl: 'leaflet.component.html',
  styleUrls: ['leaflet.component.css']
})

@Injectable({providedIn: 'root'}) //this makes a component single-instance, which applies to services, as well.

export class LeafletComponent implements OnInit, OnChanges {
  currentUser = null;
  userIsAdmin = false;
  vtCenter = new L.LatLng(43.916944, -72.668056); //VT geo center, downtown Randolph
  vtCenterLeft = new L.LatLng(43.916944, -72.25); //Zoom so VT is on left edge...
  @Input() itemType = 'Visit'; //flag what type of item is being mapped (vpMapped, vpVisit-mapped, vpVisit-new, etc.)
  @Input() mapPoints = false; //external flag plot mapValues as circleMarkers
  @Input() mapValues = null; //single value or array of values having .latitude and .longitude properties to plot as circleMarkers, set by the parent
  @Input() mapMarker = false; //external flag to invoke the map with a moveable marker
  @Input() locMarker = null; //single object having .latitude and .longitude properties to locate the moveable marker
  @Input() update = false; //external flag that this is an edit/update, not a create instantition: plot the mapMarker location with mapValues data
  @Input() zoomTo = {option:'Vermont', value: {center: this.vtCenter, zoomLevel:8}}; //external flag to set zoom/center of map
  @Output() markerUpdate = new EventEmitter<L.LatLng>(); //when the mapMarker is moved or located, send LatLng map events to listeners
  @Output() markerSelect = new EventEmitter<vpMappedEventInfo>(); //when a circleMarker is selected, send mapped pool info events to listeners
  itemLoc: L.LatLng = null; //store the location of the marker on the screen, passed with events to listeners, etc.
  itemInfo: vpMappedEventInfo = new vpMappedEventInfo(); //store a marker's extended info, passed with events to listeners
  mapByClick = false; //flag to allow mapping new pools by click (default is by drag only)
  public map = null;
  marker = null;
  scaleControl = L.control.scale({position: 'topright'});
  baseLayerControl = L.control.layers(null, null, { collapsed: true, position: 'topright'});
  boundaryControl = L.control.layers(null, null, { collapsed: true, position: 'topright'});
  zoomControl = L.control.zoom({position: 'topright'});
  poolControl = L.control.layers(null, null, { collapsed: false, position: 'bottomleft'}); //pool status feature groups
  cursorLat = 0; //value for map display of cursor latitue location on map
  cursorLng = 0; //value for map display of cursor longitude location on map
  zoomLevel = 0; //global value that tracks the map zoomLevel
  zoomCenter = this.vtCenter; //global value that tracks the map zoomCenter
  zoomStatus = false; //flag to show zoom stats

  /*
    https://leafletjs.com/reference-1.5.0.html#domevent eg. L.DomEvent.on(div, 'click', e => onDivClick(e))
    https://leafletjs.com/reference-1.5.0.html#domutil
  */
  legendControl = L.Control.extend({
    options: {
      position: 'bottomright'
    },

    onAdd: function (map) {

      var div = L.DomUtil.create('div', 'info legend');

      div.style.backgroundColor = 'white';


      div.innerHTML = `
      <div class="col-12">
        <div class="row">
          <div class="circle" style="background:Orange;"></div>
          <label style="padding-left:3px;">Potential</label>
        </div>
        <div class="row">
          <div class="circle" style="background:Cyan;"></div>
          <label style="padding-left:3px;">Probable</label>
        </div>
        <div class="row">
          <div class="circle" style="background:Navy;"></div>
          <label style="padding-left:3px;">Confirmed</label>
        </div>
        <div class="row">
          <div class="square"></div>
          <label style="padding-left:3px;">Monitored</label>
        </div>
        <div class="row">
          <div class="triangle"><div class="filled"></div></div>
          <label>Visited</label>
        </div>
      </div>
      `;
      return div;
    }
  }); // end legendControl

  //printControl = LP.control.browserPrint();
  //https://www.w3schools.com/colors/colors_names.asp
  potentialColors = ["Orange"];
  probableColors = ["Cyan"];
  confirmedColors = ["Navy"];
  eliminatedColors = ["Black"];
  monitoredColors = ["LightSteelBlue"];
  cmLLArr = []; //array of shapeMarkers (originally native circleMarkers) 1:1 with mapPoints values
  allGroup = L.featureGroup(); //allGroup is not shown but used for zoomTo, etc.
  potnGroup = L.featureGroup(null, {name:'Potential', id:'potential'});
  probGroup = L.featureGroup(null, {name:'Probable', id:'probable'});
  confGroup = L.featureGroup(null, {name:'Confirmed', id:'confirmed'});
  elimGroup = L.featureGroup(null, {name:'Duplicate', id:'duplicate'});
  duplGroup = L.featureGroup(null, {name:'Eliminated', id:'eliminated'});
  statusGroups = [
    {group:this.potnGroup, name:'Potential', id:'potential'},
    {group:this.probGroup, name:'Probable', id:'probable'},
    {group:this.confGroup, name:'Confirmed', id:'confirmed'},
    {group:this.duplGroup, name:'Duplicate', id:'duplicate'},
    {group:this.elimGroup, name:'Eliminated', id:'eliminated'}
  ];
  bndryGroup = L.featureGroup(); //boundary overlays. 'name' and 'id' are set in options when adding layers to group.
  parcelGroup = L.featureGroup();
  parcelAdded = {}; //a list of town parcels that have been added
  townLayer = null; //class variable for the raw towns layer to be user for processing
  cmColors = ["blue", "#f5d108","#800000","yellow","orange","purple","cyan","grey"];
  cmColor = 0; //current color index
  cmClrCnt = this.cmColors.length; //(this.cmColors).length();
  cmRadius = 4 ;
  googleSat = L.tileLayer("https://{s}.google.com/vt/lyrs=s,h&hl=tr&x={x}&y={y}&z={z}",
    {
      id: 'google.sat', //illegal property
      name: 'Google Satellite +', //illegal property
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      zIndex: 0,
      maxNativeZoom: 20,
      maxZoom: 20
    } as any);
  streets = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoiamxvb21pc3ZjZSIsImEiOiJjanB0dzVoZ3YwNjlrNDNwYm9qN3NmNmFpIn0.tyJsp2P7yR2zZV4KIkC16Q',
    {
      id: 'mapbox.streets',
      name: 'Mapbox Streets',
      zIndex: 0,
      maxNativeZoom: 20,
      maxZoom: 20
    } as any);
  light = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoiamxvb21pc3ZjZSIsImEiOiJjanB0dzVoZ3YwNjlrNDNwYm9qN3NmNmFpIn0.tyJsp2P7yR2zZV4KIkC16Q',
    {
      id: 'mapbox.light',
      name: 'Mapbox Light',
      zIndex: 0,
      maxNativeZoom: 20,
      maxZoom: 20
    } as any);
  esriWorld = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      id: 'esri.world ',
      name: 'ESRI Imagery',
      zIndex: 0,
      maxNativeZoom: 20,
      maxZoom: 20,
      attribution: 'Tiles &copy; Esri' // &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    } as any);
  esriTopo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      id: 'esri.topo',
      name: 'ESRI Topo Map',
      zIndex: 0,
      maxNativeZoom: 19,
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri' // &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    } as any);
  openTopo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      id: 'open.topo',
      name: 'Open Topo Map',
      zIndex: 0,
      maxZoom: 17,
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    } as any);

    baseLayer = 0; //holds the baseLayers[] array index of the baseLayer last shown
    baseLayers = [this.esriTopo, this.esriWorld, this.openTopo, this.googleSat, this.streets, this.light]; //make esriTopo default b/c openTopo often loads slowly

  constructor(
    public uxValuesService: UxValuesService,
    private authenticationService: AuthenticationService,
    private vpPoolsService: vpPoolsService,
    private vcgiService: vcgiService,
    private injector: Injector,
    private applRef: ApplicationRef,
    private componentFactoryResolver: ComponentFactoryResolver
    ) {
    /*
      preserve baseLayer shown across page loads with outside service
      which holds baseLayers[] array index of last-selected baseLayer.
    */
    this.baseLayer = this.uxValuesService.baseLayerIndex;
    this.cmColor = this.uxValuesService.pointColorIndex;

    //console.log(`constructor | baseLayerIndex: ${this.baseLayer}`);
  } //constructor

  ngOnInit() {
    if (this.authenticationService.currentUserValue) {
      this.currentUser = this.authenticationService.currentUserValue.user;
      this.userIsAdmin = this.currentUser.userrole == 'admin';
    } else { this.userIsAdmin = false;}

    /*
      This resolves errors of an 'already initialized map'.
      However, now we see page-loads with a blank map...
      Blank map issue resolved by wrapping the map tag <app-map-comp> in a 'loading' flag
      so that each time a page is loaded, the map is hidden, then shown.
    */
    var container = L.DomUtil.get("map");
    if (container != null) {
      container._leaflet_id = null;
    }

    this.map = new L.Map("map", {
               zoomControl: false,
               maxZoom: 20,
               minZoom: 1,
               center: this.uxValuesService.getZoomCenter(),
               zoom: this.uxValuesService.getZoomLevel()
             });

   this.marker = L.marker(this.vtCenter, {
               draggable: true,
               autoPan: true
             });

    this.scaleControl.addTo(this.map);

    //baseLayerControl is baseLayers control
    this.baseLayerControl.addTo(this.map);
    for (var i=0;i<this.baseLayers.length;i++) {
      //note: get around TypeScript type-checking by accessing non-declared object .properties in
      //the following way: as ['property']['sub-property'], not array[i].property.sub-property.
      this.baseLayerControl.addBaseLayer(this.baseLayers[i], this.baseLayers[i]['options']['name']);
    }
    //boundaryControl is state, counties, towns, geoJson overlays...
    this.addGeoJsonLayer(state as any, "State Boundary", 'state', this.boundaryControl,  this.bndryGroup);
    this.addGeoJsonLayer(counties as any, "County Boundaries", 'county', this.boundaryControl, this.bndryGroup);
    this.addGeoJsonLayer(towns as any, "Town Boundaries", 'town', this.boundaryControl, this.bndryGroup);
    this.addGeoJsonLayer(biophysical as any, "Biophysical Regions", 'biophysical', this.boundaryControl, this.bndryGroup);
    this.boundaryControl.addOverlay(this.parcelGroup, 'Parcel Boundaries');
    if (this.uxValuesService.overlaySelected['parcel']) {this.parcelGroup.addTo(this.map); this.parcelGroup.bringToBack();}
    this.boundaryControl.addTo(this.map);

    //poolControl - show/hide pools by pool status
    if (this.itemType != 'Home') {this.poolControl.addTo(this.map);}
    this.addPoolStatusLayer(this.potnGroup);
    this.addPoolStatusLayer(this.probGroup);
    this.addPoolStatusLayer(this.confGroup);
    if (this.userIsAdmin) {
      this.addPoolStatusLayer(this.duplGroup);
      this.addPoolStatusLayer(this.elimGroup);
    }

    if (this.mapMarker) {this.marker.addTo(this.map);} //a single Marker added in plotPoolMarker

    //this.zoomControl.setPosition('topright');
    this.zoomControl.addTo(this.map);
    this.zoomLevel = this.map.getZoom();

    //this.printControl.position('topright');
    //this.printControl.addTo(this.map);

    this.baseLayers[this.baseLayer].addTo(this.map);

    this.map.on("baselayerchange", e => this.OnBaseLayerChange(e));
    this.map.on("overlayadd", e => this.OnMapOverlayChange(e,1));
    this.map.on("overlayremove", e => this.OnMapOverlayChange(e,0));

    this.map.on("zoomend", e => this.onZoomEnd(e));
    this.map.on("moveend", e => this.onMoveEnd(e));

    this.map.on("click", e => this.onMapClick(e)); //when used for plotting a point, this causes problems

    this.map.on("mousemove", e => this.onMouseMove(e));

    this.marker.on("moveend", e => this.onMarkerMoveEnd(e));

    this.map.addControl(new this.legendControl(this.map));

    if (this.itemType === "Home") {
      this.zoomVermontLeft();
    }
  }

  addPoolStatusLayer(poolStatusGroup) {
    //find poolStatusGroup index within our custom array by searching for the .group element
    var idx = this.statusGroups.findIndex(elm => {
      return elm.group == poolStatusGroup;
    });
    //console.log('addPoolStatusLayer found poolStatusGroup:', this.statusGroups[idx]);
    //this method only works if we can assign options object to a featureGroup, which is so-far not possible
    //this.poolControl.addOverlay(poolStatusGroup, `<span id="${poolStatusGroup.options.id}">${poolStatusGroup.options.name}</span>`);
    //if (this.uxValuesService.overlaySelected[poolStatusGroup.options.id]) {poolStatusGroup.addTo(this.map);}
    this.poolControl.addOverlay(poolStatusGroup, `<span id="${this.statusGroups[idx].id}">${this.statusGroups[idx].name}</span>`);
    if (this.uxValuesService.overlaySelected[this.statusGroups[idx].id]) {poolStatusGroup.addTo(this.map);}
    poolStatusGroup.on("click", e => this.onCircleGroupClick(e));
  }

  addParcelGeoJsonLayer(townName=null, uxVal=null, pclGp=null, pclAd=null, bdyGp=null, map=null) {
    if (!uxVal) {uxVal = this.uxValuesService;}
    if (!pclGp) {pclGp = this.parcelGroup;}
    if (!pclAd) {pclAd = this.parcelAdded;}
    if (!bdyGp) {bdyGp = this.bndryGroup;}
    if (!map) {map = this.map;}

    pclGp.eachLayer(async layer => {
      console.log('getTownsInView | Remove', layer.options.name);
      await pclGp.removeLayer(layer);
      pclAd[townName] = false; //or delete it...
    })

    uxVal.getParcelMap(townName).then(() => {
      var layer = null;
      const layerName = townName;
      const layerId = townName.toLowerCase();
      const geoJson = uxVal.parcels[townName];
      if (!pclAd[townName]) {
        layer = L.geoJSON(geoJson, {
            onEachFeature: (feature, layer) => {
              let obj = feature.properties;
              let ttp = '';
              let pop = '';
              for (var key in obj) {
                if (('OWNER1'==key||'OWNER2'==key)&&obj[key]) {ttp += `${key}: ${obj[key]}<br>`;}
                if (obj[key]) pop += `${key}: ${obj[key]}<br>`;
              }
              layer.bindTooltip(ttp);
              layer.bindPopup(pop,{maxHeight:200});
            }, //this.onEachFeature,
            style: (feature) => {return {color:"black", weight:1, fillOpacity:0.01, fillColor:"cyan"};}, //this.onStyle,
            bringToBack: true,
            name: layerName, //IMPORTANT: this used to compare layers at ZIndex time
            id: layerId //IMPORTANT: this used to set uxValues in OnMapOverlayChange
        });
        pclAd[townName] = true;
        pclGp.addLayer(layer); //add the town's parcel layer to the parcel featureGroup...
        if (uxVal.overlaySelected['parcel']) {pclGp.addTo(this.map);}
        pclGp.bringToBack(); //Push parcelGroup to back so pools are clickable
        bdyGp.bringToBack(); //Push all other boundaries behind parcel map so parcels are clickable
      }
    });
  }

  addGeoJsonLayer(data={"a":"a", "test":"test"}, layerName="Test", layerId='test', layerControl=null, layerGroup=null) {
    var layer = null;
    layer = L.geoJSON(data, {
        onEachFeature: this.onEachFeature,
        style: this.onStyle,
        uxVal: this.uxValuesService,
        addGJ: this.addParcelGeoJsonLayer,
        pclGp: this.parcelGroup,
        pclAd: this.parcelAdded,
        bdyGp: this.bndryGroup,
        map: this.map,
        bringToBack: true,
        name: layerName, //IMPORTANT: this used to compare layers at ZIndex time
        id: layerId //IMPORTANT: this used to set uxValues in OnMapOverlayChange
    });
    if ('town' == layerId) (this.townLayer = layer);
    if (layerControl) {layerControl.addOverlay(layer, layerName);}
    if (layerGroup) {layerGroup.addLayer(layer);} //layerGropus are FeatureGroups for aggregating layers for group actions
    if (this.uxValuesService.overlaySelected[layerId]) {layer.addTo(this.map); layer.bringToBack();}
  }

  onEachFeature(feature, layer) {
      layer.on("click", function (event) {
          event.target._map.fitBounds(layer.getBounds()); //zoom to town..
          if (layer.feature.properties.TOWNNAME) { //load/add/show town's parcel map
            let townName = layer.feature.properties.TOWNNAME;
            layer.options.addGJ(townName, layer.options.uxVal, layer.options.pclGp, layer.options.pclAd, layer.options.bdyGp, layer.options.map);
          }
      });
      layer.on('mousemove', function (e) {
        //console.log('mousemove', e);
      });
      if (feature.properties) {
          var obj = feature.properties;
          var pop = '';
          var ttp = '';
          for (var key in obj) {
            switch(key.substr(key.length - 4).toLowerCase()) { //last 4 characters of property
              case 'name':
                ttp += `${obj[key]}<br>`;
                break;
              case 'eoid':
                //ttp += `${key}: ${obj[key]}<br>`;
                break;
              case 'type':
                ttp += `${obj[key]}<br>`;
                break;
            }
          }
          if (ttp) {layer.bindTooltip(ttp);}
      }
  }

  /*
    Callback function to set style of added geoJson overlays on the Boundary Layer Control
  */
  onStyle(feature) {
      if (feature.properties.BLOCK_TYPE) {
        switch(feature.properties.BLOCK_TYPE) {
          case 'PRIORITY':
            return {color:"black", weight:1, fillOpacity:0.2, fillColor:"yellow"};
            break;
          case 'NONPRIOR':
            return {color:"black", weight:1, fillOpacity:0.1, fillColor:"blue"};
            break;
        }
      } else {
        if (feature.properties.BIOPHYSRG1) { //biophysical regions
          return {color:"red", weight:1, fillOpacity:0.1, fillColor:"red"};
        } else if (feature.properties.CNTYNAME) { //counties
          return {color:"black", weight:1, fillOpacity:0.1, fillColor:"yellow"};
        } else if (feature.properties.TOWNNAME) { //towns
          return {color:"blue", weight:1, fillOpacity:0.1, fillColor:"blue"};
        } else { //states and all others
          return {color:"black", weight:1, fillOpacity:0.1, fillColor:"black"};
        }
      }
  }

  /*
    this is magic. this is called when the parent (containing) component's data
    changes. so, when a map is included on a page with <app-map></app-map>, this
    event fires when the page's data changes.
  */
  async ngOnChanges(changes: {[propKey: string]: SimpleChange}) {
    //console.log('leaflet.component.ngOnChanges(changes), changes:', changes);
    //console.log('leaflet.component.ngOnChanges() | mapMarker:', this.mapMarker, ' | update: ', this.update)
    await this.clearPools();
    if (this.mapPoints) {
      await this.plotPoolShapes(this.mapValues);
    }
    if (this.mapMarker && this.marker) {
      this.marker.addTo(this.map);
      await this.plotPoolMarker(this.locMarker);
    }
    if (this.mapMarker && !this.mapPoints) { //zoom to the mapMarker if it's the only feature
      this.zoomMarker();
    }
    if (this.mapPoints && this.cmLLArr.length===1) { //zoom to a mapped point if it's the only feature
      this.zoomExtents();
    }
    if (changes.zoomTo && changes.zoomTo.currentValue != changes.zoomTo.previousValue) {
      //this.map.setView(changes.zoomTo.currentValue.center, changes.zoomTo.currentValue.zoomLevel);
      switch (changes.zoomTo.currentValue.option) {
        case 'Marker':
          this.zoomMarker();
          break;
        case 'Vermont':
          this.zoomVermont();
          break;
        case 'Extents':
          this.zoomExtents();
          break;
        case 'Previous':
          this.uxValuesService.zoomPrev(this.map);
          break;
        case 'Next':
          this.uxValuesService.zoomNext(this.map);
          break;
        case 'Init':
          this.uxValuesService.InitZoom();
          break;
        case 'Custom':
          const value = changes.zoomTo.currentValue.value;
          this.map.setView(value.center, value.zoomLevel);
          break;
        default:
          break;
      }
    }
  }

  zoomLatLon(e=null) {
    if (e) {
      const val = e.target.value.trim();
      const reg = /\s*(?:;|,|:|\s|$)\s*/;
      const arr = val.split(reg);
      //console.log(arr);
      const lat = Number(arr[0]);
      const lon = Number(arr[1]);
      var zum = Number(arr[2]);
      if (lat && lon) {
        const loc = L.latLng(arr[0], arr[1]);
        zum = arr[2]?arr[2]:15;
        this.map.setView(loc, zum);
      }
    }
  }

  zoomMarker(e=null) {
    if (e) {e.stopPropagation();}
    if (this.mapMarker && this.marker) {
      this.map.setView(this.marker._latlng, 15);
    }
  }

  zoomExtents(e=null) {
    if (e) {e.stopPropagation();}

    if (this.map) {
      /*
        If there is an array of points, zoom to their bounds (if point are closely grouped, this could be zoomed too far).
        If there is a single point, center map on point and zoom to level 15 (300m)
        If there is just a marker, center map on marker and zoom to level 15 (300m)

        To zoom to visible points - use allGroup.eachLayer(layer) and map.hasLayer(layer)
      */
      var zoomGroup = L.featureGroup();
      var count = 0;
      this.allGroup.eachLayer(layer => {
        if (this.map.hasLayer(layer)) {
          count++;
          zoomGroup.addLayer(layer);
        }
      })
      if (count == 1) {
        this.map.fitBounds(zoomGroup.getBounds());
        this.map.setZoom(15);
      } else if (count > 1) {
        this.map.fitBounds(zoomGroup.getBounds());
        if (this.map.getZoom() > 15) {this.map.setZoom(15);}
      } else if (this.mapMarker) {
        this.map.setView(this.marker._latlng, 15); //zoomLevl 15 is 300m
      } else {
        this.zoomVermont();
      }
    }
  }

  zoomVermont(e=null) {
    if (e) {e.stopPropagation();}
    if (this.map) {
      this.map.setView(this.vtCenter, 8);
    }
  }

  zoomVermontLeft(e=null) {
    if (e) {e.stopPropagation();}
    if (this.map) {
      this.map.setView(this.vtCenterLeft, 8);
    }
  }

  zoomPrev(e=null) {
    if (e) {e.stopPropagation();}
    this.uxValuesService.zoomPrev(this.map);
  }

  zoomNext(e=null) {
    if (e) {e.stopPropagation();}
    this.uxValuesService.zoomNext(this.map);
  }

  OnBaseLayerChange(e) {
    //find the array index of the baseLayer that was chosen from the envent value
    var index = this.baseLayers.findIndex(elm => {
      return elm == e.layer;
    });
    //console.log(`OnBaseLayerChange | name: ${e.name} | index: ${index}`);
    this.uxValuesService.baseLayerIndex = index; //assign saved value of baselayer for consistency across reloads
    this.map.options.maxZoom = this.baseLayers[index].maxZoom; //set map maxZoom based on baseLayer maxZoom
  }

  /*
    Fired when an overlay is selected through a layer control. We send all overlays
    to the back so that point markers remain clickable, in the foreground.
  */
  OnMapOverlayChange(e, add=1) {
    var overlayId = null;
    //console.log('OnMapOverlayChange', e.layer.options, add);
    if (e.layer.options.id) {overlayId = e.layer.options.id;}
    else {
      //find poolStatusGroup index within our custom array by searching for the .group element
      var idx = this.statusGroups.findIndex(elm => {
        return elm.group == e.layer;
      });
      //console.log('OnMapOverlayChange | statusGroups index found:', idx, this.statusGroups[idx]);
      //check if we found a statusGroup - some overlays (eg. Parcels) aren't in statusGroups
      if (this.statusGroups[idx]) {overlayId = this.statusGroups[idx].id;}
    }
    if (overlayId) {this.uxValuesService.overlaySelected[overlayId] = add;} //assign saved value of baselayer for consistency across reloads
    else if (this.parcelGroup == e.layer) {this.uxValuesService.overlaySelected['parcel'] = add;}
    //console.log(this.uxValuesService.overlaySelected);
    if (e.layer.options.bringToBack) {e.layer.bringToBack();} //FeatureGroups can do this. LayerGroups cannot.
  }

  //respond to map zoom: set plotted pool radius relative to zoom level and update all points
  async onZoomEnd(e) {
    //console.log('onZoomEnd', e.zoomPrev, e.zoomNext);
    //console.log('zoomLevel', this.map.getZoom());
    this.zoomLevel = this.map.getZoom();
    this.zoomCenter = this.map.getCenter();
    await this.uxValuesService.addPrevZoom(this.map.getZoom(), this.map.getCenter());
    await this.SetPointZoomRadius();
    await this.setEachPointRadius();
    this.uxValuesService.zoomUI=true;

    if (this.zoomLevel > 10) { //add or remove parcel map layer based on towns visible at zoom
      //get visible towns at this zoom and get/add/show their parcel maps
      //this.getTownsInView();
    }
  }

  getTownsInView() {
    this.parcelGroup.eachLayer(async layer => {
      console.log('getTownsInView | Remove', layer.options.name);
      await this.parcelGroup.removeLayer(layer);
    })
    this.map.eachLayer((layer) => {
      if (layer.feature && layer.feature.properties.TOWNNAME) {
        if(this.map.getBounds().contains(layer.getBounds())) {
          let townName = layer.feature.properties.TOWNNAME;
          console.log(townName);
          /*
          this.uxValuesService.getParcelMap(townName)
            .then(() => {
              this.addParcelGeoJsonLayer(townName);
            });
          */
        }
      }
    });
  }

  //respond to map move: save map center and update displayed value
  async onMoveEnd(e) {
    //console.log('onMoveEnd');
    this.zoomCenter = this.map.getCenter();
    //NOTE: too hard to make this work - invokes a 2nd addPrevMove event.
    //await this.uxValuesService.addPrevMove(this.map.getZoom(), this.map.getCenter());
    this.uxValuesService.moveUI=true;
    if (this.zoomLevel > 10) { //get visible towns at this zoom and get/add/show their parcel maps
      //this.getTownsInView();
    }
  }

  //set the class value of plotted pool radius relative to zoom level
  async SetPointZoomRadius() {
    //this.cmRadius = Math.floor(2 + Math.pow(this.zoomLevel, 2) / 20);
    this.cmRadius = Math.floor(this.zoomLevel/3);
    //console.log('leaflet.component.SetPointZoomRadius | zoomLevel: ', this.zoomLevel, 'cmRadius', this.cmRadius);
  }

  //iterate through all plotted pools in the featureGroup and alter each radius
  setEachPointRadius(radius = this.cmRadius) {
    var i=0;
    this.allGroup.eachLayer((cmLayer: L.CircleMarker) => { //typescript complains that plain layer doesn't have setRadius(). CircleMarker does, so cast it.
      //if (++i < 10) {console.log('leaflet.component.setEachPointRadius', cmLayer)}
      radius = this.GetRadiusForPool(cmLayer.options); //we hung pool properties on each plotted pool shape for use here
      cmLayer.setRadius(radius);
    });
  }

  onMapClick(e) { //this is no longer used for mapping a pool (disabled)
    //console.log("leaflet.onMapClick | event: ", e);
    if (this.mapMarker && this.mapByClick) {
      this.itemLoc = L.latLng(e.latlng.lat, e.latlng.lng);
      this.marker.setLatLng(this.itemLoc);
      this.markerUpdate.emit(this.itemLoc);
      //this.map.panTo(this.itemLoc);
      //this.map.setView(this.itemLoc, 18);
      //console.log("leaflet.onMapClick | itemLoc: ", this.itemLoc);
      this.marker.bindTooltip(`Pool ID: ${this.mapValues.poolId}<br>
                               Lat: ${this.itemLoc.lat}<br>
                               Lng: ${this.itemLoc.lng}`);
     }

     //if town boundaries are showing, find the town clicked a load/add/show it parcel map
     let geoJsonClickLoc = [e.latlng.lng, e.latlng.lat];
     this.townLayer.eachLayer(layer => {
       //console.log(layer.feature.geometry, clickLoc);
       //if (D3geo.geoContains(layer, geoJsonClickLoc)) {
       if (0) {
         let townName = layer.feature.properties.TOWNNAME;
         console.log(townName, layer, geoJsonClickLoc);
         /*
         this.uxValuesService.getParcelMap(townName)
           .then(() => {
             this.addParcelGeoJsonLayer(townName);
           });
          */
       }
     })
  }

  /*
    This is where we handle the location of a newly mapped pool.
  */
  onMarkerMoveEnd(e) {
    //console.log("leaflet.onMarkerMoveEnd | event: ", e);
    this.itemLoc = L.latLng(e.target._latlng.lat, e.target._latlng.lng);
    this.markerUpdate.emit(this.itemLoc);
    //console.log("leaflet.onMarkerMoveEnd | itemLoc: ", this.itemLoc);
    this.marker.bindTooltip(`Pool ID: ${this.mapValues.poolId}<br>
                             Lat: ${Number(this.itemLoc.lat).toFixed(5)}<br>
                             Lng: ${Number(this.itemLoc.lng).toFixed(5)}`);
  }

  onMouseMove(e) {
    this.cursorLat = e.latlng.lat;
    this.cursorLng = e.latlng.lng;
  }

  /*
    A click was received on the leaflet featureGroup of shape markers.
    From the event values - e.layer.options or e.sourceTarget - we can
    get data for the specific circleMarker that was clicked.

    use e.layer.options to reference custom properties set at creation
    use e.sourceTarget to append functions like bindPopup
  */
  onCircleGroupClick(e) {
    //console.log("leaflet.onCircleGroupClick | event: ", e);
    //console.log("leaflet.onCircleGroupClick | index:", e.layer.options.index);
    console.log("leaflet.onCircleGroupClick | poolId:", e.layer.options.poolId);
    const index = e.sourceTarget.options.index;
    const cmLoc = L.latLng(e.latlng.lat, e.latlng.lng);
    const poolId = e.sourceTarget.options.poolId;
    const poolObj = Array.isArray(this.mapValues) ? this.mapValues[index] : this.mapValues;

    if (this.itemType == 'Visit Mapped Pool') { //this is used to select a pool when creating a new visit
      this.itemInfo.latLng = cmLoc;
      this.itemInfo.poolId = poolId;
      this.markerSelect.emit(this.itemInfo);
    } else {
      this.LoadVisitReviewData(poolObj.poolId)
        .then(data => {
          const popList = this.buildPopupList(index);
          e.sourceTarget.bindPopup(() => this.createLeafletPopup(poolObj, data, popList)).openPopup();
          /*
          const popText = this.buildPopup(index);
          const popShow = L.popup({
            className: 'leaflet-custom-popup',
          	maxHeight: 200,
            keepInView: true
          }).setContent(popText);

          e.sourceTarget.bindPopup(popShow).openPopup();
          */
        }).catch(err => {console.log('Error loading review data for popup:', err);})
    }
  }

  LoadVisitReviewData(poolId) {
    return new Promise((resolve, reject) => {
      this.vpPoolsService.getByPoolId(poolId)
        .pipe(first())
        .subscribe(data => {
          var visits = [], reviews = [];
          data.rows.forEach(row => {
            console.log(`pool:${row.poolId}/visit:${row.visitId}/review: ${row.reviewId}`);
            if (row.visitId) visits.push(row.visitId);
            if (row.reviewId) reviews.push(row.reviewId);
          });
          resolve ({visits:visits, reviews:reviews});
        }, error => {
          console.log('LoadVisitReviewData ERROR:', error);
          reject ({visits:[], reviews:[]});
        });
    });
  }

  /*
    https://stackoverflow.com/questions/45091330/how-to-spawn-angular-4-component-inside-a-leaflet-markers-popup#45107300
  */
  private createLeafletPopup(poolObj:any = {}, data:any = {}, popList:string = '') {
      const factory = this.componentFactoryResolver.resolveComponentFactory(PopupComponent);
      const compRef = factory.create(this.injector);

      compRef.instance.poolObj = poolObj;
      compRef.instance.visits = data.visits;
      compRef.instance.reviews = data.reviews;
      compRef.instance.itemType = this.itemType;

      this.applRef.attachView(compRef.hostView);
      compRef.onDestroy(() => {
          this.applRef.detachView(compRef.hostView);
      });

      let div = document.createElement('div');
      div.appendChild(compRef.location.nativeElement); //include html from popup.component.html

      div.insertAdjacentHTML('beforeend', this.buildPopupList(poolObj));

      compRef.changeDetectorRef.detectChanges(); //causes bubble to auto-size

      return div;
  }

  buildPopup(index) {
    var poolObj = Array.isArray(this.mapValues) ? this.mapValues[index] : this.mapValues;
    return this.buildPopupLinks(poolObj) + this.buildPopupList(poolObj);
  }

  buildPopupLinks(obj) {
    var text = '';

    //Create action links at the top of the popup display based upon the context - 'itemType'
    switch (this.itemType) {
      case 'Visit New Pool':
        //don't add links to the top - they just click on the point to get info about it
        break;
      case 'Visit Mapped Pool':
        //don't add links to the top - they just click on the point to select it
        break;
      case 'Visit':
        text += `<div><a href="pools/visit/view/${obj.visitId}">View Visit ${obj.visitId}</a></div>`;
        if (this.userIsAdmin) {
          text += `<div><a href="review/create/${obj.visitId}">Review Visit ${obj.visitId}</a></div>`;
          //text += `<div><a href="pools/visit/update/${obj.visitId}">Edit Visit ${obj.visitId}</a></div>`;
          text += `<div><a href="pools/visit/create/${obj.visitPoolId}">Add Visit for Pool ${obj.visitPoolId}</a></div>`;
        }
        break;
      case 'List Mapped Pool':
        text += `<div><a href="pools/mapped/view/${obj.poolId}">View Mapped Pool ${obj.poolId}</a></div>`;
        text += `<div><a href="pools/visit/create/${obj.poolId}">Add Visit for Pool ${obj.poolId}</a></div>`;
        break;
      case 'View Mapped Pool':
        if (this.userIsAdmin) {
          text += `<div><a href="pools/mapped/update/${obj.poolId}">Edit Mapped Pool ${obj.poolId}</a></div>`;
        }
        text += `<div><a href="pools/visit/create/${obj.poolId}">Add Visit for Pool ${obj.poolId}</a></div>`;
        break;

      default:
      case 'List Pools/Visits':
        if (this.userIsAdmin && obj.visitId) {
          text += `<div><a href="review/create/${obj.visitId}">Add Review for Visit ${obj.visitId}</a></div>`;
        }
        if (this.userIsAdmin && obj.reviewId) {
          text += `<div><a href="review/view/${obj.reviewId}">View Review ${obj.reviewId} for Visit ${obj.visitId}</a></div>`;
        }
        if (obj.visitId) {
          /*
          if (this.userIsAdmin||(this.currentUser&&(this.currentUser.username===obj.mappedByUser||this.currentUser.username===obj.visitUserName))) {
            text += `<div><a href="pools/visit/update/${obj.visitId}">Edit Visit ${obj.visitId} for Pool ${obj.poolId}</a></div>`;
          }*/
          text += `<div><a href="pools/visit/view/${obj.visitId}">View Visit ${obj.visitId} for Pool ${obj.poolId}</a></div>`;
        }
        if (this.currentUser) {
          text += `<div><a href="pools/visit/create/${obj.poolId}">Add Visit for Pool ${obj.poolId}</a></div>`;
        }
        if (obj.visitPoolPhoto) {
          text += `<div><a href="${obj.visitPoolPhoto}" target="_blank">View Pool Photo</a></div>`;
        }
        break;
    }
  }

    buildPopupList(obj) {
      var text = '';
      var exclude = ['count']; //an array of column names to exclude from the popup list of values from the db
      var include = [ //an array of column names to include in the popup list of values from the db
        'poolId',
        'mappedLatitude',
        'mappedLongitude',
        //'mappedTown',
        'visitTown',
        'mappedPoolStatus',
        'mappedDateText',
        'mappedDate',
        'visitDate',
        'mappedMethod',
        'mappedByUser',
        'visitUserName',
        'visitPoolPhoto'
      ];
      var fieldName = {
        'poolId':'Pool ID',
        'mappedLatitude':'Mapped Latitude',
        'mappedLongitude':'Mapped Longitude',
        'mappedTown':'Mapped Town',
        'visitTown':'Visit Town',
        'mappedPoolStatus':'Pool Status',
        'mappedDateText':'Date Mapped',
        'mappedDate':'Date Mapped',
        'visitDate':'Visit Date',
        'mappedMethod':'Mapped Method',
        'mappedByUser':'Mapped by User',
        'visitUserName':'Visited by User',
        'visitPoolPhoto':'Pool Photo'
      }

    /*
      It looks like the issue with the vertical scrollbar clipping table content happens
      when the table is the widest element, and content has vertical overflow. A hack
      solution is to force an element outside the table to be wider, which makes room
      for the table and the vertical scrollbar.
    */
    text += `<table class="leaflet-table">`;

    // Iterate over pool data object. Add non-null fields to popup text as html divs.
    // TODO: make this a select list of meaningful fields...
    Object.keys(obj).forEach(function(key,index) {
      if (obj[key] && include.includes(key)) { //add values in inclusion list
      //if (obj[key] && !exclude.includes(key)) { //add non-null values not in the exclusion list
        if (key.includes('Town')) {
          text += `<tr><td>${fieldName[key]}</td><td>${obj[key].townName}</td></tr>`;
        } else if (key.includes('Date')) {
          text += `<tr><td>${fieldName[key]}</td><td>${Moment(obj[key]).format('MM/DD/YYYY')}</td></tr>`;
        } else if (key.includes('reatedAt') || key.includes('pdatedAt')) {
          text += `<tr><td>${fieldName[key]}</td><td>${Moment(obj[key]).format('MM/DD/YYYY@HH:MM')}</td></tr>`;
        } else if (key.includes('atitude') || key.includes('ongitude')) {
          text += `<tr><td>${fieldName[key]}</td><td>${Number(obj[key]).toFixed(5)}</td></tr>`;
        } else if (key.includes('Photo')) {
          if (obj[key].slice(0,5)=='https') {
            text += `<tr><td>${fieldName[key]}</td><td><a href=${obj[key]} target="_blank">Photo Link</a></td></tr>`;}
        } else {
          text += `<tr><td>${fieldName[key]}</td><td>${obj[key]}</td></tr>`;
        }
      }
    });
    text += '</table>';

    return text;
  }

  async clearPools() {
    //console.log('clearPools');
    this.allGroup.clearLayers();
    this.potnGroup.clearLayers();
    this.probGroup.clearLayers();
    this.confGroup.clearLayers();
    this.duplGroup.clearLayers();
    this.elimGroup.clearLayers();
    //delete this.cmLLArr;
    this.cmLLArr = [];
  }

  /*
    Original idea from Alex to set the radius based upon mappedLocationUncertainty.
    This is not curerntly implemented, but should be easily done.
  */
  private GetRadiusForPool(objPool:any) {
    var radius = this.cmRadius;

    return radius;
/*
    switch (objPool.mappedLocationUncertainty) {
      case null:
      case '10':
        break;
      case '50':
        radius = this.cmRadius + 1;
        break;
      case '100':
        radius = this.cmRadius + 2;
        break;
      case '>100':
        radius = this.cmRadius + 4;
        break;
    }
    return radius;
*/
  }

  async plotPoolMarker(vpool) {
    var llLoc = null;

    if (vpool === undefined) return;

    if (!vpool) return;

    if (Array.isArray(vpool)) {vpool = vpool[0];}

    //console.log('leaflet.component.plotPoolMarker(', vpool.poolId, ')');

    //convert null, undefined, NaN, empty, etc to 0
    vpool.latitude = vpool.latitude || 0;
    vpool.longitude = vpool.longitude || 0;

    //don't plot pools/visits/items lacking lat/lon values. it really mucks things up.
    if (!vpool.latitude || !vpool.longitude) {
      //console.log(`leaflet.component.plotPoolMarker(${vpool.poolId}) NO Lat/Lng for pool.`);
      return;
    }

    //console.log('leaflet.component.plotPoolMarker | Location:', vpool.latitude, vpool.longitude,')');

    llLoc = L.latLng(vpool.latitude, vpool.longitude);

    //this.cmLLArr.push(llLoc); //don't add markers to LatLon array. it mucks zoom, etc.

    this.marker.setLatLng(llLoc);

    var toolTip = `Pool ID: ${vpool.poolId}<br>
                   Lat: ${Number(llLoc.lat).toFixed(5)}<br>
                   Lng: ${Number(llLoc.lng).toFixed(5)}<br>`;

    if (vpool.visitPoolPhoto && vpool.visitPoolPhoto.includes('https')) {
      toolTip += `<img
                     src="${vpool.visitPoolPhoto}"
                     style="max-height: 100px; max-width: 100px;"
                   />`;
                 }
    this.marker.bindTooltip(toolTip);
  }

  async plotPoolShapes(vpools) {
    var llLoc = null;
    var shape = null; //the shape object which is mapped
    var ptRadius = null;
    var ptColor = null; //color indicates pool status (optionally mappedConfidence)
    var ptShape = null; //shape indicates visit/no visit, permission
    var ptCount = {potential:0, probable:0, confirmed:0, duplicate:0, eliminated:0}; //these must map to statusGroups ids...

    //console.log('leaflet.plotPoolShapes(',vpools,')');

    if (!vpools) return;

    if (!Array.isArray(vpools)) {vpools = [vpools];}

    this.SetPointZoomRadius(); //adjust cmRadius to current zoomLevel

    for (var i = 0; i < vpools.length; i++) {

      //convert null, undefined, NaN, empty, etc to 0
      vpools[i].latitude = vpools[i].latitude || 0;
      vpools[i].longitude = vpools[i].longitude || 0;

      //don't plot pools/visits/items lacking lat/lon values. it really mucks things up.
      if (!vpools[i].latitude || !vpools[i].longitude) {
        console.log('leaflet.plotPoolShapes() NO Lat/Lng for pool', vpools[i].poolId);
        continue;
      }

      llLoc = L.latLng(vpools[i].latitude, vpools[i].longitude);

      ptRadius = this.GetRadiusForPool(vpools[i]);

      // set the circleMarker's color based upon mappedPoolStatus
      switch (vpools[i].mappedPoolStatus) {
        case 'Duplicate': //duplicate pools should NOT be displayed
        case 'Eliminated': //eliminate pools should NOT be displayed
          ptColor = this.eliminatedColors[0];
          break;
        case 'Monitored':
          ptColor = this.monitoredColors[0];
          break;
        case 'Confirmed':
          ptColor = this.confirmedColors[0];
          break;
        case 'Probable':
          ptColor = this.probableColors[0];
          break;
        case 'Potential':
        default:
          ptColor = this.potentialColors[0];
          break;
      }

      /*
        Set the shapeMarker's shape based upon
        - Pool Status
        - Visit Data
        - Monitored or Not.
        See https://github.com/rowanwins/Leaflet.SvgShapeMarkers
        for options, shapes, etc.
      */
      if (vpools[i].visitId) {
        ptShape = "triangle";
      } else {
        ptShape = "circle";
      }

      /*
        See https://leafletjs.com/reference-1.3.4.html#path-weight for Path options.
      */
      //shape = L.circleMarker(llLoc, <any> {
      shape = L.shapeMarker(llLoc, <any> {
          shape: ptShape,
          radius: ptRadius, //applies to all shapes
          fillColor: ptColor, //interior color
          fillOpacity: 0.8, //values from 0 to 1
          color: "black", //border color
          weight: 1, //border thickness
          index: i, //event.sourceTarget.options.index
          poolId: vpools[i].poolId, //event.sourceTarget.options.poolId
          mappedPoolStatus: vpools[i].mappedPoolStatus,
          mappedConfidence: vpools[i].mappedConfidence,
          mappedLocationUncertainty: vpools[i].mappedLocationUncertainty
      });

      //shape.on("click", e => this.onCircleGroupClick(e)); //

      this.allGroup.addLayer(shape); //add this marker to the current featureGroup, which is an object with possibly multiple layerGroups by Pool Type or Status
      switch (vpools[i].mappedPoolStatus) {
        case 'Duplicate':
          this.duplGroup.addLayer(shape);
          ptCount.duplicate++;
          break;
        case 'Eliminated':
          this.elimGroup.addLayer(shape);
          ptCount.eliminated++;
          break;
        case 'Confirmed':
          this.confGroup.addLayer(shape);
          ptCount.confirmed++;
          break;
        case 'Probable':
          this.probGroup.addLayer(shape);
          ptCount.probable++;
          break;
        case 'Potential':
          this.potnGroup.addLayer(shape);
          ptCount.potential++;
          break;
      }

      this.cmLLArr.push(llLoc); //this is used to scope zoom. redundant?

      var toolText = '';
      /* Don't indlue visitId in tooltip anymore.
      if (vpools[i].visitId) {
        toolText += `<div>Visit ${vpools[i].visitId}</div>`;
      }*/
      toolText += `
            <div>Pool ${vpools[i].poolId}</div>
            <div>Status: ${vpools[i].mappedPoolStatus}</div>
            <div>Lat: ${Number(vpools[i].latitude).toFixed(5)}</div>
            <div>Lon:${Number(vpools[i].longitude).toFixed(5)}</div>
            `;
      //Add image to bottom of toolTip if one is indicated in field visitPoolPhoto
      if (vpools[i].visitPoolPhoto && vpools[i].visitPoolPhoto.includes('https')) {
        toolText += `<img
          src="${vpools[i].visitPoolPhoto}"
          style="max-height: 100px; max-width: 100px;"
          />`;
      }

      //NOTE shape.bindPopup was moved to onCircleGroupClick()

      shape.bindTooltip(toolText);

    } // for loop over vpools[i]

    //update point-counts in pool status menu by setting html innerHTML...
    //local object ptCount must have values that map to statusGroups ids...
    this.statusGroups.forEach((obj, idx) => {
      if (document.getElementById(obj.id)) {
          document.getElementById(obj.id).innerHTML = `${this.statusGroups[idx].name} (${ptCount[obj.id]})`;
      }
    });
  } // plotPoolShapes()

  changeColor(index=null) {

    //console.log(`changeColor(${index})`);
    if (!index) {
      this.cmColor++;
      if (this.cmColor > this.cmClrCnt) {this.cmColor = 0;}
    }
    //console.log(`changeColor(${index})`);

    this.allGroup.eachLayer((layer: any) => {

      layer.setStyle({color: this.cmColors[this.cmColor]})
    });

    this.uxValuesService.pointColorIndex = this.cmColor; //apply the change to the UX service to preserve value across page loads
  }
}
