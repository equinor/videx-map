import Vector2 from '@equinor/videx-vector2';
import LineDictionary from '../../../src/utils/LineDictionary';

import { create, pointer, Selection } from 'd3-selection';

import { createNoise2D } from 'simplex-noise';

export default { title: 'utils/Line Dictionary' };

const width: number = 700;
const height: number = 700;

// Function for generating data
const perlinWorms: (amount: number) => Vector2[][] = (amount: number) => {
  // initialize the noise function
  const noise2D = createNoise2D();

  const lines: Vector2[][] = [];

  // N perlin worms
  for (let i: number = 0; i < amount; i++) {

    // Random start position
    const baseX: number = Math.floor(10 + Math.random() * (width - 20));
    const baseY: number = Math.floor(10 + Math.random() * (height - 20));
    let pos: Vector2 = new Vector2(baseX, baseY);

    // Random direction
    let dir: Vector2 = Vector2.right
      .rescale(10)
      .rotate(Math.random() * Math.PI * 2);

    // Add first
    const line: Vector2[] = [
      pos,
    ];

    // 50 iterations
    for (let j: number = 0; j < 50; j++) {
      pos = pos.add(dir);
      dir = dir.rotate(noise2D(pos.x * 0.1, pos.y * 0.1));
      // Don't add line sections outside
      if (pos.x < 0 || pos.y < 0 || pos.x >= width || pos.y >= height) break;
      line.push(pos);
    }

    lines.push(line);
  }
  return lines;
}

const lineData  = perlinWorms(100);

interface lineRender {
  line: Vector2[],
  render: Selection<SVGPathElement, undefined, null, undefined>,
}

export const Lines = () => {
  {
    const root: Selection<HTMLDivElement, undefined, null, undefined> = create('div')

    root.append('div')
      .style('height', '25px')
      .style('font-weight', 'bold')
      .text('Using line dictionary:');

    const initializationDiv: Selection<HTMLDivElement, undefined, null, undefined> = root.append('div')
      .style('height', '25px');

    const lookupPerformanceDiv: Selection<HTMLDivElement, undefined, null, undefined> = root.append('div')
      .style('height', '25px')
      .text('Look-up performance: ---');

    let prevSelection: Selection<SVGPathElement, undefined, null, undefined>;

    // Lines
    const lines: lineRender[] = [];

    const svg: Selection<SVGSVGElement, undefined, null, undefined> = root.append('svg')
      .style('width', `${width}px`)
      .style('height', `${height}px`)
      .style('border', '2px dotted DimGrey')
      .on('mouseout', () => {
        if (prevSelection) {
          prevSelection.attr('stroke', 'SteelBlue')
          .attr('stroke-width', 1);
        }
      })
      .on('mousemove', (event) => {
        // Undo previous selection
        if (prevSelection) {
          prevSelection.attr('stroke', 'SteelBlue')
          .attr('stroke-width', 1);
        }

        // @ts-ignore
        const mousePos: [number, number] = pointer(event);
        const t0: number = performance.now();
        const latLong = new Vector2(mousePos[0], mousePos[1]);
        const closestObj = dict.getClosest(latLong);
        const t1: number = performance.now();
        lookupPerformanceDiv.text(`Look-up performance: ${(t1 - t0).toFixed(2)} ms`);
        if(closestObj === undefined) return;

        // Color line
        closestObj.attr('stroke', 'Tomato')
          .attr('stroke-width', 1.5);

        prevSelection = closestObj;
      });

    // Line function
    const appendLine: (x1: number, y1: number, x2: number, y2: number, color: string) => void = (x1: number, y1: number, x2: number, y2: number, color: string) => {
      svg.append('line')
       .attr('x1', x1).attr('y1', y1)
       .attr('x2', x2).attr('y2', y2)
       .attr('stroke', color)
       .attr('pointer-events', 'none');
    }

    // Append grid
    for (let x = 100; x < width; x+=100) appendLine(x, 0, x, height, 'LightGrey');
    for (let y = 100; y < height; y+=100) appendLine(0, y, width, y, 'LightGrey');

    // Draw lines
    for (let n: number = 0; n < lineData.length; n++) {

      const line: Vector2[] = lineData[n];

      const first: Vector2 = line[0];
      let path = `M${first[0]},${first[1]}`;

      for (let i = 1; i < line.length; i++) {
        const pos: Vector2 = line[i];
        path += `L${pos[0]},${pos[1]}`;
      }

      lines.push({
        line,
        render: svg.append('path')
          .attr('d', path)
          .attr('fill', 'none')
          .attr('stroke', 'SteelBlue')
          .attr('stroke-width', 1)
          .attr('pointer-events', 'none'),
      });
    };

    const init0: number = performance.now(); // Init timer start
    const dict: LineDictionary<Selection<SVGPathElement, undefined, null, undefined>> = new LineDictionary();

    lines.forEach(line => {
      dict.add(line.line, line.render);
    });
    const init1: number = performance.now(); // Init timer end

    initializationDiv.text(`Initialization: ${(init1 - init0).toFixed(2)} ms`);

    return root.node();
  }
}
