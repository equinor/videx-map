import * as PIXI from 'pixi.js';
import { Color } from './Colors';
import { ResizeConfig } from './Config';

type vec3 = [number, number, number];

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// WELLBORE SHADER

/** Uniforms used by the shader. */
export interface WellboreUniforms {
  /** Color of lighted wellbore on the format: [R, G, B]. */
  wellboreColor1: vec3,
/** Color of shaded wellbore on the format: [R, G, B]. */
  wellboreColor2: vec3,
  /** True if completion and ticks should be visible. */
  completionVisible: boolean,
  /* Status of wellbore. (0: Active, 1: Filtered, 2: Ghost, 3: Hidden) */
  status: number,
  /** Size of dashes. */
  dashSize: number,
}

/**
 * Get shader for wellbore.
 * @param color Color used for wellbore
 * @param wellboreWidth Width of wellbore
 * @return PIXI shader
 */
export function getWellboreShader(color: Color, completionVisible: boolean, wellboreWidth: number): PIXI.Shader {
  return PIXI.Shader.from(
    wellboreVertexShader,
    wellboreFragmentShader,
    {
      wellboreColor1: color.col1,
      wellboreColor2: color.col2,
      completionVisible,
      status: 0,
      dashSize: wellboreWidth * 0.4,
    } as WellboreUniforms,
  );
}

export const wellboreVertexShader = `
  attribute vec2 verts;
  attribute vec4 vertCol;
  attribute float typeData;

  uniform mat3 translationMatrix;
  uniform mat3 projectionMatrix;

  varying vec4 vCol;
  varying float type;

  void main() {
    vCol = vertCol;
    type = typeData;
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(verts, 1.0)).xy, 0.0, 1.0);
  }
`;

export const wellboreFragmentShader = `
  precision mediump float;

  varying vec4 vCol;
  varying float type;

  uniform vec3 wellboreColor1;
  uniform vec3 wellboreColor2;
  uniform bool completionVisible;
  uniform int status;
  uniform float dashSize;

  void main() {
    vec3 col = vec3(0.0);
    float alpha = 1.0;

    if (status == 0) {
      if (completionVisible && type == 1.0) {
        if(mod(vCol.x, dashSize * 2.0) > dashSize) discard;
      }

      if (!completionVisible && type == 2.0) discard;

      float dist = clamp(vCol.z * vCol.z + vCol.w * vCol.w, 0.0, 1.0);

      vec3 dir3D = vec3(vCol.zw, sqrt(1.0 - dist * dist));
      vec3 sunDir = vec3(0.6247, -0.6247, 0.4685);

      float light = 0.4 + dot(dir3D, sunDir) * 0.6;
      light = clamp(light, 0.0, 1.0);

      col = mix(wellboreColor2, wellboreColor1, light);
    }

    else if (status == 1) {
      if (type == 2.0) discard;
      if(mod(vCol.x + vCol.y * 0.2, dashSize * 5.0) > dashSize * 3.0) discard;
      vec3 c = wellboreColor2 + wellboreColor1 * 0.5;
      vec3 gray = vec3(0.9);
      col = mix(gray, c, 0.3);
    }

    else if (status == 2) {
      if (type == 2.0) discard;
      alpha = 0.03;
    }

    else discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// CIRCLE SHADER / ROOT SHADER

export interface RootUniforms {
  active: boolean;
  circleColor1: [number, number, number]; // [R, G, B]
  circleColor2: [number, number, number]; // [R, G, B]
}

export function getCircleShader(): PIXI.Shader {
  const uniforms: RootUniforms = {
    active: true,
    circleColor1: [0, 0, 0],
    circleColor2: [0, 0, 0],
  }


  return PIXI.Shader.from(
    RootShader.vertexShader,
    RootShader.fragmentShader,
    uniforms,
  );
}

/** Stringify number for shader. If whole number, ensure one decimal slot. */
function toShader(n: number): string {
  if(n - Math.floor(n) === 0) return n.toString() + '.0';
  else return n.toString();
}

export class RootShader {

  static resizeConfig: ResizeConfig;

  static setResize(resizeConfig: ResizeConfig) {
    RootShader.resizeConfig = resizeConfig;
  }

  /** Build root shader with assigned variables. */
  static buildShader() {
    RootShader.buildVertexShader();
    RootShader.buildFragmentShader();
  }

  private static buildVertexShader() {
    const { base, multiplier, zoomReference } = RootShader.resizeConfig;
    RootShader.vertexShader = `
      attribute vec2 verts;
      attribute vec2 inputUVs;

      uniform mat3 translationMatrix;
      uniform mat3 projectionMatrix;
      uniform float zoom;

      varying vec2 UVs;

      void main() {
        UVs = inputUVs;

        vec2 dir = inputUVs - 0.5;
        vec2 scale = dir * ${toShader(2.0 * multiplier)} * pow(${toShader(base)}, -(zoom - ${toShader(zoomReference)}));

        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(verts + scale, 1.0)).xy, 0.0, 1.0);
      }
    `;
  }

  // Note: sinDir is normalized vec3(1, -1, 0.75)
  private static buildFragmentShader() {
    RootShader.fragmentShader = `
      precision mediump float;

      varying vec2 UVs;

      uniform vec3 circleColor1;
      uniform vec3 circleColor2;
      uniform bool active;

      void main() {
        if (!active) {
          discard;
          return;
        }
        vec2 dir = 2.0 * UVs - 1.0;
        float dist = dir.x * dir.x + dir.y * dir.y;
        if (dist > 1.0) discard;

        vec3 dir3D = vec3(dir, sqrt(1.0 - dist * dist));
        vec3 sunDir = vec3(0.625, -0.625, 0.469);

        float light = dot(dir3D, sunDir);
        light = 0.4 + light * 0.6;

        vec3 col = mix(circleColor2, circleColor1, clamp(light, 0.0, 1.0));

        gl_FragColor = vec4(col, 1.0);
      }
    `;
  }

  public static vertexShader: string = "";
  public static fragmentShader: string = "";
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
