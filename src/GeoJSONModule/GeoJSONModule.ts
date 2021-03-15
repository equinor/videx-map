import * as PIXI from 'pixi.js';
import Vector2 from '@equinor/videx-vector2';
import { ModuleInterface } from '../ModuleInterface';
import { EventHandler, DefaultEventHandler } from '../EventHandler';
import {
  GeoJSONMultiPolygon,
  GeoJSONPolygon,
  GeoJSONLineString,
  GeoJSONPoint,
  FeatureProps,
} from '.';

type vec3 = [number, number, number];

/** Interface for config. */
interface Config {
  customEventHandler?: EventHandler;
  onFeatureHover?: (event: MouseEvent, data: any) => void;
}

/** Module for displaying fields. */
export default class GeoJSONModule extends ModuleInterface {

  onFeatureHover: (event: MouseEvent, data: any) => void;
  points: GeoJSONPoint;
  linestrings: GeoJSONLineString;
  polygons: GeoJSONPolygon;
  multipolygons: GeoJSONMultiPolygon;
  _eventHandler: EventHandler;
  mapmoving: boolean;

  constructor(config?: Config) {
    super();
    this.mapmoving = false;
    this._eventHandler = config?.customEventHandler || new DefaultEventHandler();
    this.onFeatureHover = config?.onFeatureHover;
  }

  set(data: GeoJSON.FeatureCollection, props?: (feature: any) => FeatureProps) {
    data.features.forEach(feature => {
      if(feature.geometry.type === 'Point') {
        if (this.points === undefined) this.points = new GeoJSONPoint(this.root, this.pixiOverlay);
        this.points.add(feature, props);
      } else if (feature.geometry.type === 'LineString') {
        if (this.linestrings === undefined) this.linestrings = new GeoJSONLineString(this.root, this.pixiOverlay);
        this.linestrings.add(feature, props);
      } else if (feature.geometry.type === 'Polygon') {
        if (this.polygons === undefined) this.polygons = new GeoJSONPolygon(this.root, this.pixiOverlay);
        this.polygons.add(feature, props);
      } else if (feature.geometry.type === 'MultiPolygon') {
        if (this.multipolygons === undefined) this.multipolygons = new GeoJSONMultiPolygon(this.root, this.pixiOverlay);
        this.multipolygons.add(feature, props);
      }

    });
    if (this.polygons) this.polygons.drawLabels();
    if (this.multipolygons) this.multipolygons.drawLabels();
  }

    /**
   * Check for features at the given coordinates.
   * Will give a list of feature data if any are hit or an empty list if not.
   * @param pos Target position in lat-long
   * @returns List of features at the given position
   */
  testPosition(pos: Vector2) : any {
    let result = [];
    if (this.polygons) result.push(this.polygons.testPosition(pos));
    if (this.multipolygons) result.push(this.multipolygons.testPosition(pos));
    if (this.linestrings) result.push(this.linestrings.testPosition(pos));
    if (this.points) result.push(this.points.testPosition(pos));
    result = result.filter(v => v);
    return result;
  }

  onAdd(map: import("leaflet").Map): void {
    const element = this.pixiOverlay.utils.getRenderer().view.parentNode;
    const callbacks = {
      mousemove: this.handleMouseMove.bind(this),
      mouseout: this.handleMouseOut.bind(this),
      click: this.handleMouseClick.bind(this),
      mousedown: this.handleMouseDown.bind(this),
      mouseup: this.handleMouseUp.bind(this),
    };
    this._eventHandler.register(map, element, callbacks);
  }

  onRemove(map: import("leaflet").Map): void {
    this._eventHandler.unregister();
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
