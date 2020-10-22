import * as PIXI from 'pixi.js';
import * as L from 'leaflet';
import 'leaflet-pixi-overlay';
import { ModuleInterface } from '../../src';

// @ts-ignore
export default class PixiLayer extends L.PixiOverlay {

  // Support all 'hidden' props
  [key: string]: any;

  /** Root pixi container. */
  root: PIXI.Container;

  /* Reference to added modules */
  modules: ModuleInterface[];

  /** Previous zoom level. */
  prevZoom: number;

  constructor(options?: any) {
    const drawCallback = (utils: any) => {
      const zoom = utils.getMap().getZoom();
      const container = utils.getContainer();
      const renderer = utils.getRenderer();

      // Call onZoom function
      if (this.prevZoom !== zoom) {
        this.modules.forEach(module => module.resize(zoom));
        this.prevZoom = zoom;
      }

      renderer.render(container);
    }

    const root = new PIXI.Container(); // Group content in container
    root.sortableChildren = true; // Make container sortable

    super(drawCallback, root, options);
    this.root = root;
    this.modules = [];
  }

  /**
   * Adds a new layer to the multi-layer.
   * @param instance Instance of layer to add
   */
  addModule<T extends ModuleInterface>(instance: T) {
    instance.pixiOverlay = (this as any); // Send pixiOverlay reference
    this.modules.push(instance);
    if (this.prevZoom) instance.resize(this.prevZoom); // Initial zoom
    this.root.addChild(instance.root);
  }

  onAdd(map: L.Map) {
    super.onAdd(map);
    this.modules.forEach(mod => mod.onAdd && mod.onAdd(map));
  }

  onRemove(map: L.Map) {
    super.onRemove(map);
    this.modules.forEach(mod => mod.onRemove && mod.onRemove(map));
  }
}
