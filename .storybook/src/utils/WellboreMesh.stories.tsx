import Vector2 from '@equinor/videx-vector2';
import * as PIXI from "pixi.js";

import { LineInterpolator } from '../../../src/utils/LineInterpolator';
import { WellboreMesh } from '../../../src/utils/WellboreMesh';

export default { title: 'utils/WellboreMesh' };

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Circle data
const generateSpiralWellbore: ((points: number) => Vector2[]) = points => {
  const output: Vector2[] = [];

  const center = new Vector2(500, 500);
  for (let i = 0; i < points; i++) {
    output.push(
      Vector2.right
        .mutable
        .rotateDeg((1000 / points) * i)
        .scale(400 - i * 1.2)
        .add(center)
        .immutable,
    );
  }

  return output;
}

const circleWellbore: Vector2[] = generateSpiralWellbore(300);

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Stair data
const generateStairWellbore: ((steps: number) => Vector2[]) = steps => {
  const output: Vector2[] = [];

  // Range of x and y
  const min = 100;
  const max = 900;

  const delta = (max - min) / steps;

  let pos = new Vector2(min, min);

  for (let i = 0; i < steps; i++) {
    output.push(pos);
    pos = pos.add(delta, 0);
    output.push(pos);
    pos = pos.add(0, delta);
  }

  // Last
  output.push(pos);

  return output;
}

const stairWellbore: Vector2[] = generateStairWellbore(10);

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Vertex shader
const vertexShader = `
      attribute vec2 verts;
      attribute vec4 inputData;
      attribute float inputType;

      uniform mat3 translationMatrix;
      uniform mat3 projectionMatrix;

      varying vec4 data;
      varying float type;

      void main() {
          data = inputData;
          type = inputType;
          gl_Position = vec4((projectionMatrix * translationMatrix * vec3(verts, 1.0)).xy, 0.0, 1.0);
      }
  `;

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // Fragment shader
  const fragShader = `
      precision mediump float;

      varying vec4 data;
      varying float type;

      uniform float length;

      void main() {
         gl_FragColor = vec4(data.x / length, data.y, 0.0, 1.0);
      }
  `;

  const fragShader2 = `
      precision mediump float;

      varying vec4 data;
      varying float type;

      uniform float length;

      void main() {
        gl_FragColor = vec4(0.0, type, 0.0, 1.0);
      }
  `;

export const Spiral = () => {
  const app = new PIXI.Application({ width: 1000, height: 1000, backgroundColor: 0x66AACC,});

  const interp = new LineInterpolator(circleWellbore, 0.001);

  const mesh = new WellboreMesh(interp, 5);
  const { vertices, triangles, vertexData, extraData } = mesh.generate();

  let geometry = new PIXI.Geometry();
  geometry.addAttribute('verts', vertices, 2);
  geometry.addAttribute('inputData', vertexData, 4);
  geometry.addAttribute('inputType', extraData, 1);
  geometry.addIndex(triangles);

  const uniforms = {
    length: interp.length,
  }

  const lineShader: any = PIXI.Shader.from(vertexShader, fragShader, uniforms);
  const lineMesh = new PIXI.Mesh(geometry, lineShader);
  app.stage.addChild(lineMesh);

  return app.view;
};

export const SpiralTicks = () => {
  const app = new PIXI.Application({ width: 1000, height: 1000, backgroundColor: 0x66AACC,});

  const interp = new LineInterpolator(circleWellbore, 0.001);

  const intervals: [number, number][] = [[0.1, 0.2], [0.3, 0.5], [0.7, 0.75], [0.8, 0.8], [0.85, 0.95]];

  const mesh = new WellboreMesh(interp, 5);
  const { vertices, triangles, vertexData, extraData } = mesh.generate(intervals);

  let geometry = new PIXI.Geometry();
  geometry.addAttribute('verts', vertices, 2);
  geometry.addAttribute('inputData', vertexData, 4);
  geometry.addAttribute('inputType', extraData, 1);
  geometry.addIndex(triangles);

  const uniforms = {
    length: interp.length,
  }

  const lineShader = PIXI.Shader.from(vertexShader, fragShader2, uniforms);

  // @ts-ignore
  const lineMesh = new PIXI.Mesh(geometry, lineShader);
  app.stage.addChild(lineMesh);

  return app.view;
};

export const Stairs = () => {
  const app = new PIXI.Application({ width: 1000, height: 1000, backgroundColor: 0x66AACC,});

  const interp = new LineInterpolator(stairWellbore, 0.001);

  const mesh = new WellboreMesh(interp, 5);
  const { vertices, triangles, vertexData, extraData } = mesh.generate();

  let geometry = new PIXI.Geometry();
  geometry.addAttribute('verts', vertices, 2);
  geometry.addAttribute('inputData', vertexData, 4);
  geometry.addAttribute('inputType', extraData, 1);
  geometry.addIndex(triangles);

  const uniforms = {
    length: interp.length,
  }

  const lineShader = PIXI.Shader.from(vertexShader, fragShader, uniforms);

  // @ts-ignore
  const lineMesh = new PIXI.Mesh(geometry, lineShader);
  app.stage.addChild(lineMesh);

  return app.view;
};
