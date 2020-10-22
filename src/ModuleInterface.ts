import { pixiOverlayBase } from './pixiOverlayInterfaces';
import * as PIXI from 'pixi.js';

/** Class with common functions shared by all layers. */
export abstract class ModuleInterface {

  /** Function for pixi overlay. */
  pixiOverlay: pixiOverlayBase;

  /** Root container for layer. */
  root: PIXI.Container;

  /** True if layer is currently visible. */
  visibility: boolean = true;

  /** Common constructor for all map layers. */
  constructor() {
    this.root = new PIXI.Container(); // Group content in container
    this.root.sortableChildren = true; // Make container sortable
  }

  /** Toggle the visibility of the root PIXI container. */
  toggle() {
    this.root.visible = !this.root.visible;
  }

  /**
   * Set visibility of the root PIXI container to a given value.
   *
   * @param visible Should layer be visible?
   * @returns True if new visibility was set
   */
  setVisibility(visible: boolean) {
    if (visible != this.visibility) {
      this.root.visible = visible;
      this.visibility = visible;
      return true;
    }
    return false;
  }

  onAdd(map: L.Map) : void {}

  onRemove(map: L.Map) : void {};

  resize(zoom: number) : void {};

}
