import * as PIXI from 'pixi.js';
import Vector2 from '@equinor/videx-vector2';
import { SourceData } from './SourceData';
import { RootData } from './RootData';
import { Group } from './Group';
import { processIntervals } from '../intervals';
import { LineInterpolator } from '../../LineInterpolator';
import { WellboreMesh } from '../../WellboreMesh';
import { getWellboreShader, WellboreUniforms } from '../Shader';
import { Label } from '../labels/Label';
import { Colors, Color } from '../Colors';
import { TickConfig } from '../Config';

export interface WellboreDataInput {
  data: SourceData,
  group: Group,
  root: RootData,
  /** Projected coordinates. */
  coords: Vector2[],
  /** Threshold for radius considered to be single point. */
  pointThreshold: number;
  wellboreWidth: number;
  tick: TickConfig;
}

export enum WellboreStatus {
  normal, highlighted, multiHighlighted, selected
}

/** Current filter status. Soft leaves gray wellbores, while hard leaves "ghost"-lines */
export enum FilterStatus {
  none, soft, hard,
}

export class WellboreData {
  data: SourceData;
  group: Group;
  wellboreWidth: number;
  interpolator: LineInterpolator;
  mesh: PIXI.Mesh;
  label: Label;
  private _zIndex: number = 0;

  root: RootData;
  status: WellboreStatus = WellboreStatus.normal;
  private filter: FilterStatus = FilterStatus.none;

  constructor(input: WellboreDataInput) {
    this.data = input.data;
    this.group = input.group;
    this.root = input.root;
    this.wellboreWidth = input.wellboreWidth;
    this.interpolator = new LineInterpolator(input.coords, input.pointThreshold);

    this.label = new Label(input.data.labelShort, this.colors.fontColor, this.colors.default.labelBg);

    if (this.interpolator.singlePoint) {
      this.label.attachToRoot = true;
    } else {
      const intervals = processIntervals(input.data.intervals);
      this.mesh = this.createWellboreMesh(intervals, input.tick);
    }

    // Update WellboreData with current state
    this.update();
  }

  set zIndex (val: number) {
    this._zIndex = val;
    if (this.mesh) this.mesh.zIndex = this._zIndex;
  }

  get colors(): Colors {
    return this.group.colors;
  }

  get color(): Color {
    const { colors } = this.group;

    switch (this.status) {
      case WellboreStatus.normal:
        return colors.default;
      case WellboreStatus.highlighted:
        return colors.highlight;
      case WellboreStatus.multiHighlighted:
        return colors.multiHighlight;
      case WellboreStatus.selected:
        return colors.selected;
    }
  }

  get active(): boolean {
    const activeUniform = (this.mesh && this.mesh.shader.uniforms.status == 0);
    return this.group.active && (activeUniform || this.filter === FilterStatus.none);
  }

  setFilter(filter: FilterStatus) {
    if (this.filter === filter) return; // If flag is duplicate
    this.filter = filter;
    this.update();
  }

  get selected(): boolean {
    return this.status == WellboreStatus.selected;
  }

  get highlighted(): boolean {
    return this.status == WellboreStatus.highlighted || this.status == WellboreStatus.multiHighlighted;
  }

  get order() {
    return this.group.order;
  }

  get uniforms(): WellboreUniforms {
    return this.mesh.shader.uniforms;
  }

  private createWellboreMesh(intervals: [number, number][], tick: TickConfig): PIXI.Mesh {
    const line = new WellboreMesh(this.interpolator, this.wellboreWidth, tick);
    const { vertices, triangles, vertexData, extraData } = line.generate(intervals);

    // Create geometry
    const geometry = new PIXI.Geometry();
    geometry.addAttribute('verts', vertices, 2);
    geometry.addAttribute('vertCol', vertexData, 4);
    geometry.addAttribute('typeData', extraData, 1);
    geometry.addIndex(triangles);

    const shader: any = getWellboreShader(this.colors.default, this.group.state.completionVisible, this.group.state.wellboreVisible);
    return new PIXI.Mesh(geometry, shader);
  }

  setCompletionVisibility(visible: boolean) {
    if (this.mesh) this.uniforms.completionVisible = visible;
  }

  setWellboreVisibility(visible: boolean) {
    if (this.mesh) this.uniforms.wellboreVisible = visible;
  }

  setHighlight(isHighlighted: boolean, multiple: boolean = false) : void {
    if (this.status === WellboreStatus.selected) return;

    if (isHighlighted) {
      this.status = multiple ? WellboreStatus.multiHighlighted : WellboreStatus.highlighted;
    }
    else this.status = WellboreStatus.normal;

    if (isHighlighted) {
      const color = multiple ? this.colors.multiHighlight : this.colors.highlight;
      if (this.mesh) {
        this.mesh.shader.uniforms.wellboreColor1 = color.col1;
        this.mesh.shader.uniforms.wellboreColor2 = color.col2;
        this.mesh.zIndex = this._zIndex + 100000;
      }
      this.label.background.tint = color.labelBg;
      this.label.background.alpha = 0.75;
      this.label.background.zIndex = 2;
      this.label.text.zIndex = 3;
      this.label.text.tint = this.colors.interactFontColor;
    } else {
      if (this.mesh) {
        this.mesh.shader.uniforms.wellboreColor1 = this.colors.default.col1;
        this.mesh.shader.uniforms.wellboreColor2 = this.colors.default.col2;
        this.mesh.zIndex = this._zIndex;
      }
      this.label.background.tint = this.colors.default.labelBg;
      this.label.background.alpha = Label.config.backgroundOpacity;
      this.label.background.zIndex = 0;
      this.label.text.zIndex = 1;
      this.label.text.tint = this.colors.fontColor;
    }
  }

  setSelected(isSelected: boolean) : void {
    this.status = isSelected ? WellboreStatus.selected : WellboreStatus.normal;

    if (isSelected) {
      if (this.mesh) {
        this.mesh.shader.uniforms.wellboreColor1 = this.colors.selected.col1;
        this.mesh.shader.uniforms.wellboreColor2 = this.colors.selected.col2;
        this.mesh.zIndex = this._zIndex + 1000000;
      }
      this.label.background.tint = this.colors.selected.labelBg;
      this.label.background.alpha = 0.75;
      this.label.background.zIndex = 2
      this.label.text.zIndex = 3;
    } else {
      if (this.mesh) {
        this.mesh.shader.uniforms.wellboreColor1 = this.colors.default.col1;
        this.mesh.shader.uniforms.wellboreColor2 = this.colors.default.col2;
        this.mesh.zIndex = this._zIndex;
      }
      this.label.background.tint = this.colors.default.labelBg;
      this.label.background.alpha = Label.config.backgroundOpacity;
      this.label.background.zIndex = 0;
      this.label.text.zIndex = 1;
    }
    this.label.text.tint = this.colors.fontColor;
    this.root.recalculate();
  }

  update() : void {
    const active = (this.group.active && this.filter === FilterStatus.none);
    if (this.mesh) {
      let status = this.filter;
      if (!this.group.active) status = 4;
      this.mesh.shader.uniforms.status = status;
      // this.mesh.shader.uniforms.ghost = this.group.active && !this.isActive;
    }
    this.label.visible = active;
  }

}
