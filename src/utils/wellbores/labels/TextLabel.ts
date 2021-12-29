import * as PIXI from 'pixi.js';

import { Label } from './label';

export class TextLabel extends Label {

  private static style: PIXI.TextStyle;

  metrics: PIXI.TextMetrics;

  static setStyle(fontSize: number) {
    TextLabel.style = new PIXI.TextStyle({
      fontFamily : 'Arial',
      fontSize: fontSize,
      fill: 0xFFFFFF, // Initially white to use tint
      align : 'center'
    });
  }

  /**
   * Create a new label
   * @param label Content of label
   * @param fontColor Color of font
   * @param bgColor Color of background
   */
  constructor (label: string, fontColor: number, bgColor: number) {
    super(label, fontColor, bgColor);
    // Label
    const text: PIXI.Text = new PIXI.Text(label, TextLabel.style);
    //text.resolution = window.devicePixelRatio; // Increases text resolution
    text.visible = Label.state.visible;
    text.tint = fontColor;
    text.zIndex = 1;
    this.text = text;

    // Metrics
    const metrics = PIXI.TextMetrics.measureText(label, TextLabel.style);
    this.metrics = metrics;

    this.createBackground(bgColor);
  }

  get width() {
    return this.metrics.width;
  }

  get height() {
    return this.metrics.height;
  }
}
