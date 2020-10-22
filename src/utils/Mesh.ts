import Vector2 from "@equinor/videx-vector2";
import * as PIXI from 'pixi.js';
import { flatten, VectorLike } from '@equinor/videx-linear-algebra';
import { SegmentPoint } from './LineInterpolator';
import earcut from 'earcut';

export interface WellboreSegmentData {
  vertices: number[];
  triangles: number[];
  vertexData: number[];
  extraData: number[];
}

export interface MeshData {
  vertices: number[];
  triangles: number[];
}

export interface MeshNormalData extends MeshData {
  normals: number[];
}

/**
 * Segment data used when creating polygon outline.
 */
interface SegmentData {
  upper: VectorLike;
  lower: VectorLike;
}

/**
 * Helper function for finding intersection between two rays.
 * @param p1 Position of first ray
 * @param d1 Direction of first ray
 * @param p2 Position of second ray
 * @param d2 Direction of second ray
 * @returns Intersection of rays
 */
function Intersection(p1: Vector2, d1: Vector2, p2: Vector2, d2: Vector2): [number, number] {
  const c: [number, number] = [p1[0] - p2[0], p1[1] - p2[1]];
  const len: number = (c[0] * d2[1] - c[1] * d2[0]) / (d1[1] * d2[0] - d1[0] * d2[1]);
  c[0] = d1[0] * len + p1[0];
  c[1] = d1[1] * len + p1[1];
  return c;
}

export default class Mesh {
  /**
   * Create mesh for a line.
   * @param points Collection of points used to construct mesh
   * @param thickness Thickness of line
   * @param callback Callback with segment point for every two vertices added, first vertex is upper
   * @returns Vertex and triangulation for mesh
   */
  static WellboreSegment (points: SegmentPoint[], thickness: number = 1, type: number): WellboreSegmentData {
    const vertices: number[] = [];
    const triangles: number[] = [];
    const vertexData: number[] = [];
    const extraData: number[] = [];

    // Half of thickness
    const _thickness: number = thickness * 0.5;

    // Add First
    const point0: SegmentPoint = points[0];
    const first: Vector2 = point0.position;
    const from0: Vector2  = Vector2.sub(points[1].position, first).rescale(_thickness);
    vertices.push(
      -from0[1] + first[0], // Upper: X
      from0[0] + first[1],  // Upper: Y
      from0[1] + first[0],  // Lower: X
      -from0[0] + first[1], // Lower: Y
    );
    vertexData.push(
      point0.distance,  1.0,  -point0.direction[1],  point0.direction[0],   // Upper
      point0.distance,  0.0,  point0.direction[1],   -point0.direction[0],  // Lower
    );
    extraData.push(type, type);

    // Iterate over all points
    for (let i: number = 1; i < points.length - 1; i++) {
      const point: SegmentPoint = points[i];
      const prev: Vector2 = points[i - 1].position;
      const cur: Vector2 = point.position;
      const next: Vector2 = points[i + 1].position;

      const to: Vector2 = Vector2.sub(cur, prev);
      const from: Vector2 = Vector2.sub(next, cur);

      let upper: [number, number] = null;
      let inner:  [number, number] = null;
      if (Vector2.angleDeg(to, from) < 90) {
        // Normal upper
        const toU: Vector2 = to.rotate90()
          .mutable
          .rescale(_thickness)
          .add(prev)
          .immutable;
        const fromU: Vector2 = from.rotate90()
          .mutable
          .rescale(_thickness)
          .add(next)
          .immutable;

        // Normal inner
        const toI: Vector2 = to.rotate270()
          .mutable
          .rescale(_thickness)
          .add(prev)
          .immutable;
        const fromI: Vector2 = from.rotate270()
          .mutable
          .rescale(_thickness)
          .add(next)
          .immutable;

        // Find intersections for exact line width
        upper = Intersection(toU, to, fromU, from);
        inner = Intersection(toI, to, fromI, from);
      } else { // If wide angle
        upper = [
          -point.direction[1] * _thickness + cur[0],
          point.direction[0] * _thickness + cur[1],
        ];
        inner = [
          point.direction[1] * _thickness + cur[0],
          -point.direction[0] * _thickness + cur[1],
        ];
      }

      vertices.push(upper[0], upper[1], inner[0], inner[1]);

      vertexData.push(
        point.distance,  1.0,  -point.direction[1],  point.direction[0],   // Upper
        point.distance,  0.0,  point.direction[1],   -point.direction[0],  // Lower
      );
      extraData.push(type, type);

      //  0     2
      //
      //  1     3
      if (i != 0) {
        const n: number = i * 2;
        triangles.push(n - 1, n - 2, n, n - 1, n, n + 1);
      }
    }

    // Add last vertices
    const pointN = points[points.length - 1];
    const last: Vector2 = pointN.position;
    const toN: Vector2 = Vector2.sub(last, points[points.length - 2].position).rescale(_thickness);
    vertices.push(
      last[0] - toN[1], // Upper: X
      last[1] + toN[0], // Upper: Y
      last[0] + toN[1], // Lower: X
      last[1] - toN[0], // Lower: Y
    );
    vertexData.push(
      pointN.distance,  1.0,  -pointN.direction[1],  pointN.direction[0],   // Upper
      pointN.distance,  0.0,  pointN.direction[1],   -pointN.direction[0],  // Lower
    );
    extraData.push(type, type);

    // Add last triangles
    const n: number = points.length * 2 - 2;
    triangles.push(n - 1, n - 2, n, n - 1, n, n + 1);

    return { vertices, triangles, vertexData, extraData };
  }

  static SimpleLine = (points: VectorLike[], thickness: number = 1): MeshNormalData => {
    // Half of thickness
    const linethickness: number = thickness * 0.5;

    function GetNormal(index: number): Vector2 {
      if (index === 0) return Vector2.sub(points[1], points[0]).mutable.rotate90().rescale(1);
      if (index === points.length - 1) {
        return Vector2.sub(points[points.length - 1], points[points.length - 2]).mutable.rotate90().rescale(1);
      }
      const prev = points[index - 1];
      const cur = points[index];
      const next = points[index + 1];
      return Vector2.lerpRot(Vector2.sub(cur, prev), Vector2.sub(next, cur), 0.5).mutable.rotate90().rescale(1);
    }

    const vertices: number[] = [];
    const triangles: number[] = [];
    const normals: number[] = [];
    let baseTris = 0;

    let prevUpperRight;

    for (let i = 0; i < points.length - 1; i++) {
      const cur = points[i];
      const next = points[i + 1];
      const dir = Vector2.sub(next, cur);

      const dirN = dir.rotate90().mutable.rescale(linethickness).immutable;

      const leftNormal = GetNormal(i);
      const rightNormal = GetNormal(i + 1);

      //  1     3
      //
      //  0     2
      const lowerLeft = Vector2.sub(cur, dirN);
      const upperLeft = Vector2.add(cur, dirN);
      const lowerRight = Vector2.sub(next, dirN);
      const upperRight = Vector2.add(next, dirN);

      vertices.push(
        lowerLeft[0], lowerLeft[1],
        upperLeft[0], upperLeft[1],
        lowerRight[0], lowerRight[1],
        upperRight[0], upperRight[1],
      );
      normals.push(
        -leftNormal[0], -leftNormal[1], leftNormal[0], leftNormal[1],
        -rightNormal[0], -rightNormal[1], rightNormal[0], rightNormal[1],
      ); // Normal data

      triangles.push(baseTris, baseTris + 1, baseTris + 3, baseTris, baseTris + 3, baseTris + 2);

      if (i !== 0) { // Patch
        const toPrevUpper = Vector2.sub(prevUpperRight, upperLeft);
        const angle = Vector2.signedAngle(dirN, toPrevUpper);
        if (angle < 0) {
          triangles.push(baseTris, baseTris - 2, baseTris + 1);
        } else {
          triangles.push(baseTris, baseTris - 1, baseTris + 1);
        }
      }

      prevUpperRight = upperRight;
      baseTris += 4;
    }

    return { vertices, triangles, normals };
  }

  /**
   * Create mesh for a polygon.
   * @param points Collection of points used to construct mesh
   * @returns Vertex and triangulation for mesh
   */
  static Polygon = (points: Vector2[]): MeshData => {
    const vertices: number[] = flatten(points);
    const triangles: number[] = earcut(vertices);
    return { vertices, triangles };
  }

  static PolygonOutline = (points: VectorLike[], thickness: number = 1): MeshNormalData => {
    // Half of thickness
    const linethickness: number = thickness * 0.5;

    function GetIndex(index: number): number {
      let r = index % points.length;
      if (r < 0) r += points.length;
      return r;
    }

    const vertices: number[] = [];
    const triangles: number[] = [];
    const normals: number[] = [];
    let baseTris = 0;

    let prevUpperRight;

    let firstUpperLeft;
    let firstDirN;

    for (let i = 0; i < points.length; i++) {
      const prev = points[GetIndex(i - 1)];
      const cur = points[GetIndex(i)];
      const next = points[GetIndex(i + 1)];
      const next2 = points[GetIndex(i + 2)];
      const dir = Vector2.sub(next, cur);

      const dirN = dir.rotate90().mutable.rescale(linethickness).immutable;

      // Normal Vector
      const leftNormal = Vector2.lerpRot(
        Vector2.sub(cur, prev),
        Vector2.sub(next, cur),
        0.5,
      ).mutable.rotate90().rescale(1);

      const rightNormal = Vector2.lerpRot(
        Vector2.sub(next, cur),
        Vector2.sub(next2, next),
        0.5,
      ).mutable.rotate90().rescale(1);

      //  1     3
      //
      //  0     2
      const lowerLeft = Vector2.sub(cur, dirN);
      const upperLeft = Vector2.add(cur, dirN);
      const lowerRight = Vector2.sub(next, dirN);
      const upperRight = Vector2.add(next, dirN);

      vertices.push(
        lowerLeft[0], lowerLeft[1],
        upperLeft[0], upperLeft[1],
        lowerRight[0], lowerRight[1],
        upperRight[0], upperRight[1],
      );
      normals.push(
        -leftNormal[0], -leftNormal[1], leftNormal[0], leftNormal[1],
        -rightNormal[0], -rightNormal[1], rightNormal[0], rightNormal[1],
      ); // Normal data

      triangles.push(baseTris, baseTris + 1, baseTris + 3, baseTris, baseTris + 3, baseTris + 2);

      if (i !== 0) { // Patch
        const toPrevUpper = Vector2.sub(prevUpperRight, upperLeft);
        const angle = Vector2.signedAngle(dirN, toPrevUpper);
        if (angle < 0) {
          triangles.push(baseTris, baseTris - 2, baseTris + 1);
        } else {
          triangles.push(baseTris, baseTris - 1, baseTris + 1);
        }
      } else { // Get first values for last patching
        firstUpperLeft = upperLeft;
        firstDirN = dirN;
      }

      // Patch last
      if (i === points.length - 1) {
        const toLastUpper = Vector2.sub(upperRight, firstUpperLeft);
        const angle = Vector2.signedAngle(firstDirN, toLastUpper);
        if (angle < 0) {
          triangles.push(0, baseTris - 2, 1);
        } else {
          triangles.push(0, baseTris - 1, 1);
        }
      }

      prevUpperRight = upperRight;
      baseTris += 4;
    }

    return { vertices, triangles, normals };
  }

  /**
   * Create a simple pixi mesh from vertices, triangles and shaders. Vertices are named 'inputVerts' in shader.
   * @param vertices Vertices belonging to mesh
   * @param triangles Triangulation of mesh
   * @param vertexShader Vertex shader as string
   * @param fragmentShader Fragment shader as string
   * @param uniforms Collection of uniforms
   * @param normals UV data
   * @returns Created pixi mesh
   */
  static from(vertices: number[], triangles: number[], vertexShader: string, fragmentShader: string, uniforms?: {}, normals?: number[]): PIXI.Mesh {
    // Create geometry
    const geometry = new PIXI.Geometry();
    geometry.addAttribute('inputVerts', vertices, 2);
    if (normals) geometry.addAttribute('inputNormals', normals, 2);
    geometry.addIndex(triangles);

    // Shader
    const shader: any = PIXI.Shader.from(
      vertexShader,
      fragmentShader,
      uniforms,
    );
    return new PIXI.Mesh(geometry, shader);
  }
}
