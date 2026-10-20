import { WellboreData } from './data';

export class Highlight {
  wellbore: WellboreData = null;

  get active() {
    return this.wellbore !== null;
  }

  set(wellbore: WellboreData) {
    if (this.wellbore === wellbore) return;

    this.clear();
    this.wellbore = wellbore;
    wellbore.setHighlight(true);
    wellbore.root.recalculate(false);
  }

  clear() {
    if (!this.active) return;

    this.wellbore.setHighlight(false);
    this.wellbore.root.recalculate(false);
    this.wellbore = null;
  }
}
