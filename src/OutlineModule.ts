import * as PIXI from 'pixi.js';
import { ModuleInterface } from './ModuleInterface';
import Mesh from './utils/Mesh';
import Vector2 from '@equinor/videx-vector2';
import { inverseLerp, lerp } from '@equinor/videx-math'
import log from './utils/Log';

export interface OutlineData {
  coordinates: [number, number][][];
  meta: {
    defaultOn: boolean;
    fill: string;
    name: string;
    stroke: [number, number, number];
    type: string;
  }
}

interface Uniforms {
  color: [number, number, number];
  /** Additional width of outline */
  width: number;
  visible: boolean;
}

/** Interface for outline config. */
interface InputConfig {
  /** Base with without any scaling. (Default: 0.1) */
  baseWidth?: number;
  /* Reference value for min zoom. (Default: 0) */
  minZoom?: number;
  /* Reference value for max zoom. (Default: 18) */
  maxZoom?: number;
  /** Extra width of line at max zoom. (Default: 0.1) */
  minExtraWidth?: number;
  /** Extra width of line at min zoom. (Default: 10.0) */
  maxExtraWidth?: number;
}

/** Interface for outline config. */
interface Config {
  /** Base with without any scaling. (Default: 0.1) */
  baseWidth: number;
  /** Reference value for min zoom. (Default: 0) */
  minZoom: number;
  /** Reference value for max zoom. (Default: 18) */
  maxZoom: number;
  /** Extra width of line at max zoom. (Default: 0.0) */
  minExtraWidth: number;
  /** Extra width of line at min zoom. (Default: 0.3) */
  maxExtraWidth: number;
}

/** Current width of outline. */
interface State {
  extraWidth: number;
}

/** Module for displaying outlines. */
export default class OutlineModule extends ModuleInterface {

  /** Mapping outline collection name with corresponding uniforms. */
  outlineDict: {[key: string]: Uniforms} = {};

  /** Graphic elements currently existing in world space. */
  spawned: PIXI.Mesh[] = [];

  /** Vertex shader for the outlines. */
  static vertexShader: string;

  /** Fragment shader for the outlines. */
  static fragmentShader: string;

  /** Default config. */
  config: Config = {
    baseWidth: 0.1,
    minZoom: 0,
    maxZoom: 18,
    minExtraWidth: 0.1,
    maxExtraWidth: 10.0,
  }

  state: State = {
    extraWidth: 1,
  }

  scaling: (zoom: number) => number;

  constructor(config?: InputConfig) {
    super();

    // Don't continue without config
    if (!config) return;

    if (!isNaN(config.minZoom)) this.config.minZoom = config.minZoom;
    if (!isNaN(config.maxZoom)) this.config.maxZoom = config.maxZoom;

    if (!isNaN(config.minExtraWidth)) this.config.minExtraWidth = config.minExtraWidth;
    if (!isNaN(config.maxExtraWidth)) this.config.maxExtraWidth = config.maxExtraWidth;
  }

  /**
   * Set collection of outlines to display. Clears previous content on execution.
   * @param data Outlines to draw
   */
  set(data: OutlineData[]): void {
    // Get projection function
    const project = this.pixiOverlay.utils.latLngToLayerPoint;

    // Clear graphics before drawing new
    this.clear();

    data.forEach(outlineCollection => {
      // Define uniform for outline collection
      const uniforms: Uniforms = {
        color: outlineCollection.meta.stroke,
        width: this.state.extraWidth,
        visible: true,
      }

      // Register layer
      this.outlineDict[outlineCollection.meta.name] = uniforms;

      const coordinates: [number, number][][] = outlineCollection.coordinates;
      for (let n = 0; n < coordinates.length; n++) {
        const polygon = coordinates[n];

        const projected: [number, number][] = [];
        for (let i = 0; i < polygon.length; i++) {
          const p = polygon[i];
          const pos = project(p);
          projected.push([pos.x, pos.y]);
        }

        let outlineData;
        if (Vector2.equals(projected[0], projected[projected.length - 1], 0.000001)) {
          projected.pop(); // Remove overlap
          if (projected.length <= 2) { // * Avoid insufficient points
            log(`Skipping outline (Polygon) with ${projected.length} points.`);
            continue;
          }
          outlineData = Mesh.PolygonOutline(projected, this.config.baseWidth);
        } else {
          if (projected.length <= 1) { // * Avoid insufficient points
            log(`Skipping outline (Line) with ${projected.length} points.`);
            continue;
          }
          outlineData = Mesh.SimpleLine(projected, this.config.baseWidth);
        }

        const outline = Mesh.from(outlineData.vertices, outlineData.triangles, OutlineModule.vertexShader, OutlineModule.fragmentShader, uniforms, outlineData.normals);
        this.root.addChild(outline);

        this.spawned.push(outline);
      }
    });
  }

  /**
   * Set visibility for outline layers.
   * @param names Names of collections to modify
   *
   * @example
   * setVisibleLayers(['OWC', 'GOC']);
   */
  setVisibleLayers(names: string[]): void {
    // Disable all layers
    Object.keys(this.outlineDict).forEach(key => this.outlineDict[key].visible = false);

    // Enable selected
    names.forEach(name => {
      const uniforms: Uniforms = this.outlineDict[name];
      if (!uniforms) return;
      uniforms.visible = true;
    });
  }

  /** Clear all spawned graphic elements and return to pool. */
  clear(): void {
    while (this.spawned.length > 0) {
      const temp: PIXI.Mesh = this.spawned.pop();
      this.root.removeChild(temp);
      temp.destroy();
    }
    this.outlineDict = {};
  }

  resize (zoom: number) {
    const t = inverseLerp(this.config.minZoom, this.config.maxZoom, zoom);
    const width = lerp(this.config.maxExtraWidth, this.config.minExtraWidth, t);

    this.state.extraWidth = width; // Update width

    Object.keys(this.outlineDict).forEach(key => {
      this.outlineDict[key].width = width
    });
  }
}

OutlineModule.vertexShader = `
  attribute vec2 inputVerts;
  attribute vec2 inputNormals;

  uniform mat3 translationMatrix;
  uniform mat3 projectionMatrix;

  uniform float width;

  void main() {
    vec2 pos = inputVerts + inputNormals * width;
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(pos, 1.0)).xy, 0.0, 1.0);
  }
`;

OutlineModule.fragmentShader = `
  precision mediump float;

  uniform vec3 color;
  uniform bool visible;

  void main() {
    if (!visible) discard;
    gl_FragColor = vec4(color, 1.0);
  }
`;
