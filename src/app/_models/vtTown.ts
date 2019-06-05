export class vtTown {
  townId: number;
  townName: string;
  townCountyId: number;
  townCentroid: object;
  townBorder: object;

  constructor () {
    this.townId = 0;
    this.townName = 'Unknown';
    this.townCountyId = 0;
    this.townCentroid = {};
    this.townBorder = {};
  }
}
