/* eslint-disable no-magic-numbers, curly */
type vec2 = [number, number];

/**
 * Helping function for determining if a points is inside a triangle.
 * @param p Points to evaluate
 * @param v1 Vertex 1 of triangle
 * @param v2 Vertex 2 of triangle
 * @param v3 Vertex 3 of triangle
 * @returns True if points is inside triangle
 */
function pointInsideTriangle(p: vec2, v1: vec2, v2: vec2, v3: vec2) {
  const k1 = (p[0] - v1[0]) * (v2[1] - v1[1]) - (p[1] - v1[1]) * (v2[0] - v1[0]);
  const k2 = (p[0] - v2[0]) * (v3[1] - v2[1]) - (p[1] - v2[1]) * (v3[0] - v2[0]);
  const k3 = (p[0] - v3[0]) * (v1[1] - v3[1]) - (p[1] - v3[1]) * (v1[0] - v3[0]);

  if (k1 < 0) {
    return (k2 < 0) ? (k3 < 0) : false;
  }
  return (k2 >= 0) ? (k3 >= 0) : false;
}

interface Triangle {
  v1: vec2;
  v2: vec2;
  v3: vec2;
  polygonID: number;
}

export default class TriangleDictionary<T> {
  /** Resolution of data segmentation. */
  resolution: number;

  /** Map with collection of triangle IDs. */
  tiles: Map<string, number[]> = new Map<string, number[]>();

  /** Triangle IDs to polygon. */
  triangles: Triangle[] = [];

  /** Mapping polygon IDs to values. */
  polygonValues: T[] = [];

  constructor(decimals: number = 0) {
    this.resolution = 10 ** decimals;
  }

  add(vertices: vec2[], triangles: number[], value: T) {
    const polygonID: number = this.polygonValues.length;
    this.polygonValues.push(value);

    let v1: vec2;
    let v2: vec2;
    let v3: vec2;

    for (let i: number = 0; i < triangles.length; i += 3) {
      const triangleID: number = this.triangles.length;

      // Finding triangle corners
      v1 = vertices[triangles[i]];
      v2 = vertices[triangles[i + 1]];
      v3 = vertices[triangles[i + 2]];

      this.triangles.push({ v1, v2, v3, polygonID });

      const minX: number = Math.min(v1[0], v2[0], v3[0]);
      const maxX: number = Math.max(v1[0], v2[0], v3[0]);
      const minY: number = Math.min(v1[1], v2[1], v3[1]);
      const maxY: number = Math.max(v1[1], v2[1], v3[1]);

      const tileMinX: number = Math.floor(minX * this.resolution);
      const tileMaxX: number = Math.floor(maxX * this.resolution);
      const tileMinY: number = Math.floor(minY * this.resolution);
      const tileMaxY: number = Math.floor(maxY * this.resolution);

      // Most triangles does not end up "avoiding" a tile.
      for (let x: number = tileMinX; x <= tileMaxX; x++) {
        for (let y: number = tileMinY; y <= tileMaxY; y++) {
          const key: string = `${x}.${y}`;
          if (this.tiles.has(key)) {
            this.tiles.get(key).push(triangleID);
          } else {
            this.tiles.set(key, [ triangleID ]);
          }
        }
      }
    }
  }

  getPolygonAt(target: vec2): T {
    const x: number = Math.floor(target[0] * this.resolution);
    const y: number = Math.floor(target[1] * this.resolution);
    const key: string = `${x}.${y}`;
    if (!this.tiles.has(key)) return null;
    const triangles = this.tiles.get(key);

    for (let i = 0; i < triangles.length; i++) {
      const triangle = this.triangles[triangles[i]];
      if (!pointInsideTriangle(target, triangle.v1, triangle.v2, triangle.v3)) continue;
      return this.polygonValues[triangle.polygonID];
    }

    return null;
  }
}
