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
    zoomCount = 0;
    zoomUI = true; //flag a zoom event from map UI (not from zoomPrev or zoomNext)
    moveUI = true; //flag a zoom event from map UI (not from zoomPrev or zoomNext)

    constructor() {
      this.baseLayerIndex = 0; //default value
      this.pointColorIndex = 0; //default value
    }

    addPrevZoom(level, center) {
      if (this.zoomUI) {
        console.log('addPrevZoom');
        this.prevZoomLevel.push(level);
        this.prevZoomCenter.push(center);
        this.zoomIndex = this.prevZoomLevel.length-1;
        this.zoomCount = this.prevZoomLevel.length-1;
      }
    }

    addPrevMove(level, center) {
      if (this.moveUI) {
        console.log('addPrevMove');
        this.prevZoomLevel.push(level);
        this.prevZoomCenter.push(center);
        this.zoomIndex = this.prevZoomLevel.length-1;
        this.zoomCount = this.prevZoomLevel.length-1;
      }
    }

    zoomPrev(map) {
      this.zoomUI=false;
      this.moveUI=false;
      this.zoomIndex--;
      if (this.zoomIndex < 0) this.zoomIndex = 0;
      map.setView(this.getZoomCenter(), this.getZoomLevel());
    }

    zoomNext(map) {
      this.zoomUI=false;
      this.moveUI=false;
      this.zoomIndex++;
      if (this.zoomIndex > this.prevZoomLevel.length-1) this.zoomIndex = this.prevZoomLevel.length-1;
      map.setView(this.getZoomCenter(), this.getZoomLevel());
    }

    getZoomLevel() {
      //console.log('getZoomLevel', this.zoomIndex, this.prevZoomLevel[this.zoomIndex])
      return this.prevZoomLevel[this.zoomIndex];
    }

    getZoomCenter() {
      //console.log('getZoomCenter', this.zoomIndex, this.prevZoomCenter[this.zoomIndex])
      return this.prevZoomCenter[this.zoomIndex];
    }
}
