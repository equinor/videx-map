/* eslint-disable no-magic-numbers */
import Vector2 from '@equinor/videx-vector2';

/**
 * Get the center of mass of a polygon.
 * @param vertices Vertices of polygon
 * @param triangles Triangles of polygon
 * @returns Center of mass and mass of polygon
 */
export default function centerOfMass(vertices: Vector2[], triangles: number[]): [Vector2, number] {
  let comX = 0;
  let comY = 0;
  let totalMass = 0;

  for (let i = 0; i < triangles.length; i += 3) {
    const a = vertices[triangles[i]];
    const b = vertices[triangles[i + 1]];
    const c = vertices[triangles[i + 2]];

    const ab = Vector2.sub(b, a);
    const ac = Vector2.sub(c, a);

    const mass: number = Vector2.cross(ab, ac) * 0.5;
    comX += mass * (a.x + b.x + c.x) / 3;
    comY += mass * (a.y + b.y + c.y) / 3;
    totalMass += mass;
  }

  return [new Vector2(comX / totalMass, comY / totalMass), totalMass];
}
