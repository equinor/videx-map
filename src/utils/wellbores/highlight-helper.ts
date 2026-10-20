import Vector2 from '@equinor/videx-vector2';

import LineDictionary from '../LineDictionary';
import { WellboreData, RootData, HighlightEvent } from './data';
import PointDictionary from '../PointDictionary';
import WellboreModule from '../../WellboreModule';

function testRoot(
  pos: Vector2,
  radius: number,
  pointDict: PointDictionary<RootData>,
): WellboreData {
  const root = pointDict.getClosestUnder(pos, radius);
  if (!root) return null;
  // Use the first active wellbore in the existing label-stack order.
  return root.val.wellbores.find(d => d.active) ?? null;
}

function testLabel(pos: Vector2, roots: RootData[]): WellboreData {
  const candidates = roots.filter(
    root =>
      root.active &&
      root.rootLabelsBBox &&
      root.rootLabelsBBox.contains(pos.x, pos.y),
  );

  for (let i = 0; i < candidates.length; i++) {
    for (let j = 0; j < candidates[i].wellbores.length; j++) {
      const wellbore = candidates[i].wellbores[j];
      if (wellbore.active && wellbore.label.attachToRoot) {
        const bbox = wellbore.label.getBoundingBox();
        if (bbox.y > pos.y) break; // it is below pos and cannot have any hits
        if (bbox.contains(pos.x, pos.y)) {
          return wellbore;
        }
      }
    }
  }
  return null;
}

function testWellborePath(
  pos: Vector2,
  lineDict: LineDictionary<WellboreData>,
  distanceThreshold = 0.5,
): WellboreData {
  return lineDict.getClosest(pos, distanceThreshold) ?? null;
}

export function updateHighlighted(
  module: WellboreModule,
  pos: Vector2,
  onHighlightOn?: (event: HighlightEvent) => void,
  onHighlightOff?: () => void,
  originalEvent?: any,
): void {
  let wellbore: WellboreData;

  // 1. test if position overlaps a root
  wellbore = testRoot(pos, module.getRootRadius(), module.pointDict);

  // 2. test if position overlaps a root label
  if (!wellbore && module.containers.labels.visible) {
    wellbore = testLabel(pos, module.roots);
  }

  // 3. test if position is close to a wellbore line segment
  if (!wellbore) {
    wellbore = testWellborePath(pos, module.lineDict, 0.5); // make configurable?
  }

  const { highlight } = module;

  // If no hits
  if (!wellbore) {
    if (highlight?.active) {
      clearHighlight(module, onHighlightOff);
    }
  } else {
    const changed = highlight.wellbore !== wellbore;

    // If highlight and changed
    if (changed) {
      highlight.set(wellbore);
      module.requestRedraw();
    }

    if (onHighlightOn) {
      onHighlightOn(HighlightEvent.from(wellbore, changed, originalEvent));
    }
  }
}

export function forceHighlight(module: WellboreModule, wellbore: WellboreData) {
  const { highlight } = module;

  // If highlight and changed
  if (highlight && highlight.wellbore !== wellbore) {
    highlight.set(wellbore);
    module.requestRedraw();
  }
}

export function clearHighlight(
  module: WellboreModule,
  onHighlightOff?: () => void,
) {
  module.highlight.clear();
  if (onHighlightOff) onHighlightOff();
  module.requestRedraw();
}
