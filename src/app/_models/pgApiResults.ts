
import { pgFields } from '@app/_models';

export class pgApiResults {
      command: string;
      rowCount: number;
      oid: string;
      rows: any[];
      fields: pgFields[];
      _parsers: [];
      RowCtor: string;
      rowAsArray: boolean;
};
