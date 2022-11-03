import { WellboreData, RootData, HighlightEvent } from "./data";
import Vector2 from "@equinor/videx-vector2";
import LineDictionary from "../LineDictionary";
import PointDictionary from "../PointDictionary";
import WellboreModule from "../../WellboreModule";

function testRoot(pos: Vector2, radius: number, pointDict: PointDictionary<RootData>) : WellboreData[] {
  const root = pointDict.getClosestUnder(pos, radius);
  if (!root) return null;
  return root.val.wellbores.filter(d => d.active);
}

function testLabel(pos: Vector2, roots: RootData[]) : WellboreData[] {
  const candidates = roots.filter(root => root.active && root.rootLabelsBBox && root.rootLabelsBBox.contains(pos.x, pos.y));

  for (let i = 0; i < candidates.length; i++) {
    for (let j = 0; j < candidates[i].wellbores.length; j++) {
      const wellbore = candidates[i].wellbores[j];
      if (wellbore.active && wellbore.label.attachToRoot) {
        const bbox = wellbore.label.getBoundingBox();
        if (bbox.y > pos.y) break; // it is below pos and cannot have any hits
        if (bbox.contains(pos.x, pos.y)) {
          return [wellbore];
        }
      }
    }
  }
  return null;
}

function testWellborePath(pos: Vector2, lineDict: LineDictionary<WellboreData>, distanceThreshold = 0.5) : WellboreData[] {
  const hit = lineDict.getClosest(pos, distanceThreshold);
  return hit ? [ hit ] : null;
}


export function updateHighlighted(module: WellboreModule, pos: Vector2, onHighlightOn?: (event: HighlightEvent) => void, onHighlightOff?: () => void, originalEvent?: any) : void {
  let wellbores : WellboreData[];

  // 1. test if position overlaps a root
  wellbores = testRoot(pos, module.getRootRadius(), module.pointDict);

  // 2. test if position overlaps a root label
  if (!wellbores && module.containers.labels.visible) {
    wellbores = testLabel(pos, module.roots);
  }

  // 3. test if position is close to a wellbore line segment
  if (!wellbores) {
    wellbores = testWellborePath(pos, module.lineDict, 0.5); // make configurable?
  }

  const { highlight, pixiOverlay } = module;

  // If no hits
  if (!wellbores) {
    if (highlight?.active) {
      clearHighlight(module, onHighlightOff);
    }
  } else {

    // Get root from first wellbore
    const root = wellbores[0].root;

    let changed = false;
    if (!highlight.active || !highlight.equals(root, wellbores)) { // If highlight and changed
      changed = true;
      highlight.set(root, wellbores);
      module.requestRedraw();
    }

    if (onHighlightOn) {
      onHighlightOn(HighlightEvent.from(wellbores, changed, originalEvent));
    }
  }
}

export function forceHighlight(module: WellboreModule, wellbore: WellboreData) {
  const { highlight, pixiOverlay } = module;

  const root = wellbore.root;
  const wellbores = [ wellbore ];

  if (highlight && !highlight.equals(root, wellbores)) { // If highlight and changed
    highlight.set(root, wellbores);
    module.requestRedraw();
  }
}

export function clearHighlight(module: WellboreModule, onHighlightOff?: () => void) {
  module.highlight.clear();
  if (onHighlightOff) onHighlightOff();
  module.requestRedraw();
}
