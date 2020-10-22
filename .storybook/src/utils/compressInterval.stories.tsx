import { compressIntervals } from '../../../src/utils/wellbores/intervals';
import * as d3 from 'd3';

export default { title: 'utils/compressInterval' };

const intervals: [number, number][] = [
  [0.5038362007755104, 0.5646949758012324],
  [0.5147306063801429, 0.5795326645752564],
  [0.5646949758012324, 0.6349754382877081],
  [0.5795326645752564, 0.6458696193359563],
  [0.6349754382877081, 0.7239945393031167],
  [0.6458696193359563, 0.7348885935177998],
  [0.7239945393031167, 0.8166263611915113],
  [0.7348885935177998, 0.8275210846926794],
  [0.8166263611915113, 0.9089055221583787],
  [0.8275210846926794, 0.9197946911502879],
  [0.9089055221583787, 0.9934476589888107],
  [0.9197946911502879, 1],
];

const intervals2: [number, number][] = [
  [0.05, 0.1],
  [0.125, 0.25],
  [0.2, 0.3],
  [0.4, 0.45],
  [0.425, 0.5],
  [0.425, 0.5],
  [0.6, 0.85],
  [0.67, 0.72],
  [0.75, 0.81],
  [0.84, 0.91],
  [0.93, 0.99],
]

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Interval 1
export const Interval1 = () => {
  {
    const barHeight: number = 15;
    const height: number = barHeight * intervals.length;
    const root: d3.Selection<HTMLDivElement, undefined, null, undefined> = d3.create('div');

    root.append('p')
      .html('<b>Before</b> compression:')

    const svg: d3.Selection<SVGSVGElement, undefined, null, undefined> = root.append('svg')
      .attr('width', '800px')
      .attr('height', `${height}px`)
      .style('border', '2px dotted DimGrey')
      .style('padding', '5px')

    for (let i: number = 0; i < intervals.length; i++) {
      const start: number = intervals[i][0] * 800;
      const end: number = intervals[i][1] * 800;
      svg.append('polygon')
      .attr('points', `
        ${start},${barHeight * i}
        ${end},${barHeight * i}
        ${end},${barHeight * (i + 1)}
        ${start},${barHeight * (i + 1)}
      `)
      .attr('fill', d3.interpolateRainbow(i / intervals.length))
    }

    // Compressed
    const compressed: [number, number][] = compressIntervals(intervals);
    const compressedHeight: number = barHeight * compressed.length;

    root.append('p')
      .html('<b>After</b> compression:')

    const compressedSvg: d3.Selection<SVGSVGElement, undefined, null, undefined> = root.append('svg')
      .attr('width', '800px')
      .attr('height', `${compressedHeight}px`)
      .style('border', '2px dotted DimGrey')
      .style('padding', '5px')

    for (let i: number = 0; i < compressed.length; i++) {
      const start: number = compressed[i][0] * 800;
      const end: number = compressed[i][1] * 800;
      compressedSvg.append('polygon')
      .attr('points', `
        ${start},${barHeight * i}
        ${end},${barHeight * i}
        ${end},${barHeight * (i + 1)}
        ${start},${barHeight * (i + 1)}
      `)
      .attr('fill', d3.interpolateRainbow(i / compressed.length))
    }

    return root.node();
  }
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Interval 2
export const Interval2 = () => {
  {
    const barHeight: number = 15;
    const height: number = barHeight * intervals2.length;
    const root: d3.Selection<HTMLDivElement, undefined, null, undefined> = d3.create('div');

    root.append('p')
      .html('<b>Before</b> compression:')

    const svg: d3.Selection<SVGSVGElement, undefined, null, undefined> = root.append('svg')
      .attr('width', '800px')
      .attr('height', `${height}px`)
      .style('border', '2px dotted DimGrey')
      .style('padding', '5px')

    for (let i: number = 0; i < intervals2.length; i++) {
      const start: number = intervals2[i][0] * 800;
      const end: number = intervals2[i][1] * 800;
      svg.append('polygon')
      .attr('points', `
        ${start},${barHeight * i}
        ${end},${barHeight * i}
        ${end},${barHeight * (i + 1)}
        ${start},${barHeight * (i + 1)}
      `)
      .attr('fill', d3.interpolateRainbow(i / intervals2.length))
    }

    // Compressed
    const compressed: [number, number][] = compressIntervals(intervals2);
    const compressedHeight: number = barHeight * compressed.length;

    root.append('p')
      .html('<b>After</b> compression:')

    const compressedSvg: d3.Selection<SVGSVGElement, undefined, null, undefined> = root.append('svg')
      .attr('width', '800px')
      .attr('height', `${compressedHeight}px`)
      .style('border', '2px dotted DimGrey')
      .style('padding', '5px')

    for (let i: number = 0; i < compressed.length; i++) {
      const start: number = compressed[i][0] * 800;
      const end: number = compressed[i][1] * 800;
      compressedSvg.append('polygon')
      .attr('points', `
        ${start},${barHeight * i}
        ${end},${barHeight * i}
        ${end},${barHeight * (i + 1)}
        ${start},${barHeight * (i + 1)}
      `)
      .attr('fill', d3.interpolateRainbow(i / compressed.length))
    }

    return root.node();
  }
}
