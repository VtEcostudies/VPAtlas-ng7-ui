import { vtTown } from '@app/_models';

export class vpVisit {
    count: number = 0;
    visitId: number = 0;
    visitIdLegacy: number = 0;
    visitPoolId: string = '';
    visitUserName: string = '';
    visitUserId: number = 0;
    visitObserverUserName: string = '';
    visitNavMethod: string = '';
    visitNavMethodOther: string = '';
    visitPoolMapped: boolean = false;
    visitLocatePool: boolean = false;
    visitCertainty: string = '';
    visitLocationUncertainty: string = '';
    visitDate: any = '';
    visitTown: vtTown = null; //vtTown = new vtTown(); instantiating town ojbect here works, but creates a circular dependency warning. set this on form load instead.
    visitTownId: number = 0;
    visitLocationComments: string = '';
    visitDirections: string = '';
    visitCoordSource: string = '';
    visitLatitude: number = 43.916944;
    visitLongitude: number = -72.668056;
    visitUserIsLandowner: boolean = false;
    visitLandownerPermission: boolean = false;
    visitLandowner: any = {};
    visitVernalPool: string = '';
    visitPoolType: string = '';
    visitPoolTypeOther: string = '';
    visitInletType: string = '';
    visitOutletType: string = '';
    visitForestCondition: string = '';
    visitForestUpland: string = '';
    visitHabitatComment: string = '';
    visitHabitatAgriculture: number = 0.0;
    visitHabitatLightDev: number = 0.0;
    visitHabitatHeavyDev: number = 0.0;
    visitHabitatPavedRd: number = 0.0;
    visitHabitatDirtRd: number = 0.0;
    visitHabitatPowerline: number = 0.0;
    visitHabitatOther: string = '';
    visitMaxDepth: string = '';
    visitWaterLevelObs: string = '';
    visitHydroPeriod: string = '';
    visitMaxWidth: string = '';
    visitMaxLength: string = '';
    visitPoolTrees: string = '';
    visitPoolShrubs: string = '';
    visitPoolEmergents: number = 0.0;
    visitPoolFloatingVeg: number = 0.0;
    visitSubstrate: string = '';
    visitSubstrateOther: string = '';
    visitDisturbDumping: number = 0.0;
    visitDisturbSiltation: number = 0.0;
    visitDisturbVehicleRuts: number = 0.0;
    visitDisturbRunoff: number = 0.0;
    visitDisturbDitching: number = 0.0;
    visitDisturbOther: string = '';
    visitWoodFrogAdults: number = 0.0;
    visitWoodFrogLarvae: number = 0.0;
    visitWoodFrogEgg: number = 0.0;
    visitWoodFrogEggHow: string = '';
    visitSpsAdults: number = 0.0;
    visitSpsLarvae: number = 0.0;
    visitSpsEgg: number = 0.0;
    visitSpsEggHow: string = '';
    visitJesaAdults: number = 0.0;
    visitJesaLarvae: number = 0.0;
    visitJesaEgg: number = 0.0;
    visitJesaEggHow: string = '';
    visitBssaAdults: number = 0.0;
    visitBssaLarvae: number = 0.0;
    visitBssaEgg: number = 0.0;
    visitBssaEggHow: string = '';
    visitFairyShrimp: number = 0.0;
    visitFingerNailClams: number = 0.0;
    visitSpeciesOther1: string = '';
    visitSpeciesOther2: string = '';
    visitSpeciesOtherName: string = '';
    visitSpeciesOtherCount: string = '';
    visitSpeciesOtherPhoto: string = '';
    visitSpeciesOtherNotes: string = '';
    visitSpeciesComments: string = '';
    visitFish: number = 0.0;
    visitFishCount: number = 0.0;
    visitFishSizeSmall: number = 0.0;
    visitFishSizeMedium: number = 0.0;
    visitFishSizeLarge: number = 0.0;
    visitPoolPhoto: string = '';
    createdAt: any = '';
    updatedAt: any = '';
    visitCreatedAt: any = '';
    visitUpdatedAt: any = '';
    visitFishSize: string = '';
    visitWoodFrogPhoto: string = '';
    visitWoodFrogNotes: string = '';
    visitSpsPhoto: string = '';
    visitSpsNotes: string = '';
    visitJesaPhoto: string = '';
    visitJesaNotes: string = '';
    visitBssaPhoto: string = '';
    visitBssaNotes: string = '';
    visitFairyShrimpPhoto: string = '';
    visitFairyShrimpNotes: string = '';
    visitFingerNailClamsPhoto: string = '';
    visitFingerNailClamsNotes: string = '';
    poolId: string = '';
    latitude: number = 43.916944;
    longitude: number = -72.668056;
}
