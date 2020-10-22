import { SourceData } from '../../src/utils/wellbores/data';

export default function removeExpDuplicates(expWells: SourceData[], refWells: SourceData[]): SourceData[] {
  return expWells.filter(well => !refWells.some(ref => ref.label === well.label));
}
