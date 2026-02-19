import { SourceData } from '../../../src/utils/wellbores/data';

interface ExplorationWell {
  latitude: number;
  longitude: number;
  uniqueWellboreIdentifier: string;
}


export function transformExplorationData(wells: ExplorationWell[]): SourceData[] {
  const output: SourceData[] = new Array(wells.length);

  for (let i = 0; i < wells.length; i++) {
    const well = wells[i];
    output[i] = {
        ...well,
      intervals: [],
      label: well.uniqueWellboreIdentifier,
      labelShort: well.uniqueWellboreIdentifier,
      path:  [[well.latitude, well.longitude]],
    }
  }

  return output;
}
