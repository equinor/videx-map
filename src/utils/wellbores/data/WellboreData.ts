/* eslint-disable no-magic-numbers, curly, @typescript-eslint/no-explicit-any */
import { Container, Geometry, Mesh, Shader } from 'pixi.js';
import Vector2 from '@equinor/videx-vector2';
import { SourceData } from './SourceData';
import { RootData } from './RootData';
import { Group } from './Group';
import { processIntervals } from '../intervals';
import { LineInterpolator } from '../../LineInterpolator';
import { WellboreMesh } from '../../WellboreMesh';
import { WellboreShader, WellboreUniforms } from '../Shader';
import { Label } from '../labels/Label';
import { Colors, Color } from '../Colors';
import { TickConfig } from '../Config';
import { Detail } from './details';

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

  public static state = {
    wellboreRadius: 1,
    rootRadius: 1,
  };

  data: SourceData;
  group: Group;
  wellboreWidth: number;
  interpolator: LineInterpolator;
  container: Container;
  label: Label;
  private _zIndex: number = 0;

  private details: Container;
  private detailsDict: { [key: string]: Container } = {};

  private mesh: Mesh<Geometry, Shader>;

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
      this.container = new Container();

      const intervals = processIntervals(input.data.intervals);

      this.details = new Container();
      this.mesh = this.createWellboreMesh(intervals, input.tick);

      // All details should be sorted below the wellbore mesh
      this.container.addChild(this.details, this.mesh);
    }

    // Update WellboreData with current state
    this.update();
  }

  set zIndex (val: number) {
    this._zIndex = val;
    if (this.container) {
      this.container.zIndex = this._zIndex;
    }
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
    const activeUniform = (this.mesh && this.mesh.shader.resources.uniforms.uniforms.status === 0);
    return this.group.active && (activeUniform || this.filter === FilterStatus.none);
  }

  /**
   * Render wellbore details if data is available.
   * @param key - Unique identifier for the detail to render
   * @param detail - Object containing information to draw
   */
  tryDrawDetail(key: string, detail: Detail) {
    if (!this.container) return;

    // Get relative positions along wellbore, if available for data
    const relative = detail.getRelative(this.data);
    if (!Array.isArray(relative) || relative.length === 0) return;

    const container = new Container();
    container.visible = detail.visible;

    relative.forEach(p => {
      const graphics = detail.getGraphics(p, this.interpolator);
      container.addChild(graphics);
    });

    // Add details and store container reference by key
    this.details.addChild(container);
    this.detailsDict[key] = container;
  }

  setFilter(filter: FilterStatus) {
    if (this.filter === filter) return; // If flag is duplicate
    this.filter = filter;
    this.update();
  }

  get selected(): boolean {
    return this.status === WellboreStatus.selected;
  }

  get highlighted(): boolean {
    return this.status === WellboreStatus.highlighted || this.status === WellboreStatus.multiHighlighted;
  }

  get order(): number {
    return this.group.order;
  }

  get uniforms(): WellboreUniforms {
    return this.mesh.shader.resources.uniforms.uniforms as WellboreUniforms;
  }

  private createWellboreMesh(intervals: [number, number][], tick: TickConfig): Mesh<Geometry, Shader> {
    const line = new WellboreMesh(this.interpolator, this.wellboreWidth, tick);
    const { vertices, triangles, vertexData, extraData } = line.generate(intervals);

    const geometry = new Geometry();
    geometry.addAttribute('verts', vertices);
    geometry.addAttribute('vertCol', vertexData);
    geometry.addAttribute('typeData', extraData);
    geometry.addIndex(triangles);

    const shader = WellboreShader.get(this.colors.default, this.group.state.completionVisible, this.group.state.wellboreVisible);

    return new Mesh({geometry, shader});
  }

  setCompletionVisibility(visible: number) {
    if (this.mesh) {
      this.uniforms.completionVisible = visible ? 1 : 0;
    }
  }

  setWellboreVisibility(visible: number) {
    if (this.mesh) {
      this.uniforms.wellboreVisible = visible ? 1 : 0;
    }
  }

  setDetailsVisibility(key: string, visible: boolean) {
    if (key in this.detailsDict) {
      this.detailsDict[key].visible = visible;
    }
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
        this.mesh.shader.resources.uniforms.uniforms.wellboreColor1 = color.col1;
        this.mesh.shader.resources.uniforms.uniforms.wellboreColor2 = color.col2;
        this.container.zIndex = this._zIndex + 100000;
      }
      this.label.container.zIndex = 1;
      this.label.background.tint = color.labelBg;
      this.label.background.alpha = 0.75;
      this.label.fontColor = this.colors.interactFontColor;
    } else {
      if (this.mesh) {
        this.mesh.shader.resources.uniforms.uniforms.wellboreColor1 = this.colors.default.col1;
        this.mesh.shader.resources.uniforms.uniforms.wellboreColor2 = this.colors.default.col2;
        this.container.zIndex = this._zIndex;
      }
      this.label.container.zIndex = 0;
      this.label.background.tint = this.colors.default.labelBg;
      this.label.background.alpha = Label.config.backgroundOpacity;
      this.label.fontColor = this.colors.fontColor;
    }
  }

  setSelected(isSelected: boolean) : void {
    this.status = isSelected ? WellboreStatus.selected : WellboreStatus.normal;

    if (isSelected) {
      if (this.mesh) {
        this.mesh.shader.resources.uniforms.uniforms.wellboreColor1 = this.colors.selected.col1;
        this.mesh.shader.resources.uniforms.uniforms.wellboreColor2 = this.colors.selected.col2;
        this.container.zIndex = this._zIndex + 1000000;
      }
      this.label.container.zIndex = 1;
      this.label.background.tint = this.colors.selected.labelBg;
      this.label.background.alpha = 0.75;
    } else {
      if (this.mesh) {
        this.mesh.shader.resources.uniforms.uniforms.wellboreColor1 = this.colors.default.col1;
        this.mesh.shader.resources.uniforms.uniforms.wellboreColor2 = this.colors.default.col2;
        this.container.zIndex = this._zIndex;
      }
      this.label.container.zIndex = 0;
      this.label.background.tint = this.colors.default.labelBg;
      this.label.background.alpha = Label.config.backgroundOpacity;
    }
    this.label.fontColor = this.colors.fontColor;
    this.root.recalculate();
  }

  update() : void {
    if (this.group.active) {
      // Labels and details are only visible if no filter.
      const noFilter = (this.filter === FilterStatus.none);

      if (this.container) {
        this.container.visible = true;
        this.mesh.shader.resources.uniforms.uniforms.status = this.filter;
        this.mesh.shader.resources.uniforms.uniforms.wellboreRadius = WellboreData.state.wellboreRadius;
        this.mesh.shader.resources.uniforms.uniforms.rootRadius = WellboreData.state.rootRadius;
        this.details.visible = noFilter;
      }

      this.label.visible = noFilter;
    } else { // If group is inactive
      if (this.container) {
        this.container.visible = false;
        this.details.visible = false;
      }

      this.label.visible = false;
    }
  }
}
