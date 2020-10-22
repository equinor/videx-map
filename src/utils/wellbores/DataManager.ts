import { SourceData, WellboreData, RootData, Group } from './data';

export default class DataManager {
  wellbores: { [key: number]: WellboreData } = {}
  roots: { [key: number]: RootData } = {}

  /** Map group keys ('Drilled', 'Planned', etc.) to keys in wellbores dictionary. */
  groups: { [key: string]: Group } = {}

  addWellbore(key: number, data: SourceData) {

  }

  removeWellbore(key: number) {

  }
}
