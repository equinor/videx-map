import * as PIXI from 'pixi.js';
import { Color } from '../Colors';

export interface State {
  zoom: number;
  scale: number;
  visible: boolean;

  /** Displacement from root. */
  rootDisplacement: number;
}

/** Common configurations. */
export interface Common {
  backgroundOpacity: number;
}

export class Label {

  public static state: State = {
    zoom: 1,
    scale: 1,
    visible: true,
    rootDisplacement: 1,
  };

  static config: Common = { backgroundOpacity: 0.5 };

  text: PIXI.Text | PIXI.BitmapText;
  background: PIXI.Graphics;

  private _attachToRoot: boolean = false;

  static setStyle(fontSize: number) {

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

  }

  createBackground(bgColor: number){
    // Background
    const background = new PIXI.Graphics();
    background.beginFill(0xFFFFFF);
    background.drawRect(-this.width * 0.55, -this.height * 0.525, this.width * 1.1, this.height * 1.05);
    background.endFill();
    background.visible = this.visible;
    background.alpha = Label.config.backgroundOpacity;
    background.tint = bgColor;
    background.zIndex = 0;
    this.background = background;
  }

  get width() {
    return 0;
  }

  get height() {
    return 0;
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
