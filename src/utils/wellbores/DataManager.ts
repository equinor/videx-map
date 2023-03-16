/* eslint-disable @typescript-eslint/no-empty-function */
import { SourceData, WellboreData, RootData, Group } from './data';

export default abstract class DataManager {
  wellbores: { [key: number]: WellboreData } = {}
  roots: { [key: number]: RootData } = {}

  /** Map group keys ('Drilled', 'Planned', etc.) to keys in wellbores dictionary. */
  groups: { [key: string]: Group } = {}

  addWellbore(_key: number, _data: SourceData) {

  }

  removeWellbore(_key: number) {

  }
}
