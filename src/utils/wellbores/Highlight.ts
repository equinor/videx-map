/* eslint-disable curly */
import { WellboreData, RootData } from './data'

export class Highlight {
  active: boolean = false;
  root: RootData;
  wellbores: WellboreData[];

  /** Return true of highlight is single. */
  get single() {
    return this.wellbores.length === 1;
  }

  /** Get first wellbore. */
  get first() {
    return this.wellbores[0];
  }

  /** Set highlight */
  set(root: RootData, wellbores: WellboreData[]) {
    // If new highlight
    if (!this.active) {
      this.root = root;
      this.wellbores = wellbores;
      this.highlightWellbores();
      this.highlightRoot();
      this.active = true;
      return;
    }

    if (this.root !== root || this.wellbores.length !== wellbores.length) {
      this.clear(); // Clear all
      this.root = root;
      this.wellbores = wellbores;
      this.highlightWellbores();
      this.highlightRoot();
    } else { // If same root and highlight type
      this.clearWellbores(); // Only clear wellbores
      this.wellbores = wellbores; // Set new wellbore
      this.highlightWellbores(); // Highlight wellbores
    }

    this.active = true;
  }

  private highlightRoot() {
    this.root.recalculate(false);
  }

  private highlightWellbores() {
    const multiple = (this.wellbores.length > 1);
    for (let i = 0; i < this.wellbores.length; i++) {
      this.wellbores[i].setHighlight(true, multiple);
    }
  }

  clear() {
    if (!this.active) return;
    this.clearWellbores();
    this.clearRoot();
    this.active = false;
  }

  private clearRoot() {
    this.root.recalculate(false);
    delete this.root;
  }

  private clearWellbores() {
    for (let i = 0; i < this.wellbores.length; i++) {
      this.wellbores[i].setHighlight(false);
    }
    delete this.wellbores;
  }

  equals(root: RootData, wellbores: WellboreData[]) {
    if (this.root !== root) return false;
    if (this.wellbores.length !== wellbores.length) return false;

    // Compare wellbores
    for (let i = 0; i < this.wellbores.length; i++) {
      const wellbore = this.wellbores[i];
      if (!wellbores.includes(wellbore)) return false;
    }

    return true;
  }
}
