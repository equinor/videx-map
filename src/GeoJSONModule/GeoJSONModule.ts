/* eslint-disable curly */
import { Container } from 'pixi.js';
import * as L from 'leaflet';
import Vector2 from '@equinor/videx-vector2';

import { ModuleInterface } from '../ModuleInterface';
import { EventHandler, DefaultEventHandler } from '../EventHandler';
import { default as GeoJSONMultiPolygon } from './multipolygon';
import { default as GeoJSONPolygon } from './polygon';
import { default as GeoJSONLineString } from './linestring';
import { default as GeoJSONPoint } from './point';
import { ResizeConfig, LabelResizeConfig } from '../ResizeConfigInterface';
import { FeatureProps } from './interfaces';

/** Interface for config. */
interface Config {
  customEventHandler?: EventHandler;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  onFeatureHover?: (event: MouseEvent, data: any) => void;
  outlineResize?: ResizeConfig;
  labelResize?: LabelResizeConfig;
}

/** Module for displaying fields. */
export default class GeoJSONModule extends ModuleInterface {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  onFeatureHover: (event: MouseEvent, data: any) => void;
  points: GeoJSONPoint;
  linestrings: GeoJSONLineString;
  polygons: GeoJSONPolygon;
  multipolygons: GeoJSONMultiPolygon;
  _eventHandler: EventHandler;
  mapmoving: boolean;
  labelRoot: Container
  config?: Config;

  constructor(config?: Config) {
    super();
    this.mapmoving = false;
    this._eventHandler = config?.customEventHandler || new DefaultEventHandler();
    this.onFeatureHover = config?.onFeatureHover;
    this.config = config;
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  set(data: GeoJSON.FeatureCollection, props?: (feature: any) => FeatureProps) {
    this.labelRoot = new Container();
    data.features.forEach(feature => {
      if(feature.geometry.type === 'Point') {
        if (this.points === undefined) this.points = new GeoJSONPoint(this.root, this.pixiOverlay);
        this.points.add(feature, props);
      } else if (feature.geometry.type === 'LineString') {
        if (this.linestrings === undefined) this.linestrings = new GeoJSONLineString(this.root, this.pixiOverlay, this.config);
        this.linestrings.add(feature, props);
      } else if (feature.geometry.type === 'Polygon') {
        if (this.polygons === undefined) this.polygons = new GeoJSONPolygon(this.root, this.labelRoot, this.pixiOverlay, this.config);
        this.polygons.add(feature, props);
      } else if (feature.geometry.type === 'MultiPolygon') {
        if (this.multipolygons === undefined) this.multipolygons = new GeoJSONMultiPolygon(this.root, this.labelRoot, this.pixiOverlay, this.config);
        this.multipolygons.add(feature, props);
      }

    });
    this.root.addChild(this.labelRoot);
    if (this.polygons) this.polygons.drawLabels();
    if (this.multipolygons) this.multipolygons.drawLabels();
  }

    /**
   * Check for features at the given coordinates.
   * Will give a list of feature data if any are hit or an empty list if not.
   * @param pos Target position in lat-long
   * @returns List of features at the given position
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  testPosition(pos: Vector2) : any {
    let result = [];
    if (this.polygons) result.push(this.polygons.testPosition(pos));
    if (this.multipolygons) result.push(this.multipolygons.testPosition(pos));
    if (this.linestrings) result.push(this.linestrings.testPosition(pos));
    if (this.points) result.push(this.points.testPosition(pos));
    result = result.filter(v => v);
    return result;
  }

  onAdd(map: L.Map): void {
    const element = this.pixiOverlay.utils.getRenderer().canvas.parentNode;
    const callbacks = {
      mousemove: this.handleMouseMove.bind(this),
      mouseout: this.handleMouseOut.bind(this),
      click: this.handleMouseClick.bind(this),
      mousedown: this.handleMouseDown.bind(this),
      mouseup: this.handleMouseUp.bind(this),
    };

    this._eventHandler.register(map, element, callbacks);
  }

  onRemove(_map: L.Map): void {
    this._eventHandler?.unregister();
  }

  resize(zoom: number) {
    if (this.points) this.points.resize(zoom);
    if (this.linestrings) this.linestrings.resize(zoom);
    if (this.polygons) this.polygons.resize(zoom);
    if (this.multipolygons) this.multipolygons.resize(zoom);
  }

  private handleMouseMove(event: MouseEvent): boolean {
    if(this.mapmoving) return false;
    const map = this.pixiOverlay.utils.getMap();
    const latLng = map.mouseEventToLatLng(event);
    const layerCoords = new Vector2([latLng.lng, latLng.lat]);
    const hits = this.testPosition(layerCoords);
    if(this.onFeatureHover) this.onFeatureHover(event, hits);
    return true;
  }

  private handleMouseOut(event: MouseEvent) : boolean {
    if(this.onFeatureHover) this.onFeatureHover(event, []);
    return true;
  }

  private handleMouseClick() : boolean {
    return true;
  }

  private handleMouseDown() : boolean {
    this.mapmoving = true;
    return true;
  }

  private handleMouseUp() : boolean {
    this.mapmoving = false;
    return true;
  }
}
