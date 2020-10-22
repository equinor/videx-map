import { SourceData } from '../../src/utils/wellbores/data';

interface ExplorationWell {
  completionDate?: string;
  discoveryIdentifier?: string;
  drillEndDate?: string;
  fieldGuid?: number;
  latitude: number;
  longitude: number;
  operator?: string;
  parentWellbore?: string;
  responsibleCompany?: string;
  uniqueWellboreIdentifier: string;
  wellboreContent?: string;
  wellboreGuid: number;
  wellborePurpose: string;
}


export default function processExploration(wells: ExplorationWell[]): SourceData[] {
  const output: SourceData[] = new Array(wells.length);

  for (let i = 0; i < wells.length; i++) {
    const well = wells[i];
    output[i] = {
      intervals: [],
      label: well.uniqueWellboreIdentifier,
      labelShort: compressName(well.uniqueWellboreIdentifier),
      path: [[well.latitude, well.longitude]],
    }
  }

  return output;
}

function compressName(name: string) {
  let output = name;
  if (/^[a-zA-Z]{2}\s/.test(name)) {
    output = name.substring(3);
  }
  return output;
}
