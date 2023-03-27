/* eslint-disable no-magic-numbers, curly */
import * as PIXI from 'pixi.js';
import { color } from 'd3-color';
import Vector2 from '@equinor/videx-vector2';

import { pixiOverlayBase } from '../pixiOverlayInterfaces';
import PointDictionary from '../utils/PointDictionary';
import { FeatureProps } from '.';

/** Module for displaying fields. */
export default class GeoJSONPoint {

  /** Graphic elements currently existing in world space. */
  spawned: PIXI.Graphics[] = [];

  /** Pool of initialized graphic elements. */
  pool: PIXI.Graphics[] = [];

  container: PIXI.Container;
  pixiOverlay: pixiOverlayBase;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  dict: PointDictionary<any> = new PointDictionary<number>(0.25, 20, 4);

  textStyle: PIXI.TextStyle;

  constructor(root: PIXI.Container, pixiOverlay: pixiOverlayBase) {

    this.container = new PIXI.Container();
    this.container.sortableChildren = true;
    root.addChild(this.container);

    this.pixiOverlay = pixiOverlay;
  }

  add(feature: GeoJSON.Feature, props: (feature: object) => FeatureProps) {

    const geom = feature.geometry as GeoJSON.Point;
    const properties: FeatureProps = props(feature);

    const coordinates = geom.coordinates as [number, number];
    if(coordinates?.length > 0) {
      const projected = this.projectPoint(coordinates);

      this.dict.add(projected, feature.properties);
      let point;
      if (this.pool.length > 0) {
        point = this.pool.pop();
      } else {
        point = new PIXI.Graphics();
        this.container.addChild(point);
      }
      const fillColor = properties.style.fillColor ? new PIXI.Color(color(properties.style.fillColor).formatHex()).toNumber() : 0x0;
      const lineColor = properties.style.lineColor ? new PIXI.Color(color(properties.style.lineColor).formatHex()).toNumber()  : 0x0;
      const opacity = properties.style.fillOpacity || 0;
      const offset = 4;
      point.lineStyle(properties.style.lineWidth, lineColor);
      point.beginFill(fillColor, opacity);
      point.drawRect(projected[0] - offset, projected[1] - offset, offset*2, offset*2);
      point.endFill();
      this.spawned.push(point);
    }
  }

 /**
   * Project a point coordinate.
   * @param point x,y pair
   * @returns Projected point
   */
  projectPoint(point: [number, number]): Vector2 {
    const project = this.pixiOverlay.utils.latLngToLayerPoint;
    const coord = project([point[1], point[0]]);
    return new Vector2(coord.x, coord.y);
  }

  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  resize(_zoom: number) {

  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  testPosition(pos: Vector2) : any {
    return this.dict.getClosestUnder(pos);
  }
}
