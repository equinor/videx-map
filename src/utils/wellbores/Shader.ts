import * as PIXI from 'pixi.js';
import { Color } from './Colors';
import { ResizeConfig } from './Config';

type vec3 = [number, number, number];

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// SHARED LOGIC

/** Stringify number for shader. If whole number, ensure one decimal slot. */
function toShader(n: number): string {
  if(n - Math.floor(n) === 0) return n.toString() + '.0';
  else return n.toString();
}

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
  /** True if wellbore should be visible. */
  wellboreVisible: boolean,
  /* Status of wellbore. (0: Active, 1: Filtered, 2: Ghost, 3: Hidden) */
  status: number,
}

/**
 * Get shader for wellbore.
 * @param color Color used for wellbore
 * @param wellboreWidth Width of wellbore
 * @return PIXI shader
 */
export function getWellboreShader(color: Color, completionVisible: boolean, wellboreVisible: boolean): PIXI.Shader {
  return PIXI.Shader.from(
    WellboreShader.vertexShader,
    WellboreShader.fragmentShader,
    {
      wellboreColor1: color.col1,
      wellboreColor2: color.col2,
      completionVisible,
      wellboreVisible,
      status: 0,
    } as WellboreUniforms,
  );
}

export class WellboreShader {
  /** Build wellbore shader with assigned variables. */
  static build(wellboreResize: ResizeConfig, wellboreDash: number) {
    const { min, max } = wellboreResize;

    const zoomMin = toShader(min.zoom);
    const zoomRange = toShader(max.zoom - min.zoom);
    const scaleMin = toShader(min.scale);
    const scaleMax = toShader(max.scale);

    WellboreShader.vertexShader = `
      attribute vec2 verts;
      attribute vec4 vertCol;
      attribute float typeData;

      uniform mat3 translationMatrix;
      uniform mat3 projectionMatrix;
      uniform float zoom;

      varying vec4 vCol;
      varying float type;

      void main() {
        vCol = vertCol;
        type = typeData;

        vec2 normal = vertCol.zw;
        float t = (zoom - ${zoomMin}) / ${zoomRange};
        float scale = mix(${scaleMin}, ${scaleMax}, clamp(t, 0.0, 1.0)) - ${scaleMax};

        vec2 extra = mix(normal * scale, vec2(0.0), step(2.0, typeData));

        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(verts + extra, 1.0)).xy, 0.0, 1.0);
      }
    `;

    const dash = toShader(wellboreDash);
    const doubleDash = toShader(wellboreDash * 2);
    const quadrupleDash = toShader(wellboreDash * 4);

    WellboreShader.fragmentShader = `
      precision mediump float;

      varying vec4 vCol;
      varying float type;

      uniform vec3 wellboreColor1;
      uniform vec3 wellboreColor2;
      uniform bool completionVisible;
      uniform bool wellboreVisible;
      uniform int status;

      const vec3 sunDir = vec3(0.6247, -0.6247, 0.4685);

      void main() {
        vec3 col = vec3(0.0);
        float alpha = 1.0;

        if (status == 0) {
          if(type == 0.0) {
            if (!wellboreVisible) {
              alpha = 0.03;
            }
          } else if (type == 1.0) {
            if(completionVisible){
              if(mod(vCol.x, ${doubleDash}) > ${dash}) discard;
            } else if(!wellboreVisible){
              alpha = 0.03;
            }
          }
          if (!completionVisible && type == 2.0) discard;

          float dist = clamp(vCol.z * vCol.z + vCol.w * vCol.w, 0.0, 1.0);

          vec3 dir3D = vec3(vCol.zw, sqrt(1.0 - dist * dist));

          float light = 0.4 + dot(dir3D, sunDir) * 0.6;
          light = clamp(light, 0.0, 1.0);

          col = mix(wellboreColor2, wellboreColor1, light);
        }

        else if (status == 1) {
          if (type == 2.0) discard;
          if(mod(vCol.x + vCol.y * 0.2, ${quadrupleDash}) > ${doubleDash}) discard;
          vec3 c = wellboreColor2 + wellboreColor1 * 0.5;
          vec3 gray = vec3(0.9);
          col = mix(gray, c, 0.3);
        }

        else if (status == 2) {
          if (type == 2.0) discard;
          alpha = 0.03;
        }

        else discard;

        col *= alpha;
        gl_FragColor = vec4(col, alpha);
      }
    `;
  }

  /** Vertex shader */
  public static vertexShader: string = "";

  /** Fragment shader */
  static fragmentShader: string = "";
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// CIRCLE SHADER / ROOT SHADER

export interface RootUniforms {
  active: boolean;
  circleColor1: [number, number, number]; // [R, G, B]
  circleColor2: [number, number, number]; // [R, G, B]
}

export class RootShader {
  /** Get root shader */
  static get() {
    return PIXI.Shader.from(
      RootShader.vertexShader,
      RootShader.fragmentShader,
      {
        active: true,
        circleColor1: [0, 0, 0],
        circleColor2: [0, 0, 0],
      },
    );
  }

  /** Build vertex shader from given resize configs */
  static build(maxScale: number) {
    RootShader.vertexShader = `
      attribute vec2 verts;
      attribute vec2 inputUVs;

      uniform mat3 translationMatrix;
      uniform mat3 projectionMatrix;
      uniform float rootRadius;

      varying vec2 UVs;

      void main() {
        UVs = inputUVs;

        vec2 dir = 2.0 * inputUVs - 1.0;

        float extraRadius = rootRadius - ${toShader(maxScale)};

        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(verts + dir * extraRadius, 1.0)).xy, 0.0, 1.0);
      }
    `;
  }

  public static vertexShader: string = "";

  public static fragmentShader: string = `
    precision mediump float;

    varying vec2 UVs;

    uniform vec3 circleColor1;
    uniform vec3 circleColor2;
    uniform bool active;

    const vec3 sunDir = vec3(0.6247, -0.6247, 0.4685);

    void main() {
      if (!active) {
        discard;
        return;
      }
      vec2 dir = 2.0 * UVs - 1.0;
      float dist = dir.x * dir.x + dir.y * dir.y;
      if (dist > 1.0) discard;

      vec3 dir3D = vec3(dir, sqrt(1.0 - dist * dist));

      float light = dot(dir3D, sunDir);
      light = 0.4 + light * 0.6;

      vec3 col = mix(circleColor2, circleColor1, clamp(light, 0.0, 1.0));

      gl_FragColor = vec4(col, 1.0);
    }
  `;
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
