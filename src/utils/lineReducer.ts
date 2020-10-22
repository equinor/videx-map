import Vector2 from '@equinor/videx-vector2';
import { displacementToLineOrigin } from './linePoint';
import { VectorLike } from '@equinor/videx-linear-algebra';

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
    let cur: T = points[i];

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
};

/*
optimal(points: [number, number][] | Vector2[], maxAbsoluteDeviation: number): Vector2[] {
  let idx = 0; // Original index

  const _points = points.map(d => {
    return {
      point: d,
      index: idx++,
      consumed: [], // Points consumed. Increases deviation
    }
  });

  let curDeviation = 0;

  while (_points.length > 3) {
    let minDeviation = Infinity;
    let minIndex = -1; // Index of point to remove

    // Get point in current line with the smallest deviation
    for (let i = 0; i < _points.length - 2; i++ ) {
      const lineStart = _points[i].point;
      const lineEnd = _points[i + 2].point;
      const middle = _points[i + 1].point; // Point in the middle
      let deviation = DistanceToVector(middle, lineStart, lineEnd); // Deviation of removing point
      _points[i + 1].consumed.forEach(idx => { // Also add deviation of all consumed points
        deviation += DistanceToVector(points[idx], lineStart, lineEnd);
      })
      if (deviation < minDeviation) {
        minDeviation = deviation;
        minIndex = i + 1;
      }
    }

    curDeviation += minDeviation;
    if (curDeviation > maxAbsoluteDeviation) break;
    const originalIndex = _points[minIndex].index;
    const allConsumed = _points[minIndex].consumed;
    _points[minIndex - 1].consumed.push(originalIndex, ...allConsumed); // Push point and all consumed
    _points[minIndex + 1].consumed.push(originalIndex, ...allConsumed); // Push point and all consumed
    _points.splice(minIndex, 1); // Remove point
  }

  return _points.map(d => d.point);
}
*/
