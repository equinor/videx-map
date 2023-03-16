/* eslint-disable curly, no-magic-numbers */
import Vector2 from '@equinor/videx-vector2';
import { VectorLike } from '@equinor/videx-linear-algebra';

import { displacementToLineOrigin } from './linePoint';

/**
 * Reduce complexity of a line by removing points with little information.
 * @param points Collection of points to reduce
 * @param maxDeviation Max deviation of a single point
 * @param distanceWeight Scale allowed deviatin by distance from last point
 * @returns Reduced line
 */
export function reduce<T extends VectorLike>(points: T[], maxDeviation: number, distanceWeight: number): T[] {
  const output: T[] = [
    points[0],
    points[1],
  ];

  // Initial direction
  let lineStart: T = points[0];
  let lineEnd: T = points[1];

  for (let i: number = 2; i < points.length - 1; i++) {
    const cur: T = points[i];

    // Avoid overlapping points
    if (Vector2.equals(cur, points[i - 1], 0.01)) continue;

    const minDisp: Vector2 = displacementToLineOrigin(cur, lineStart, lineEnd);

    const lineDir = Vector2.sub(lineEnd, lineStart);
    const pointDir = Vector2.sub(cur, lineEnd);
    const angle = Vector2.angleDeg(lineDir, pointDir);

    // if (angle >= 165) continue;

    if (minDisp[1] > maxDeviation + minDisp[0] * distanceWeight - angle * 0.075) {
      output.push(cur);
      lineStart = lineEnd;
      lineEnd = cur;
    }
  }

  // Add last
  const last: T = points[points.length - 1];
  output.push(last);

  return output;
}
