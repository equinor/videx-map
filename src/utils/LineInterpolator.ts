/* eslint-disable no-magic-numbers, curly */
import Vector2 from '@equinor/videx-vector2';
import { mix } from '@equinor/videx-linear-algebra';

/**
 * Path used by the interpolator.
 */
interface PathPoint {
  /**
   * Point along the line.
   */
  point: Vector2;
  /**
   * Normalized direction towards next point.
   */
  direction: Vector2;
  /**
   * Distance to point along line.
   */
  distance: number;
  /**
   * Relative distance to point along line.
   */
  relative: number;
}

/**
 * Point in returned segment.
 */
export interface SegmentPoint {
  /**
   * Point along line.
   */
  position: Vector2;
  /**
   * Normalized direction towards next point.
   */
  direction: Vector2;
  /**
   * Distance to point along line.
   */
  distance: number;
}

/**
 * Interpolator for finding points and subsegments on a line defined by a collection
 * of Vector2 or 2D vectors.
 */
export class LineInterpolator {

  /**
   * Amount of provided points.
   */
  amount : number;

  /**
   * Length of line.
   */
  length : number;

  /**
   * True if line is an approximation of a single point.
   */
  singlePoint : boolean = true;

  /**
   * Collection of points along line with distances.
   */
  path: PathPoint[];

  /**
   * Construct line interpolator from a collection of points
   * @param points Collection of points as Vector2
   */
  constructor(points: Vector2[], radius: number) {
    const amount: number = points.length;
    const path: PathPoint[] = new Array(amount); // Path

    const root = points[0];
    let initDir: Vector2;
    if (points.length >= 2) {
      initDir = Vector2.sub(points[1], points[0]).normalize();
    } else {
      initDir = Vector2.right;
    }

    // Set first point
    path[0] = {
      point: root,
      direction: initDir,
      distance: 0,
      relative: 0,
    }

    // Total length of line
    let length: number = 0;

    for(let i = 1; i < amount; i++) {
      const point = points[i];
      length += Vector2.distance(point, path[i - 1].point);
      path[i] = {
        point,
        direction: this.GetDirection(points, i),
        distance: length, // Distance to point along line (in world units)
        relative: 0,
      };

      // Not a single point if outside radius
      if(Vector2.distance(point, root) > radius) this.singlePoint = false;
    }

    // Re-iterate over path to calculate relative distances
    for(let i = 1; i < amount; i++) {
      const p = path[i];
      p.relative = (length === 0) ? 0 : p.distance / length;
    }

    this.amount = amount;
    this.length = length;
    this.path = path;
  }

  /**
   * Get point at relative position.
   * @param relative Relative position along the line between 0 and 1
   * @returns Point at relative position
   */
  GetPoint(relative: number): SegmentPoint {
    // Return first point if line has no length
    if(this.singlePoint) {
      return {
        position: this.path[0].point,
        direction: Vector2.up,
        distance: 0,
      };
    }

    if (relative < 0) {
      const first = this.path[0];
      return {
        position: first.point,
        direction: first.direction,
        distance: 0,
      }
    }

    if (relative >= 1) {
      const last = this.path[this.amount - 1];
      return {
        position: last.point,
        direction: last.direction,
        distance: this.length,
      }
    }

    const base: number = this.GetClosestPointBelow(relative);
    const prev: PathPoint = this.path[base];
    const cur: PathPoint = this.path[base + 1];
    const dist: number = cur.relative - prev.relative;
    const frac: number = (relative - prev.relative) / dist;
    return {
      position: mix(prev.point, cur.point, frac, Vector2.zero),
      direction: Vector2.lerpRot(prev.direction, cur.direction, frac).normalize(),
      distance: prev.distance * (1 - frac) + cur.distance * frac,
    };
  }

  /**
   * Get section at relative position.
   * @param relativeStart Relative position along the line between 0 and 1
   * @param relativeEnd Relative position along the line between 0 and 1
   * @returns Relative section along the line
   */
  GetSection(relativeStart: number, relativeEnd: number): SegmentPoint[] {
    // Return two points if line has no length
    if(this.singlePoint) {
      return [
        { position: this.path[0].point, direction: Vector2.up, distance: 0 },
        { position: this.path[0].point, direction: Vector2.up, distance: 0 },
      ];
    }

    // If last interval is at the end
    if (relativeStart >= 1) {
      const last = this.path[this.path.length - 1];
      return [
        { position: last.point, direction: last.direction, distance: this.length },
        { position: last.point, direction: last.direction, distance: this.length },
      ];
    }

    const base: number = this.GetClosestPointBelow(relativeStart);

    const points: SegmentPoint[] = [];

    const prev: PathPoint = this.path[base];
    const cur: PathPoint = this.path[base + 1];
    const dist: number = cur.relative - prev.relative;
    const frac: number = (relativeStart - prev.relative) / dist;
    points.push({ // Push first point
      position: mix(prev.point, cur.point, frac, Vector2.zero),
      direction: Vector2.lerpRot(prev.direction, cur.direction, frac).normalize(),
      distance: prev.distance * (1 - frac) + cur.distance * frac,
    });

    for(let i = base + 1; i < this.amount; i++) {
      const cur: PathPoint = this.path[i];

      if (cur.relative >= relativeEnd) { // End
        const cur: PathPoint = this.path[i];
        const prev: PathPoint = this.path[i - 1];
        const dist: number = cur.relative - prev.relative;
        const frac: number = (relativeEnd - prev.relative) / dist;
        points.push({ // Push last point
          position: mix(prev.point, cur.point, frac, Vector2.zero),
          direction: Vector2.lerpRot(prev.direction, cur.direction, frac).normalize(),
          distance: prev.distance * (1 - frac) + cur.distance * frac,
        });
        break;
      }

      points.push({ // Add points between
        position: cur.point,
        direction: this.path[i].direction,
        distance: cur.distance,
      });
    }
    return points;
  }

  /**
   * Get closest point below provided relative position along the line.
   * Utilizes divide-and-conquer algorithm to speed up search.
   * @param relative Relative position along the line between 0 and 1
   * @returns Index of closest point below relative
   */
  GetClosestPointBelow(relative: number): number {
    let base: number = 0;
    let range: number = this.amount;
    let idx: number = Math.floor(range * 0.5);
    while(range > 1) {
      if(relative < this.path[idx].relative) {
        range = Math.floor(range * 0.5);
        idx = base + Math.floor(range * 0.5);
      } else {
        base += Math.floor(range * 0.5);
        range = Math.ceil(range * 0.5);
        idx = base + Math.floor(range * 0.5);
      }
    }
    return base;
  }

  /**
   * Get point with given distance from the start in world space.
   * @param distance Real distance from the start
   * @returns Point at given distance from start
   */
  GetPointFromStart(distance: number): SegmentPoint{
    const relative: number = distance / this.length;
    return this.GetPoint(relative);
  }

  /**
   * Get point with given distance from the end in world space.
   * @param distance Real distance from the end
   * @returns Point at given distance from end
   */
  GetPointFromEnd(distance: number): SegmentPoint {
    const relative: number = 1 - (distance / this.length);
    return this.GetPoint(relative);
  }

  /**
   * Get collection of equally space points with given width in real distance.
   * @param relative Start of range
   * @param width Width of range in real distance
   * @param resolution Amount of points within range
   * @returns Collection of equally spaced points within range
   */
  GetRangeFromStart(relative: number, width: number, resolution: number = 10): SegmentPoint[] {
    const relativeEnd: number = relative + (width / this.length);
    const relativeDisp: number = (relativeEnd - relative) / resolution;

    const points = [];
    for(let i = 0; i <= resolution; i++) {
      points.push(this.GetPoint(relative + relativeDisp * i));
    }
    return points;
  }

  /**
   * Get direction towards next point.
   * @param idx Index of point
   * @returns Direction as vector
   */
  GetDirection(points: Vector2[], idx: number): Vector2 {
    const end: number = points.length - 1;
    if (idx === 0) { // If first
      return Vector2.sub(points[1], points[0]).normalize();
    } // If last
    else if (idx === end) {
      return Vector2.sub(points[end], points[end - 1]).normalize();
    }
    else {
      const cur: Vector2 = points[idx]; // Current point
      const to: Vector2 = Vector2.sub(cur, points[idx - 1]); // Direction to current
      const from: Vector2 = Vector2.sub(points[idx + 1], cur); // Direction from current

      return Vector2.lerpRot(to, from, 0.5).normalize(); // Rotate halfway
    }
  }
}
