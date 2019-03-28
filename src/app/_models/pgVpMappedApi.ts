
import { pgFields, vpMapped } from '@app/_models';

export class pgVpMappedApi {
      command: string;
      rowCount: number;
      oid: string;
      rows: vpMapped[];
      fields: pgFields[];
      parsers: [];
      RowCtor: string;
      rowAsArray: boolean;
};
