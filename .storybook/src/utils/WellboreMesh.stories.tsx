import Vector2 from '@equinor/videx-vector2';
import { Application, Geometry, Mesh, Shader } from "pixi.js";

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
      in vec2 verts;
      in vec4 inputData;
      in float inputType;

      out vec4 data;
      out float type;

      uniform mat3 uWorldTransformMatrix;
      uniform mat3 uProjectionMatrix;

      void main() {
          gl_Position = vec4((uProjectionMatrix * uWorldTransformMatrix * vec3(verts, 1.0)).xy, 0.0, 1.0);
          data = inputData;
          type = inputType;
      }
  `;

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // Fragment shader
  const fragShader = `
      in vec4 data;
      in float type;

      uniform float length;

      void main() {
         gl_FragColor = vec4(data.x / length, data.y, 0.0, 1.0);
      }
  `;

  const fragShader2 = `
      precision mediump float;

      in vec4 data;
      in float type;

      uniform float length;

      void main() {
        gl_FragColor = vec4(0.0, type, 0.0, 1.0);
      }
  `;

export const Spiral = () => {
  const root = document.createElement('div');
  const app = new Application();

  app.init({
    width: 1000, height: 1000, backgroundColor: 0x66AACC,
  }).then(() => {
      const interp = new LineInterpolator(circleWellbore, 0.001);

      const mesh = new WellboreMesh(interp, 5, { width: 1, height: 7});
      const { vertices, triangles, vertexData, extraData } = mesh.generate();

      let geometry = new Geometry();
      geometry.addAttribute('verts', vertices);
      geometry.addAttribute('inputData', vertexData);
      geometry.addAttribute('inputType', extraData);
      geometry.addIndex(triangles);


      const lineShader: Shader = Shader.from({
        gl: {
          vertex: vertexShader,
          fragment: fragShader,
        },
        resources: {
          lengthUniforms: {
            length: {
              value: new Float32Array(interp.length),
              type: 'f32',
            }
          }
        },
      });
      const lineMesh = new Mesh({geometry, shader: lineShader});
      app.stage.addChild(lineMesh);
      root.appendChild(app.canvas);
    });

  return root;
};

export const SpiralTicks = () => {
  const root = document.createElement('div');
  const app = new Application();

  app.init({
    width: 1000, height: 1000, backgroundColor: 0x66AACC,
  }).then(() => {
      const interp = new LineInterpolator(circleWellbore, 0.001);

      const intervals: [number, number][] = [[0.1, 0.2], [0.3, 0.5], [0.7, 0.75], [0.8, 0.8], [0.85, 0.95]];

      const mesh = new WellboreMesh(interp, 5, { width: 1, height: 7});
      const { vertices, triangles, vertexData, extraData } = mesh.generate(intervals);


      const geometry: Geometry = new Geometry({
          attributes: {
            verts: vertices,
            inputData: vertexData,
            inputType: extraData,
          },
          indexBuffer: triangles
        });

      const uniforms = {
        value: interp.length,
        type: 'f32',
      }

      const lineShader = Shader.from({
        gl: {
          vertex: vertexShader,
          fragment: fragShader2,
        },
        resources: {
          theUniforms: {
            length: { value: interp.length, type: 'f32' },
          },
        },
      });

      // @ts-ignore
      const lineMesh = new Mesh({geometry, shader: lineShader});
      app.stage.addChild(lineMesh);
      root.append(app.canvas);
    });

  return root;
};

export const Stairs = () => {
  const root = document.createElement('div');
  const app = new Application();

  app.init({
    canvas: document.createElement('canvas'),
    width: 1000,
    height: 1000,
    backgroundColor: 0x66AACC,
  }).then(() => {
    const interp = new LineInterpolator(stairWellbore, 0.001);

    const mesh = new WellboreMesh(interp, 5, { width: 1, height: 7});
    const { vertices, triangles, vertexData, extraData } = mesh.generate();

    const geometry: Geometry = new Geometry({
      attributes: {
        verts: vertices,
        inputData: vertexData,
        inputType: extraData,
      },
      indexBuffer: triangles
    });

    const lineShader = Shader.from({
      gl: {
        vertex: vertexShader,
        fragment: fragShader,
      },
      resources: {
        theUniforms: {
          length: { value: interp.length, type: 'f32' },
        },
      }
    });

    const lineMesh = new Mesh({geometry, shader: lineShader});
    app.stage.addChild(lineMesh);
    root.append(app.canvas);
  });

  return root;
};
