import * as PIXI from 'pixi.js';
import { pixiOverlayBase } from '../pixiOverlayInterfaces';
import Mesh, { MeshData, MeshNormalData } from '../utils/Mesh';
import centerOfMass from '../utils/centerOfMass';
import GeoJSONLabels from './labels';
import { clamp } from '@equinor/videx-math';
import TriangleDictionary from '../utils/TriangleDictionary';
import Vector2 from '@equinor/videx-vector2';
import { color } from 'd3';
import { FeatureProps, FeatureStyle } from '.';

type vec3 = [number, number, number];

interface FillUniform {
  col1: vec3;
  col2: vec3;
  opacity: number;
  hashed: boolean;
  hashDisp: number;
  hashWidth: number;
}

interface OutlineUniform {
  color: vec3;
  width: number;
}

export interface FeatureMesh {
  fill: {
    mesh: PIXI.Mesh;
    uniform: FillUniform;
  };
  outline: {
    mesh: PIXI.Mesh;
    uniform: OutlineUniform;
  };
}

/** Interface for feature config. */
interface Config {
  /** Initial scale of feature hash (Default: 1.0). */
  initialHash?: number,
  /** Minimum scale of feature hash (Default: 0.0). */
  minHash?: number,
  /** Maximum scale of feature hash (Default: Infinity). */
  maxHash?: number,
}

/** Container for GeoJSON Polygon features. */
export default class GeoJSONPolygon {
  /** Vertex shader for the fill. */
  static vertexShaderFill: string;

  /** Fragment shader for the fill. */
  static fragmentShaderFill: string;

  /** Vertex shader for the outlines. */
  static vertexShaderOutline: string;

  /** Fragment shader for the outlines. */
  static fragmentShaderOutline: string;

  /** Collection of features with meshes. */
  features: FeatureMesh[] = [];

  /** Settings for how to render data. */
  config: Config = {
    initialHash: 1.0,
    minHash: 0.0,
    maxHash: Infinity,
  };

  container: PIXI.Container;
  pixiOverlay: pixiOverlayBase;
  dict: TriangleDictionary<number> = new TriangleDictionary(1.2);
  textStyle: PIXI.TextStyle;
  labels: GeoJSONLabels;

  constructor(root: PIXI.Container, pixiOverlay: pixiOverlayBase, config?: Config) {
    if (config?.initialHash && typeof config.initialHash === 'number') this.config.initialHash = config.initialHash;
    if (config?.minHash && typeof config.minHash === 'number') this.config.minHash = config.minHash;
    if (config?.maxHash && typeof config.maxHash === 'number') this.config.maxHash = config.maxHash;

    this.container = new PIXI.Container();
    this.container.sortableChildren = true;
    root.addChild(this.container);

    this.pixiOverlay = pixiOverlay;
    this.features = [];
    this.config.initialHash = clamp(this.config.initialHash);

    this.textStyle = new PIXI.TextStyle({
      fontFamily : 'Arial',
      fontSize: 64,
      fontWeight: '600',
      fill : 0x454545,
      align : 'center'
    });

    this.labels = new GeoJSONLabels(this.container, this.textStyle, 0.1);

  }

  add(feature: GeoJSON.Feature, props: (feature: object) => FeatureProps) {

    const geom = feature.geometry as GeoJSON.Polygon;
    const properties: FeatureProps = props(feature);
    if (properties.style.labelScale) this.labels.baseScale = properties.style.labelScale;
    const meshes: FeatureMesh[] = [];
    const coordinates = geom.coordinates as [number, number][][];
    if(coordinates?.length > 0) {
      const projected = this.projectPolygons(coordinates[0]);
      projected.pop(); // Remove overlapping

      const meshData = Mesh.Polygon(projected);
      this.dict.add(coordinates[0], meshData.triangles, properties.id);
      const outlineData = Mesh.PolygonOutline(projected, 0.15);
      const [position, mass] = centerOfMass(projected, meshData.triangles);

      meshes.push(
        this.drawPolygons(this.container, meshData, outlineData, properties.style, 0),
      );
      this.labels.addLabel(properties.label, { position, mass });
      this.features.push(...meshes);

      // this.labelManager.draw(container);
    }
  }

  /**
   * Draw each polygon in a polygon collection.
   * @param polygons
   */
  drawPolygons(container: PIXI.Container, meshData: MeshData, outlineData: MeshNormalData, featureStyle: FeatureStyle, zIndex: number): FeatureMesh {

    const fillColor = featureStyle.fillColor ? color(featureStyle.fillColor).rgb() : undefined;
    const fillColor2 = featureStyle.fillColor2 ? color(featureStyle.fillColor2).rgb() : undefined;
    const fillUniform: FillUniform = {
      col1: fillColor ? [fillColor.r, fillColor.g, fillColor.b] : [0, 0, 0],
      col2: fillColor2 ? [fillColor2.r, fillColor2.g, fillColor2.b] : [0, 0, 0],
      opacity: featureStyle.fillOpacity,
      hashed: featureStyle.hashed,
      hashDisp: Math.random() * 10,
      hashWidth: this.config.initialHash,
    };

    const lineColor = color(featureStyle.lineColor).rgb();
    const outlineUniform: OutlineUniform = {
      color: [lineColor.r, lineColor.g, lineColor.b],
      width: featureStyle.lineWidth,
    }

    const polygonMesh = Mesh.from(meshData.vertices, meshData.triangles, GeoJSONPolygon.vertexShaderFill, GeoJSONPolygon.fragmentShaderFill, fillUniform);
    polygonMesh.zIndex = zIndex;

    container.addChild(polygonMesh);

    const polygonOutlineMesh = Mesh.from(outlineData.vertices, outlineData.triangles, GeoJSONPolygon.vertexShaderOutline, GeoJSONPolygon.fragmentShaderOutline, outlineUniform, outlineData.normals);
    polygonOutlineMesh.zIndex = zIndex + 1;
    container.addChild(polygonOutlineMesh);

    return {
      fill: {
        mesh: polygonMesh,
        uniform: fillUniform,
      },
      outline: {
        mesh: polygonOutlineMesh,
        uniform: outlineUniform,
      },
    }
  }

  drawLabels(): void {
    this.labels.draw();
  }

  /**
   * Project a collection of polygons.
   * @param points Points within polygons
   * @returns Projected polygons
   */
  projectPolygons(points: [number, number][]): Vector2[] {
    const project = this.pixiOverlay.utils.latLngToLayerPoint;
    return points.map(c => {
      const coord = project([c[1], c[0]]);
      return new Vector2(coord.x, coord.y);
    });
  }

  resize(zoom: number) {

  }
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// FILL
GeoJSONPolygon.vertexShaderFill = `
  attribute vec2 inputVerts;

  uniform mat3 translationMatrix;
  uniform mat3 projectionMatrix;

  varying vec2 verts;

  void main() {
    verts = inputVerts;
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(inputVerts, 1.0)).xy, 0.0, 1.0);
  }
`;

GeoJSONPolygon.fragmentShaderFill = `
  precision mediump float;

  varying vec2 verts;

  uniform vec3 col1;
  uniform vec3 col2;
  uniform float opacity;

  uniform bool hashed;
  uniform float hashDisp;
  uniform float hashWidth;

  void main() {
    if(hashed && mod(verts.y + hashDisp, hashWidth * 2.0) > hashWidth) {
      gl_FragColor = vec4(col2 / 255., 1.0) * opacity;
    }
    else {
      gl_FragColor = vec4(col1 / 255., 1.0) * opacity;
    }
  }
`;

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// OUTLINE
GeoJSONPolygon.vertexShaderOutline = `
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

GeoJSONPolygon.fragmentShaderOutline = `
  precision mediump float;

  uniform vec3 color;

  void main() {
    gl_FragColor = vec4(color / 255., 1.0);
  }
`;
