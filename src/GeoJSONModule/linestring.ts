/* eslint-disable no-magic-numbers, curly */
import { Container, Geometry, Mesh, Shader, TextStyle } from 'pixi.js';
import { color } from 'd3-color';
import Vector2 from '@equinor/videx-vector2';

import { pixiOverlayBase } from '../pixiOverlayInterfaces';
import LineMesh, { MeshNormalData } from '../utils/LineMesh';
import LineDictionary from '../utils/LineDictionary';
import { FeatureProps, FeatureStyle } from '.';
import { GeoJSONFragmentShaderOutline, GeoJSONVertexShaderOutline } from './shader';
import { getRadius } from '../utils/Radius';
import { ResizeConfig } from '../ResizeConfigInterface';
import { Defaults } from './constants';

type vec3 = [number, number, number];

interface OutlineUniform {
  color: {
    value: vec3,
    type: string,
  };
  width: {
    value: number,
    type: string,
  }
}

export interface FeatureMesh {
  outline: {
    mesh: Mesh<Geometry, Shader>;
    uniform: OutlineUniform;
  };
}

/** Interface for field config. */
interface Config {
  outlineResize?: ResizeConfig;
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

  container: Container;
  pixiOverlay: pixiOverlayBase;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  dict: LineDictionary<any> = new LineDictionary(1.2);
  textStyle: TextStyle;
  currentZoom: number = Defaults.INITIAL_ZOOM;

  constructor(root: Container, pixiOverlay: pixiOverlayBase, config?: Config) {

    this.container = new Container();
    this.container.sortableChildren = true;
    root.addChild(this.container);

    this.pixiOverlay = pixiOverlay;
    this.features = [];
    this.config = config;
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
      const outlineData = LineMesh.SimpleLine(projected, Defaults.DEFAULT_LINE_WIDTH);

      meshes.push(
        this.drawPolygons(this.container, outlineData, properties.style, Defaults.DEFAULT_Z_INDEX),
      );
      this.features.push(...meshes);
    }
  }

  /**
   * Draw each polygon in a polygon collection.
   * @param polygons
   */
  drawPolygons(container: Container, outlineData: MeshNormalData, featureStyle: FeatureStyle, zIndex: number): FeatureMesh {

    const lineColor = color(featureStyle.lineColor).rgb();
    const outlineUniform: OutlineUniform = {
      color:{
        value: [lineColor.r, lineColor.g, lineColor.b],
        type: 'vec3<f32>',
      },
      width: {
        value: featureStyle.lineWidth,
        type: 'f32',
      },
    }

    const polygonOutlineMesh = LineMesh.from(outlineData.vertices,
      outlineData.triangles,
      GeoJSONVertexShaderOutline,
      GeoJSONFragmentShaderOutline,
      outlineUniform,
      outlineData.normals);
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
    if (!this.config.outlineResize) return;
    const outlineRadius = this.getOutlineRadius(zoom);

    /**
     * This is not the best way to update, ideally we would use global uniforms
     * @example this.pixiOverlay._renderer.globalUniforms.uniforms.outlineWidth = outlineRadius;
     * instead of iterating over every mesh and manually updating each of the selected
     */
    this.container.children.map((child: Container ) => {
      /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
      // @ts-ignore
      if (child.shader.resources.uniforms.uniforms.outlineWidth) {
        /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
        // @ts-ignore
        child.shader.resources.uniforms.uniforms.outlineWidth = outlineRadius;
      }
    });
    this.currentZoom = zoom;
  }

  testPosition(pos: Vector2) : number {
    return this.dict.getClosest(pos);
  }

  getOutlineRadius(zoom: number = this.currentZoom) {
    return getRadius(zoom, this.config.outlineResize);
  }
}
