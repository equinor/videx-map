/* eslint-disable no-magic-numbers, @typescript-eslint/no-explicit-any */
import Vector2 from '@equinor/videx-vector2';
import * as PIXI from 'pixi.js';

/**
 *
 * @param center
 * @param radius
 * @param uniformRadius Fraction of full radius used by uniform initially
 * @return New circle mesh with shader uniforms attached
 */
export default function generateCircle(center: Vector2, radius: number, shader: any): PIXI.Mesh {
  // Winding order:
  // 2    3
  //
  // 0    1

  // Define geometry
  const geometry = new PIXI.Geometry();
  geometry.addAttribute('verts', [
    center[0] - radius, center[1] - radius,
    center[0] + radius, center[1] - radius,
    center[0] - radius, center[1] + radius,
    center[0] + radius, center[1] + radius,
  ], 2);
  geometry.addAttribute('inputUVs', [
    0, 0,
    1, 0,
    0, 1,
    1, 1,
  ], 2);
  geometry.addIndex([0, 2, 3, 0, 3, 1]);

  const circle = new PIXI.Mesh(geometry, shader);

  return circle;
}
