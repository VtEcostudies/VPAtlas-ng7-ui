import { Component, OnInit, Input, OnChanges, SimpleChange } from "@angular/core";
import * as L from "leaflet";

@Component({
  selector: 'app-map',
  templateUrl: 'vpmap.leaflet.component.html',
  styleUrls: ['vpmap.leaflet.component.css']
})

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

  ngOnInit() {

    this.map = new L.Map("map", {
      zoomControl: false,
      maxZoom: 20,
      minZoom: 5,
      center: this.vtCenter,
      zoom: 8
    });

    this.cmGroup.addTo(this.map); //an empty layerGroup for circleMarkers to be added to the map

    const googleSat = {
      "Google Satellite Plus": L.tileLayer("https://{s}.google.com/vt/lyrs=s,h&hl=tr&x={x}&y={y}&z={z}",
        {
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
          maxNativeZoom: 20,
          zIndex: 0,
          maxZoom: 20
        }
      ).addTo(this.map)
    };

    this.layerControl = L.control.layers(googleSat, null, { collapsed: false }).addTo(this.map);

    const streets = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoiamxvb21pc3ZjZSIsImEiOiJjanB0dzVoZ3YwNjlrNDNwYm9qN3NmNmFpIn0.tyJsp2P7yR2zZV4KIkC16Q',
      {
        id: 'mapbox.streets',
        maxNativeZoom: 20,
        zIndex: 0,
        maxZoom: 20
      } as any);

    const light = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoiamxvb21pc3ZjZSIsImEiOiJjanB0dzVoZ3YwNjlrNDNwYm9qN3NmNmFpIn0.tyJsp2P7yR2zZV4KIkC16Q',
      {
        id: 'mapbox.light',
        maxNativeZoom: 20,
        maxZoom: 20
      } as any);

    const esriTopo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        id: 'esri.topo',
        maxNativeZoom: 20,
        maxZoom: 20,
      	attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
      } as any);
      
    const openTopo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        id: 'open.topo',
      	maxZoom: 17,
      	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
      } as any);

    this.layerControl.addBaseLayer(streets, "Mapbox Streets");
    this.layerControl.addBaseLayer(light, "Mapbox Grayscale");
    this.layerControl.addBaseLayer(esriTopo, "ESRI Topo Map");
    this.layerControl.addBaseLayer(openTopo, "Open Topo Map");

    //this.layerControl.setPosition("bottomright");

    this.map.on("layeradd", e => this.onLayerAdd(e));

    this.map.on("zoomend", e => this.onZoomEnd(e));
/*
    this.marker = L.marker(this.map.getCenter(), {
      draggable: true,
      icon: L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.4.0/dist/images/marker-icon.png",
        iconSize: [25, 35],
        iconAnchor: [30 / 2, 35]
      })
    }).addTo(this.map);
    console.log("this.marker", this.marker);
    this.map.on("click", e => this.onMapClick(e));
*/
  }

  ngOnChanges(changes: {[propKey: string]: SimpleChange}) {
    console.log('ngOnChanges(changes), changes:', changes);
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

  onLayerAdd(e) {
    //this.zoomExtents(); //this might be causing huge client-side slowdown and resource hogging...
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

      circle.bindPopup(`<a href="pools/mapped/view/${vpools[i].mappedPoolId}">
                        View Pool ${vpools[i].mappedPoolId}<br>
                        Lat: ${vpools[i].mappedLatitude}<br>
                        Lon:${vpools[i].mappedLongitude}</a><br/>`);

      circle.bindTooltip(`${vpools[i].mappedPoolId}<br>
                        Lat: ${vpools[i].mappedLatitude}<br>
                        Lon:${vpools[i].mappedLongitude}<br>`);
    }
  }

}
