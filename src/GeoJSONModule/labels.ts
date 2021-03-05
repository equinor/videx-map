import * as PIXI from 'pixi.js';
import {v4 as uuidv4} from 'uuid';
import Vector2 from '@equinor/videx-vector2';

/** Data for label. */
export type GeoJSONLabelData = {
  position: Vector2;
  mass: number;
}

interface Label {
  name: string;
  position: Vector2;
  instance?: PIXI.BitmapText;
}

/** Class used to manage field labels. Handles scaling and grouping of labels. */
export default class GeoJSONLabels {

  /**PIXI container  to hold all labels*/
  container: PIXI.Container;

  /** The textstyle used for labels. */
  textStyle: PIXI.TextStyle;

  /** The font used for labels. */
  font: PIXI.BitmapFont;

  /** font name */
  fontName: string;

  /** Scale of labels when size is set to 1. */
  baseScale: number;

  /** Collection of single-polygon fields. */
  labels: Label[] = [];

  /** Visibility */
  visible: boolean = true;

  /** construct a new label container. */
  constructor(root: PIXI.Container, textStyle: PIXI.TextStyle, baseScale: number, fontName?: string) {
    this.container = new PIXI.Container();
    this.container.sortableChildren = false;
    root.addChild(this.container);

    this.textStyle = textStyle;
    this.baseScale = baseScale;
    this.fontName = fontName || uuidv4();
    this.font = PIXI.BitmapFont.from(this.fontName, this.textStyle, {resolution: window.devicePixelRatio, chars: PIXI.BitmapFont.ASCII});
  }

  /**
   * Add a new label.
   * @param name label name
   * @param data Data for each label
   */
  addLabel(name: string, data: GeoJSONLabelData) { // Single-polygon
      this.labels.push({
        name,
        position: data.position,
        instance: null,
      });
  }

  /**
   * Draw all labels
   * @param root Target root for labels
   */
  draw() {
    // Function for drawing single label
    const drawLabel = (name: string, position: Vector2) => {
      const instance: PIXI.BitmapText = new PIXI.BitmapText(name, {fontName: this.fontName});
      instance.position.set(position[0], position[1]);
      instance.scale.set(this.baseScale);
      // instance.anchor.set(0.5);
      instance.zIndex = 1000; // High z-index
      this.container.addChild(instance);
      return instance;
    };

    // Draw single-polygon labels
    this.labels.forEach(label => {
      label.instance = drawLabel(label.name, label.position);
    });
  }


  hideLabels() {
    this.container.visible = false
    this.visible = false;
  }

  showLabels() {
    this.container.visible = true
    this.visible = true;
  }
}
