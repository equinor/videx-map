import WellboreModule from '../src/WellboreModule';
import { getDefaultConfig, InputConfig } from '../src/utils/wellbores/Config';
import { wellbores } from './test-data';
import { pixiOverlayMock } from './mocks';
import { getDefaultColors, InputColors } from '../src/utils/wellbores/Colors';
import { WellboreData, RootData, Group } from '../src/utils/wellbores/data';

const defaultConfig = getDefaultConfig();

const createModule = (options?: InputConfig) : WellboreModule => {
  const module = new WellboreModule(options);
  module.pixiOverlay = pixiOverlayMock;
  return module;
};

test('can instantiate WellboreModule class with no options', () => {
  const module = createModule();

  expect(module).toBeInstanceOf(WellboreModule);
  expect(module.config.scale).toEqual(defaultConfig[0].scale);
  expect(module.config.wellboreResize).toStrictEqual(defaultConfig[0].wellboreResize);
  expect(module.config.rootResize).toEqual(defaultConfig[0].rootResize);
  expect(module.config.batchSize).toEqual(defaultConfig[0].batchSize);
});

test('can instantiate WellboreModule class with options', () => {
  const wellboreResize = {
    min: { zoom: 10, scale: 0.2 },
    max: { zoom: 18, scale: 0.1 },
  };

  const module = createModule({
    wellboreResize,
  });

  expect(module).toBeInstanceOf(WellboreModule);
  expect(module.config.wellboreResize).toStrictEqual(wellboreResize);
});

test('can register data groups and set options', () => {
  const module = createModule();

  expect(module.groups.default).toBeDefined();

  const colors: InputColors = {
    defaultColor1: [0.8, 0.2, 0.2],
    defaultColor2: [0.4, 0.1, 0.1],
    highlightColor1: [0.8, 0.2, 0.8],
    highlightColor2: [0.4, 0.1, 0.4],
    multiHighlightColor1: [0.6, 0.1, 0.1],
    multiHighlightColor2: [0.3, 0.0, 0.0],
    selectedColor1: [1.0, 1.0, 1.0],
    selectedColor2: [0.8, 0.8, 0.8],
    fontColor: 0xFF0000,
    defaultLabelBg: 0xFF0000,
    highlightLabelBg: 0xFF00FF,
    multiHighlightLabelBg: 0xDD0000,
    selectedLabelBg: 0xCCCCCC,
  };

  module.registerGroup('test1', { colors });

  expect(module.groups).toBeDefined();
  expect(module.groups.test1).toBeDefined();
  expect(module.groups.test1.key).toBe('test1');
  expect(module.groups.test1.active).toBeTruthy();


  module.registerGroup('test2', { colors });

  expect(module.groups.test2).toBeDefined();
  expect(module.groups.test2.key).toBe('test2');
  expect(module.groups.test2.active).toBeTruthy();

  module.registerGroup('test3');

  const defaultColors = getDefaultColors();

  expect(module.groups.test3).toBeDefined();
  expect(module.groups.test3.key).toBe('test3');
  expect(module.groups.test3.active).toBeTruthy();
  expect(module.groups.test3.colors).toEqual(defaultColors);

  expect(() => module.registerGroup('test1')).toThrow();
});

test('can add a single wellbore', () => {
  const module = createModule();

  module.addWellbore(wellbores[0]);

  expect(module.groups.default.wellbores.length).toBe(1);

  const addedWellbore1 = module.groups.default.wellbores[0];
  expect(addedWellbore1).toBeInstanceOf(WellboreData);
  expect(addedWellbore1.colors).toBe(module.groups.default.colors);
  expect(addedWellbore1.root).toBeInstanceOf(RootData);
  expect(addedWellbore1.root.wellbores.includes(addedWellbore1)).toBeTruthy();

  module.addWellbore(wellbores[1]);

  expect(module.groups.default.wellbores.length).toBe(2);

  const addedWellbore2 = module.groups.default.wellbores[1];
  expect(addedWellbore2).toBeInstanceOf(WellboreData);
  expect(addedWellbore2.colors).toBe(module.groups.default.colors);
  expect(addedWellbore2.root).toBeInstanceOf(RootData);
  expect(addedWellbore2.root.wellbores.includes(addedWellbore2)).toBeTruthy();
  expect(addedWellbore2.root).not.toBe(addedWellbore1.root);

  module.registerGroup('test');
  expect(module.groups.test).toBeInstanceOf(Group);

  module.addWellbore(wellbores[0], module.groups.test);
  const addedWellbore3 = module.groups.test.wellbores[0];
  expect(addedWellbore3).toBeInstanceOf(WellboreData);
  expect(addedWellbore3.root).toBeInstanceOf(RootData);
  expect(addedWellbore3.root.wellbores.includes(addedWellbore3)).toBeTruthy();
  expect(addedWellbore3.root).toBe(addedWellbore1.root);
});

test('can set and clear data', async () => {
  const module = createModule();

  expect(module.set(wellbores, 'test')).rejects.toThrowError();

  module.registerGroup('group1');
  module.registerGroup('group2');

  await module.set(wellbores.slice(0, 6), 'group1');
  await module.set(wellbores.slice(6), 'group2');

  expect(module.groups.group1.wellbores.length).toBe(6);
  expect(module.groups.group2.wellbores.length).toBe(4);
  expect(module.pointDict.pointValues.size).toBe(7);

  module.clear('group1');

  expect(module.groups.group1.wellbores.length).toBe(0);
  expect(module.groups.group2.wellbores.length).toBe(4);

  module.clear();

  expect(module.groups.group1.wellbores.length).toBe(0);
  expect(module.groups.group2.wellbores.length).toBe(0);
});

test('can remove data in a group', async () => {
  const module = createModule();

  module.registerGroup('group1');
  module.registerGroup('group2');

  await module.set(wellbores.slice(0, 6), 'group1');
  await module.set(wellbores.slice(6), 'group2');

  expect(module.groups.group1.wellbores.length).toBe(6);
  expect(module.groups.group2.wellbores.length).toBe(4);
  expect(module.lineDict.lineValues.size).toBe(4)
  expect(module.pointDict.pointValues.size).toBe(7);
  expect(module.roots.length).toBe(7);
  expect(module.roots.reduce((count, r) => r.wellbores.length + count, 0)).toBe(10);
  expect(module.roots.reduce((count, r) => r.wellbores.filter(d => d.label.attachToRoot).length + count, 0)).toBe(6);

  module.clear('group1');
  expect(module.groups.group1.wellbores.length).toBe(0);
  expect(module.groups.group2.wellbores.length).toBe(4);
  expect(module.lineDict.lineValues.size).toBe(2)
  expect(module.pointDict.pointValues.size).toBe(3);
  expect(module.roots.length).toBe(3);
  expect(module.roots.reduce((count, r) => r.wellbores.length + count, 0)).toBe(4);
  expect(module.roots.reduce((count, r) => r.wellbores.filter(d => d.label.attachToRoot).length + count, 0)).toBe(2);
});

test('can toggle groups on and off', async () => {
  const module = createModule();

  module.registerGroup('group1');
  module.registerGroup('group2');

  await module.set(wellbores.slice(0, 3)); // add to default group
  await module.set(wellbores.slice(3, 6), 'group1');
  await module.set(wellbores.slice(6), 'group2');

  expect(module.groups.default.wellbores.length).toBe(3);
  expect(module.groups.group1.wellbores.length).toBe(3);
  expect(module.groups.group2.wellbores.length).toBe(4);

  expect(module.groups.default.wellbores.every(w => w.active)).toBeTruthy();
  expect(module.groups.group1.wellbores.every(w => w.active)).toBeTruthy();
  expect(module.groups.group2.wellbores.every(w => w.active)).toBeTruthy();

  module.disable(); // should disable all groups (including default)

  expect(Object.values(module.groups).every(g => g.active === false)).toBeTruthy();

  expect(module.groups.default.wellbores.every(w => w.active === false)).toBeTruthy();
  expect(module.groups.group1.wellbores.every(w => w.active === false)).toBeTruthy();
  expect(module.groups.group2.wellbores.every(w => w.active === false)).toBeTruthy();

  module.enable(); // should enable all groups (including default)

  expect(Object.values(module.groups).every(g => g.active)).toBeTruthy();

  expect(module.groups.default.wellbores.every(w => w.active)).toBeTruthy();
  expect(module.groups.group1.wellbores.every(w => w.active)).toBeTruthy();
  expect(module.groups.group2.wellbores.every(w => w.active)).toBeTruthy();

  module.disable('group1', 'group2');

  expect(module.groups.default.active).toBeTruthy();
  expect(module.groups.group1.active).toBeFalsy();
  expect(module.groups.group2.active).toBeFalsy();

  expect(module.groups.default.wellbores.every(w => w.active)).toBeTruthy();
  expect(module.groups.group1.wellbores.every(w => w.active === false)).toBeTruthy();
  expect(module.groups.group2.wellbores.every(w => w.active === false)).toBeTruthy();

  module.enable('group2');

  expect(module.groups.default.active).toBeTruthy();
  expect(module.groups.group1.active).toBeFalsy();
  expect(module.groups.group2.active).toBeTruthy();

  expect(module.groups.default.wellbores.every(w => w.active)).toBeTruthy();
  expect(module.groups.group1.wellbores.every(w => w.active === false)).toBeTruthy();
  expect(module.groups.group2.wellbores.every(w => w.active)).toBeTruthy();
});

test('can disable wellbores with provided filter function', async () => {
  const module = createModule();

  module.registerGroup('group1');
  module.registerGroup('group2');

  const data1 = wellbores.slice(0, 2)
    .map(d => ({ ...d, category: 'category1' }))
    .concat(wellbores.slice(2, 6).map(d => ({ ...d, category: 'category2' })));

  const data2 = wellbores.slice(6, 9)
    .map(d => ({ ...d, category: 'category1' }))
    .concat(wellbores.slice(9).map(d => ({ ...d, category: 'category2' })));

  await module.set(data1, 'group1'),
  await module.set(data2, 'group2'),

  expect(module.groups.group1.wellbores.filter(d => d.active).length).toBe(6);
  expect(module.groups.group2.wellbores.filter(d => d.active).length).toBe(4);

  // filter all groups. All items not matching filter should be disabled.
  module.hardFilter(v => v.category === 'category1');

  expect(module.groups.group1.wellbores.filter(d => d.active).length).toBe(2);
  expect(module.groups.group2.wellbores.filter(d => d.active).length).toBe(3);

  // clear filter all groups
  module.clearFilter();

  expect(module.groups.group1.wellbores.filter(d => d.active).length).toBe(6);
  expect(module.groups.group2.wellbores.filter(d => d.active).length).toBe(4);

  module.hardFilter(v => v.category === 'category1', 'group1');

  expect(module.groups.group1.wellbores.filter(d => d.active).length).toBe(2);
  expect(module.groups.group2.wellbores.filter(d => d.active).length).toBe(4);
});
