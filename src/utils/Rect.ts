import Vector2 from '@equinor/videx-vector2';
import { VectorLike } from '@equinor/videx-linear-algebra';

export default class Rect {
  lowerLeft: Vector2;
  width: number;
  height: number;
  rotation: number;

  // TODO: Find point inside boundary, and overlap. Find by inverse rotating vector to line and evaluate.

  constructor(lowerLeft: Vector2, width: number, height: number, rotation: number) {
    this.lowerLeft = lowerLeft;
    this.width = width;
    this.height = height;
    this.rotation = rotation;
  }

  /**
   * Check if a point is inside.
   * @param vector Vector to evaluate
   * @returns True if point is inside rectangle
   */
  isInside(vector: VectorLike): boolean

  /**
   * Check if a point is inside.
   * @param x X position to evaluate
   * @param y Y position to evaluate
   * @returns True if point is inside rectangle
   */
  isInside(x: number, y: number): boolean

  isInside(a: number | VectorLike, b?: number): boolean {
    let local: Vector2;

    // Get point
    if (typeof a === 'number') {
      local = this.inverseTransformPoint(a, b);
    } else {
      local = this.inverseTransformPoint(a[0], a[1]);
    }

    return !(
      local[0] < 0 ||
      local[1] < 0 ||
      local[0] > this.width ||
      local[1] > this.height
    );
  }

  /**
   * Transforms position from world space to local space.
   * @param position
   */
  inverseTransformPoint(x: number, y: number): Vector2 {
    return new Vector2(x, y).mutable
      .sub(this.lowerLeft)
      .rotateDeg(-this.rotation) // Counter rotate
      .immutable;
  }
}
