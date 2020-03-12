import { Injectable } from '@angular/core';
import "leaflet";
import "leaflet-svg-shape-markers";
declare let L;

@Injectable({ providedIn: 'root' })

export class uxValuesService {
    vtCenter = new L.LatLng(43.916944, -72.668056); //VT geo center, downtown Randolph
    baseLayerIndex = -1;
    pointColorIndex = -1;
    prevZoomLevel = [8];
    prevZoomCenter = [this.vtCenter];
    zoomIndex = 0;

    constructor() {
      this.baseLayerIndex = 0; //default value
      this.pointColorIndex = 0; //default value
    }

    addPrevZoom(level, center) {
      this.prevZoomLevel.push(level);
      this.prevZoomCenter.push(center);
    }

    zoomNext() {
      this.zoomIndex=this.zoomIndex>0?this.zoomIndex--:0;
    }

    zoomPrev() {
      this.zoomIndex++;
      if (this.zoomIndex > this.prevZoomLevel.length) this.zoomIndex = this.prevZoomLevel.length;
    }

    getZoomLevel() {
      return this.prevZoomLevel[this.zoomIndex];
    }

    getZoomCenter() {
      return this.prevZoomCenter[this.zoomIndex];
    }
}
