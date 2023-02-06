import { Colors, getDefaultColors, InputColors } from '../Colors';
import { WellboreData, FilterStatus } from './WellboreData';
import { RootData } from './RootData';
import { SourceData } from './SourceData';

export interface GroupOptions {
  order?: number;
  mirrorLabels?: boolean;
  colors?: InputColors;
}

interface WellboreState {
  completionVisible: boolean;
  wellboreVisible: boolean;
}

type Filter = (data: SourceData) => boolean;

export class Group {
  key: string;
  colors: Colors;
  order: number = 0;
  mirrorLabels: boolean = false;
  wellbores: WellboreData[] = [];
  active: boolean = true;
  activeFilter: Filter = null;
  /** Is active filter soft or hard (Ghost) */
  isHardFilter: boolean;

  /** State of wellbores attached to group */
  state: WellboreState = {
    completionVisible: true,
    wellboreVisible: true,
  };

  constructor(key: string, options?: GroupOptions) {
    this.key = key;
    if (options) {
      if(!isNaN(options.order)) {
        this.order = options.order;
      }
      if (options.mirrorLabels) {
        this.mirrorLabels = options.mirrorLabels;
      }
      this.colors = getDefaultColors(options.colors);
    } else {
      this.colors = getDefaultColors();
    }
  }

  append(wellbore: WellboreData) {
    wellbore.zIndex = this.order * 10000 + this.wellbores.length;
    if (this.activeFilter) {
      const targetFilter = this.isHardFilter ? FilterStatus.hard : FilterStatus.soft;
      wellbore.setFilter(this.activeFilter(wellbore.data) ? FilterStatus.none : targetFilter);
      wellbore.root.recalculate(true);
    }
    this.wellbores.push(wellbore);
  }

  /**
   * Iterate over all wellbores and unique roots.
   * @param wellboreFunc Function to call on wellbores
   * @param rootFunc Function to call on roots
   */
  private forAll(wellboreFunc: (wellbore: WellboreData) => void, rootFunc: (root: RootData) => void) {
    const roots = new Set<RootData>(); // Set of unique roots

    const wellbores = this.wellbores;
    for (let i = 0; i < wellbores.length; i++) {
      const wellbore = wellbores[i];
      wellboreFunc(wellbore);
      roots.add(wellbore.root);
    }

    roots.forEach(root => rootFunc(root));
  }

  setActive(active: boolean) : void {
    if (this.active === active) return;
    this.active = active;

    this.forAll(
      wellbore => wellbore.update(),
      root => root.recalculate(true),
    );
  }

  softFilter(filter: Filter) {
    this.activeFilter = filter;
    this.isHardFilter = false;
    this.forAll(
      wellbore => wellbore.setFilter(filter(wellbore.data) ? FilterStatus.none : FilterStatus.soft),
      root => root.recalculate(true),
    );
  }

  hardFilter(filter: Filter) {
    this.activeFilter = filter;
    this.isHardFilter = true;
    this.forAll(
      wellbore => wellbore.setFilter(filter(wellbore.data) ? FilterStatus.none : FilterStatus.hard),
      root => root.recalculate(true),
    );
  }

  clearFilter() {
    this.activeFilter = null;
    this.forAll(
      wellbore => wellbore.setFilter(FilterStatus.none),
      root => root.recalculate(true),
    );
  }

  setCompletionVisibility(visible: boolean) {
    this.state.completionVisible = visible;
    this.wellbores.forEach(wellbore => {
      wellbore.setCompletionVisibility(visible);
    });
  }

  setWellboreVisibility(visible: boolean) {
    this.state.wellboreVisible = visible;
    this.wellbores.forEach(wellbore => {
      wellbore.setWellboreVisibility(visible);
    });
  }
}
