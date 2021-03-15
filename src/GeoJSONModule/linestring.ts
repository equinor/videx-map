import * as PIXI from 'pixi.js';
import { pixiOverlayBase } from '../pixiOverlayInterfaces';
import Mesh, { MeshNormalData } from '../utils/Mesh';
import LineDictionary from '../utils/LineDictionary';
import Vector2 from '@equinor/videx-vector2';
import { color } from 'd3';
import { FeatureProps, FeatureStyle } from '.';
type vec3 = [number, number, number];

interface OutlineUniform {
  color: vec3;
  width: number;
}

export interface FeatureMesh {
  outline: {
    mesh: PIXI.Mesh;
    uniform: OutlineUniform;
  };
}

/** Interface for field config. */
interface Config {
}

/** Module for displaying fields. */
export default class GeoJSONLineString {
  /** Vertex shader for the outlines. */
  static vertexShaderOutline: string;

  /** Fragment shader for the outlines. */
  static fragmentShaderOutline: string;

  /** Collection of features with meshes. */
  features: FeatureMesh[] = [];

  /** Settings for how to render fields. */
  config: Config = {
  };

  container: PIXI.Container;
  pixiOverlay: pixiOverlayBase;
  dict: LineDictionary<any> = new LineDictionary(1.2);
  textStyle: PIXI.TextStyle;

  constructor(root: PIXI.Container, pixiOverlay: pixiOverlayBase, config?: Config) {

    this.container = new PIXI.Container();
    this.container.sortableChildren = true;
    root.addChild(this.container);

    this.pixiOverlay = pixiOverlay;
    this.features = [];
  }

  add(feature: GeoJSON.Feature, props: (feature: object) => FeatureProps) {

    const geom = feature.geometry as GeoJSON.LineString;
    const properties: FeatureProps = props(feature);

    const meshes: FeatureMesh[] = [];
    const coordinates = geom.coordinates as [number, number][];
    if(coordinates?.length > 0) {
      const projected = this.projectPolygons(coordinates);
      projected.pop(); // Remove overlapping

      this.dict.add(projected, feature.properties);
      const outlineData = Mesh.SimpleLine(projected, 0.15);

      meshes.push(
        this.drawPolygons(this.container, outlineData, properties.style, 1000),
      );
      this.features.push(...meshes);
    }
  }

  /**
   * Draw each polygon in a polygon collection.
   * @param polygons
   */
  drawPolygons(container: PIXI.Container, outlineData: MeshNormalData, featureStyle: FeatureStyle, zIndex: number): FeatureMesh {

    const lineColor = color(featureStyle.lineColor).rgb();
    const outlineUniform: OutlineUniform = {
      color: [lineColor.r, lineColor.g, lineColor.b],
      width: featureStyle.lineWidth,
    }

    const polygonOutlineMesh = Mesh.from(outlineData.vertices, outlineData.triangles, GeoJSONLineString.vertexShaderOutline, GeoJSONLineString.fragmentShaderOutline, outlineUniform, outlineData.normals);
    polygonOutlineMesh.zIndex = zIndex;
    container.addChild(polygonOutlineMesh);

    return {
      outline: {
        mesh: polygonOutlineMesh,
        uniform: outlineUniform,
      },
    }
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

  testPosition(pos: Vector2) : any {
    return this.dict.getClosest(pos);
  }
}

GeoJSONLineString.vertexShaderOutline = `
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

GeoJSONLineString.fragmentShaderOutline = `
  precision mediump float;

  uniform vec3 color;

  void main() {
    gl_FragColor = vec4(color / 255., 1.0);
  }
`;
