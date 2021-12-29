import * as PIXI from "pixi.js";
import Vector2 from "@equinor/videx-vector2";

import { Label } from "./Label";
import { WellboreData } from "../data";

export function positionAtRoot(wellbore: WellboreData, position: number) : void {
  wellbore.label.attachToRoot = true;

  const { text, background } = wellbore.label;
  const { scale, rootDisplacement } = Label.state;

  text.anchor = new PIXI.Point(0.5, 0);
  text.rotation = 0;
  background.rotation = 0;
  background.pivot.set(0, -Label.height * 0.5);
  const yPos = (rootDisplacement + 5 * scale) + (position * (Label.height + 5) * scale) + wellbore.root.position[1];
  text.position.set(wellbore.root.position[0], yPos);
  text.scale.set(scale); // Resize
  background.position.set(wellbore.root.position[0], yPos);
  background.scale.set(scale); // Resize
}

export function positionAlongWellbore(wellbore: WellboreData) : void {
  wellbore.label.attachToRoot = false;

  const { text, background, width, height } = wellbore.label;
  const end = wellbore.interpolator.GetPoint(1).position;
  const scaledWidth = width * Label.state.scale; // Multiply by scale
  const start = wellbore.interpolator.GetPointFromEnd(scaledWidth);
  const dir = Vector2.sub(end, start.position).mutable;

  let anchorX, anchorY;
  let pivotX, pivotY;
  let angle;
  let pos;

  // X+: Right
  // Y+: Down
  if (dir.x < 0) { // Left
    anchorX = 0;
    anchorY = 0;
    pivotX = -width * 0.5;
    pivotY = -height * 0.5;
    angle = Vector2.signedAngle(Vector2.left, dir);
    pos = dir.rotate270()
      .rescale(wellbore.wellboreWidth * 0.5 + 0.075)
      .add(end);
  } else { // Right
    anchorX = 1;
    anchorY = 0;
    pivotX = width * 0.5;
    pivotY = -height * 0.5;
    angle = Vector2.signedAngle(Vector2.right, dir);
    pos = dir.rotate90()
      .rescale(wellbore.wellboreWidth * 0.5 + 0.075)
      .add(end);
  }

  text.position.set(pos[0], pos[1]);
  text.rotation = angle;
  text.anchor = new PIXI.Point(anchorX, anchorY);
  text.scale.set(Label.state.scale); // Resize

  // Place background
  background.position.set(pos[0], pos[1]);
  background.pivot.set(pivotX, pivotY);
  background.rotation = angle;
  background.scale.set(Label.state.scale); // Resize
}
