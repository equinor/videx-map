import * as PIXI from 'pixi.js';
import { Color } from '../Colors';

interface State {
  zoom: number;
  scale: number;
  visible: boolean;

  /** Displacement from root. */
  rootDisplacement: number;
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
    rootDisplacement: 1,
  };

  private static style: PIXI.TextStyle;

  static config: Common;
  static height: number; // Height of labels

  container: PIXI.Container;
  private text: PIXI.Text;
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
    // Metrics
    const metrics = PIXI.TextMetrics.measureText(label, Label.style);
    this.metrics = metrics;

    const container = new PIXI.Container();
    container.visible = Label.state.visible;
    container.zIndex = 0;
    this.container = container;

    // Background
    const background = new PIXI.Graphics();
    background.beginFill(0xFFFFFF);
    background.drawRect(-metrics.width * 0.55, -Label.height * 0.525, metrics.width * 1.1, Label.height * 1.05);
    background.endFill();
    background.alpha = Label.config.backgroundOpacity;
    background.tint = bgColor;
    this.background = background;

    // Label
    const text: PIXI.Text = new PIXI.Text(label, Label.style);
    text.resolution = window.devicePixelRatio; // Increases text resolution
    text.tint = fontColor;
    text.anchor.set(0.5);
    this.text = text;

    // Add to container
    container.addChild(background, text);
  }

  get visible() {
    return this.container.visible;
  }

  set visible(flag) {
    this.container.visible = (flag && Label.state.visible);
  }

  set fontColor(color: number) {
    this.text.tint = color;
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
    const { y, width, height } = this.container;
    const x = this.container.x - width / 2;
    return new PIXI.Rectangle(x, y, width, height);
  }
}
