
import * as PIXI from 'pixi.js';
import { RootData, WellboreData } from '../../src/utils/wellbores/data';
import { wellbores, group, group2 } from '../test-data';
import Vector2 from '@equinor/videx-vector2';
import { Label } from '../../src/utils/wellbores/labels';
import { FilterStatus } from '../../src/utils/wellbores/data/WellboreData';

// @ts-ignore mock measureText
PIXI.TextMetrics.measureText = () => ({});


const getInput1 = (root: RootData) => {
  return {
    data: wellbores[0],
    group,
    root,
    coords: [Vector2.zero],
    pointThreshold: 0.1,
    wellboreWidth: 1,
  }
};

const getInput2 = (root: RootData) => {
  return {
    data: wellbores[0],
    group: group2,
    root,
    coords: [Vector2.zero],
    pointThreshold: 0.1,
    wellboreWidth: 1,
  }
};

Label.setCommon({ backgroundOpacity: 0.4 });

test('Can instantiate root data', () => {
  const root = new RootData(Vector2.zero, 1);
  const wellboreData = new WellboreData(getInput1(root));
  root.append(wellboreData);
  root.recalculate();

  expect(root.mesh).toBeDefined();
  expect(root.mesh.shader.uniforms.circleColor1).toBe(group.colors.default.col1);
  expect(root.mesh.shader.uniforms.circleColor2).toBe(group.colors.default.col2);
  expect(root.mesh.shader.uniforms.active).toBeTruthy();
  expect(root.wellbores).toBeDefined();
  expect(root.wellbores.length).toBe(1);
  expect(root.active).toBeTruthy();
  expect(root.target).toBe(wellboreData);
});

test('Can append data', () => {
  const root = new RootData(Vector2.zero, 1);
  const wellboreData = new WellboreData(getInput1(root));
  const wellboreData2 = new WellboreData(getInput2(root));
  root.append(wellboreData);
  root.append(wellboreData2);
  expect(root.wellbores).toBeDefined();
  expect(root.wellbores.length).toBe(2);
});

test('Can update color', () => {
  const root = new RootData(Vector2.zero, 1);

  const wellboreData = new WellboreData(getInput1(root));
  wellboreData.setFilter(FilterStatus.hard);
  root.append(wellboreData);

  const wellboreData2 = new WellboreData(getInput2(root));
  root.append(wellboreData2);

  root.recalculate();

  expect(root.mesh.shader.uniforms.circleColor1).toBe(group2.colors.default.col1);
  expect(root.mesh.shader.uniforms.circleColor2).toBe(group2.colors.default.col2);
  expect(root.mesh.shader.uniforms.active).toBeTruthy();
});

test('Can update active', () => {
  const root = new RootData(Vector2.zero, 1);
  const wellboreData = new WellboreData(getInput1(root));
  root.append(wellboreData);
  wellboreData.setFilter(FilterStatus.hard);
  root.recalculate();
  expect(root.active).toBeFalsy();
  expect(root.mesh.shader.uniforms.active).toBeFalsy();
});
