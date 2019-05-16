import { Injectable } from '@angular/core';
import { Component, OnInit, Input, OnChanges, SimpleChange } from "@angular/core";
import * as L from "leaflet";
//import { globals } from @app/_service;
import { uxValuesService } from '@app/_services';

@Component({
  selector: 'app-map',
  templateUrl: 'vpmap.leaflet.component.html',
  styleUrls: ['vpmap.leaflet.component.css']
})

@Injectable({providedIn: 'root'}) //this makes a service single-instance. what does it do for a component?

export class vpMapLeafletComponent implements OnInit, OnChanges {
  @Input() mapPools : [];
  public map;
  marker;
  lat;
  lng;
  layerControl;
  myRenderer = L.canvas({ padding: 0.5 });
  cmColors = {0:"#800000",1:"green",2:"blue",3:"yellow",4:"orange",5:"purple",6:"cyan",7:"grey"};
  cmRadius = 1;
  cmGroup = L.layerGroup();
  cmLLArr = [];
  zoom = 0;
  vceCenter = new L.LatLng(43.6962, -72.3197); //VCE coordinates
  vtCenter = new L.LatLng(43.916944, -72.668056); //VT geo center, downtown Randolph
  vtAltCtr = new L.LatLng(43.858297, -72.446594); //VT border center for the speciespage view, where px bounds are small and map is zoomed to fit
  googleSat = L.tileLayer("https://{s}.google.com/vt/lyrs=s,h&hl=tr&x={x}&y={y}&z={z}",
    {
      id: 'google.sat',
      name: 'Google Satellite +',
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
    baseLayers = [this.googleSat, this.streets, this.light, this.esriTopo, this.openTopo];


  constructor(private uxValuesService: uxValuesService) {

    /*
      preserve baseLayer shown across page loads with outside service
      which holds baseLayers[] array index of last-selected baseLayer.
    */
    this.baseLayer = this.uxValuesService.baseLayerIndex;

    console.log(`constructor | baseLayerIndex: ${this.baseLayer}`);

  }

  ngOnInit() {

    this.map = new L.Map("map", {
      zoomControl: false,
      maxZoom: 20,
      minZoom: 5,
      center: this.vtCenter,
      zoom: 8
    });

    this.cmGroup.addTo(this.map); //an empty layerGroup for circleMarkers to be added to the map

    this.layerControl = L.control.layers(null, null, { collapsed: true }).addTo(this.map);

    for (var i=0;i<this.baseLayers.length;i++) {
      this.layerControl.addBaseLayer(this.baseLayers[i], this.baseLayers[i].options.name);
    }

    this.baseLayers[this.baseLayer].addTo(this.map);

    this.map.on("baselayerchange", e => this.onBaseLayerChange(e));

    this.map.on("zoomend", e => this.onZoomEnd(e));
  }

  /*
    this is magic. this is called when the parent (containing) component's data
    changes. so, when a map is included on a page with <app-map></app-map>, this
    event fires when the page's data changes.
  */
  ngOnChanges(changes: {[propKey: string]: SimpleChange}) {
    //console.log('ngOnChanges(changes), changes:', changes);
    this.clearPools();
    this.plotPools(this.mapPools);
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

  onLayerAdd(e) {
    //this.zoomExtents(); //this might be causing huge client-side slowdown and resource hogging...
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
    console.log('onZoomEnd', this.zoom);
    this.cmRadius = this.zoom > 10 ? this.zoom - 10: 1;
    console.log('cmCount', this.cmLLArr.length);
    if (this.cmLLArr.length < 20) {this.cmRadius = 5;}
    this.setCmRadius();
  }

  setCmRadius(rad = this.cmRadius) {
    this.cmGroup.eachLayer((cmLayer: L.CircleMarker) => { //typescript complains that plain layer doesn't have setRadius(). CircleMarker does, so cast it.
      cmLayer.setRadius(rad);
    });
  }

  onMapClick(e) {
    this.lat = e.latlng.lat;
    this.lng = e.latlng.lng;
    console.log("this.marker", this.marker);
    this.marker.setLatLng(new L.LatLng(e.latlng.lat, e.latlng.lng));
    this.map.panTo(new L.LatLng(e.latlng.lat, e.latlng.lng));
    this.map.setView(new L.LatLng(e.latlng.lat, e.latlng.lng), 18);
  }

  clearPools() {
    this.cmGroup.clearLayers();
    this.cmLLArr = [];
  }

  plotPools(vpools) {

    if (!vpools) return;

    if (!Array.isArray(vpools)) {vpools = [vpools];}

    if (vpools.length < 20) {this.cmRadius = 5;}

    for (var i = 0; i < vpools.length; i++) {

      var llLoc = L.latLng(vpools[i].mappedLatitude, vpools[i].mappedLongitude);

      var circle = L.circleMarker(llLoc, {
          renderer: this.myRenderer,
          radius: this.cmRadius,
          color: this.cmColors[0]
      });

      this.cmGroup.addLayer(circle); //add this marker to the current layerGroup, which is an ojbect with possibly multiple layerGroups by Pool Type or Status

      this.cmLLArr.push(llLoc);

      circle.bindPopup(`<a href="pools/mapped/update/${vpools[i].mappedPoolId}">
                        Update Pool ${vpools[i].mappedPoolId}<br>
                        Lat: ${vpools[i].mappedLatitude}<br>
                        Lon:${vpools[i].mappedLongitude}</a><br/>`);

      circle.bindTooltip(`${vpools[i].mappedPoolId}<br>
                        Lat: ${vpools[i].mappedLatitude}<br>
                        Lon:${vpools[i].mappedLongitude}<br>`);
    }
  }

}
