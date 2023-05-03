import { SourceData } from '../SourceData';

// Relative position along the wellbore, given as a single point or start/end
export type RelativePosition = (number | [number, number]);

export interface DetailOptions {
  getData: (wellbore: SourceData, group: string) => RelativePosition[];
  shape?: string;
  color?: [number, number, number];
}
