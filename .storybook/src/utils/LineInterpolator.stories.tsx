
import Vector2 from '@equinor/videx-vector2';
import { LineInterpolator } from '../../../src/utils/LineInterpolator';

import * as d3 from 'd3';

export default { title: 'utils/Line Interpolator' };

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// CIRCLE
export const Circle = () => {
  {
    const points: Vector2[] = [];

    const center = new Vector2(250, 250);

    // Generate a set of points along a circle
    for(let i = 0; i <= 260; i += 20) {
      points.push(
        Vector2.right
          .rotateDeg(i)
          .rescale(200)
          .add(center)
      );
    }

    // Create the line interpolator
    const interp: LineInterpolator = new LineInterpolator(points, 0.001);

    const svg = d3.create('svg')
      .attr('width', '500px')
      .attr('height', '500px')

    const line = interp.GetSection(0.5, 0.75);
    for (let i = 1; i < line.length; i++) { // Iterate over line points
      const cur = line[i];
      const prev = line[i - 1];
      svg.append('line')
        .attr('x1', prev.position.x)
        .attr('y1', prev.position.y)
        .attr('x2', cur.position.x)
        .attr('y2', cur.position.y)
        .attr('stroke', 'OliveDrab')
        .attr('stroke-width', 2)
    }

    line.forEach(l => {
      if (!l.direction) return;
      const nrm = l.direction.rotate270();
      svg.append('line')
        .attr('x1', l.position.x)
        .attr('y1', l.position.y)
        .attr('x2', l.position.x + nrm.x * 30)
        .attr('y2', l.position.y + nrm.y * 30)
        .attr('opacity', 0.4)
        .attr('stroke', 'FireBrick')
        .attr('stroke-width', 2)
    });

    // Draw general points
    points.forEach(p => {
      svg.append('circle')
        .attr('cx', p.x)
        .attr('cy', p.y)
        .attr('r', 5)
        .attr('fill', 'DimGrey')
    });

    const point2 = interp.GetPoint(0.25).position;
    svg.append('circle')
      .attr('cx', point2.x)
      .attr('cy', point2.y)
      .attr('r', 5)
      .attr('fill', 'SteelBlue');

    const point3 = interp.GetPointFromEnd(100).position;
    svg.append('circle')
      .attr('cx', point3.x)
      .attr('cy', point3.y)
      .attr('r', 5)
      .attr('fill', 'FireBrick');

    return svg.node();
  }
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// TICKS
export const Ticks = () => {
  {
    const points = [];

    // Generate a set of points along a circle
    for(let i = 20; i <= 780; i += 40) {
      points.push(new Vector2(i, 100 + 30 * Math.sin(i * .02)));
    }

    // Create the line interpolator
    const interp = new LineInterpolator(points, 0.001);

    const svg = d3.create('svg')
      // .style('background-color', 'red').style('opacity', .5)
      .attr('width', '800px')
      .attr('height', '200px')

    // Draw general points
    points.forEach(p => {
      svg.append('circle')
        .attr('cx', p.x)
        .attr('cy', p.y)
        .attr('r', 5)
        .attr('fill', 'DimGrey')
    });

    for(let i = 0.1; i <= 0.9; i += 0.1) {
      const point = interp.GetPoint(i);
      const pos = point.position;
      const dir = point.direction.rescale(2);
      const norm = dir.rotate90().rescale(40); // Rotate direction and rescale

      // Calculate points
      const ll = pos.sub(dir).sub(norm); // Lower left
      const lr = pos.add(dir).sub(norm); // Lower right
      const ur = pos.add(dir).add(norm); // Upper right
      const ul = pos.sub(dir).add(norm); // Upper left

      svg.append('polygon')
        .attr('points', `${ll.x},${ll.y} ${lr.x},${lr.y} ${ur.x},${ur.y} ${ul.x},${ul.y}`)
        .attr('fill', 'White')
        .attr('fill', 'OliveDrab')
    }

    return svg.node();
  }
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// TICKS
export const Waves = () => {
  {
    const points = [];

    // Generate a set of points along a circle
    for(let i = 20; i <= 780; i += 20) {
      points.push(new Vector2(i, 100 + 30 * Math.sin(i * .02)));
    }

    // Create the line interpolator
    const interp = new LineInterpolator(points, 0.001);

    const svg = d3.create('svg')
      // .style('background-color', 'red').style('opacity', .5)
      .attr('width', '800px')
      .attr('height', '200px')

    const range = interp.GetRangeFromStart(0.1, 300, 21);
    range.forEach(p => {
        svg.append('circle')
        .attr('cx', p.position.x)
        .attr('cy', p.position.y - 40)
        .attr('r', 5)
        .attr('fill', 'OliveDrab')
    })

    const range2 = interp.GetRangeFromStart(0.52, 300, 7);
    range2.forEach(p => {
        svg.append('circle')
        .attr('cx', p.position.x)
        .attr('cy', p.position.y - 40)
        .attr('r', 5)
        .attr('fill', 'FireBrick')
    })

    // Draw general points
    points.forEach(p => {
      svg.append('circle')
        .attr('cx', p.x)
        .attr('cy', p.y)
        .attr('r', 5)
        .attr('fill', 'DimGrey')
    });

    return svg.node();
  }
}
