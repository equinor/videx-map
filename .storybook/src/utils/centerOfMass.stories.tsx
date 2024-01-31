import centerOfMass from '../../../src/utils/centerOfMass';
import earcut from 'earcut';
import Vector2 from '@equinor/videx-vector2';
import { flatten } from '@equinor/videx-linear-algebra';
import { create } from 'd3-selection';

export default { title: 'utils/centerOfMass' };

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Circle
export const Circle = () => {
  {
    const root = create('svg')
      .attr('width', '500px')
      .attr('height', '500px');

    const center = new Vector2(250, 250);

    const verts: Vector2[] = [];
    for (let i = 0; i < 360; i += 60) {
      const pos = Vector2.right
        .rescale(200)
        .rotateDeg(i)
        .add(center);
      verts.push(pos);
    }

    const tris = earcut(flatten(verts));

    for (let i = 0; i < tris.length; i += 3) {
      const a = verts[tris[i]];
      const b = verts[tris[i + 1]];
      const c = verts[tris[i + 2]];

      root.append('path')
        .attr('fill', 'Coral')
        .attr('stroke', 'FireBrick')
        .attr('d',`M${a.x},${a.y}L${b.x},${b.y}L${c.x},${c.y}Z`)
    }

    verts.forEach(pos => {
      root.append('circle')
        .attr('cx', pos.x)
        .attr('cy', pos.y)
        .attr('fill', 'FireBrick')
        .attr('r', 5);
    });

    const [com] = centerOfMass(verts, tris);
    root.append('circle')
        .attr('cx', com.x)
        .attr('cy', com.y)
        .attr('fill', 'Black')
        .attr('r', 5);

    return root.node();
  }
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Arrow
export const Arrow = () => {
  {
    const root = create('svg')
      .attr('width', '500px')
      .attr('height', '500px');

    const center = new Vector2(250, 250);

    const verts: Vector2[] = [
      new Vector2(50, 50),
      new Vector2(250, 450),
      new Vector2(450, 50),
      new Vector2(250, 150),
    ];

    const tris = earcut(flatten(verts));

    for (let i = 0; i < tris.length; i += 3) {
      const a = verts[tris[i]];
      const b = verts[tris[i + 1]];
      const c = verts[tris[i + 2]];

      root.append('path')
        .attr('fill', 'Coral')
        .attr('stroke', 'FireBrick')
        .attr('d',`M${a.x},${a.y}L${b.x},${b.y}L${c.x},${c.y}Z`)
    }

    verts.forEach(pos => {
      root.append('circle')
        .attr('cx', pos.x)
        .attr('cy', pos.y)
        .attr('fill', 'FireBrick')
        .attr('r', 5);
    });

    const [com] = centerOfMass(verts, tris);
    root.append('circle')
        .attr('cx', com.x)
        .attr('cy', com.y)
        .attr('fill', 'Black')
        .attr('r', 5);

    return root.node();
  }
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Letter T
export const LetterT = () => {
  {
    const root = create('svg')
      .attr('width', '500px')
      .attr('height', '500px');

    const center = new Vector2(250, 250);

    const verts: Vector2[] = [
      new Vector2(50, 50),
      new Vector2(450, 50),
      new Vector2(450, 100),
      new Vector2(275, 100),
      new Vector2(275, 450),
      new Vector2(225, 450),
      new Vector2(225, 100),
      new Vector2(50, 100),
    ];

    const tris = earcut(flatten(verts));

    for (let i = 0; i < tris.length; i += 3) {
      const a = verts[tris[i]];
      const b = verts[tris[i + 1]];
      const c = verts[tris[i + 2]];

      root.append('path')
        .attr('fill', 'Coral')
        .attr('stroke', 'FireBrick')
        .attr('d',`M${a.x},${a.y}L${b.x},${b.y}L${c.x},${c.y}Z`)
    }

    verts.forEach(pos => {
      root.append('circle')
        .attr('cx', pos.x)
        .attr('cy', pos.y)
        .attr('fill', 'FireBrick')
        .attr('r', 5);
    });

    const [com] = centerOfMass(verts, tris);
    root.append('circle')
      .attr('cx', com.x)
      .attr('cy', com.y)
      .attr('fill', 'Black')
      .attr('r', 5);

    return root.node();
  }
}
