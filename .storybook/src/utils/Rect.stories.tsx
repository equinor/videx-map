import Rect from '../../../src/utils/Rect';
import { create, pointer } from 'd3-selection';
import Vector2 from '@equinor/videx-vector2';

export default { title: 'utils/Rect' };

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
export const OnHover = () => {
  {
    const height: number = 200;
    const width: number = 200;

    const root = create('svg')
    .attr('height', `${height}px`)
    .attr('width', `${width}px`);

    const center: Vector2 = new Vector2(width * 0.5, height * 0.5);

    const rectWidth: number = 80;
    const rectHeight: number = 80;
    const rotation = -20;

    const right = Vector2.right
      .scale(rectWidth)
      .rotateDeg(rotation);

    const up = right.rescale(rectHeight)
      .rotate90();

    const lowerLeft = center.sub(right.scale(0.5)).sub(up.scale(0.5));
    const lowerRight = lowerLeft.add(right);
    const upperLeft = lowerLeft.add(up);
    const upperRight = lowerLeft.add(right).add(up);

    const rectangle = root.append('path')
      .attr('d', `
        M${lowerLeft.x},${lowerLeft.y}
        L${lowerRight.x},${lowerRight.y}
        L${upperRight.x},${upperRight.y}
        L${upperLeft.x},${upperLeft.y}Z
      `)
      .attr('fill', 'Olive');

    const rect = new Rect(lowerLeft, rectWidth, rectHeight, rotation);

    root.on('mousemove', (event) => {
      // @ts-ignore
      const mousePos = pointer(event);
      rectangle.attr('fill', rect.isInside(mousePos) ? 'Red' : 'Olive');
    })

    root.on('mouseout', d => {
      rectangle.attr('fill', 'Olive');
    })

    return root.node();
  }
}
