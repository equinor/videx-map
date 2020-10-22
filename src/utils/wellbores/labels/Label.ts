import * as PIXI from 'pixi.js';
import { Color } from '../Colors';

interface State {
  zoom: number;
  scale: number;
  visible: boolean;
}

/** Common configurations. */
interface Common {
  backgroundOpacity: number;
}

export class Label {

  public static state: State = {
    zoom: 1,
    scale: 1,
    visible: true,
  };

  private static style: PIXI.TextStyle;

  static config: Common;
  static height: number; // Height of labels

  text: PIXI.Text;
  background: PIXI.Graphics;
  metrics: PIXI.TextMetrics;

  private _attachToRoot: boolean = false;

  static setStyle(fontSize: number) {
    Label.style = new PIXI.TextStyle({
      fontFamily : 'Arial',
      fontSize: fontSize,
      fill: 0xFFFFFF, // Initially white to use tint
      align : 'center'
    });
    Label.height = PIXI.TextMetrics.measureText(' ', Label.style).height;
  }

  static setCommon(config: Common) {
    Label.config = config;
  }

  /**
   * Create a new label
   * @param label Content of label
   * @param fontColor Color of font
   * @param bgColor Color of background
   */
  constructor (label: string, fontColor: number, bgColor: number) {
    // Label
    const text: PIXI.Text = new PIXI.Text(label, Label.style);
    text.resolution = window.devicePixelRatio; // Increases text resolution
    text.visible = Label.state.visible;
    text.tint = fontColor;
    text.zIndex = 1;
    this.text = text;

    // Metrics
    const metrics = PIXI.TextMetrics.measureText(label, Label.style);
    this.metrics = metrics;

    // Background
    const background = new PIXI.Graphics();
    background.beginFill(0xFFFFFF);
    background.drawRect(-metrics.width * 0.55, -Label.height * 0.525, metrics.width * 1.1, Label.height * 1.05);
    background.endFill();
    background.visible = Label.state.visible;
    background.alpha = Label.config.backgroundOpacity;
    background.tint = bgColor;
    background.zIndex = 0;
    this.background = background;
  }

  get visible() {
    return this.text.visible;
  }

  set visible(flag) {
    this.text.visible = flag && Label.state.visible;
    this.background.visible = flag && Label.state.visible;
  }

  get attachToRoot() {
    return this._attachToRoot;
  }

  set attachToRoot(val: boolean) {
    if (val !== this._attachToRoot) {
      this._attachToRoot = val;
    }
  }

  getBoundingBox() {
    const { y, width, height } = this.background;
    const x = this.background.x - width / 2;
    return new PIXI.Rectangle(x, y, width, height);
  }
}
