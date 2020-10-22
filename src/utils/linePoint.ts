import Vector2 from '@equinor/videx-vector2';
import { VectorLike } from '@equinor/videx-linear-algebra';

  /**
   * Find the position along a line segment closest to a given point.
   * @param point Reference point
   * @param lineStart Start of line segment
   * @param lineEnd End of line segment
   * @returns Closest point on line
   */
  export function closestPointOnLine(point: Vector2, lineStart: Vector2, lineEnd: Vector2): Vector2 {
    const lineDir: Vector2 = Vector2.sub(lineEnd, lineStart);

    // Angle of line relative to x-axis
    const lineAngle: number = Vector2.angleRight(lineDir);
    const len: number = lineDir.magnitude;

    // Local direction to point
    const dir: Vector2 = Vector2.sub(point, lineStart)
      .mutable
      .rotate(-lineAngle);

    // If outside
    if (dir[0] < 0) return lineStart;
    else if(dir[0] > len) return lineEnd;

    return lineDir
      .mutable
      .rescale(dir[0])
      .add(lineStart[0], lineStart[1])
      .immutable;
  };

  /**
   * Find the shortest distance from a point to a line segment.
   * @param point Reference point
   * @param lineStart Start of line segment
   * @param lineEnd End of line segment
   * @returns Distance to line
   */
  export function distanceToLine(point: Vector2, lineStart: Vector2, lineEnd: Vector2): number {
    const lineDir: Vector2 = Vector2.sub(lineEnd, lineStart);

    // Angle of line relative to x-axis
    const lineAngle: number = Vector2.angleRight(lineDir);
    const len: number = lineDir.magnitude;

    // Local direction to point
    const dir: Vector2 = Vector2.sub(point, lineStart)
      .mutable
      .rotate(-lineAngle);

    // If outside
    if (dir[0] < 0) return dir.magnitude;
    else if(dir[0] > len) return Vector2.distance(point, lineEnd);

    return Math.abs(dir.y);
  };

  /**
   * Get the relative displacement of the point in respect to lineStart.
   * X-component contains displacement along line.
   * Y component contains displacement perpendicular to line.
   * @param point Reference point
   * @param lineStart Start of line segment
   * @param lineEnd End of line segment
   */
  export function displacementToLineOrigin(point: VectorLike, lineStart: VectorLike, lineEnd: VectorLike): Vector2 {
    const lineDir: Vector2 = Vector2.sub(lineEnd, lineStart).mutable;

    // Angle of line relative to x-axis
    const lineAngle: number = Vector2.angleRight(lineDir);

    // Return local direction to point. Re-use linedir.
    return lineDir.set(point)
      .sub(lineStart)
      .rotate(-lineAngle)
      .modify(Math.abs)
      .immutable;
  };
