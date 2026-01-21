import { Graphics } from 'pixi.js';
import Vector2 from '@equinor/videx-vector2';
import { LineInterpolator } from '../../../LineInterpolator';
import { DetailOptions } from './DetailOptions';
import { Detail } from './Detail';

export interface ShoeOptions extends DetailOptions {
  widthTop: number;
  widthBottom: number;
}

export class ShoeDetail extends Detail {
  private widthTop: number;
  private widthBottom: number;

  constructor(options: ShoeOptions, group: string = 'default') {
    super(options, group);

    this.widthTop = options.widthTop || 1;
    this.widthBottom = options.widthBottom || 1;
  }

  public getGraphics([top, bottom]: [number, number], interpolator: LineInterpolator) {
    const from = interpolator.GetPoint(top).position;
    const to = interpolator.GetPoint(bottom).position;

    const normal = Vector2.sub(to, from).rotate90().normalize();

    // Scaled normals
    const normalTop = normal.scale(this.widthTop);
    const normalBottom = normal.scale(this.widthBottom);

    // Define each corner of the shoe
    const from1 = Vector2.add(from, normalTop);
    const from2 = Vector2.sub(from, normalTop);
    const to1 = Vector2.add(to, normalBottom);
    const to2 = Vector2.sub(to, normalBottom);

    // Draw shoe
    return new Graphics()
      .fill({color: this.color, alpha: 1})
      .setStrokeStyle(0)
      .moveTo(from1.x, from1.y)
      .lineTo(to1.x, to1.y)
      .lineTo(to2.x, to2.y)
      .lineTo(from2.x, from2.y);
  }
}
