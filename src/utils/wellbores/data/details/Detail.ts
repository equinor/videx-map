import * as PIXI from 'pixi.js';
import { SourceData } from '../SourceData';
import { LineInterpolator } from '../../../LineInterpolator';
import { DetailOptions, RelativePosition } from './DetailOptions';

/** Detail represents graphics displayed along the wellbore, such as casing. */
export abstract class Detail {
  public initialized: boolean = false;
  public visible: boolean = false;

  protected getData: (wellbore: SourceData, group: string) => RelativePosition[];
  protected color: PIXI.Color;
  protected group: string;

  constructor(options: DetailOptions, group: string = 'default') {
    this.getData = options.getData;
    this.color = new PIXI.Color(options.color || [0, 0, 0]);

    this.group = group;
  }

  /**
   * Obtain the relative position along the wellbore required for rendering graphics.
   * @param wellbore - Source data for the wellbore
   * @returns Relative position along the wellbore needed for drawing graphics
   */
  public getRelative(wellbore: SourceData): RelativePosition[] {
    return this.getData(wellbore, this.group);
  }

  public abstract getGraphics(relative: RelativePosition, interpolator: LineInterpolator) : PIXI.Graphics;
}
