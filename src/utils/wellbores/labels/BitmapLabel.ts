import * as PIXI from 'pixi.js';
import { Label } from './label';

export class BitmapLabel extends Label {
  private static font: PIXI.BitmapFont;

  static setStyle(fontSize: number) {
    BitmapLabel.font = PIXI.BitmapFont.from('BitmapLabelFont', {
      fontFamily: 'Arial',
      fontSize: fontSize,
      fill: 0xFFFFFF, // Initially white to use tint
    }, { chars: PIXI.BitmapFont.ASCII });
  }

  /**
   * Create a new label
   * @param label Content of label
   * @param fontColor Color of font
   * @param bgColor Color of background
   */
  constructor (label: string, fontColor: number, bgColor: number) {
    super(label, fontColor, bgColor);
    const {visible} = BitmapLabel.state;
    // Label
    const text: PIXI.BitmapText = new PIXI.BitmapText(label, { fontName: 'BitmapLabelFont', align : 'center', tint: fontColor });
    //text.resolution = window.devicePixelRatio; // Increases text resolution
    text.visible = visible;
    text.zIndex = 1;
    this.text = text;

    this.createBackground(bgColor);
  }

  get width() {
    return (this.text as PIXI.BitmapText).textWidth;
  }

  get height() {
    return (this.text as PIXI.BitmapText).textHeight;
  }

}
