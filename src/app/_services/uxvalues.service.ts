import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })

export class uxValuesService {
    baseLayerIndex = -1;

    constructor() {
      this.baseLayerIndex = 0; //default value
    }

    setBaseLayer(layerIndex) {
      this.baseLayerIndex = layerIndex;
    }

    getBaseLayer() {
        return this.baseLayerIndex;
    }
}
