import * as PIXI from 'pixi.js';
import { ModuleInterface } from './ModuleInterface';
import Vector2 from '@equinor/videx-vector2';
import log from './utils/Log';

/** Data format on incoming faultlines */
interface FaultlineData {
  coordinates: [number, number][];
  geometry: string;
  modelGuid: string;
  omniaUpdateDate: string;
  segID: number;
  source: string;
  sourceCreateDate: string;
  sourceFileName: string;
  sourceUpdateDate: string;
}

/** Interface for faultline config. */
interface InputConfig {
  /** Color of faultline on format 0xRRGGBB. (Default: 0x727D88) */
  color?: number;
  /** Alpha of faultlines. (Default: 1.0) */
  alpha?: number;
  /** Width of outline. (Default: 0.125) */
  outlineWidth?: number;
}

interface Config {
  /** Color of faultline on format 0xRRGGBB. (Default: 0x727D88) */
  color: number;
  /** Alpha of faultlines. (Default: 1.0) */
  alpha: number;
  /** Width of outline. (Default: 0.125) */
  outlineWidth: number;
}

/** Module for displaying faultlines. */
export default class FaultlineModule extends ModuleInterface {

  /** Graphic elements currently existing in world space. */
  spawned: PIXI.Graphics[] = [];

  /** Pool of initialized graphic elements. */
  pool: PIXI.Graphics[] = [];

  /** Default config. */
  config: Config = {
    color: 0x727D88,
    alpha: 1.0,
    outlineWidth: 0.125,
  }

  constructor(config?: InputConfig) {
    super();

    // Don't continue without config
    if (!config) return;

    if (!isNaN(config.color)) this.config.color = config.color;
    if (!isNaN(config.alpha)) this.config.alpha = config.alpha;
    if (!isNaN(config.outlineWidth)) this.config.outlineWidth = config.outlineWidth;
  }

  destroy(){
    super.destroy();
    this.pool.forEach(g => g.destroy({ children: true, texture: true, baseTexture: true }));
    this.pool = null;
    this.spawned = null;
  }

  /**
   * Set collection of faultlines to display. Clears previous content on execution.
   * @param data Faultlines to draw
   */
  set(data: FaultlineData[]) {
    // Clear graphics before drawing new
    this.clear();

    // Get projection function
    const project = this.pixiOverlay.utils.latLngToLayerPoint;
    let lineCount = 0;
    data.forEach(d => {
      // Pull graphics from pool if available
      let faultline;
      if (this.pool.length > 0) {
        faultline = this.pool.pop();
      } else {
        faultline = new PIXI.Graphics();
      }
      this.root.addChild(faultline);
      this.spawned.push(faultline);

      // Set alpha
      faultline.alpha = this.config.alpha;

      const projected = d.coordinates.map(p => {
        const coord = project(p);
        return new PIXI.Point(coord.x, coord.y);
      });

      // Draw line
      const first: PIXI.Point = projected[0];
      const last: PIXI.Point = projected[projected.length - 1];
      if (!Vector2.equals([first.x, first.y], [last.x, last.y], 0.000001)) { // If no loop
        lineCount++; // Count lines appearing in data
        faultline.lineStyle(this.config.outlineWidth, this.config.color).moveTo(first.x, first.y);
        for (let i = 1; i < projected.length; i++) faultline.lineTo(projected[i].x, projected[i].y);
        return;
      }

      // Draw polygon
      faultline.beginFill(this.config.color);
      faultline.lineStyle(this.config.outlineWidth, this.config.color);
      faultline.drawPolygon(projected);
      faultline.endFill();
    });

    if (lineCount > 0) {
      log(`Drawing ${lineCount} faultline polygons as lines.`);
    }
  }

  /** Clear all spawned graphic elements and return to pool. */
  clear() {
    while (this.spawned.length > 0) {
      const temp: PIXI.Graphics = this.spawned.pop();
      this.root.removeChild(temp);
      temp.clear(); // Clear
      this.pool.push(temp); // Add to pool
    }
  }

  resize (zoom: number) {

  }
}
