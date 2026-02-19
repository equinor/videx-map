/**
 * Shared shaders for polygon and multipolygon
 */
export const GeoJSONVertexShaderFill = `
  in vec2 inputVerts;

  uniform mat3 uWorldTransformMatrix;
  uniform mat3 uProjectionMatrix;

  out vec2 verts;

  void main() {
    verts = inputVerts;
    gl_Position = vec4((uProjectionMatrix * uWorldTransformMatrix * vec3(inputVerts, 1.0)).xy, 0.0, 1.0);
  }
  `;

export const GeoJSONFragmentShaderFill = `
  precision mediump float;

  in vec2 verts;

  uniform vec3 col1;
  uniform vec3 col2;
  uniform float opacity;
  uniform float hashDisp;
  uniform float hashWidth;

  void main() {
    if(mod(verts.y + hashDisp, hashWidth * 2.0) > hashWidth) {
      gl_FragColor = vec4(col2 / 255., 1.0) * opacity;
    }
    else {
      gl_FragColor = vec4(col1 / 255., 1.0) * opacity;
    }
  }
  `;

/**
 * Shared shaders for polygon, multipolygon and linestring
 */
export const GeoJSONVertexShaderOutline = `
  in vec2 inputVerts;
  in vec2 inputNormals;

  uniform mat3 uWorldTransformMatrix;
  uniform mat3 uProjectionMatrix;

  uniform float outlineWidth;

  void main() {
    vec2 pos = inputVerts + inputNormals * outlineWidth;
    gl_Position = vec4((uProjectionMatrix * uWorldTransformMatrix * vec3(pos, 1.0)).xy, 0.0, 1.0);
  }
  `;

export const GeoJSONFragmentShaderOutline = `
  precision mediump float;

  uniform vec3 color;

  void main() {
    gl_FragColor = vec4(color / 255., 1.0);
  }
  `;
