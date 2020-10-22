import Vector2 from '@equinor/videx-vector2';
import { closestPointOnLine } from '../../../src/utils/linePoint';

import * as d3 from 'd3';

export default { title: 'utils/linePoint' };

const line = {
  start: new Vector2(100, 200),
  end: new Vector2(360, 370),
};

export const ClosestPointOnLine = () => {
  const width = 500;
  const height = 500;

  let pointer: d3.Selection<SVGCircleElement, undefined, null, undefined>;
  let pointerLine: d3.Selection<SVGLineElement, undefined, null, undefined>;

  const root = d3.create('div')

  const distanceDiv = root.append('div')
    .style('height', '25px')
    .text('Distance: ---');

  const performanceDiv = root.append('div')
    .style('height', '25px')
    .text('Performance: ---');

  const svg = root.append('svg')
    .style('width', `${width}px`)
    .style('height', `${height}px`)
    .style('border', '2px dotted DimGrey')
    .on('mouseout', () => {
      pointer.attr('opacity', 0);
      pointerLine.attr('opacity', 0);
    })
    .on('mousemove', (event) => {
      // @ts-ignore
      const mousePos = d3.pointer(event);

      const point = new Vector2(mousePos[0] - 1, mousePos[1])

      const t0 = performance.now();
      const pointOnLine = closestPointOnLine(point, line.start, line.end);
      const t1 = performance.now();

      distanceDiv.text(`Distance: ${Vector2.distance(point, pointOnLine).toFixed(2)}`);
      performanceDiv.text(`Performance: ${(t1 - t0).toFixed(3)}`);

      pointer.attr('opacity', 1)
        .attr('cx', point.x)
        .attr('cy', point.y)

      pointerLine.attr('opacity', 1)
        .attr('x1', point.x)
        .attr('y1', point.y)
        .attr('x2', pointOnLine[0])
        .attr('y2', pointOnLine[1]);
    })

  // Append a line
  svg.append('line')
    .attr('x1', line.start.x)
    .attr('y1', line.start.y)
    .attr('x2', line.end.x)
    .attr('y2', line.end.y)
    .attr('stroke', 'SteelBlue')
    .attr('stroke-width', 1.3)
    .attr('pointer-events', 'none');

  // Mouse pointer
  pointer = svg.append('circle')
    .attr('cx', 100)
    .attr('cy', 100)
    .attr('r', 3)
    .attr('fill', 'OrangeRed')
    .attr('opacity', 0)
    .attr('pointer-events', 'none');

  // Line from point
  pointerLine = svg.append('line')
    .attr('stroke', 'OrangeRed')
    .attr('stroke-width', 1.3)
    .attr('pointer-events', 'none')
    .attr('opacity', 0);

  return root.node();
};
