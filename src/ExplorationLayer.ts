/* eslint-disable no-magic-numbers, curly */
import Vector2 from '@equinor/videx-vector2';
import * as PIXI from 'pixi.js';

import { ModuleInterface } from './ModuleInterface';
import generateCircle from './utils/generateCircle';
import { RootUniforms } from './utils/wellbores/Shader';
import PointDictionary from './utils/PointDictionary';

const sample: ExplorationWell[] = null;

interface ExplorationWell {
  completionDate?: string;
  discoveryIdentifier?: string;
  drillEndDate?: string;
  fieldGuid?: number;
  latitude: number;
  longitude: number;
  operator?: string;
  parentWellbore?: string;
  responsibleCompany?: string;
  uniqueWellboreIdentifier: string;
  wellboreContent?: string;
  wellboreGuid: number;
  wellborePurpose: string;
}

/**
 * Data assigned each point in point dictionary.
 */
interface PointData {
  mesh: PIXI.Mesh;
  uniforms: RootUniforms;
}

interface selection {
  point: PointData,
  /** Original z-index. */
  zIndex: number;
}

/**
 * Exploration layer
 *
 * Layer for displaying exploration wells.
 */
export default class ExplorationLayer extends ModuleInterface {

  /** Dictionary used to manage points. */
  pointDict: PointDictionary<PointData> = new PointDictionary<PointData>(0.25, -2, /* ! Fix */ -1);

  /** Initial scale. */
  prevScale: number;

  /** Current selection */
  selection: selection;

  appendExploration(scale: number = 1.0) {
    // Get projection function
    const project = this.pixiOverlay.utils.latLngToLayerPoint;

    const targetScale = this.clampScale(scale);
    this.prevScale = targetScale;

    for (let i = 0; i < sample.length; i++) {
      const lat = sample[i].latitude;
      const long = sample[i].longitude;

      const projected = project([lat, long]);
      const pos = new Vector2(projected.x, projected.y);

      // ! Warning: Undefined input
      const well = generateCircle(pos, 0.3, undefined);

      this.root.addChild(well);
      this.pointDict.add(pos, {
        mesh: well,
        uniforms: undefined, // Fix
      });
    }
  }

  /**
   * @param scale
   * @returns Clamped scale
   * @private
   */
  clampScale(scale: number): number {
    if (scale < 1.0) scale = 1.0;
    let targetScale = scale * 0.05;
    if (targetScale > 1.0) targetScale = 1.0;
    return targetScale;
  }

  highlight(lat: number, long: number): boolean
  {
    // Get projection function
    const project = this.pixiOverlay.utils.latLngToLayerPoint;

    if (this.selection) {
      const point = this.selection.point;
      point.uniforms.circleColor1 = [0.3, 0.3, 0.3],
      point.mesh.zIndex = this.selection.zIndex;
      this.selection = null;
    }

    // Get worldspace from coordinates
    const {x, y} = project([lat, long]);
    const worldSpace = new Vector2(x, y);

    const circleUnder = this.pointDict.getClosestUnder(worldSpace);

    if(circleUnder) {
      const point = circleUnder.val;
      this.selection = {
        point,
        zIndex: point.mesh.zIndex,
      }
      point.uniforms.circleColor1 = [0.2, 0.6, 0.7];
      point.mesh.zIndex = Infinity;
      return true;
    }

    return false;
  }

}
