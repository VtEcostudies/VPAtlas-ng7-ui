import { vtTown } from '@app/_models';

export class vpMapped {
    count: number = 0;
    mappedPoolId: string = '';
    createdAt: number = 0;
    updatedAt: number = 0;
    mappedShape: string = '';
    mappedSource: string = '';
    mappedSource2: string ='';
    mappedDateText: string = '';
    mappedDateUnixSeconds: number;
    mappedByUser: string = '';
    mappedByUserId: number = 0;
    mappedPhotoNumber: string = '';
    mappedConfidence: string = '';
    mappedLocationAccuracy: string = '';
    mappedComments: string = '';
    mappedLatitude: number = 43.916944;
    mappedLongitude: number = -72.668056;

    mappedMethod: string = '';
    mappedPoolStatus: string = '';
    mappedlocationInfoDirections: string = '';
    mappedLandownerPermission: boolean = false;
    mappedLandownerName: string = '';
    mappedLandownerAddress: string = '';
    mappedLandownerTown: string = '';
    mappedLandownerStateAbbrev: string = '';
    mappedLandownerZip5: string = '';
    mappedLandownerPhone: string = '';
    mappedLandownerEmail: string = '';
    mappedLandownerInfo: string = '';
    mappedLocationUncertaintyUnits: string = '';
    mappedLocationUncertainty: number = null;

    mappedTownId: number = 0;
    mappedTown: vtTown = null; //new vtTown(); //instantiating town causes circular dependency warning. set this on form load instead.
}
