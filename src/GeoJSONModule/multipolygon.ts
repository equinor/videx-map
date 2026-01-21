/* eslint-disable no-magic-numbers, curly */
import { Container, Geometry, Mesh, Shader, TextStyle, TextStyleFontWeight, TextStyleAlign } from 'pixi.js';
import { color } from 'd3-color';
import { clamp } from '@equinor/videx-math';
import Vector2 from '@equinor/videx-vector2';

import { pixiOverlayBase } from '../pixiOverlayInterfaces';
import LineMesh, { MeshData, MeshNormalData } from '../utils/LineMesh';
import centerOfMass from '../utils/centerOfMass';
import GeoJSONLabels from './labels';
import TriangleDictionary from '../utils/TriangleDictionary';
import { FeatureProps, FeatureStyle } from '.';
import {
  GeoJSONFragmentShaderFill,
  GeoJSONFragmentShaderOutline,
  GeoJSONVertexShaderFill,
  GeoJSONVertexShaderOutline,
} from './shader';
import { ResizeConfig, LabelResizeConfig } from '../ResizeConfigInterface';
import { getRadius } from '../utils/Radius';
import { Defaults } from './constants';

type vec3 = [number, number, number];

interface FillUniform {
  col1: {
    value: vec3,
    type: string;
  };
  col2: {
    value: vec3,
    type: string;
  };
  opacity: {
    value: number,
    type: string;
  };
  hashed: {
    value: boolean,
    type: string;
  };
  hashDisp: {
    value: number,
    type: string;
  };
  hashWidth: {
    value: number,
    type: string;
  };
}

interface OutlineUniform {
  color: {
    value: vec3,
    type: string;
  };
  outlineWidth: {
    value: number,
    type: string;
  };
}

export interface FeatureMesh {
  fill: {
    mesh: Mesh<Geometry, Shader>;
    uniform: FillUniform;
  };
  outline: {
    mesh: Mesh<Geometry, Shader>;
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
  /**Label font family, default Arial */
  labelFontFamily?: string,
  /**Label font size, default 64 */
  labelFontSize?: number,
  /**Label font weight, default 600 */
  labelFontWeight?: string,
  /**Label fill color, default 0x454545 */
  labelColor?: string | number,
  /**Label alignment, default Center  */
  labelAlign?: string,
  /** Resize configuration for outline. */
  outlineResize?: ResizeConfig;
  /** Resize configuration for labels. */
  labelResize?: LabelResizeConfig;
}

/** Container for GeoJSON Polygon features. */
export default class GeoJSONMultiPolygon {
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
    initialHash: Defaults.INITIAL_HASH,
    minHash: Defaults.DEFAULT_MIN_HASH,
    maxHash: Infinity,
  };

  container: Container;
  pixiOverlay: pixiOverlayBase;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  dict: TriangleDictionary<any> = new TriangleDictionary(1.2);
  textStyle: TextStyle;
  labels: GeoJSONLabels;
  currentZoom: number = Defaults.INITIAL_ZOOM;

  constructor(root: Container, labelRoot: Container, pixiOverlay: pixiOverlayBase, config?: Config) {
    if (config?.initialHash && typeof config.initialHash === 'number') this.config.initialHash = config.initialHash;
    if (config?.minHash && typeof config.minHash === 'number') this.config.minHash = config.minHash;
    if (config?.maxHash && typeof config.maxHash === 'number') this.config.maxHash = config.maxHash;

    this.container = new Container();
    this.container.sortableChildren = true;
    root.addChild(this.container);

    this.pixiOverlay = pixiOverlay;
    this.features = [];
    this.config = config;
    this.config.initialHash = clamp(this.config.initialHash);

    this.textStyle = new TextStyle({
      fontFamily: config?.labelFontFamily || Defaults.DEFAULT_FONT_FAMILY,
      fontSize: config?.labelFontSize || Defaults.DEFAULT_FONT_SIZE,
      fontWeight: (config?.labelFontWeight || Defaults.DEFAULT_FONT_WEIGHT) as TextStyleFontWeight,
      fill: config?.labelColor || Defaults.DEFAULT_LABEL_COLOR,
      align: (config?.labelAlign || Defaults.DEFAULT_LABEL_ALIGN) as TextStyleAlign,
    });

    this.labels = new GeoJSONLabels(labelRoot || this.container, this.textStyle, this.config.labelResize?.baseScale || Defaults.DEFAULT_BASE_SCALE);

  }

  add(feature: GeoJSON.Feature, props: (feature: object) => FeatureProps) {

    const geom = feature.geometry as GeoJSON.MultiPolygon;
    const properties: FeatureProps = props(feature);
    if (properties.style.labelScale) this.labels.baseScale = properties.style.labelScale;
    const meshes: FeatureMesh[] = [];
    const coordinateGroup = geom.coordinates as [number, number][][][];
    if(coordinateGroup?.length > 0) {
      coordinateGroup.forEach(coordinates => {
        const projected = this.projectPolygons(coordinates[0]);
        projected.pop(); // Remove overlapping

        const meshData = LineMesh.Polygon(projected);
        this.dict.add(coordinates[0], meshData.triangles, feature.properties);
        const outlineData = LineMesh.PolygonOutline(projected, Defaults.DEFAULT_LINE_WIDTH);
        const [position, mass] = centerOfMass(projected, meshData.triangles);

        meshes.push(
          this.drawPolygons(this.container, meshData, outlineData, properties.style, Defaults.DEFAULT_Z_INDEX),
        );

        if (properties.label) this.labels.addLabel(properties.label, { position, mass });
      });
      this.features.push(...meshes);

    }
  }

  /**
   * Draw each polygon in a polygon collection.
   * @param polygons
   */
  drawPolygons(container: Container, meshData: MeshData, outlineData: MeshNormalData, featureStyle: FeatureStyle, zIndex: number): FeatureMesh {

    const fillColor = featureStyle.fillColor ? color(featureStyle.fillColor).rgb() : undefined;
    const fillColor2 = featureStyle.fillColor2 ? color(featureStyle.fillColor2).rgb() : undefined;
    const fillUniform: FillUniform = {
      col1: {
        value: fillColor ? [fillColor.r, fillColor.g, fillColor.b] : [0, 0, 0],
        type: 'vec3<f32>',
      },
      col2: {
        value: fillColor2 ? [fillColor2.r, fillColor2.g, fillColor2.b] : [0, 0, 0],
        type: 'vec3<f32>',
      },
      opacity: {
        value: featureStyle.fillOpacity,
        type: 'f32',
      },
      hashed: {
        value: featureStyle.hashed,
        type: 'f32',
      },
      hashDisp: {
        value: Math.random() * 10,
        type: 'f32',
      },
      hashWidth: {
        value: this.config.initialHash,
        type: 'f32',
      },
    };

    const lineColor = color(featureStyle.lineColor).rgb();
    const outlineUniform: OutlineUniform = {
      color: {
        value: [lineColor.r, lineColor.g, lineColor.b],
        type: 'vec3<f32>',
      },
      outlineWidth: {
        value: featureStyle.lineWidth,
        type: 'f32',
      },
    }

    const polygonMesh = LineMesh.from(meshData.vertices, meshData.triangles, GeoJSONVertexShaderFill, GeoJSONFragmentShaderFill, fillUniform);
    container.zIndex = zIndex;

    container.addChild(polygonMesh);

    const polygonOutlineMesh = LineMesh.from(outlineData.vertices,
      outlineData.triangles,
      GeoJSONVertexShaderOutline,
      GeoJSONFragmentShaderOutline,
      outlineUniform,
      outlineData.normals);
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
    if (!this.config.outlineResize) return;
    const outlineRadius = this.getOutlineRadius(zoom);

    if (this.config.labelResize) {
      const labelSize = this.getLabelSize(zoom);

      // Labels will just get in the way after a certain threshold, so it is better to just hide them
      if (zoom <= this.config.labelResize.threshold) {
        this.labels.hideLabels();
      } else {
        this.labels.showLabels();
        this.labels.resize(labelSize);
      }
    }

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
    return this.dict.getPolygonAt([pos.x, pos.y]);
  }

  getOutlineRadius(zoom: number = this.currentZoom) {
    return getRadius(zoom, this.config.outlineResize);
  }

  getLabelSize(zoom: number = this.currentZoom) {
    return getRadius(zoom, this.config.labelResize);
  }
}
