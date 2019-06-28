﻿import { Injectable } from '@angular/core';
import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChange } from "@angular/core";
//import * as $ from "jquery";
//import * as LP from "leaflet.browser.print";
import { AuthenticationService, uxValuesService } from '@app/_services';
import { vpMappedEventInfo } from '@app/_models';

//import * as L from "leaflet";
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
  @Input() itemType = 'Visit'; //flag what type of item is being mapped (vpMapped, vpVisit-mapped, vpVisit-new, etc.)
  @Input() mapPoints = false; //external flag plot mapValues as circleMarkers
  @Input() mapValues = null; //single value or array of values having .latitude and .longitude properties to plot as circleMarkers, set by the parent
  @Input() mapMarker = false; //external flag to invoke the map with a moveable marker
  @Input() locMarker = null; //single object having .latitude and .longitude properties to locate the moveable marker
  @Input() update = false; //external flag that this is an edit/update, not a create instantition: plot the mapMarker location with mapValues data
  @Output() markerUpdate = new EventEmitter<L.LatLng>(); //when the mapMarker is moved or located, send LatLng map events to listeners
  @Output() markerSelect = new EventEmitter<vpMappedEventInfo>(); //when a circleMarker is selected, send mapped pool info events to listeners
  itemLoc: L.LatLng = null; //store the location of the marker on the screen, passed with events to listeners, etc.
  itemInfo: vpMappedEventInfo = new vpMappedEventInfo(); //store a marker's extended info, passed with events to listeners
  public map = null;
  marker = null;
  layerControl = null;
  zoomControl = L.control.zoom();
  scaleControl = L.control.scale();
/*
  customControl =  L.Control.Layers.extend({

    onAdd: function () {
      this._initLayout();
      this._addButton();
      this._update();
      //return this._map._container;
    },
    _addButton: function () {
      console.log('_addButton() | the this: ', this);
      var elements = this._map._container.getElementsByClassName('leaflet-control-layers-list');
      var button = L.DomUtil.create('button', 'my-button-class', elements[0]);
      button.textContent = 'Close control';
      L.DomEvent.on(button, 'click', function(e){
        L.DomEvent.stop(e);
        //this._collapse();
        console.log('layer button clicked');
      }, this);
      return button;
    }
  });
*/
/*
  customBox =  L.Control.extend({
    options: {
      position: 'topleft'
    },

    onAdd: function (mod) {

      console.log('customBox mod: ', mod);

      var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

      container.style.backgroundColor = 'white';
      container.style.backgroundImage = "url(https://t1.gstatic.com/images?q=tbn:ANd9GcR6FCUMW5bPn8C4PbKak2BJQQsmC-K9-mbYBeFZm1ZM2w2GRy40Ew)";
      container.style.backgroundSize = "30px 30px";
      container.style.width = '30px';
      container.style.height = '30px';

      L.DomEvent.on(container, 'click', function(e) {
        L.DomEvent.stop(e);
        console.log('Custom Container Clicked');
        mod.zoomExtents(); //doesn't work.
      }, this);
      return container;
    }
  });
*/

  //printControl = LP.control.browserPrint();
  myRenderer = L.canvas({ padding: 0.5 });
  //https://www.w3schools.com/colors/colors_names.asp
  potentialColors = ["Orange"];
  probableColors = ["Cyan"];
  confirmedColors = ["Navy"];
  eliminatedColors = ["LightSteelBlue"];
  cmColors = ["blue", "#f5d108","#800000","yellow","orange","purple","cyan","grey"];
  cmColor = 0; //current color index
  cmClrCnt = 2; //(this.cmColors).length();
  cmRadius = 1;
  cmGroup = L.featureGroup();
  cmLLArr = [];
  zoom = 0;
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
  esriTopo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      id: 'esri.topo',
      name: 'ESRI Topo Map',
      zIndex: 0,
      maxNativeZoom: 20,
      maxZoom: 20,
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    } as any);
  openTopo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      id: 'open.topo',
      name: 'Open Topo Map',
      zIndex: 0,
      maxZoom: 17,
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    } as any);

    baseLayer = 0; //holds the baseLayers[] array index of the baseLayer last shown
    baseLayers = [this.openTopo, this.esriTopo, this.googleSat, this.streets, this.light];


  constructor(
    private uxValuesService: uxValuesService,
    private authenticationService: AuthenticationService
    ) {
    /*
      preserve baseLayer shown across page loads with outside service
      which holds baseLayers[] array index of last-selected baseLayer.
    */
    this.baseLayer = this.uxValuesService.baseLayerIndex;
    this.cmColor = this.uxValuesService.pointColorIndex;

    console.log(`constructor | baseLayerIndex: ${this.baseLayer}`);

    this.marker = L.marker(this.vtCenter, {
                draggable: true,
                autoPan: true
              });
  } //constructor

  ngOnInit() {
    if (this.authenticationService.currentUserValue) {
      this.currentUser = this.authenticationService.currentUserValue.user;
      console.log('vpvisit.leaflet.component.ngOnInit | currentUser.userrole:', this.currentUser.userrole);
      this.userIsAdmin = this.currentUser.userrole == 'admin';
    } else { this.userIsAdmin = false;}

    this.map = new L.Map("map", {
               zoomControl: false,
               maxZoom: 20,
               minZoom: 1,
               center: this.vtCenter,
               zoom: 8
             });

    this.scaleControl.setPosition('topright');
    this.scaleControl.addTo(this.map);

    this.layerControl = L.control.layers(null, null, { collapsed: true }).addTo(this.map);

    for (var i=0;i<this.baseLayers.length;i++) {
      //note: get around TypeScript type-checking by accessing non-declared object .properties in
      //the following way: as ['property']['sub-property'], not array[i].property.sub-property.
      this.layerControl.addBaseLayer(this.baseLayers[i], this.baseLayers[i]['options']['name']);
    }

    if (this.mapMarker) {
      this.marker.addTo(this.map); //a single Marker added in plotPoolMarker
    }
    //always add cmGroup - now we may want both point and moveable marker at the same time
    this.cmGroup.addTo(this.map); //a featureGroup of circleMarkers added in plotPoolShapes
    this.cmGroup.on("click", e => this.onCircleGroupClick(e));

    this.zoomControl.setPosition('topright');
    this.zoomControl.addTo(this.map);

    //this.printControl.position('topright');
    //this.printControl.addTo(this.map);

    this.baseLayers[this.baseLayer].addTo(this.map);

    this.map.on("baselayerchange", e => this.onBaseLayerChange(e));

    this.map.on("zoomend", e => this.onZoomEnd(e));

    this.map.on("click", e => this.onMapClick(e));

    this.marker.on("moveend", e => this.onMarkerMoveEnd(e));

    //this.map.addControl(new this.customControl());

    //this.map.addControl(new this.customBox(this));
  }


  /*
    this is magic. this is called when the parent (containing) component's data
    changes. so, when a map is included on a page with <app-map></app-map>, this
    event fires when the page's data changes.
  */
  async ngOnChanges(changes: {[propKey: string]: SimpleChange}) {
    console.log('leaflet.component.ngOnChanges(changes), changes:', changes);
    console.log('leaflet.component.ngOnChanges() | mapMarker:', this.mapMarker, ' | update: ', this.update)
    await this.clearPools();
    //if (this.mapMarker && this.update) {
    if (this.mapMarker) {
      await this.plotPoolMarker(this.locMarker);
    }
    if (this.mapPoints) {
      await this.plotPoolShapes(this.mapValues);
    }
  }

  zoomExtents() {
    if (this.map) {
      if (this.cmLLArr.length > 1) { //can't zoom to a single point - causes an error
        this.map.fitBounds(this.cmLLArr);
      } else if (this.cmLLArr.length == 1 ) {
        this.map.setView(this.cmLLArr[0], 12);
      } else {
        //no points in array?
      }
    }
  }

  zoomVermont() {
    if (this.map) {
      this.map.setView(this.vtCenter, 8 );
    }
  }

  onBaseLayerChange(e) {
    //find the array index of the baseLayer that was chosen from the envent value
    var index = this.baseLayers.findIndex(elm => {
      return elm == e.layer;
    });

    console.log(`onBaseLayerChange | name: ${e.name} | index: ${index}`);

    this.uxValuesService.setBaseLayer(index);
  }

  //set plotted pool radius relative to zoom level
  onZoomEnd(e) {
    this.zoom = this.map.getZoom();
    //console.log('onZoomEnd', this.zoom);
    this.cmRadius = this.zoom > 8 ? this.zoom - 8: 1;
    //console.log('cmCount', this.cmLLArr.length);
    if (this.cmLLArr.length < 20) {this.cmRadius = 5;}
    this.setCmRadius();
  }

  //iterate through all marker in the group and alter each radius
  setCmRadius(rad = this.cmRadius) {
    this.cmGroup.eachLayer((cmLayer: L.CircleMarker) => { //typescript complains that plain layer doesn't have setRadius(). CircleMarker does, so cast it.
      cmLayer.setRadius(rad);
    });
  }

  onMapClick(e) {
    //console.log("leaflet.onMapClick | event: ", e);
    this.itemLoc = L.latLng(e.latlng.lat, e.latlng.lng);
    this.marker.setLatLng(this.itemLoc);
    this.markerUpdate.emit(this.itemLoc);
    //this.map.panTo(this.itemLoc);
    //this.map.setView(this.itemLoc, 18);
    //console.log("leaflet.onMapClick | itemLoc: ", this.itemLoc);
    this.marker.bindTooltip(`Pool ID: ${this.mapValues.poolId}<br>
                             Lat: ${this.itemLoc.lat}<br>
                             Lng: ${this.itemLoc.lng}
                            `);
  }

  onMarkerMoveEnd(e) {
    console.log("leaflet.onMarkerMoveEnd | event: ", e);
    this.itemLoc = L.latLng(e.target._latlng.lat, e.target._latlng.lng);
    this.markerUpdate.emit(this.itemLoc);
    console.log("leaflet.onMarkerMoveEnd | itemLoc: ", this.itemLoc);
    this.marker.bindTooltip(`Pool ID: ${this.mapValues.poolId}<br>
                             Lat: ${this.itemLoc.lat}<br>
                             Lng: ${this.itemLoc.lng}
                            `);
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
    console.log("leaflet.onCircleGroupClick | index:", e.layer.options.index);
    console.log("leaflet.onCircleGroupClick | poolId:", e.layer.options.poolId);
    const index = e.sourceTarget.options.index;
    const cmLoc = L.latLng(e.latlng.lat, e.latlng.lng);
    const poolId = e.sourceTarget.options.poolId;
    const popText = this.buildPopup(index);

    if (this.itemType == 'Visit Mapped Pool') { //this is used to select a pool when creating a new visit
      this.itemInfo.latLng = cmLoc;
      this.itemInfo.poolId = poolId;
      this.markerSelect.emit(this.itemInfo);
    } else {
      const popShow = L.popup({
      	maxHeight: 200,
        keepInView: true
      }).setContent(popText);

      e.sourceTarget.bindPopup(popShow).openPopup();
    }
  }

  buildPopup(index) {
    var obj = Array.isArray(this.mapValues) ? this.mapValues[index] : this.mapValues;
    var text = '';
    var exclude = ['count']; //an array of column names to exclude from the popup list of values from the db
    var urlParts = {item: null, view: null, edit: null};

    switch (this.itemType) {
      case 'Visit':
        text += `<div><a href="pools/visit/view/${obj.visitId}">View Visit ${obj.visitId}</a></div>`;
        if (this.userIsAdmin) {
          text += `<div><a href="pools/visit/update/${obj.visitId}">Edit Visit ${obj.visitId}</a></div>`;
          text += `<div><a href="pools/visit/create/${obj.visitPoolId}">Add Visit for Pool ${obj.visitPoolId}</a></div>`;
        }
        break;
      case 'Visit New Pool':
        //don't add links to the top - they just click on the point to get info about it
        break;
      case 'Visit Mapped Pool':
        //don't add links to the top - they just click on the point to select it
        break;
      default:
      case 'Mapped Pool':
        urlParts = {item:obj.poolId, view:`pools/mapped/view/${obj.poolId}`, edit:`pools/mapped/update/${obj.poolId}`};
        text += `<div><a href="pools/mapped/view/${obj.poolId}">View Mapped Pool ${obj.poolId}</a></div>`;
        if (this.userIsAdmin) {
          text += `<div><a href="pools/mapped/update/${obj.poolId}">Edit Mapped Pool ${obj.poolId}</a></div>`;
          text += `<div><a href="pools/visit/create/${obj.poolId}">Add Visit for Pool ${obj.poolId}</a></div>`;
        }
        break;
    }

    Object.keys(obj).forEach(function(key,index) {
      if (obj[key] && !exclude.includes(key)) { //add non-null values not in the exclusion list
        text += `<div>${key}: ${obj[key]}</div>`;
      }
    });

    return text;
  }

  createVisitForPool(poolId) {
    console.log('createVisitForPool', poolId);
  }

  async clearPools() {
    this.cmGroup.clearLayers();
    this.cmLLArr = [];
  }

  async plotPoolMarker(vpool) {
    var llLoc = null;

    if (vpool === undefined) return;

    if (!vpool) return;

    if (Array.isArray(vpool)) {vpool = vpool[0];}

    console.log('leaflet.edit.plotPoolMarker(',vpool.poolId,')');

    //convert null, undefined, NaN, empty, etc to 0
    vpool.latitude = vpool.latitude || 0;
    vpool.longitude = vpool.longitude || 0;

    //don't plot pools/visits/items lacking lat/lon values. it really mucks things up.
    if (!vpool.latitude || !vpool.longitude) {
      console.log(`leaflet.edit.plotPoolMarker(${vpool.poolId}) NO Lat/Lng for pool.`);
      return;
    }

    llLoc = L.latLng(vpool.latitude, vpool.longitude);

    this.cmLLArr.push(llLoc);

    this.marker.setLatLng(llLoc);

    this.marker.bindTooltip(`Pool ID: ${vpool.poolId}<br>
                             Lat: ${llLoc.lat}<br>
                             Lng: ${llLoc.lng}
                            `);
  }

  async plotPoolShapes(vpools) {
    var llLoc = null;
    var shape = null; //the shape object which is mapped
    var ptRadius = null;
    var ptColor = null; //color indicates pool status (optionally mappedConfidence)
    var ptShape = null; //shape indicates visit/no visit, permission

    //console.log('leaflet.plotPoolShapes(',vpools,')');

    //if (vpools === undefined) return;

    if (!vpools) return;

    if (!Array.isArray(vpools)) {vpools = [vpools];}

    if (vpools.length < 20) {this.cmRadius = 5;}

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

      ptRadius = this.cmRadius;

      //set the cmRadius based upon mappedLocationUncertainty
      switch (vpools[i].mappedLocationUncertainty) {
        case null:
        case '50':
          break;
        case '100':
          ptRadius = 2 * this.cmRadius;
          break;
        case '>100':
          ptRadius = 4 * this.cmRadius;
          break;
      }

      // set the circleMarker's color based upon mappedPoolStatus
      switch (vpools[i].mappedPoolStatus) {
        case 'Eliminated':
          ptColor = this.eliminatedColors[0];
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

      /* set the circleMarker's shape based upon access/permission :
        landowner permission:
      */
/*
      switch (vpools[i].) {
        case 'Eliminated':
          ptColor = this.eliminatedColors[0];
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
*/
      //shape = L.circleMarker(llLoc, <any> {
      shape = L.shapeMarker(llLoc, <any> {
          //renderer: this.myRenderer,
          shape: "square",
          radius: ptRadius,
          color: ptColor, //this.cmColors[this.cmColor],
          index: i, //event.sourceTarget.options.index
          poolId: vpools[i].poolId, //event.sourceTarget.options.poolId
          status: vpools[i].mappedPoolStatus,
          confidence: vpools[i].mappedConfidence,
          locationUncertainty: vpools[i].mappedLocationUncertainty
      });

      this.cmGroup.addLayer(shape); //add this marker to the current featureGroup, which is an ojbect with possibly multiple layerGroups by Pool Type or Status

      this.cmLLArr.push(llLoc);

      var urlParts = {item: null, view: null, edit: null};
      switch (this.itemType) {
        case 'Visit':
          urlParts = {item:vpools[i].visitId , view:`pools/visit/view/${vpools[i].visitId}`, edit:`pools/visit/update/${vpools[i].visitId}`};
          break;
        default:
        case 'Mapped Pool':
          urlParts = {item:vpools[i].poolId, view:`pools/mapped/view/${vpools[i].poolId}`, edit:`pools/mapped/update/${vpools[i].poolId}`};
          break;
      }

      //NOTE shape.bindPopup was moved on onCircleGroupClick()

      shape.bindTooltip(`
                        <div>${this.itemType} ${urlParts.item}</div>
                        <div>Status: ${vpools[i].mappedPoolStatus}</div>
                        <div>Lat: ${vpools[i].latitude}</div>
                        <div>Lon:${vpools[i].longitude}</div>`);

    } // for loop over vpools[i]
  } // plotPoolShapes()

  changeColor(index=null) {

    console.log(`changeColor(${index})`);
    if (!index) {
      this.cmColor++;
      if (this.cmColor > this.cmClrCnt) {this.cmColor = 0;}
    }
    console.log(`changeColor(${index})`);

    this.cmGroup.eachLayer((layer: any) => {

      layer.setStyle({color: this.cmColors[this.cmColor]})
    });

    this.uxValuesService.pointColorIndex = this.cmColor; //apply the change to the UX service to preserve value across page loads
  }

}
