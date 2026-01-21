/* eslint-disable @typescript-eslint/no-empty-function */
import { pixiOverlayBase } from './pixiOverlayInterfaces';
import { Container } from 'pixi.js';

/** Class with common functions shared by all layers. */
export abstract class ModuleInterface {

  /** Function for pixi overlay. */
  pixiOverlay: pixiOverlayBase;

  /** Root container for layer. */
  root: Container;

  /** True if layer is currently visible. */
  visibility: boolean = true;

  // prevZoom: number;

  /** Common constructor for all map layers. */
  constructor() {
    this.root = new Container(); // Group content in container
    this.root.sortableChildren = true; // Make container sortable
  }

  destroy(){
    this.root.destroy({ children: true, texture: true, textureSource: true });
    this.root = null;
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
    if (visible !== this.visibility) {
      this.root.visible = visible;
      this.visibility = visible;
      return true;
    }
    return false;
  }

  onAdd(_map: L.Map) : void {}

  onRemove(_map: L.Map) : void {}

  resize(_zoom: number) : void {}

}
