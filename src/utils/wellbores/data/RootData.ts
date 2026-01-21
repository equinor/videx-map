/* eslint-disable no-magic-numbers, curly */
import { Geometry, Mesh, Rectangle, Shader } from 'pixi.js';
import Vector2 from '@equinor/videx-vector2';

import { WellboreData } from './WellboreData';
import { RootShader, RootUniforms } from '../Shader';
import generateCircle from '../../generateCircle';
import { Label, positionAtRoot, positionAlongWellbore } from '../labels';

export class RootData {

  public static state = {
    rootRadius: 1.0,
    maxScale: 1.0,
  };

  mesh: Mesh<Geometry, Shader>;
  wellbores: WellboreData[] = [];
  position: Vector2;
  labelIndex: number = 0;
  rootLabelsBBox: Rectangle = null;

  /** Target wellbore data for color */
  target: WellboreData = null;

  constructor(position: Vector2) {
    this.position = position;
    const shader: Shader = RootShader.get();
    this.mesh = generateCircle(position, RootData.state.maxScale, shader);
  }

  /** Active if  */
  get active() {
    return this.target && this.target.active;
  }

  private updateLabelsBBox(label : Label) : void {
    const bbox = label.getBoundingBox();

    if (!this.rootLabelsBBox) {
      this.rootLabelsBBox = bbox;
    } else {
      this.rootLabelsBBox.height = (bbox.y + bbox.height) - this.rootLabelsBBox.y;
      if (bbox.width > this.rootLabelsBBox.width) {
        this.rootLabelsBBox.x = bbox.x;
        this.rootLabelsBBox.width = bbox.width;
      }
    }
  }

  /** Position wellbore label along wellbore. Should never be called if labels are disabled. */
  private positionLabel(wellbore: WellboreData) : void {
    if (wellbore.label.attachToRoot) {
      const index = this.labelIndex++;
      positionAtRoot(wellbore, index);
      this.updateLabelsBBox(wellbore.label);
    } else {
      positionAlongWellbore(wellbore);
    }
  }

  append(wellbore: WellboreData) {
    this.wellbores.push(wellbore);
    if (!wellbore.active) return; // No need to recalculte if inactive wellbore
    if (!this.target) this.recalculate(true); // Recalculate if first target
    else if (wellbore.order < this.target.order && wellbore.status > this.target.status) this.recalculate(true);
    else if (Label.state.visible) this.positionLabel(wellbore); // Position label if lower order and visible
  }

  /** Recalculate target and update uniforms */
  recalculate(labelUpdate: boolean = false) {
    this.updateTarget();
    this.updateUniforms();
    if (labelUpdate) this.updateLabels();
  }

  private updateTarget() {
    let target: WellboreData;
    let smallest: number = Number.MAX_VALUE;

    for (let i = 0; i < this.wellbores.length; i++) {
      const wellbore = this.wellbores[i];
      if (!wellbore.active) continue; // Skip inactive wellbores

      // Always target selected
      if (wellbore.selected) {
        target = wellbore;
        break;
      }

      // Weight order with status
      const weighted = wellbore.order - 1000000 * wellbore.status;

      // Target wellbores with smallest order
      if (weighted < smallest) {
        smallest = weighted;
        target = wellbore;
      }
    }

    this.target = target;
  }

  private updateUniforms() {
    const uniform: RootUniforms = this.mesh.shader.resources.uniforms.uniforms as RootUniforms;
    uniform.active = this.active ? 1 : 0;
    if (this.target) {
      const color = this.target.color;
      uniform.circleColor1 = color.col1;
      uniform.circleColor2 = color.col2;
      // Set z index based on status of target
      // 0: normal,  1: highlighted, 2: multiHighlighted, 3: selected
      this.mesh.zIndex = this.target.status;
    }

    uniform.rootRadius = RootData.state.rootRadius;
  }

  updateLabels(): void {
    this.labelIndex = 0;
    this.rootLabelsBBox = null;

    if (Label.state.visible) {
      this.wellbores.forEach(wellbore => {
        if (wellbore.active) this.positionLabel(wellbore);
      });
    }
  }

  setLabelVisibility(visible: boolean) {
    if (visible) this.updateLabels();
    else this.rootLabelsBBox = null;

    this.wellbores.forEach(wellbore => {
      if (wellbore.active) wellbore.label.visible = visible;
    })
  }
}
