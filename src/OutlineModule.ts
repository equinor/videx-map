/* eslint-disable no-magic-numbers, curly */
import { Geometry, Shader, Mesh } from 'pixi.js';
import Vector2 from '@equinor/videx-vector2';
import { inverseLerp, lerp } from '@equinor/videx-math'

import { ModuleInterface } from './ModuleInterface';
import LineMesh from './utils/LineMesh';
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
  spawned: Mesh<Geometry, Shader>[] = [];

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
          outlineData = LineMesh.PolygonOutline(projected, this.config.baseWidth);
        } else {
          if (projected.length <= 1) { // * Avoid insufficient points
            log(`Skipping outline (Line) with ${projected.length} points.`);
            continue;
          }
          outlineData = LineMesh.SimpleLine(projected, this.config.baseWidth);
        }

        const outline = LineMesh.from(outlineData.vertices,
          outlineData.triangles,
          OutlineModule.vertexShader,
          OutlineModule.fragmentShader,
          {
            color: {
              value: uniforms.color,
              type: 'vec3<f32>',
            },
            visible: {
              value: uniforms.visible,
              type: 'i32',
            },
            width: {
              value: uniforms.width,
              type: 'f32',
            },
          },
          outlineData.normals);
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
      const temp: Mesh<Geometry, Shader> = this.spawned.pop();
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
  in vec2 inputVerts;
  in vec2 inputNormals;

  uniform mat3 uWorldTransformMatrix;
  uniform mat3 uProjectionMatrix;

  uniform float width;

  void main() {
    vec2 pos = inputVerts + inputNormals * width;
    gl_Position = vec4((uProjectionMatrix * uWorldTransformMatrix * vec3(pos, 1.0)).xy, 0.0, 1.0);
  }
`;

OutlineModule.fragmentShader = `
  precision mediump float;

  uniform vec3 color;
  uniform int visible;

  void main() {
    if (visible == 0) discard;
    gl_FragColor = vec4(color, 1.0);
  }
`;
