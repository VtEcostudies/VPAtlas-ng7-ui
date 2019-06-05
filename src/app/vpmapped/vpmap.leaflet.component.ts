import { Injectable } from '@angular/core';
import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChange } from "@angular/core";
import * as L from "leaflet";
//import * as LP from "leaflet.browser.print";
import { AuthenticationService, uxValuesService } from '@app/_services';

@Component({
  selector: 'app-map',
  templateUrl: 'vpmap.leaflet.component.html',
  styleUrls: ['vpmap.leaflet.component.css']
})

@Injectable({providedIn: 'root'}) //this makes a component single-instance, which applies to services, as well.

export class vpMapLeafletComponent implements OnInit, OnChanges {
  currentUser = null;
  userIsAdmin = false;
  vceCenter = new L.LatLng(43.6962, -72.3197); //VCE coordinates
  vtCenter = new L.LatLng(43.916944, -72.668056); //VT geo center, downtown Randolph
  vtAltCtr = new L.LatLng(43.858297, -72.446594); //VT border center for the speciespage view, where px bounds are small and map is zoomed to fit
  @Input() mapPools;
  @Input() update = false;
  @Output() poolUpdate = new EventEmitter<L.LatLng>();
  poolLoc: L.LatLng;
  public map;
  //update = true; //flag that we will create a moveable marker for editing pool location
  marker = L.marker(this.vtCenter, {
              draggable: true,
              autoPan: true
            });
  layerControl;
  zoomControl = L.control.zoom();
  scaleControl = L.control.scale();
  //printControl = LP.control.browserPrint();
  myRenderer = L.canvas({ padding: 0.5 });
  cmColors = ["blue", "#f5d108","#800000","yellow","orange","purple","cyan","grey"];
  cmColor = 0; //current color index
  cmClrCnt = 7; //(this.cmColors).length();
  cmRadius = 1;
  cmGroup = L.layerGroup();
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

  } //constructor

  ngOnInit() {
    if (this.authenticationService.currentUserValue) {
      this.currentUser = this.authenticationService.currentUserValue.user;
      console.log('vpmap.leaflet.component.ngOnInit | currentUser.userrole:', this.currentUser.userrole);
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

    if (this.update) {
      this.marker.addTo(this.map); //a single Marker added in plotPoolMarker
    } else {
      this.cmGroup.addTo(this.map); //a layerGroup of circleMarkers added in plotPoolCircles
    }

    this.zoomControl.setPosition('topright');
    this.zoomControl.addTo(this.map);

    //this.printControl.position('topright');
    //this.printControl.addTo(this.map);

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
  ngOnChanges(changes: {[propKey: string]: SimpleChange}) {
    //console.log('ngOnChanges(changes), changes:', changes);
    this.clearPools();
    if (this.update) {
      this.plotPoolMarker(this.mapPools);
    } else {
      this.plotPoolCircles(this.mapPools);
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
    this.poolLoc = L.latLng(e.latlng.lat, e.latlng.lng);
    this.marker.setLatLng(this.poolLoc);
    this.poolUpdate.emit(this.poolLoc);
    //this.map.panTo(this.poolLoc);
    //this.map.setView(this.poolLoc, 18);
    console.log("vpmap.leaflet.onMapClick | poolLoc: ", this.poolLoc);
    this.marker.bindTooltip(`Pool ID: ${this.mapPools.mappedPoolId}<br>
                             Lat: ${this.poolLoc.lat}<br>
                             Lng: ${this.poolLoc.lng}
                            `);
  }

  onMarkerMoveEnd(e) {
    this.poolLoc = L.latLng(e.target._latlng.lat, e.target._latlng.lng);
    this.poolUpdate.emit(this.poolLoc);
    console.log("vpmap.leaflet.onMarkerMoveEnd | poolLoc: ", this.poolLoc);
    this.marker.bindTooltip(`Pool ID: ${this.mapPools.mappedPoolId}<br>
                             Lat: ${this.poolLoc.lat}<br>
                             Lng: ${this.poolLoc.lng}
                            `);
  }

  clearPools() {
    this.cmGroup.clearLayers();
    this.cmLLArr = [];
  }

  plotPoolMarker(vpool) {

    console.log('vpmap.leaflet.plotPoolMarker(',vpool,')');

    if (!vpool) return;

    if (Array.isArray(vpool)) {vpool = vpool[0];}

    this.marker.setLatLng(L.latLng(vpool.mappedLatitude, vpool.mappedLongitude));

    this.marker.bindTooltip(`Pool ID: ${vpool.mappedPoolId}<br>
                             Lat: ${vpool.mappedLatitude}<br>
                             Lng: ${vpool.mappedLongitude}
                            `);
  }

  plotPoolCircles(vpools) {

    console.log('vpmap.leaflet.plotPoolCircles(',vpools,')');

    if (!vpools) return;

    if (!Array.isArray(vpools)) {vpools = [vpools];}

    if (vpools.length < 20) {this.cmRadius = 5;}

    for (var i = 0; i < vpools.length; i++) {

      var llLoc = L.latLng(vpools[i].mappedLatitude, vpools[i].mappedLongitude);

      var ptRadius = this.cmRadius;

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

      // TODO: set the cmColor based upon mappedPoolStatus

      var circle = L.circleMarker(llLoc, {
          renderer: this.myRenderer,
          radius: ptRadius,
          color: this.cmColors[this.cmColor]
      });

      this.cmGroup.addLayer(circle); //add this marker to the current layerGroup, which is an ojbect with possibly multiple layerGroups by Pool Type or Status

      this.cmLLArr.push(llLoc);

      if (this.userIsAdmin) {
        circle.bindPopup(`<a href="pools/mapped/view/${vpools[i].mappedPoolId}">View ${vpools[i].mappedPoolId}</a><br>
                          <a href="pools/mapped/update/${vpools[i].mappedPoolId}">Edit ${vpools[i].mappedPoolId}</a><br>
                          Lat: ${vpools[i].mappedLatitude}<br>
                          Lon:${vpools[i].mappedLongitude}<br>
                          `
                        );
      } else {
        circle.bindPopup(`<a href="pools/mapped/view/${vpools[i].mappedPoolId}">View ${vpools[i].mappedPoolId}</a><br>
                          Lat: ${vpools[i].mappedLatitude}<br>
                          Lon:${vpools[i].mappedLongitude}<br>
                          `
                        );
      }

      circle.bindTooltip(`${vpools[i].mappedPoolId}<br>
                        Lat: ${vpools[i].mappedLatitude}<br>
                        Lon:${vpools[i].mappedLongitude}<br>`);
    } // else userIsAdmin
  } // plotPoolCircles()

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
