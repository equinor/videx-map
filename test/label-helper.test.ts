import * as PIXI from "pixi.js";
import { WellboreData } from "../src/utils/wellbores/data";
import { Label, positionAtRoot } from "../src/utils/wellbores/labels";

Label.height = 1;
Label.state.scale = 1;
Label.state.rootDisplacement = 1;

const getWellbore = () => ({
  label: {
    attachToRoot: false,
    container: {
      pivot: new PIXI.Point(0, 0),
      position: new PIXI.Point(0, 0),
      scale: new PIXI.Point(0, 0),
      rotation: 0,
    },
  },
  root: {
    position: [0, 0],
  },
});

describe('positionAtRoot', () => {
  const position0 = 0;
  const position1 = 1;

  test('Should attatch label to root', () => {
    const wellbore = getWellbore();
    positionAtRoot(wellbore as any, position0);
    expect(wellbore.label.attachToRoot).toBeTruthy();
  });

  test('Should clear rotation', () => {
    const wellbore = getWellbore();
    wellbore.label.container.rotation = 30;
    positionAtRoot(wellbore as any, position0);
    expect(wellbore.label.container.rotation).toBe(0);
  });

  test('Should set pivot-y to negative half of label height', () => {
    const wellbore = getWellbore();
    positionAtRoot(wellbore as any, position0);
    expect(wellbore.label.container.pivot.y).toBe(-0.5);
  });

  test('Should set scale to Label.state.scale', () => {
    const wellbore = getWellbore();
    positionAtRoot(wellbore as any, position0);

    const { scale } = wellbore.label.container;
    expect(scale.x).toBe(1);
    expect(scale.y).toBe(1);
  });

  test('Should inherit x-position from the root', () => {
    const wellbore = getWellbore();
    wellbore.root.position[0] = 1;
    positionAtRoot(wellbore as any, position0);
    expect(wellbore.label.container.position.x).toBe(1);
  });

  test('Should stack wellbore labels below root', () => {
    const wellbore0 = getWellbore();
    const wellbore1 = getWellbore();

    // Order should not matter
    positionAtRoot(wellbore1 as any, position1);
    positionAtRoot(wellbore0 as any, position0);

    // First label below root, second label below first
    expect(wellbore0.root.position[1]).toBeLessThan(wellbore0.label.container.position.y)
    expect(wellbore0.label.container.position.y).toBeLessThan(wellbore1.label.container.position.y);
  });
});
