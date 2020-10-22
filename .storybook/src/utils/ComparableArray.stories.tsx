import ComparableArray from '../../../src/utils/ComparableArray';
import * as d3 from 'd3';

export default { title: 'utils/ComparableArray' };

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
export const layer = () => {
  {
    const height: number = 200;
    const width: number = 200;

    const root = d3.create('div')
    .attr('height', `${height}px`)
    .attr('width', `${width}px`);

    const objs = [
      {a: 2, b: 'test'},
      {a: 3, b: 'test'},
      {a: 1, b: 'test'},
    ];

    const arr = [2, 3];

    const a = new ComparableArray(objs, true, d => d.a);


    root.append('div')
      .style('margin-bottom', '20px')
      .html(
        `const objs = [<br>
          &nbsp;&nbsp;&nbsp;&nbsp;{a: 2, b: 'test'},<br>
          &nbsp;&nbsp;&nbsp;&nbsp;{a: 3, b: 'test'},<br>
          &nbsp;&nbsp;&nbsp;&nbsp;{a: 1, b: 'test'},<br>
        ];`
      );

    root.append('div')
      .style('margin-bottom', '20px')
      .html(
        `const arr = [${arr.toString()}]`,
      );

    root.append('div')
      .style('margin-bottom', '20px')
      .html(
        `objs = arr&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;${a.compare(arr)}`,
      );

    return root.node();
  }
}
