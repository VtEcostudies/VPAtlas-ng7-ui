import { Injectable } from '@angular/core';
import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChange } from "@angular/core";
import * as L from "leaflet";
import { AuthenticationService, uxValuesService } from '@app/_services';

@Component({
  selector: 'app-map-edit',
  templateUrl: 'leaflet.component.html',
  styleUrls: ['leaflet.component.css']
})

@Injectable({providedIn: 'root'}) //this makes a component single-instance, which applies to services, as well.

export class LeafletEditComponent implements OnInit, OnChanges {
  currentUser = null;
  userIsAdmin = false;
  vtCenter = new L.LatLng(43.916944, -72.668056); //VT geo center, downtown Randolph
  @Input() itemType = 'Visit';
  @Input() mapValues; //single value or array of values to plot, set by the parent
  @Input() update = false; //external flag to invoke the map with a moveable marker
  @Output() markerUpdate = new EventEmitter<L.LatLng>(); //send LatLng map events to listeners
  itemLoc: L.LatLng; //store the location of the marker on the screen, passed with events to listeners, etc.
  public map = null;
  marker = null;
  layerControl;
  zoomControl = L.control.zoom();
  scaleControl = L.control.scale();
  myRenderer = L.canvas({ padding: 0.5 });
  cmColors = ["blue", "#f5d108","#800000","yellow","orange","purple","cyan","grey"];
  cmColor = 0; //current color index
  cmClrCnt = 7; //(this.cmColors).length();
  cmRadius = 1; //default circleMarker radius
  cmGroup = L.featureGroup(); //a group of layers
  cmLLArr = []; //an array of circleMarkers
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
      preserve baseLayer and pointColor shown across page loads with outside service
      which holds baseLayerIndex of last-selected baseLayer and pointColorIndex of
      last-selected color.
    */
    this.baseLayer = this.uxValuesService.baseLayerIndex;
    this.cmColor = this.uxValuesService.pointColorIndex;

    console.log(`constructor | baseLayerIndex: ${this.baseLayer}`);

    //create marker instance has to go here, in constructor, or errors.
    this.marker = L.marker(this.vtCenter, {
                  draggable: true,
                  autoPan: true
                });
  } //constructor

  ngOnInit() {
    if (this.authenticationService.currentUserValue) {
      this.currentUser = this.authenticationService.currentUserValue.user;
      console.log('vpvisit.leaflet.edit.component.ngOnInit | currentUser.userrole:', this.currentUser.userrole);
      this.userIsAdmin = this.currentUser.userrole == 'admin';
    } else { this.userIsAdmin = false;}

    //creating map instance has to go here in ngOnInit, or errors.
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

    this.marker.addTo(this.map); //a single Marker added in plotPoolMarker

    this.zoomControl.setPosition('topright');
    this.zoomControl.addTo(this.map);

    this.baseLayers[this.baseLayer].addTo(this.map);

    this.map.on("baselayerchange", e => this.onBaseLayerChange(e));

    this.map.on("zoomend", e => this.onZoomEnd(e));

    this.map.on("click", e => this.onMapClick(e));

    this.marker.on("moveend", e => this.onMarkerMoveEnd(e));
  }

  /*
    this is magic. this is called when the parent (containing) component's data
    changes. so, when a map is included on a page with <app-map></app-map>, this
    event fires when the page's data changes.
  */
  async ngOnChanges(changes: {[propKey: string]: SimpleChange}) {
    //console.log('ngOnChanges(changes), changes:', changes);
    await this.clearPools();
    await this.plotPoolMarker(this.mapValues);
  }

  zoomExtents() {
    if (this.map) {
      if (this.cmLLArr.length > 1) { //fitBounds can't zoom to a single point - causes an error
        this.map.fitBounds(this.cmLLArr);
      } else if (this.cmLLArr.length == 1 ) { //use setView with center and zoom-level
        this.map.setView(this.cmLLArr[0], 12);
      } else { //no values in cmLLArr. error.
        console.log('Error in zoomExtents(). No values in point array.');
      }
    }
  }

  zoomVermont() {
    if (this.map) {
      this.map.setView(this.vtCenter, 8);
    }
  }

  onBaseLayerChange(e) {
    //find the array index of the baseLayer that was chosen from the event value
    var index = this.baseLayers.findIndex(elm => {
      return elm == e.layer;
    });

    console.log(`onBaseLayerChange | name: ${e.name} | index: ${index}`);

    this.uxValuesService.setBaseLayer(index);
  }

  onZoomEnd(e) {
    this.zoom = this.map.getZoom();
    //console.log('onZoomEnd', this.zoom);
    this.cmRadius = this.zoom > 10 ? this.zoom - 10: 1;
    //console.log('cmCount', this.cmLLArr.length);
    if (this.cmLLArr.length < 20) {this.cmRadius = 5;}
    this.setCmRadius();
  }

  setCmRadius(rad = this.cmRadius) {
    this.cmGroup.eachLayer((cmLayer: L.CircleMarker) => { //typescript complains that plain layer doesn't have setRadius(). CircleMarker does, so cast it.
      cmLayer.setRadius(rad);
    });
  }

  onMapClick(e) {
    console.log("leaflet.onMapClick | event: ", e);
    this.itemLoc = L.latLng(e.latlng.lat, e.latlng.lng);
    this.marker.setLatLng(this.itemLoc);
    this.markerUpdate.emit(this.itemLoc);
    //this.map.panTo(this.itemLoc);
    //this.map.setView(this.itemLoc, 18);
    console.log("leaflet.edit.onMapClick | itemLoc: ", this.itemLoc);
    this.marker.bindTooltip(`Pool ID: ${this.mapValues.poolId}<br>
                             Lat: ${this.itemLoc.lat}<br>
                             Lng: ${this.itemLoc.lng}
                            `);
  }

  onMarkerMoveEnd(e) {
    console.log("leaflet.onMarkerMoveEnd | event: ", e);
    this.itemLoc = L.latLng(e.target._latlng.lat, e.target._latlng.lng);
    this.markerUpdate.emit(this.itemLoc);
    console.log("leaflet.edit.edit.onMarkerMoveEnd | itemLoc: ", this.itemLoc);
    this.marker.bindTooltip(`Pool ID: ${this.mapValues.poolId}<br>
                             Lat: ${this.itemLoc.lat}<br>
                             Lng: ${this.itemLoc.lng}
                            `);
  }

  clearPools() {
    this.cmGroup.clearLayers();
    this.cmLLArr = [];
  }

  async plotPoolMarker(vpool) {
    var llLoc = null;

    if (!vpool) return;

    if (Array.isArray(vpool)) {vpool = vpool[0];}

    console.log('leaflet.edit.plotPoolMarker(',vpool.poolId,')');

    //don't plot pools/visits/items lacking lat/lon values. it really mucks things up.
    if (Number(vpool.latitude) == 0 || Number(vpool.longitude) == 0) {
      console.log(`leaflet.edit.plotPoolMarker(${vpool.poolId}) NO Lat/Lng for pool.`);
      return;
    }

    var urlParts = {base: null, item: null, view: null, edit: null};
    switch (this.itemType) {
      case 'Visit':
        urlParts = {base: '', item:vpool.visitId , view:`pools/visit/view/${vpool.visitId}`, edit:`pools/visit/update/${vpool.visitId}`};
        break;
      default:
      case 'Mapped Pool':
        urlParts = {base: '', item:vpool.poolId, view:`pools/mapped/view/${vpool.poolId}`, edit:`pools/mapped/update/${vpool.poolId}`};
        break;
    }

    llLoc = L.latLng(vpool.latitude, vpool.longitude);

    this.cmLLArr.push(llLoc);

    this.marker.setLatLng(llLoc);

    this.marker.bindTooltip(`${this.itemType} ${urlParts.item}<br>
                             Lat: ${llLoc.lat}<br>
                             Lng: ${llLoc.lng}
                            `);
  }

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
