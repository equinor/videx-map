import { Container } from 'pixi.js';
import * as L from 'leaflet';
import './leaflet-pixi-overlay';
import { ModuleInterface } from '../../../src';

// @ts-ignore
export default class PixiLayer extends L.PixiOverlay {

  // Support all 'hidden' props
  [key: string]: any;

  /** Root pixi container. */
  root: Container;

  /* Reference to added modules */
  modules: Set<ModuleInterface>;

  /** Previous zoom level. */
  prevZoom?: number;

  constructor(options: any = {}) {
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

    const root = new Container(); // Group content in container
    root.sortableChildren = true; // Make container sortable

    super(drawCallback, root, options);
    this.root = root;
    this.modules = new Set();
  }

  /**
   * Adds a new layer to the multi-layer.
   * @param instance Instance of layer to add
   */
  addModule<T extends ModuleInterface>(module: T) {
    module.pixiOverlay = (this as any); // Send pixiOverlay reference
    this.modules.add(module);
    if (this.prevZoom) {
      module.resize(this.prevZoom); // Initial zoom
    }
    this.root.addChild(module.root);
  }

  onAdd(map: L.Map) {
    super.onAdd(map);
    this.modules.forEach(module => module.onAdd(map));
  }

  onRemove(map: L.Map) {
    super.onRemove(map);
    this.modules.forEach(mod => mod.onRemove && mod.onRemove(map));
  }
}
