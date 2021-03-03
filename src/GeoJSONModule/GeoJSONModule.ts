import * as PIXI from 'pixi.js';
import { ModuleInterface } from '../ModuleInterface';
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
}

/** Module for displaying fields. */
export default class GeoJSONModule extends ModuleInterface {

  /** Settings for how to render fields. */
  config: Config = {
  };

  points: GeoJSONPoint;
  linestrings: GeoJSONLineString;
  polygons: GeoJSONPolygon;
  multipolygons: GeoJSONMultiPolygon;


  constructor(config?: Config) {
    super();

    // Don't continue without config
    if (!config) return;
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
}
