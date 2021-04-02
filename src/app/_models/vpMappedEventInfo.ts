import L from "leaflet";

export class vpMappedEventInfo {
  poolId: string = '';
  latLng: L.LatLng = null;
  town: {townName:"Unknown", townId:0, townCountyId:0};
}
