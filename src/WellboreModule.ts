import * as PIXI from 'pixi.js';
import { ModuleInterface } from './ModuleInterface';
import { Config, InputConfig, getDefaultConfig } from './utils/wellbores/Config';
import { RootShader } from './utils/wellbores/Shader';
import { SourceData, Group, GroupOptions, WellboreData, RootData } from './utils/wellbores/data';
import LineDictionary from './utils/LineDictionary';
import PointDictionary from './utils/PointDictionary';
import Vector2 from '@equinor/videx-vector2';
import Projector from './utils/wellbores/Projector';
import { Label } from './utils/wellbores/labels';
import { updateHighlighted, clearHighlight, forceHighlight } from './utils/wellbores/highlight-helper';
import { Highlight } from './utils/wellbores/Highlight';
import AsyncLoop from './utils/wellbores/AsyncLoop';
import { EventHandler, DefaultEventHandler } from './EventHandler';
import RealtimeWellbore from './utils/wellbores/RealtimeWellbore';

export default class WellboreModule extends ModuleInterface {
  config: Config;
  groups: { [key: string]: Group } = {};
  roots: RootData[] = []; // Array with roots for iteration

  asyncLoop: AsyncLoop = new AsyncLoop();
  lineDict: LineDictionary<WellboreData>;
  pointDict: PointDictionary<RootData>;
  highlight: Highlight = new Highlight();

  currentZoom: number = 20;

  private _deferredSelector: (data: SourceData) => boolean;
  private _projector: Projector;
  private _eventHandler: EventHandler;

  containers: {
    wellbores: PIXI.Container,
    roots: PIXI.Container,
    labels: PIXI.Container,
  };

  /** Zoom event handler. */
  scaling: (zoom: number) => number;
  marker : PIXI.Graphics;

  constructor(inputConfig?: InputConfig) {
    super();
    const [ config, extra ] = getDefaultConfig(inputConfig);
    this.config = config;

    this.scaling = extra.scaling;

    this.lineDict = new LineDictionary<WellboreData>(config.gridSize, value => value.active);
    this.pointDict = new PointDictionary<RootData>(0.25, config.gridSize * 10, this.getRootRadius(20), value => value.active);

    // add a default group, with default settings
    // TODO: expand InputConfig to allow passing GroupOptions for default group.
    this.registerGroup('default');

    const createContainer = () => {
      const container = new PIXI.Container();
      container.sortableChildren = true;
      this.root.addChild(container);
      return container;
    }

    this.containers = {
      wellbores: createContainer(),
      roots: createContainer(),
      labels: createContainer(),
    };

    /** Prepare drawing of labels. */
    Label.setStyle(extra.fontSize); // Set label style
    Label.setCommon({ // Set common config
      backgroundOpacity: extra.labelBgOpacity
    });

    this._eventHandler = inputConfig && inputConfig.customEventHandler || new DefaultEventHandler();

    // Set resize variables of root shader
    RootShader.setResize(config.rootResize);
    RootShader.buildShader();
  }

  registerGroup(key: string, options?: GroupOptions) : void {
    if (this.groups[key]) throw Error(`Group [${key}] already registered!`);
    this.groups[key] = new Group(key, options);
  }

  private addRoot(position: Vector2) : RootData {
    const overlapping = this.pointDict.getOverlapping(position);

    if (overlapping) return overlapping.val;

    const wellboreRoot = new RootData(position, this.config.rootRadius);
    this.containers.roots.addChild(wellboreRoot.mesh);
    this.pointDict.add(position, wellboreRoot);
    this.roots.push(wellboreRoot); // Add root

    return wellboreRoot;
  }

  /**
   * Add a single wellbore
   * @param key data group to add wellbore into
   * @param data wellbore data
   */
  addWellbore(data: SourceData, group: Group = this.groups.default) : void {
    if (data.path.length === 0) throw Error('Empty wellbore path!');

    // Place root for wellbore
    const projectedPath = this.projector.batchVector2(data.path);
    const root = this.addRoot(projectedPath[0]);

    const wellbore = new WellboreData({
      data: data,
      group,
      root,
      coords: projectedPath,
      pointThreshold: this.config.rootRadius * 1.5,
      wellboreWidth: this.config.wellboreWidth,
    });
    if (wellbore.mesh) this.containers.wellbores.addChild(wellbore.mesh);
    this.containers.labels.addChild(wellbore.label.text);
    this.containers.labels.addChild(wellbore.label.background);
    group.append(wellbore);

    // Add to line dictionary
    if(!wellbore.interpolator.singlePoint) this.lineDict.add(projectedPath, wellbore);

    // Append wellbore to root
    root.append(wellbore);

    if (this._deferredSelector && this._deferredSelector(wellbore.data)) {
      this._deferredSelector = undefined;
      wellbore.setSelected(true);
    }
  }

  set(wells: SourceData[], key: string = 'default') : Promise<void> {
    return new Promise((resolve, reject) => {
      const group = this.groups[key];
      if (!group) {
        reject(Error(`Group [${key}] not registered!`));
        return;
      }
      try {
        if (this.groups[key].wellbores.length > 0) this.clear(key);

        this.asyncLoop.Start(key, {
          iterations: wells.length,
          batchSize: 20,
          func: i => this.addWellbore(wells[i], group),
          postFunc: () => this.pixiOverlay.redraw(),
          endFunc: () => {
            this.pixiOverlay.redraw();
            resolve();
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  private forEachGroup(keys: string[], func: (group: Group, key: string) => void): void {
    const registeredKeys = Object.keys(this.groups);
    keys = (keys.length == 0) ? registeredKeys : keys.filter(key => registeredKeys.includes(key));
    keys.forEach(key => func(this.groups[key], key));
    this.pixiOverlay.redraw();
  }

  private setActive(active: boolean, keys: string[]) : void {
    this.forEachGroup(keys, group => group.setActive(active));
  }

  /**
   * Highlight appropriate wellbore(s) at given coordinates.
   * @param lat Target latitude
   * @param long Target longitude
   * @returns True if there is someting to highlight
   */
  private handleMouseMove(event: MouseEvent): boolean {
    const map = this.pixiOverlay.utils.getMap();
    const latLng = map.mouseEventToLatLng(event);

    const worldspaceCoord = this.projector.getVector2(latLng);

    updateHighlighted(
      this,
      worldspaceCoord,
      this.config.onHighlightOn,
      this.config.onHighlightOff,
      event,
    );

    return this.highlight.active;
  }

  private handleMouseOut() : boolean {
    return this.clearHighlight(this.config.onHighlightOff);
  }

  private handleMouseClick() : boolean {
    if (this.config.onWellboreClick && this.highlight.active && this.highlight.single) {
      const wellbore = this.highlight.first;
      this.config.onWellboreClick({
        group: wellbore.group.key,
        data: wellbore.data,
      });
      return true;
    }
    return false;
  }

  public enable(...keys: string[]): void  { this.setActive(true, keys)  }

  public disable(...keys: string[]): void { this.setActive(false, keys) }

  /**
   * Enable/disable labels
   * @param visible
   */
  setLabelVisibility(visible: boolean) {
    Label.state.visible = visible;
    this.roots.forEach(root => root.setLabelVisibility(visible));
    this.pixiOverlay.redraw();
  }

  setCompletionVisibility(visible: boolean, ...keys: string[]) {
    this.forEachGroup(keys, group => group.setCompletionVisibility(visible));
  }

  /** "Soft" filtering function. Will turn wellbores that does not pass filter gray-ish. */
  softFilter(filterFunction : (v: SourceData) => boolean, ...keys: string[]): void {
    this.forEachGroup(keys, group => group.softFilter(filterFunction));
  }

  /** "Hard" filtering function. Will turn wellbores that does not pass filter into "ghost" lines. */
  hardFilter(filterFunction : (v: SourceData) => boolean, ...keys: string[]): void {
    this.forEachGroup(keys, group => group.hardFilter(filterFunction));
  }

  clearFilter(...keys: string[]) : void {
    this.forEachGroup(keys, group => group.clearFilter());
  }

  setSelected(selectFunction : (v: any) => boolean, ...keys: string[]) : void {
    let nSelected = 0;
    this.forEachGroup(keys, group => {
      if (!group) return;
      group.wellbores.forEach(wellbore => {
        if (selectFunction(wellbore.data)) {
          wellbore.setSelected(true);
          nSelected++;
        } else {
          if (wellbore.selected) {
            wellbore.setSelected(false);
          }
        }
      });
    });

    if (nSelected === 0) {
      this._deferredSelector = selectFunction;
    }
  }

  clearSelected(...keys: string[]) : void {
    this.forEachGroup(keys, group => {
      if (!group) return;
      group.wellbores.forEach(wellbore => {
        if (wellbore.selected) {
          wellbore.setSelected(false);
        }
      });
    });
  }

  /**
   * Set highlight of wellbore module. Does not override mousemove events.
   * @param name Name of wellbore to highlight
   * @param keys Keys of groups to search. Can improve performance.
   * @returns Screen coordinates (in pixels) of highlighted wellbore's root
   */
  setHighlight(label: string, ...keys: string[]): RealtimeWellbore {
    const registeredKeys = Object.keys(this.groups);
    keys = (keys.length == 0) ? registeredKeys : keys.filter(key => registeredKeys.includes(key));

    // Similar behavior as forEachGroup, but without forEach loops. This is to allow return mid-loop.
    for (let n = 0; n < keys.length; n++) {
      const group = this.groups[keys[n]];

      if (!group) continue;
      const wellbores = group.wellbores;
      for (let i = 0; i < wellbores.length; i++) {
        const wellbore = wellbores[i];
        if (wellbore.data.label === label) {
          forceHighlight(this, wellbore);

          // Create and return a new instance of a realtime wellbore
          return new RealtimeWellbore(this.pixiOverlay, wellbore);
        }
      }
    }

    return null;
  }

  clearHighlight(onHighlightOff?: () => void): boolean {
    if (this.highlight.active) {
      clearHighlight(this, onHighlightOff);
      return true;
    }
    return false;
  }

  clearAll() {
    this.highlight.clear();

    this.asyncLoop.StopAll();
    this.lineDict.clear();
    this.pointDict.clear();

    Object.values(this.groups).forEach(g => {
      g.wellbores = [];
    });
    this.roots = [];

    // remove PIXI elements
    this.containers.wellbores.removeChildren();
    this.containers.labels.removeChildren();
    this.containers.roots.removeChildren();
    this.pixiOverlay.redraw();
  }

  /**
   * Clear all data or data mapped to the groups specified by keys
   * @param keys Optional list of keys for which groups to clear
   */
  clear(...keys: string[]) : void {
    // clear all?
    if (keys.length === 0) {
      return this.clearAll();
    }
    this.highlight.clear();

    const roots = new Set<RootData>(); // distinct set of roots that need to be cleaned
    this.forEachGroup(keys, (group, key) => {
      this.asyncLoop.Stop(key);
      this.lineDict.clear(d => group.wellbores.includes(d));
      // clean group
      group.wellbores.forEach(w => {
        roots.add(w.root);
        const wellboreIdx = w.root.wellbores.indexOf(w);
        if (wellboreIdx !== -1) {
          w.root.wellbores.splice(wellboreIdx, 1);
        }

        // remove PIXI elements
        this.containers.wellbores.removeChild(w.mesh);
        this.containers.labels.removeChild(w.label.text);
        this.containers.labels.removeChild(w.label.background);
      });
      group.wellbores = [];
    });

    // update roots
    roots.forEach(root => {
      // If still wellbores on root
      if (root.wellbores.length > 0) {
        root.recalculate(true);
        return;
      }
      // remove rootdata and its mesh
      const rootIdx = this.roots.indexOf(root);
      if (rootIdx !== -1) {
        this.roots.splice(rootIdx, 1);
      }
      this.pointDict.clear(d => d === root);
      this.containers.roots.removeChild(root.mesh);
    });

    this.pixiOverlay.redraw();
  }

  resize (zoom: number) {
    // @ts-ignore
    this.pixiOverlay._renderer.globalUniforms.uniforms.zoom = zoom;
    this.currentZoom = zoom;

    if (!this.scaling) return; // Return if no scaling function
    let scale = this.scaling(zoom - this.config.zoomOrigin);
    if (!Number.isFinite(scale)) scale = 1;
    Label.state.zoom = zoom; // Update label zoom
    Label.state.scale = scale; // Update label scale

    const labelVisible = zoom > 10;
    this.containers.labels.visible = labelVisible; // set label visibility

    // Only update labels on resize if labels and container is visible
    if (labelVisible && Label.state.visible) this.roots.forEach(root => root.updateLabels());
  }

  onAdd(map: import("leaflet").Map): void {
    const element = this.pixiOverlay.utils.getRenderer().view.parentNode;
    const callbacks = {
      mousemove: this.handleMouseMove.bind(this),
      mouseout: this.handleMouseOut.bind(this),
      click: this.handleMouseClick.bind(this),
    };

    this._eventHandler.register(map, element, callbacks);
  }

  onRemove(map: import("leaflet").Map): void {
    this._eventHandler.unregister();
  }

  get projector() {
    if (!this._projector) this._projector = new Projector(this.pixiOverlay.utils.latLngToLayerPoint);
    return this._projector;
  }

  /**
   * Calculate root radius based on formula used in Shader.ts!
   * @param zoom Reference zoom level
   */
  getRootRadius(zoom: number = this.currentZoom) {
    const { base, multiplier, zoomReference } = this.config.rootResize;
    return this.config.rootRadius + multiplier * (base ** -(zoom - zoomReference));
  }
}
